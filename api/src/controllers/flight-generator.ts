import prisma from '../utils/prisma.js'

const POSITIONS = ['DEL', 'GND', 'TWR', 'APR', 'CTR']
const AIRPORTS = ['DEP', 'ARR']

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

function generateFlightNumber(index: number): string {
  return `KFR${String(1001 + index)}`
}

export async function autoGenerateFlights(date: string, timeSlot: string) {
  // Check all 10 positions (5 DEP + 5 ARR) are filled
  const schedules = await prisma.aTCSchedule.findMany({
    where: { date, timeSlot },
  })

  const depBooked = new Set(schedules.filter(s => s.airport === 'DEP').map(s => s.position))
  const arrBooked = new Set(schedules.filter(s => s.airport === 'ARR').map(s => s.position))
  const depFilled = POSITIONS.every(p => depBooked.has(p))
  const arrFilled = POSITIONS.every(p => arrBooked.has(p))

  if (!depFilled || !arrFilled) {
    return { generated: 0, reason: `Need all positions at both airports. DEP: ${depFilled}, ARR: ${arrFilled}` }
  }

  // Check if flights already generated
  const existingFlights = await prisma.realisticFlight.count({
    where: { date, timeSlot },
  })
  if (existingFlights > 0) {
    return { generated: 0, reason: 'Flights already generated for this slot' }
  }

  // Get daily hub
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

  const estimatedMinutes = Math.round(distance / 420 * 60 + 30)
  const estTimeStr = `${Math.floor(estimatedMinutes / 60)}h ${estimatedMinutes % 60}m`

  const [slotStartStr, slotEndStr] = timeSlot.split('-')
  const slotStart = timeToMinutes(slotStartStr)
  const slotEnd = timeToMinutes(slotEndStr)
  const slotDuration = slotEnd - slotStart

  // Generate 20 flights
  const numFlights = 20
  const spacing = Math.floor(slotDuration / (numFlights + 1))

  const totalFlights = await prisma.realisticFlight.count()

  const networks = ['VATSIM', 'IVAO']
  const flights: any[] = []

  for (let i = 0; i < numFlights; i++) {
    const offBlockMin = slotStart + spacing * (i + 1)
    const onBlockMin = offBlockMin + estimatedMinutes

    if (onBlockMin > slotEnd + 60) break

    const offBlock = minutesToTime(offBlockMin)
    const onBlock = minutesToTime(onBlockMin)
    const network = networks[i % 2]

    flights.push({
      flightNumber: generateFlightNumber(totalFlights + i),
      depIcao,
      arrIcao,
      depName,
      arrName,
      offBlock,
      onBlock,
      estimatedFlightTime: estTimeStr,
      distance,
      network,
      reward: Math.round(distance * 0.15 + 20),
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
