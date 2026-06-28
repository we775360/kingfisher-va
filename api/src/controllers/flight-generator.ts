import prisma from '../utils/prisma.js'

const AIRPORT_NAMES: Record<string, string> = {
  VIDP: 'Indira Gandhi International',
  VABB: 'Chhatrapati Shivaji Maharaj International',
  VOBL: 'Kempegowda International',
  VOMM: 'Chennai International',
  VECC: 'Netaji Subhas Chandra Bose International',
  VOHS: 'Rajiv Gandhi International',
  VAAH: 'Sardar Vallabhbhai Patel International',
  VOGO: 'Dabolim International',
  VOTV: 'Thiruvananthapuram International',
  VOCI: 'Cochin International',
  OPKC: 'Jinnah International',
  OMDB: 'Dubai International',
  OTHH: 'Hamad International',
  EGLL: 'London Heathrow',
  KJFK: 'John F. Kennedy International',
  WSSS: 'Singapore Changi',
  VHHH: 'Hong Kong International',
  VTBS: 'Suvarnabhumi International',
}

const AIRPORT_COORDS: Record<string, [number, number]> = {
  VIDP: [28.5665, 77.1031],
  VABB: [19.0896, 72.8656],
  VOBL: [13.1986, 77.7066],
  VOMM: [12.9941, 80.1708],
  VECC: [22.6547, 88.4467],
  VOHS: [17.2403, 78.4297],
  VAAH: [23.0734, 72.6347],
  VOGO: [15.3808, 73.8314],
  VOTV: [8.4821, 76.92],
  VOCI: [10.152, 76.4019],
  OPKC: [24.9065, 67.1608],
  OMDB: [25.2532, 55.3657],
  OTHH: [25.2731, 51.6081],
  EGLL: [51.47, -0.4543],
  KJFK: [40.6413, -73.7781],
  WSSS: [1.3502, 103.9945],
  VHHH: [22.308, 113.9185],
  VTBS: [13.69, 100.7501],
}

function toRad(deg: number) {
  return (deg * Math.PI) / 180
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3440.065
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c)
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(min: number): string {
  const h = Math.floor(min / 60) % 24
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

const ROUTE_FLIGHT_CODES: Record<string, string> = {
  'VIDP-VABB': '501',
  'VABB-VIDP': '502',
  'VIDP-VOBL': '503',
  'VOBL-VIDP': '504',
  'VIDP-VOMM': '505',
  'VOMM-VIDP': '506',
  'VIDP-VECC': '507',
  'VECC-VIDP': '508',
  'VABB-VOBL': '511',
  'VOBL-VABB': '512',
  'VABB-VOMM': '513',
  'VOMM-VABB': '514',
  'VABB-VECC': '515',
  'VECC-VABB': '516',
  'VABB-OMDB': '521',
  'OMDB-VABB': '522',
  'VIDP-OMDB': '523',
  'OMDB-VIDP': '524',
  'VABB-EGLL': '531',
  'EGLL-VABB': '532',
  'VIDP-EGLL': '533',
  'EGLL-VIDP': '534',
  'VABB-WSSS': '541',
  'WSSS-VABB': '542',
  'VIDP-WSSS': '543',
  'WSSS-VIDP': '544',
}

const AIRCRAFT_TYPES: Record<string, string> = {
  SHORT: 'A320',
  MEDIUM: 'A321',
  LONG: 'A330',
  ULTRALONG: 'A380',
}

function getRouteCode(dep: string, arr: string): string {
  return ROUTE_FLIGHT_CODES[`${dep}-${arr}`] || ROUTE_FLIGHT_CODES[`${arr}-${dep}`] || '601'
}

function getAircraftForDistance(distance: number): string {
  if (distance < 500) return AIRCRAFT_TYPES.SHORT
  if (distance < 1500) return AIRCRAFT_TYPES.MEDIUM
  if (distance < 3000) return AIRCRAFT_TYPES.LONG
  return AIRCRAFT_TYPES.ULTRALONG
}

function getFlightsForTimeSlot(slot: string): number {
  const hour = parseInt(slot.split(':')[0])
  // Peak hours (6-9, 17-20): 6 flights
  // Mid hours (10-16): 5 flights
  // Off-peak (0-5, 21-23): 3 flights
  if ((hour >= 6 && hour <= 9) || (hour >= 17 && hour <= 20)) return 6
  if (hour >= 10 && hour <= 16) return 5
  return 3
}

export async function autoGenerateFlights(date: string, timeSlot: string) {
  const schedules = await prisma.aTCSchedule.findMany({
    where: { date, timeSlot },
  })

  const depBooked = new Set(schedules.filter(s => s.airport === 'DEP').map(s => s.position))
  const arrBooked = new Set(schedules.filter(s => s.airport === 'ARR').map(s => s.position))
  const filledCount = depBooked.size + arrBooked.size

  // Need ALL 5 positions at both airports to generate
  if (depBooked.size < 5 || arrBooked.size < 5) {
    return { generated: 0, reason: `Only ${depBooked.size}/5 DEP + ${arrBooked.size}/5 ARR filled. Need all 10.` }
  }

  const existingFlights = await prisma.realisticFlight.count({
    where: { date, timeSlot },
  })
  if (existingFlights > 0) {
    return { generated: 0, reason: 'Flights already generated for this slot' }
  }

  const hub = await prisma.dailyHub.findUnique({ where: { date } })
  if (!hub) {
    return { generated: 0, reason: 'No daily hub set for this date' }
  }

  const depIcao = hub.depIcao
  const arrIcao = hub.arrIcao
  const depName = hub.depName || AIRPORT_NAMES[depIcao] || depIcao
  const arrName = hub.arrName || AIRPORT_NAMES[arrIcao] || arrIcao

  const depCoord = AIRPORT_COORDS[depIcao]
  const arrCoord = AIRPORT_COORDS[arrIcao]
  const distance = depCoord && arrCoord
    ? calculateDistance(depCoord[0], depCoord[1], arrCoord[0], arrCoord[1])
    : 500

  const cruiseSpeed = distance < 500 ? 420 : distance < 1500 ? 450 : 480
  const estimatedMinutes = Math.round(distance / cruiseSpeed * 60 + 35)
  const estTimeStr = `${Math.floor(estimatedMinutes / 60)}h ${estimatedMinutes % 60}m`

  const [slotStartStr, slotEndStr] = timeSlot.split('-')
  const slotStart = timeToMinutes(slotStartStr)
  const slotEnd = timeToMinutes(slotEndStr)
  const slotDuration = slotEnd - slotStart

  const numFlights = getFlightsForTimeSlot(timeSlot)
  const spacing = Math.floor(slotDuration / (numFlights + 1))

  const routeCode = getRouteCode(depIcao, arrIcao)
  const existingCount = await prisma.realisticFlight.count()

  const networks = ['VATSIM', 'IVAO']
  const aircraftTypes = ['A320', 'A321', 'A320', 'A321', 'B738', 'B739']
  const flights: any[] = []

  for (let i = 0; i < numFlights; i++) {
    const offBlockMin = slotStart + spacing * (i + 1) + Math.floor(Math.random() * 3)
    const onBlockMin = offBlockMin + estimatedMinutes

    if (onBlockMin > slotEnd + 60) break

    const offBlock = minutesToTime(offBlockMin)
    const onBlock = minutesToTime(onBlockMin)
    const network = i % 3 === 2 ? 'VATSIM' : networks[i % 2]
    const acType = aircraftTypes[i % aircraftTypes.length]
    const flightNum = `${routeCode}${String(i + 1).padStart(2, '0')}`

    flights.push({
      flightNumber: `KFR${flightNum}`,
      aircraftType: acType,
      depIcao,
      arrIcao,
      depName,
      arrName,
      offBlock,
      onBlock,
      estimatedFlightTime: estTimeStr,
      distance,
      network,
      reward: Math.round(distance * 0.15 + 25 + Math.floor(Math.random() * 10)),
      date,
      timeSlot,
      status: 'AVAILABLE' as const,
      depConfirmed: false,
      arrConfirmed: false,
    })
  }

  if (flights.length > 0) {
    await prisma.realisticFlight.createMany({ data: flights })
  }

  return { generated: flights.length, reason: 'success' }
}
