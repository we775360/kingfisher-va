import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import prisma from '../utils/prisma.js'
import { hashPassword, verifyPassword } from '../utils/auth.js'
import { autoGenerateFlights } from './flight-generator.js'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

const POSITIONS = ['DEL', 'GND', 'TWR', 'APR', 'CTR']
const AIRPORTS = ['DEP', 'ARR']

// ── LOGIN ──
export const login = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const body = loginSchema.parse(req.body)
    const controller = await prisma.aTCController.findUnique({
      where: { email: body.email },
    })
    if (!controller) {
      return reply.status(401).send({ error: 'Invalid email or password' })
    }
    const valid = await verifyPassword(body.password, controller.password)
    if (!valid) {
      return reply.status(401).send({ error: 'Invalid email or password' })
    }
    if (controller.status === 'SUSPENDED') {
      return reply.status(403).send({ error: 'Account suspended. Contact admin.' })
    }
    const token = await reply.jwtSign(
      { controllerId: controller.id, role: 'ATC' },
      { expiresIn: '7d' }
    )
    return reply.send({
      token,
      user: {
        id: controller.id,
        email: controller.email,
        firstName: controller.firstName,
        lastName: controller.lastName,
        position: controller.position,
        rating: controller.rating,
        status: controller.status,
      },
    })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return reply.status(400).send({ error: 'Invalid input', details: err.issues })
    }
    console.error(err)
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

// ── GET ME ──
export const getMe = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const controllerId = (req as any).controllerId
    const controller = await prisma.aTCController.findUnique({
      where: { id: controllerId },
    })
    if (!controller) {
      return reply.status(404).send({ error: 'ATC controller not found' })
    }
    return reply.send({
      id: controller.id,
      email: controller.email,
      firstName: controller.firstName,
      lastName: controller.lastName,
      position: controller.position,
      rating: controller.rating,
      status: controller.status,
    })
  } catch (err) {
    console.error(err)
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

// ── GET DAILY HUB ──
export const getDailyHub = async (_req: FastifyRequest, reply: FastifyReply) => {
  try {
    const today = new Date().toISOString().split('T')[0]
    const hub = await prisma.dailyHub.findUnique({ where: { date: today } })
    return reply.send(hub)
  } catch (err) {
    console.error(err)
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

// ── GET MY SCHEDULE ──
export const getMySchedule = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const controllerId = (req as any).controllerId
    const schedules = await prisma.aTCSchedule.findMany({
      where: { staffId: controllerId },
      orderBy: [{ date: 'asc' }, { timeSlot: 'asc' }],
    })
    return reply.send(schedules)
  } catch (err) {
    console.error(err)
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

// ── GET ALL SCHEDULES ──
export const getAllSchedules = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const schedules = await prisma.aTCSchedule.findMany({
      include: {
        staff: { select: { id: true, firstName: true, lastName: true, position: true } },
      },
      orderBy: [{ date: 'asc' }, { timeSlot: 'asc' }],
    })
    const mapped = schedules.map(s => ({
      id: s.id,
      date: s.date,
      position: s.position,
      airport: s.airport,
      timeSlot: s.timeSlot,
      status: s.status,
      staffName: `${s.staff.firstName} ${s.staff.lastName}`,
      staffPosition: s.staff.position,
    }))
    return reply.send(mapped)
  } catch (err) {
    console.error(err)
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

const scheduleSchema = z.object({
  date: z.string(),
  position: z.string().min(1),
  airport: z.string().default('DEP'),
  timeSlot: z.string().min(1),
})

// ── BOOK SCHEDULE ──
export const bookSchedule = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const controllerId = (req as any).controllerId
    const body = scheduleSchema.parse(req.body)

    const existing = await prisma.aTCSchedule.findFirst({
      where: { staffId: controllerId, date: body.date, timeSlot: body.timeSlot, airport: body.airport },
    })
    if (existing) {
      return reply.status(400).send({ error: 'You already booked a slot for this date, time, and airport' })
    }

    const schedule = await prisma.aTCSchedule.create({
      data: {
        staffId: controllerId,
        date: body.date,
        position: body.position,
        airport: body.airport,
        timeSlot: body.timeSlot,
      },
    })

    // Try auto-generating flights
    await autoGenerateFlights(body.date, body.timeSlot).catch(err =>
      console.error('Flight generation check failed:', err)
    )

    return reply.status(201).send(schedule)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return reply.status(400).send({ error: 'Invalid input', details: err.issues })
    }
    console.error(err)
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

// ── CANCEL SCHEDULE ──
export const cancelSchedule = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const controllerId = (req as any).controllerId
    const { id } = req.params as { id: string }

    const schedule = await prisma.aTCSchedule.findFirst({
      where: { id, staffId: controllerId },
    })
    if (!schedule) {
      return reply.status(404).send({ error: 'Schedule not found' })
    }
    await prisma.aTCSchedule.delete({ where: { id } })
    return reply.send({ message: 'Schedule cancelled' })
  } catch (err) {
    console.error(err)
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

// ── GET POSITION STATUS ──
export const getPositionStatus = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const query = req.query as { date?: string }
    const date = query.date || new Date().toISOString().split('T')[0]

    const schedules = await prisma.aTCSchedule.findMany({
      where: { date },
      select: { position: true, airport: true, timeSlot: true, staffId: true },
    })

    // Group by timeSlot + airport
    const timeSlots = generateTimeSlots()
    const result: any[] = []

    for (const slot of timeSlots) {
      for (const airport of AIRPORTS) {
        const booked = schedules.filter(s => s.timeSlot === slot && s.airport === airport)
        const bookedPositions = new Set(booked.map(s => s.position))
        const positions = POSITIONS.map(pos => ({
          position: pos,
          filled: bookedPositions.has(pos),
          staffId: booked.find(s => s.position === pos)?.staffId || null,
        }))
        result.push({
          timeSlot: slot,
          airport,
          allFilled: positions.every(p => p.filled),
          filledCount: positions.filter(p => p.filled).length,
          totalCount: positions.length,
          positions,
        })
      }
    }

    return reply.send(result)
  } catch (err) {
    console.error(err)
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

// ── GET FLIGHTS ──
export const getFlights = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const today = new Date().toISOString().split('T')[0]
    const flights = await prisma.realisticFlight.findMany({
      where: { date: today },
      include: {
        pilot: { select: { id: true, firstName: true, lastName: true, pilotId: true } },
      },
      orderBy: [{ offBlock: 'asc' }],
    })
    const mapped = flights.map(f => ({
      id: f.id,
      flightNumber: f.flightNumber,
      depIcao: f.depIcao,
      arrIcao: f.arrIcao,
      depName: f.depName,
      arrName: f.arrName,
      offBlock: f.offBlock,
      onBlock: f.onBlock,
      network: f.network,
      status: f.status,
      depConfirmed: f.depConfirmed,
      arrConfirmed: f.arrConfirmed,
      pilotName: f.pilot ? `${f.pilot.firstName} ${f.pilot.lastName}` : null,
      pilotId: f.pilot?.pilotId || null,
    }))
    return reply.send(mapped)
  } catch (err) {
    console.error(err)
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

const toggleSchema = z.object({
  field: z.enum(['depConfirmed', 'arrConfirmed']),
})

// ── TOGGLE FLIGHT CONFIRMATION ──
export const toggleFlight = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = req.params as { id: string }
    const { field } = toggleSchema.parse(req.body)

    const flight = await prisma.realisticFlight.findUnique({ where: { id } })
    if (!flight) {
      return reply.status(404).send({ error: 'Flight not found' })
    }

    // Only allow confirmation on BOOKED flights
    if (flight.status !== 'BOOKED') {
      return reply.status(400).send({ error: 'Can only confirm flights that are booked by a pilot' })
    }

    // Don't allow confirmation before off-block time
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const currentMinutes = now.getUTCHours() * 60 + now.getUTCMinutes()
    const [offH, offM] = flight.offBlock.split(':').map(Number)
    const offBlockMinutes = offH * 60 + offM

    if (flight.date > today || (flight.date === today && offBlockMinutes > currentMinutes)) {
      return reply.status(400).send({ error: 'Cannot confirm flight before its scheduled off-block time' })
    }

    const updated = await prisma.realisticFlight.update({
      where: { id },
      data: { [field]: !(flight as any)[field] },
    })

    const newDep = field === 'depConfirmed' ? !flight.depConfirmed : flight.depConfirmed
    const newArr = field === 'arrConfirmed' ? !flight.arrConfirmed : flight.arrConfirmed

    if (newDep && newArr && flight.pilotId && flight.status === 'BOOKED') {
      await prisma.realisticFlight.update({
        where: { id },
        data: { status: 'COMPLETED' },
      })
      await prisma.pilot.update({
        where: { id: flight.pilotId },
        data: {
          walletBalance: { increment: flight.reward },
          totalFlights: { increment: 1 },
        },
      })
    }

    const final = await prisma.realisticFlight.findUnique({ where: { id } })
    return reply.send(final)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return reply.status(400).send({ error: 'Invalid input', details: err.issues })
    }
    console.error(err)
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

// ── GET STATS ──
export const getStats = async (_req: FastifyRequest, reply: FastifyReply) => {
  try {
    const today = new Date().toISOString().split('T')[0]
    const [staffOnline, schedules, flightsToday] = await Promise.all([
      prisma.aTCController.count({ where: { status: 'ACTIVE' } }),
      prisma.aTCSchedule.count({ where: { date: today } }),
      prisma.realisticFlight.count({ where: { date: today } }),
    ])

    const flightsBooked = await prisma.realisticFlight.count({ where: { date: today, status: { not: 'AVAILABLE' } } })
    const flightsCompleted = await prisma.realisticFlight.count({ where: { date: today, status: 'COMPLETED' } })

    return reply.send({
      staffOnline,
      positionsFilled: schedules,
      flightsToday,
      flightsBooked,
      flightsCompleted,
    })
  } catch (err) {
    console.error(err)
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

// ── HELPERS ──
function generateTimeSlots(): string[] {
  const slots: string[] = []
  for (let h = 0; h < 24; h++) {
    const hh = String(h).padStart(2, '0')
    slots.push(`${hh}:00-${hh}:30`)
    slots.push(`${hh}:30-${String(h + 1).padStart(2, '0')}:00`)
  }
  return slots
}
