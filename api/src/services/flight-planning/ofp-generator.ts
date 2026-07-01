import { getAircraftProfile, getAirport, getWaypoint, haversineDistance, bearing } from './nav-db.js'
import { parseRouteString } from './route-parser.js'
import { calculateFuelPlan, calculateWeights, calculateFlightTime } from './fuel-calc.js'
import { fetchWeather } from './weather.js'

export interface OFPInput {
  flightNumber: string
  depIcao: string
  arrIcao: string
  altnIcao?: string
  aircraftIcao: string
  aircraftReg: string
  paxCount: number
  cargoKg: number
  routeString?: string
  bookingDistance?: number
  pilotName?: string
  pilotCallsign?: string
}

export interface OFPResult {
  header: {
    flightNumber: string
    date: string
    depIcao: string
    arrIcao: string
    depName: string
    arrName: string
    aircraftIcao: string
    aircraftReg: string
    aircraftName: string
    releaseTime: string
    releaseDate: string
    ofpNumber: number
  }
  route: {
    sid?: string
    star?: string
    routeString: string
    waypoints: string[]
    totalDistance: number
    airDistance: number
    groundDistance: number
    avgWind: string
    avgWComponent: number
    avgISA: number
    avgFF: number
    altnIcao: string
    altnName: string
  }
  times: {
    out: string
    off: string
    on: string
    in: string
    blockTime: number
    flightTime: number
    estimatedOff: string
    estimatedOn: string
  }
  fuel: {
    tripFuel: number
    tripFuelTime: number
    contingencyFuel: number
    contingencyTime: number
    alternateFuel: number
    alternateTime: number
    finalReserve: number
    finalReserveTime: number
    minimumTakeoffFuel: number
    minimumTakeoffTime: number
    extraFuel: number
    takeoffFuel: number
    takeoffTime: number
    taxiFuel: number
    taxiTime: number
    blockFuel: number
    picExtra: number
    totalFuel: number
  }
  weights: {
    bew: number
    paxCount: number
    paxWeight: number
    cargo: number
    payload: number
    zfw: number
    mzfw: number
    zfwRemaining: number
    tow: number
    mtow: number
    towRemaining: number
    law: number
    mlw: number
    lawRemaining: number
    fuelWeight: number
    maxFuel: number
    fuelRemaining: number
  }
  flightLog: FlightLogEntry[]
  metar: { dep: string; arr: string; alt: string }
  dispatch: {
    dispatcher: string
    dispatcherTel: string
    picName: string
    picCallsign: string
  }
  weatherInfo: { windsAloft: any[]; wxProg: string }
}

export interface FlightLogEntry {
  waypoint: string
  lat: number
  lon: number
  frequency?: string
  airway?: string
  altitude: number
  mach: number
  trueAirspeed: number
  windDir: number
  windSpeed: number
  windComponent: number
  oat: number
  legDistance: number
  cumulativeDistance: number
  legTime: number
  cumulativeTime: number
  eet: string
  efb: number
  pbrn: number
}

function pad2(n: number): string { return n.toString().padStart(2, '0') }

function todayFormatted(): { dateStr: string; dateObj: Date } {
  const d = new Date()
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']
  const dd = `${pad2(d.getDate())}${months[d.getMonth()]}${d.getFullYear()}`
  return { dateStr: dd, dateObj: d }
}

function interpolateWaypoints(
  depLat: number, depLon: number,
  arrLat: number, arrLon: number,
  totalDistNm: number,
): { id: string; lat: number; lon: number; bearing: number; dist: number }[] {
  const wpts: { id: string; lat: number; lon: number; bearing: number; dist: number }[] = []
  const segmentCount = Math.max(3, Math.min(8, Math.floor(totalDistNm / 150)))
  const distPerSegment = totalDistNm / (segmentCount + 1)

  for (let i = 1; i <= segmentCount; i++) {
    const fraction = i / (segmentCount + 1)
    const lat = depLat + (arrLat - depLat) * fraction
    const lon = depLon + (arrLon - depLon) * fraction
    const brg = bearing(lat, lon, i < segmentCount
      ? depLat + (arrLat - depLat) * ((i + 1) / (segmentCount + 1))
      : arrLat,
      i < segmentCount
        ? depLon + (arrLon - depLon) * ((i + 1) / (segmentCount + 1))
        : arrLon)
    const prevLat = i === 1 ? depLat : depLat + (arrLat - depLat) * ((i - 1) / (segmentCount + 1))
    const prevLon = i === 1 ? depLon : depLon + (arrLon - depLon) * ((i - 1) / (segmentCount + 1))
    const legDist = haversineDistance(prevLat, prevLon, lat, lon)
    const id = `WPT${String(i).padStart(3, '0')}`
    wpts.push({ id, lat: Math.round(lat * 10) / 10, lon: Math.round(lon * 10) / 10, bearing: Math.round(brg), dist: Math.round(legDist) })
  }
  return wpts
}

export async function generateOFP(input: OFPInput): Promise<OFPResult> {
  const profile = getAircraftProfile(input.aircraftIcao)
  if (!profile) throw new Error(`Aircraft profile not found: ${input.aircraftIcao}`)

  const depAirport = getAirport(input.depIcao)
  const arrAirport = getAirport(input.arrIcao)
  if (!depAirport) throw new Error(`Departure airport not found: ${input.depIcao}`)
  if (!arrAirport) throw new Error(`Arrival airport not found: ${input.arrIcao}`)

  const altnIcao = input.altnIcao || 'OMAA'
  const altnAirport = getAirport(altnIcao)

  const parsed = input.routeString
    ? parseRouteString(input.routeString, input.depIcao, input.arrIcao)
    : null

  const parsedDist = parsed?.totalDistance || 0
  const gcDist = Math.round(haversineDistance(depAirport.lat, depAirport.lon, arrAirport.lat, arrAirport.lon))
  const bookingDist = input.bookingDistance || 0

  const distance = parsedDist || bookingDist || gcDist

  const distanceAir = Math.round(distance * 0.97)

  const climbTimeMin = Math.round((profile.optimumFL * 1000) / profile.climbRate)
  const descentTimeMin = Math.round((profile.optimumFL * 1000) / profile.descentRate)
  const flightTimeMin = calculateFlightTime(distance, profile.cruiseSpeed, climbTimeMin, descentTimeMin)

  const altnDist = altnAirport
    ? Math.round(haversineDistance(arrAirport.lat, arrAirport.lon, altnAirport.lat, altnAirport.lon))
    : 60
  const altnFlightTime = Math.max(15, Math.round((altnDist / (profile.cruiseSpeed * 0.65)) * 60))

  const fuelPlan = calculateFuelPlan(distance, altnDist, flightTimeMin, altnFlightTime, profile)
  const weights = calculateWeights(profile, input.paxCount, input.cargoKg, fuelPlan.blockFuel)

  const weather = await fetchWeather(input.depIcao, input.arrIcao, altnIcao)

  const { dateStr, dateObj } = todayFormatted()
  const now = dateObj
  const outTime = new Date(now.getTime() + 60 * 60 * 1000)
  const offTime = new Date(outTime.getTime() + 20 * 60 * 1000)
  const onTime = new Date(offTime.getTime() + flightTimeMin * 60 * 1000)
  const inTime = new Date(onTime.getTime() + 5 * 60 * 1000)

  const fmtZ = (d: Date) => `${pad2(d.getUTCHours())}${pad2(d.getUTCMinutes())}Z`

  const flightLog: FlightLogEntry[] = []

  if (parsed && parsed.legs.length > 0) {
    let cumDist = 0
    let cumTime = 0
    for (const leg of parsed.legs) {
      cumDist += leg.distance
      const legTimeMin = Math.max(1, (leg.distance / profile.cruiseSpeed) * 60)
      cumTime += legTimeMin
      const windDir = 80 + Math.round(Math.random() * 30)
      const windSpd = 12 + Math.round(Math.random() * 20)
      flightLog.push({
        waypoint: leg.to,
        lat: Math.round(leg.toLat * 10) / 10,
        lon: Math.round(leg.toLon * 10) / 10,
        airway: leg.airway,
        altitude: profile.optimumFL * 100,
        mach: profile.maxCruiseMach,
        trueAirspeed: profile.cruiseSpeed,
        windDir,
        windSpeed: windSpd,
        windComponent: Math.round(Math.cos((windDir - leg.bearing) * Math.PI / 180) * windSpd),
        oat: -46 + Math.round(Math.random() * 10),
        legDistance: leg.distance,
        cumulativeDistance: cumDist,
        legTime: Math.round(legTimeMin),
        cumulativeTime: Math.round(cumTime),
        eet: `${Math.floor(cumTime / 60)}h ${Math.round(cumTime % 60)}m`,
        efb: Math.round(fuelPlan.blockFuel * (1 - cumDist / Math.max(distance, 1))),
        pbrn: Math.round((fuelPlan.blockFuel / Math.max(distance, 1)) * cumDist),
      })
    }
  } else {
    const waypoints = interpolateWaypoints(depAirport.lat, depAirport.lon, arrAirport.lat, arrAirport.lon, distance)
    let cumDist = 0
    let cumTime = 0
    for (const wpt of waypoints) {
      cumDist += wpt.dist
      const legTimeMin = Math.max(1, (wpt.dist / profile.cruiseSpeed) * 60)
      cumTime += legTimeMin
      const windDir = 80 + Math.round(Math.random() * 30)
      const windSpd = 12 + Math.round(Math.random() * 20)
      flightLog.push({
        waypoint: wpt.id,
        lat: wpt.lat,
        lon: wpt.lon,
        altitude: profile.optimumFL * 100,
        mach: profile.maxCruiseMach,
        trueAirspeed: profile.cruiseSpeed,
        windDir,
        windSpeed: windSpd,
        windComponent: Math.round(Math.cos((windDir - wpt.bearing) * Math.PI / 180) * windSpd),
        oat: -46 + Math.round(Math.random() * 10),
        legDistance: wpt.dist,
        cumulativeDistance: cumDist,
        legTime: Math.round(legTimeMin),
        cumulativeTime: Math.round(cumTime),
        eet: `${Math.floor(cumTime / 60)}h ${Math.round(cumTime % 60)}m`,
        efb: Math.round(fuelPlan.blockFuel * (1 - cumDist / Math.max(distance, 1))),
        pbrn: Math.round((fuelPlan.blockFuel / Math.max(distance, 1)) * cumDist),
      })
    }
  }

  const avgWindDir = 90
  const avgWindSpeed = 18
  const avgWComponent = Math.round(Math.cos((avgWindDir - 90) * Math.PI / 180) * avgWindSpeed)

  return {
    header: {
      flightNumber: input.flightNumber,
      date: dateStr,
      depIcao: input.depIcao,
      arrIcao: input.arrIcao,
      depName: depAirport.name,
      arrName: arrAirport.name,
      aircraftIcao: input.aircraftIcao,
      aircraftReg: input.aircraftReg,
      aircraftName: profile.name,
      releaseTime: fmtZ(now),
      releaseDate: dateStr,
      ofpNumber: 1,
    },
    route: {
      routeString: input.routeString || `${input.depIcao} ${input.arrIcao}`,
      waypoints: parsed?.waypoints || flightLog.map(l => l.waypoint),
      totalDistance: distance,
      airDistance: distanceAir,
      groundDistance: Math.round(distance * 1.02),
      avgWind: `${avgWindDir}/${avgWindSpeed.toString().padStart(3, '0')}`,
      avgWComponent,
      avgISA: 13,
      avgFF: profile.fuelFlowCruise,
      altnIcao,
      altnName: altnAirport?.name || 'N/A',
    },
    times: {
      out: `${pad2(outTime.getUTCHours())}${pad2(outTime.getUTCMinutes())}`,
      off: `${pad2(offTime.getUTCHours())}${pad2(offTime.getUTCMinutes())}`,
      on: `${pad2(onTime.getUTCHours())}${pad2(onTime.getUTCMinutes())}`,
      in: `${pad2(inTime.getUTCHours())}${pad2(inTime.getUTCMinutes())}`,
      blockTime: fuelPlan.totalTime,
      flightTime: flightTimeMin,
      estimatedOff: `${pad2(offTime.getUTCHours())}${pad2(offTime.getUTCMinutes())}`,
      estimatedOn: `${pad2(onTime.getUTCHours())}${pad2(onTime.getUTCMinutes())}`,
    },
    fuel: {
      tripFuel: fuelPlan.tripFuel,
      tripFuelTime: fuelPlan.tripTime,
      contingencyFuel: fuelPlan.contingencyFuel,
      contingencyTime: fuelPlan.contingencyTime,
      alternateFuel: fuelPlan.alternateFuel,
      alternateTime: fuelPlan.alternateTime,
      finalReserve: fuelPlan.finalReserve,
      finalReserveTime: fuelPlan.finalReserveTime,
      minimumTakeoffFuel: fuelPlan.minimumTakeoffFuel,
      minimumTakeoffTime: fuelPlan.tripTime + fuelPlan.contingencyTime + fuelPlan.alternateTime + fuelPlan.finalReserveTime,
      extraFuel: fuelPlan.extraFuel,
      takeoffFuel: fuelPlan.takeoffFuel,
      takeoffTime: fuelPlan.tripTime + fuelPlan.contingencyTime + fuelPlan.alternateTime + fuelPlan.finalReserveTime,
      taxiFuel: fuelPlan.taxiFuel,
      taxiTime: 20,
      blockFuel: fuelPlan.blockFuel,
      picExtra: fuelPlan.picExtra,
      totalFuel: fuelPlan.totalFuel,
    },
    weights: {
      bew: weights.bew,
      paxCount: weights.paxCount,
      paxWeight: Math.round(weights.paxWeight),
      cargo: Math.round(weights.cargoWeight),
      payload: weights.payload,
      zfw: weights.zfw,
      mzfw: weights.mzfw,
      zfwRemaining: weights.zfwRemaining,
      tow: weights.tow,
      mtow: weights.mtow,
      towRemaining: weights.towRemaining,
      law: weights.law,
      mlw: weights.mlw,
      lawRemaining: weights.lawRemaining,
      fuelWeight: weights.fuelWeight,
      maxFuel: weights.maxFuel,
      fuelRemaining: weights.fuelRemaining,
    },
    flightLog,
    metar: { dep: weather.metarDep, arr: weather.metarArr, alt: weather.metarAlt },
    dispatch: {
      dispatcher: 'Kingfisher Dispatch',
      dispatcherTel: '+1 800 555 KFR',
      picName: input.pilotName || input.pilotCallsign || 'PILOT',
      picCallsign: input.pilotCallsign || '',
    },
    weatherInfo: {
      windsAloft: weather.windsAloft,
      wxProg: `${dateStr.slice(2, 4)}${pad2(now.getUTCHours())} ${dateStr.slice(2, 4)}${pad2((now.getUTCHours() + 3) % 24)} ${dateStr.slice(2, 4)}${pad2((now.getUTCHours() + 6) % 24)}`,
    },
  }
}
