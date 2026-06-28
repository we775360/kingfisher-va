import { FastifyRequest, FastifyReply } from 'fastify'
import bcrypt from 'bcryptjs'
import prisma from '../utils/prisma.js'
import { positionBus } from '../utils/position-bus.js'
import { sendPIREPSubmitted } from '../discord/discord.js'

function getParam(req: FastifyRequest, name: string): string | undefined {
  const body = req.body as Record<string, any> | undefined
  const query = req.query as Record<string, any> | undefined
  return body?.[name]?.toString() ?? query?.[name]?.toString() ?? undefined
}

function getNumParam(req: FastifyRequest, name: string): number | undefined {
  const v = getParam(req, name)
  if (v === undefined || v === '') return undefined
  return parseFloat(v.replace(',', '.'))
}

function getIntParam(req: FastifyRequest, name: string): number | undefined {
  const v = getNumParam(req, name)
  return v !== undefined ? Math.round(v) : undefined
}

async function findPilotByUsername(username: string) {
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: username },
        { pilot: { callsign: username } },
        { pilot: { pilotId: username } },
      ],
    },
    include: { pilot: true },
  })
  return user?.pilot ?? null
}

async function getActiveBooking(pilotId: string) {
  return prisma.booking.findFirst({
    where: { pilotId, status: 'UPCOMING' },
    include: {
      route: { select: { flightNumber: true, depIcao: true, arrIcao: true, distance: true } },
      aircraft: { select: { name: true } },
    },
    orderBy: { depTime: 'asc' },
  })
}

// ── USERQUERY ──────────────────────────────────────────
export const userquery = async (req: FastifyRequest, reply: FastifyReply) => {
  const serverpass = getParam(req, 'serverpass') ?? ''
  const expectedServerPass = process.env.FSACARS_SERVER_PASS

  if (expectedServerPass && serverpass !== expectedServerPass) {
    return reply.type('text/plain').send('NOUSR')
  }

  const username = getParam(req, 'user') ?? ''
  const password = getParam(req, 'pass') ?? ''

  if (!username || !password) {
    return reply.type('text/plain').send('NOUSR')
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: username },
        { pilot: { callsign: username } },
        { pilot: { pilotId: username } },
      ],
    },
    include: { pilot: true },
  })

  if (!user?.pilot) {
    return reply.type('text/plain').send('NOUSR')
  }

  if (user.pilot.status === 'BANNED' || user.pilot.status === 'SUSPENDED') {
    return reply.type('text/plain').send('NOUSR')
  }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    return reply.type('text/plain').send('NOUSR')
  }

  return reply.type('text/plain').send('USEROK')
}

// ── DISPATCH ───────────────────────────────────────────
export const dispatch = async (req: FastifyRequest, reply: FastifyReply) => {
  const username = getParam(req, 'user') ?? ''

  if (!username) {
    return reply.type('text/plain').send('|No user specified|N/A|')
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: username },
        { pilot: { callsign: username } },
        { pilot: { pilotId: username } },
      ],
    },
    include: {
      pilot: {
        include: {
          bookings: {
            where: { status: 'UPCOMING' },
            include: { route: true },
            orderBy: { depTime: 'asc' },
            take: 1,
          },
        },
      },
    },
  })

  if (!user?.pilot || user.pilot.bookings.length === 0) {
    return reply.type('text/plain').send('|No active booking found|N/A|')
  }

  const booking = user.pilot.bookings[0]
  const orig = booking.route.depIcao
  const dest = booking.route.arrIcao
  const flightNumber = booking.route.flightNumber
  const depTimeStr = booking.depTime.toISOString().slice(0, 16).replace('T', ' ')
  const message = `Flight ${flightNumber} | ${orig}→${dest} | Dep: ${depTimeStr}Z`

  return reply.type('text/plain').send(`${orig}|${dest}|${message}|${flightNumber}|RESERVED|`)
}

// ── POSREP ─────────────────────────────────────────────
export const posrep = async (req: FastifyRequest, reply: FastifyReply) => {
  const username = getParam(req, 'user') ?? ''

  if (!username) {
    return reply.type('text/plain').send('')
  }

  const lat2 = getNumParam(req, 'lat2')
  const lon2 = getNumParam(req, 'lon2')
  const msl = getIntParam(req, 'msl')
  const gskts = getIntParam(req, 'gskts')
  const hdgtrue = getNumParam(req, 'hdgtrue')
  const onground = getParam(req, 'onground')
  const aircraft = getParam(req, 'aircraft') ?? ''

  if (lat2 === undefined || lon2 === undefined) {
    return reply.type('text/plain').send('')
  }

  const pilot = await findPilotByUsername(username)
  if (!pilot) {
    return reply.type('text/plain').send('')
  }

  const phase = onground === '1'
    ? 'TAXIIN'
    : (msl !== undefined && msl < 10000 ? 'APPROACH' : 'CRUISE')

  const existing = await prisma.liveFlight.findUnique({
    where: { pilotId: pilot.id },
  })

  let flightNumber = existing?.flightNumber
  let depIcao = existing?.depIcao
  let arrIcao = existing?.arrIcao

  if (!existing) {
    const booking = await getActiveBooking(pilot.id)
    if (booking) {
      flightNumber = booking.route.flightNumber
      depIcao = booking.route.depIcao
      arrIcao = booking.route.arrIcao
    } else {
      flightNumber = 'KFR----'
      depIcao = '----'
      arrIcao = '----'
    }
  }

  const liveFlight = await prisma.liveFlight.upsert({
    where: { pilotId: pilot.id },
    update: {
      lat: lat2,
      lng: lon2,
      alt: msl ?? 0,
      heading: Math.round(hdgtrue ?? 0),
      groundSpeed: gskts ?? 0,
      aircraftType: aircraft.substring(0, 50),
      phase: phase as any,
      lastUpdate: new Date(),
    },
    create: {
      pilotId: pilot.id,
      flightNumber: flightNumber!,
      depIcao: depIcao!,
      arrIcao: arrIcao!,
      aircraftType: aircraft.substring(0, 50),
      lat: lat2,
      lng: lon2,
      alt: msl ?? 0,
      heading: Math.round(hdgtrue ?? 0),
      groundSpeed: gskts ?? 0,
      phase: phase as any,
    },
    include: {
      pilot: { select: { pilotId: true, firstName: true, lastName: true, rank: true } },
    },
  })

  await prisma.telemetry.create({
    data: {
      liveFlightId: liveFlight.id,
      lat: lat2,
      lng: lon2,
      alt: msl ?? 0,
      heading: Math.round(hdgtrue ?? 0),
      groundSpeed: gskts ?? 0,
    },
  })

  positionBus.emitPosition({
    flightNumber: liveFlight.flightNumber,
    depIcao: liveFlight.depIcao,
    arrIcao: liveFlight.arrIcao,
    lat: lat2,
    lng: lon2,
    alt: msl ?? 0,
    heading: Math.round(hdgtrue ?? 0),
    groundSpeed: gskts ?? 0,
    phase,
    pilot: liveFlight.pilot,
    timestamp: Date.now(),
  })

  return reply.type('text/plain').send('')
}

// ── PIREP ──────────────────────────────────────────────
export const pirep = async (req: FastifyRequest, reply: FastifyReply) => {
  const username = getParam(req, 'user') ?? ''
  const password = getParam(req, 'pass') ?? ''

  if (!username || !password) {
    return reply.type('text/plain').send('#RXOK#|Authentication failed|')
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: username },
        { pilot: { callsign: username } },
        { pilot: { pilotId: username } },
      ],
    },
    include: { pilot: true },
  })

  if (!user?.pilot) {
    return reply.type('text/plain').send('#RXOK#|User not found|')
  }

  if (user.pilot.status === 'BANNED' || user.pilot.status === 'SUSPENDED') {
    return reply.type('text/plain').send('#RXOK#|Account suspended|')
  }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    return reply.type('text/plain').send('#RXOK#|Invalid password|')
  }

  const flightNumber = getParam(req, 'fnum') ?? 'KFR----'
  const atcData = getParam(req, 'atcData') ?? ''
  const atcParts = atcData.split('/')
  const atcCallsign = atcParts[1] || ''
  const atcType = atcParts[3] || ''

  const resolvedFlightNumber = atcCallsign || flightNumber

  // ── Aircraft matching ──
  const aircraftModel = getParam(req, 'aircraft') ?? ''
  const atcModel = getParam(req, 'atcModel') ?? ''

  let aircraft = await prisma.aircraft.findFirst({
    where: {
      OR: [
        { name: { contains: aircraftModel.substring(0, 30), mode: 'insensitive' } },
        { name: { contains: atcModel.substring(0, 30), mode: 'insensitive' } },
        ...(atcType ? [{ icao: atcType }] : []),
        ...(atcModel ? [{ icao: atcModel }] : []),
      ],
    },
  })
  if (!aircraft) {
    aircraft = await prisma.aircraft.findFirst()
  }

  // ── Parse times ──
  const blocktime = getNumParam(req, 'blocktime') ?? 0
  const airtime = getNumParam(req, 'airtime') ?? 0
  const actualNM = getNumParam(req, 'actualNM') ?? 0
  const fuelstart = getNumParam(req, 'fuelstart') ?? 0
  const fuelstop = getNumParam(req, 'fuelstop') ?? 0
  const fuelUsed = Math.max(0, fuelstart - fuelstop)
  const landingFPM = getIntParam(req, 'landingFPM') ?? 0
  const crashed = getParam(req, 'crashed') === '1'
  const comments = getParam(req, 'pirep') ?? ''
  const fsVersion = getParam(req, 'fsver') ?? 'FSX'

  const timeout = getParam(req, 'timeout') ?? '0000'
  const timein = getParam(req, 'timein') ?? '0000'
  const datestamp = getParam(req, 'datestamp')

  // ── Resolve dep/arr ICAO from request or fallback to booking ──
  let depIcao = getParam(req, 'orig') ?? ''
  let arrIcao = getParam(req, 'dest') ?? ''

  if (!depIcao || !arrIcao) {
    const booking = await getActiveBooking(user.pilot.id)
    if (booking) {
      depIcao = booking.route.depIcao
      arrIcao = booking.route.arrIcao
    }
  }
  if (!depIcao) depIcao = '----'
  if (!arrIcao) arrIcao = '----'

  // ── Build dep/arr times ──
  let depTime: Date
  let arrTime: Date

  if (datestamp) {
    const ts = parseInt(datestamp) * 1000
    const base = new Date(ts)
    depTime = new Date(base)
    depTime.setUTCHours(parseInt(timeout.substring(0, 2)) || 0, parseInt(timeout.substring(2, 4)) || 0, 0, 0)
    arrTime = new Date(base)
    arrTime.setUTCHours(parseInt(timein.substring(0, 2)) || 0, parseInt(timein.substring(2, 4)) || 0, 0, 0)
    if (arrTime <= depTime) arrTime.setDate(arrTime.getDate() + 1)
  } else {
    depTime = new Date()
    arrTime = new Date(Date.now() + (blocktime || airtime || 1) * 3600000)
  }

  if (crashed) {
    return reply.type('text/plain').send('#RXOK#|PIREP received - flight marked as crashed, no report generated|')
  }

  // ── Create PIREP ──
  const pirep = await prisma.pIREP.create({
    data: {
      pilotId: user.pilot.id,
      aircraftId: aircraft!.id,
      flightNumber: resolvedFlightNumber,
      depIcao,
      arrIcao,
      depTime,
      arrTime,
      flightTime: blocktime || airtime || 0.1,
      distance: actualNM,
      fuelUsed,
      landingRate: landingFPM,
      simulator: fsVersion,
      network: 'FSACARS',
      comments: comments || 'Submitted via FSACARS',
    },
  })

  // ── Mark booking as PIREP_PENDING ──
  const booking = await getActiveBooking(user.pilot.id)
  if (booking) {
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: 'PIREP_PENDING' },
    })
  }

  // ── Update pilot stats ──
  await prisma.pilot.update({
    where: { id: user.pilot.id },
    data: {
      totalFlights: { increment: 1 },
      totalHours: { increment: blocktime || airtime || 0.1 },
      totalDistance: { increment: actualNM },
    },
  })

  // ── Remove from live flights ──
  await prisma.liveFlight.delete({ where: { pilotId: user.pilot.id } }).catch(() => {})

  // ── Discord notification ──
  sendPIREPSubmitted(
    user.pilot.pilotId,
    `${user.pilot.firstName} ${user.pilot.lastName}`,
    pirep.flightNumber,
    pirep.depIcao,
    pirep.arrIcao,
  ).catch(() => {})

  return reply.type('text/plain').send('#RXOK#|PIREP received. Thank you for flying Kingfisher Virtual Airlines!|')
}
