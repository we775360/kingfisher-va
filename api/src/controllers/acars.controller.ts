import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import prisma from '../utils/prisma.js'
import axios from 'axios'
import { positionBus } from '../utils/position-bus.js'

export const getSimBriefData = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { username } = req.query as { username: string }
    if (!username) return reply.status(400).send({ error: 'SimBrief username required' })

    const response = await axios.get(`https://www.simbrief.com/api/xml.fetcher.php?username=${username}&json=1`)
    return reply.send(response.data)
  } catch (err) {
    console.error('SimBrief Fetch Error:', err)
    return reply.status(500).send({ error: 'Failed to fetch SimBrief data' })
  }
}

export const startLiveFlight = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { userId } = req.user as { userId: string }
    const schema = z.object({
      bookingId: z.string().optional(),
      flightNumber: z.string(),
      depIcao: z.string(),
      arrIcao: z.string(),
      aircraftType: z.string(),
      simulator: z.string().optional(),
      network: z.string().optional(),
    })

    const body = schema.parse(req.body)
    const pilot = await prisma.pilot.findUnique({ where: { userId } })
    if (!pilot) return reply.status(404).send({ error: 'Pilot not found' })

    const liveFlight = await prisma.liveFlight.upsert({
      where: { pilotId: pilot.id },
      update: {
        bookingId: body.bookingId,
        flightNumber: body.flightNumber,
        depIcao: body.depIcao,
        arrIcao: body.arrIcao,
        aircraftType: body.aircraftType,
        simulator: body.simulator,
        onlineNetwork: body.network,
        phase: 'PREFLIGHT',
        lastUpdate: new Date(),
      },
      create: {
        pilotId: pilot.id,
        bookingId: body.bookingId,
        flightNumber: body.flightNumber,
        depIcao: body.depIcao,
        arrIcao: body.arrIcao,
        aircraftType: body.aircraftType,
        simulator: body.simulator,
        onlineNetwork: body.network,
        lat: 0, lng: 0, alt: 0, heading: 0, groundSpeed: 0,
      }
    })

    return reply.send(liveFlight)
  } catch (err) {
    console.error(err)
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

export const updatePosition = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { userId } = req.user as { userId: string }
    const schema = z.object({
      lat: z.number(),
      lng: z.number(),
      alt: z.number(),
      heading: z.number(),
      groundSpeed: z.number(),
      phase: z.string().optional(),
      fuel: z.number().optional(),
      vs: z.number().optional(),
    })

    const body = schema.parse(req.body)
    const pilot = await prisma.pilot.findUnique({ where: { userId } })
    if (!pilot) return reply.status(404).send({ error: 'Pilot not found' })

    const liveFlight = await prisma.liveFlight.update({
      where: { pilotId: pilot.id },
      data: {
        lat: body.lat,
        lng: body.lng,
        alt: body.alt,
        heading: body.heading,
        groundSpeed: body.groundSpeed,
        phase: (body.phase as any) || 'PREFLIGHT',
        lastUpdate: new Date(),
      },  
      include: {
        pilot: { select: { pilotId: true, firstName: true, lastName: true, rank: true } }
      }
    })

    await prisma.telemetry.create({
      data: {
        liveFlightId: liveFlight.id,
        lat: body.lat,
        lng: body.lng,
        alt: body.alt,
        heading: body.heading,
        groundSpeed: body.groundSpeed,
      }
    })

    positionBus.emitPosition({
      flightNumber: liveFlight.flightNumber,
      depIcao: liveFlight.depIcao,
      arrIcao: liveFlight.arrIcao,
      lat: body.lat,
      lng: body.lng,
      alt: body.alt,
      heading: body.heading,
      groundSpeed: body.groundSpeed,
      phase: body.phase || 'PREFLIGHT',
      pilot: liveFlight.pilot,
      timestamp: Date.now(),
    })

    return reply.send({ success: true })
  } catch (err) {
    console.error(err)
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

export const endLiveFlight = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { userId } = req.user as { userId: string }
    const pilot = await prisma.pilot.findUnique({ where: { userId } })
    if (!pilot) return reply.status(404).send({ error: 'Pilot not found' })

    await prisma.liveFlight.delete({
      where: { pilotId: pilot.id }
    })

    return reply.send({ message: 'Flight ended' })
  } catch (err) {
    console.error(err)
    return reply.status(500).send({ error: 'Internal server error' })
  }
}
