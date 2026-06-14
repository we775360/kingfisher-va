import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import prisma from '../utils/prisma.js'
import {
  sendEventCreated
} from '../discord/discord.js'

export const getEvents = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const events = await prisma.event.findMany({
      orderBy: { date: 'asc' },
      include: {
        attendees: { select: { pilotId: true } }
      }
    })
    return reply.send(events)
  } catch (err) {
    console.error(err)
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

export const joinEvent = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { userId } = req.user as { userId: string }
    const { id } = req.params as { id: string }
    const pilot = await prisma.pilot.findUnique({ where: { userId } })
    if (!pilot) return reply.status(404).send({ error: 'Pilot not found' })
    const event = await prisma.event.findUnique({
      where: { id },
      include: { attendees: true }
    })
    if (!event) return reply.status(404).send({ error: 'Event not found' })
    if (event.attendees.length >= event.slots) {
      return reply.status(400).send({ error: 'Event is full' })
    }
    const existing = await prisma.eventAttendee.findUnique({
      where: { eventId_pilotId: { eventId: id, pilotId: pilot.id } }
    })
    if (existing) return reply.status(400).send({ error: 'Already joined' })
    await prisma.eventAttendee.create({
      data: { eventId: id, pilotId: pilot.id }
    })
    return reply.send({ message: 'Joined event successfully' })
  } catch (err) {
    console.error(err)
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

export const leaveEvent = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { userId } = req.user as { userId: string }
    const { id } = req.params as { id: string }
    const pilot = await prisma.pilot.findUnique({ where: { userId } })
    if (!pilot) return reply.status(404).send({ error: 'Pilot not found' })
    await prisma.eventAttendee.delete({
      where: { eventId_pilotId: { eventId: id, pilotId: pilot.id } }
    })
    return reply.send({ message: 'Left event' })
  } catch (err) {
    console.error(err)
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

export const createEvent = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const schema = z.object({
      title: z.string().min(1),
      description: z.string().min(1),
      route: z.string().min(1),
      depIcao: z.string().min(4).max(4),
      arrIcao: z.string().min(4).max(4),
      date: z.string(),
      earnings: z.number(),
      slots: z.number().int(),
      network: z.string(),
    })
    const body = schema.parse(req.body)
    const event = await prisma.event.create({
      data: { ...body, date: new Date(body.date) }
    })
    await sendEventCreated(
      event.title,
      event.route,
      event.depIcao,
      event.arrIcao
    )
    return reply.status(201).send(event)
  } catch (err) {
    if (err instanceof z.ZodError) return reply.status(400).send({ error: 'Invalid input', details: err.issues })
    console.error(err)
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

export const deleteEvent = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = req.params as { id: string }
    await prisma.event.delete({ where: { id } })
    return reply.send({ message: 'Event deleted' })
  } catch (err) {
    console.error(err)
    return reply.status(500).send({ error: 'Internal server error' })
  }
}