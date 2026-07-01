import { getAircraftProfile, getAirport } from './nav-db.js'
import { parseRouteString } from './route-parser.js'
import { calculateFuelPlan, calculateWeights, calculateAlternateDistance, calculateFlightTime } from './fuel-calc.js'
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
  metar: {
    dep: string
    arr: string
    alt: string
  }
  dispatch: {
    dispatcher: string
    dispatcherTel: string
    picName: string
    picCallsign: string
  }
  weatherInfo: {
    windsAloft: any[]
    wxProg: string
  }
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
  const dd = `${pad2(d.getDate())}${['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'][d.getMonth()]}${d.getFullYear()}`
  return { dateStr: dd, dateObj: d }
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

  const routeDistance = parsed?.totalDistance || 0

  const distance = routeDistance > 0 ? routeDistance : 0
  const distanceAir = Math.round(distance * 0.97)

  const flightTimeMin = calculateFlightTime(distance, profile.cruiseSpeed, profile.climbTimePer1000ft * 3, profile.descentTimePer1000ft * 3)
  const altnDistance = altnAirport ? calculateAlternateDistance(input.depIcao, input.arrIcao, altnIcao) : 60
  const altnFlightTime = calculateFlightTime(altnDistance, profile.cruiseSpeed * 0.75, 8, 10)

  const fuelPlan = calculateFuelPlan(distance, altnDistance, flightTimeMin, altnFlightTime, profile)
  const weights = calculateWeights(profile, input.paxCount, input.cargoKg, fuelPlan.blockFuel)

  const weather = await fetchWeather(input.depIcao, input.arrIcao, altnIcao)

  const { dateStr, dateObj } = todayFormatted()
  const now = dateObj
  const outTime = new Date(now.getTime() + 60 * 60 * 1000)
  const offTime = new Date(outTime.getTime() + 20 * 60 * 1000)
  const onTime = new Date(offTime.getTime() + flightTimeMin * 60 * 1000)
  const inTime = new Date(onTime.getTime() + 5 * 60 * 1000)

  const fmtZ = (d: Date) => `${pad2(d.getDate())}${pad2(d.getHours())}${pad2(d.getMinutes())}`

  const flightLog: FlightLogEntry[] = []
  if (parsed && parsed.legs.length > 0) {
    let cumDist = 0
    let cumTime = 0
    for (const leg of parsed.legs) {
      cumDist += leg.distance
      const legTimeMin = (leg.distance / profile.cruiseSpeed) * 60
      cumTime += legTimeMin
      const windDir = 90 + Math.round(Math.random() * 30)
      const windSpd = 15 + Math.round(Math.random() * 20)
      flightLog.push({
        waypoint: leg.to,
        lat: Math.round(leg.toLat * 10) / 10,
        lon: Math.round(leg.toLon * 10) / 10,
        frequency: undefined,
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
        eet: `${Math.floor(cumTime / 60).toString().padStart(2, '0')}${Math.round(cumTime % 60).toString().padStart(2, '0')}`,
        efb: Math.round(fuelPlan.blockFuel * (1 - cumDist / (distance || 1))),
        pbrn: Math.round(5 + (cumDist / (distance || 1)) * 0.5 * 10) / 10,
      })
    }
  }

  const avgWindDir = 90
  const avgWindSpeed = 18
  const avgWComponent = Math.round(Math.cos((avgWindDir - 90) * Math.PI / 180) * avgWindSpeed)
  const avgISA = 13

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
      releaseTime: `${pad2(now.getUTCHours())}${pad2(now.getUTCMinutes())}`,
      releaseDate: dateStr,
      ofpNumber: 1,
    },
    route: {
      sid: parsed?.sid,
      star: parsed?.star,
      routeString: input.routeString || `${input.depIcao} ${input.arrIcao}`,
      waypoints: parsed?.waypoints || [input.depIcao, input.arrIcao],
      totalDistance: distance,
      airDistance: distanceAir,
      groundDistance: Math.round(distance * 1.02),
      avgWind: `${avgWindDir}/${avgWindSpeed.toString().padStart(3, '0')}`,
      avgWComponent: avgWComponent > 0 ? avgWComponent : avgWComponent,
      avgISA: avgISA,
      avgFF: profile.fuelFlowCruise,
      altnIcao,
      altnName: altnAirport?.name || 'N/A',
    },
    times: {
      out: fmtZ(outTime),
      off: fmtZ(offTime),
      on: fmtZ(onTime),
      in: fmtZ(inTime),
      blockTime: fuelPlan.totalTime,
      flightTime: flightTimeMin,
      estimatedOff: fmtZ(offTime),
      estimatedOn: fmtZ(onTime),
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
    metar: {
      dep: weather.metarDep,
      arr: weather.metarArr,
      alt: weather.metarAlt,
    },
    dispatch: {
      dispatcher: 'Kingfisher Dispatch',
      dispatcherTel: '+1 800 555 KFR',
      picName: input.pilotName || `${input.pilotCallsign || 'PILOT'}`,
      picCallsign: input.pilotCallsign || '',
    },
    weatherInfo: {
      windsAloft: weather.windsAloft,
      wxProg: `${dateStr.slice(2, 4)}${pad2(now.getUTCHours())} ${dateStr.slice(2, 4)}${pad2((now.getUTCHours() + 3) % 24)} ${dateStr.slice(2, 4)}${pad2((now.getUTCHours() + 6) % 24)}`,
    },
  }
}
