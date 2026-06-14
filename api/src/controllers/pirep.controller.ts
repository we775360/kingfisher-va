import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import prisma from '../utils/prisma.js'
import { sendPIREPSubmitted } from '../discord/discord.js'

const HOURLY_RATE = 500

export const createPIREP = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { userId } = req.user as { userId: string }

    const schema = z.object({
      flightNumber: z.string().min(1),
      depIcao: z.string().min(4).max(4),
      arrIcao: z.string().min(4).max(4),
      depTime: z.string(),
      arrTime: z.string(),
      aircraftId: z.string(),
      simulator: z.string(),
      network: z.string(),
      landingRate: z.number(),
      fuelUsed: z.number(),
      distance: z.number(),
      flightTime: z.number(),
      comments: z.string().optional(),
      bookingId: z.string().optional(),
    })

    const body = schema.parse(req.body)

    const pilot = await prisma.pilot.findUnique({ where: { userId } })
    if (!pilot) return reply.status(404).send({ error: 'Pilot not found' })

    const pirep = await prisma.pIREP.create({
      data: {
        pilotId: pilot.id,
        aircraftId: body.aircraftId,
        flightNumber: body.flightNumber,
        depIcao: body.depIcao,
        arrIcao: body.arrIcao,
        depTime: new Date(body.depTime),
        arrTime: new Date(body.arrTime),
        flightTime: body.flightTime,
        distance: body.distance,
        fuelUsed: body.fuelUsed,
        landingRate: body.landingRate,
        simulator: body.simulator,
        network: body.network,
        comments: body.comments,
        bookingId: body.bookingId,
      }
    })

    // Update booking status if linked
    if (body.bookingId) {
      await prisma.booking.update({
        where: { id: body.bookingId },
        data: { status: 'PIREP_PENDING' }
      })
    }

    // Discord Notification
    await sendPIREPSubmitted(
      pilot.pilotId,
      `${pilot.firstName} ${pilot.lastName}`,
      pirep.flightNumber,
      pirep.depIcao,
      pirep.arrIcao
    ).catch(err => console.error('Discord Notify Error:', err))

    return reply.status(201).send(pirep)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return reply.status(400).send({ error: 'Invalid input', details: err.issues })
    }
    console.error(err)
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

export const getMyPIREPs = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { userId } = req.user as { userId: string }
    const pilot = await prisma.pilot.findUnique({ where: { userId } })
    if (!pilot) return reply.status(404).send({ error: 'Pilot not found' })

    const pireps = await prisma.pIREP.findMany({
      where: { pilotId: pilot.id },
      include: { aircraft: true },
      orderBy: { createdAt: 'desc' }
    })

    return reply.send(pireps)
  } catch (err) {
    console.error(err)
    return reply.status(500).send({ error: 'Internal server error' })
  }
}