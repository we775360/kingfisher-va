import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import prisma from '../utils/prisma.js'

const REALISTIC_HOURLY_RATE = 700

export function parseHours(timeStr: string): number {
  let total = 0
  const hMatch = timeStr.match(/(\d+)\s*h/)
  const mMatch = timeStr.match(/(\d+)\s*m/)
  if (hMatch) total += parseInt(hMatch[1])
  if (mMatch) total += parseInt(mMatch[1]) / 60
  return Math.max(total, 0.5)
}

// ── GET AVAILABLE FLIGHTS ──
export const getAvailableFlights = async (_req: FastifyRequest, reply: FastifyReply) => {
  try {
    const today = new Date().toISOString().split('T')[0]
    const flights = await prisma.realisticFlight.findMany({
      where: { date: today },
      orderBy: [{ timeSlot: 'asc' }, { offBlock: 'asc' }],
    })
    return reply.send(flights)
  } catch (err) {
    console.error(err)
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

// ── GET MY BOOKINGS ──
export const getMyBookings = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { userId } = req.user as { userId: string; role: string }
    const pilot = await prisma.pilot.findUnique({ where: { userId } })
    if (!pilot) {
      return reply.status(404).send({ error: 'Pilot not found' })
    }
    const bookings = await prisma.realisticFlight.findMany({
      where: { pilotId: pilot.id },
      orderBy: [{ date: 'desc' }, { offBlock: 'asc' }],
    })
    return reply.send(bookings)
  } catch (err) {
    console.error(err)
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

const bookSchema = z.object({
  flightId: z.string(),
})

// ── BOOK A FLIGHT ──
export const bookFlight = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { userId } = req.user as { userId: string; role: string }
    const pilot = await prisma.pilot.findUnique({ where: { userId } })
    if (!pilot) {
      return reply.status(404).send({ error: 'Pilot not found' })
    }

    const body = bookSchema.parse(req.body)
    const flight = await prisma.realisticFlight.findUnique({
      where: { id: body.flightId },
    })
    if (!flight) {
      return reply.status(404).send({ error: 'Flight not found' })
    }
    if (flight.status !== 'AVAILABLE') {
      return reply.status(400).send({ error: 'Flight is not available' })
    }

    const updated = await prisma.realisticFlight.update({
      where: { id: body.flightId },
      data: {
        pilotId: pilot.id,
        status: 'BOOKED',
        bookedAt: new Date(),
      },
    })
    return reply.send(updated)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return reply.status(400).send({ error: 'Invalid input', details: err.issues })
    }
    console.error(err)
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

// ── CANCEL BOOKING ──
export const cancelBooking = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { userId } = req.user as { userId: string; role: string }
    const pilot = await prisma.pilot.findUnique({ where: { userId } })
    if (!pilot) {
      return reply.status(404).send({ error: 'Pilot not found' })
    }

    const { id } = req.params as { id: string }
    const flight = await prisma.realisticFlight.findFirst({
      where: { id, pilotId: pilot.id },
    })
    if (!flight) {
      return reply.status(404).send({ error: 'Booking not found' })
    }
    if (flight.status !== 'BOOKED') {
      return reply.status(400).send({ error: 'Cannot cancel a non-booked flight' })
    }

    // Apply $500 cancellation penalty
    if (pilot.walletBalance < 500) {
      return reply.status(400).send({ error: 'Insufficient funds. Cancellation requires a $500 penalty fee.' })
    }
    await prisma.pilot.update({
      where: { id: pilot.id },
      data: { walletBalance: { decrement: 500 } },
    })

    const updated = await prisma.realisticFlight.update({
      where: { id },
      data: {
        pilotId: null,
        status: 'AVAILABLE',
        bookedAt: null,
        depConfirmed: false,
        arrConfirmed: false,
      },
    })
    return reply.send(updated)
  } catch (err) {
    console.error(err)
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

// ── GET REALISTIC FLIGHT BY ID ──
export const getRealisticFlightById = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { userId } = req.user as { userId: string; role: string }
    const { id } = req.params as { id: string }

    const pilot = await prisma.pilot.findUnique({ where: { userId } })
    if (!pilot) return reply.status(404).send({ error: 'Pilot not found' })

    const flight = await prisma.realisticFlight.findUnique({
      where: { id },
      include: {
        pilot: {
          select: {
            pilotId: true,
            firstName: true,
            lastName: true,
            rank: true,
            callsign: true,
          }
        }
      }
    })
    if (!flight) return reply.status(404).send({ error: 'Flight not found' })
    if (flight.pilotId !== pilot.id) return reply.status(403).send({ error: 'Not your booking' })

    return reply.send(flight)
  } catch (err) {
    console.error(err)
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

// ── CHANGE REALISTIC FLIGHT NETWORK ──
export const changeRealisticNetwork = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { userId } = req.user as { userId: string; role: string }
    const { id } = req.params as { id: string }

    const schema = z.object({
      network: z.enum(['VATSIM', 'IVAO']),
    })
    const body = schema.parse(req.body)

    const pilot = await prisma.pilot.findUnique({ where: { userId } })
    if (!pilot) return reply.status(404).send({ error: 'Pilot not found' })

    const flight = await prisma.realisticFlight.findUnique({ where: { id } })
    if (!flight) return reply.status(404).send({ error: 'Flight not found' })
    if (flight.pilotId !== pilot.id) return reply.status(403).send({ error: 'Not your booking' })
    if (flight.status !== 'BOOKED') return reply.status(400).send({ error: 'Can only change network on booked flights' })

    await prisma.realisticFlight.update({
      where: { id },
      data: { network: body.network }
    })

    return reply.send({ success: true, network: body.network })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return reply.status(400).send({ error: 'Invalid input', details: err.issues })
    }
    console.error(err)
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

// ── ATC CANCEL BOOKING (no penalty) ──
export const atcCancelBooking = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = req.params as { id: string }
    const flight = await prisma.realisticFlight.findUnique({ where: { id } })
    if (!flight) {
      return reply.status(404).send({ error: 'Flight not found' })
    }
    if (flight.status !== 'BOOKED') {
      return reply.status(400).send({ error: 'Flight is not booked' })
    }

    const updated = await prisma.realisticFlight.update({
      where: { id },
      data: {
        pilotId: null,
        status: 'AVAILABLE',
        bookedAt: null,
        depConfirmed: false,
        arrConfirmed: false,
      },
    })
    return reply.send(updated)
  } catch (err) {
    console.error(err)
    return reply.status(500).send({ error: 'Internal server error' })
  }
}
