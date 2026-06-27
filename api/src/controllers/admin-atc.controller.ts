import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import prisma from '../utils/prisma.js'
import { hashPassword } from '../utils/auth.js'

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
  VILH: 'Kushok Bakula Rimpochee Airport',
  VIAR: 'Sri Guru Ram Dass Jee International',
  VAAU: 'Aurangabad Airport',
  VABP: 'Raja Bhoj Airport',
  VARK: 'Visakhapatnam Airport',
}

const createATCSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  position: z.string().min(1),
  rating: z.string().min(1),
})

const setDailyHubSchema = z.object({
  depIcao: z.string().min(4).max(4),
  arrIcao: z.string().min(4).max(4),
  date: z.string().min(1),
})

// ── LIST ATC STAFF ──
export const listATCStaff = async (_req: FastifyRequest, reply: FastifyReply) => {
  try {
    const staff = await prisma.aTCController.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        position: true,
        rating: true,
        status: true,
        createdAt: true,
      },
    })
    return reply.send(staff)
  } catch (err) {
    console.error(err)
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

// ── CREATE ATC STAFF ──
export const createATCStaff = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const body = createATCSchema.parse(req.body)
    const existing = await prisma.aTCController.findUnique({ where: { email: body.email } })
    if (existing) {
      return reply.status(400).send({ error: 'Email already registered' })
    }
    const hashedPassword = await hashPassword(body.password)
    const staff = await prisma.aTCController.create({
      data: {
        email: body.email,
        password: hashedPassword,
        firstName: body.firstName,
        lastName: body.lastName,
        position: body.position,
        rating: body.rating,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        position: true,
        rating: true,
        status: true,
      },
    })
    return reply.status(201).send(staff)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return reply.status(400).send({ error: 'Invalid input', details: err.issues })
    }
    console.error(err)
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

// ── UPDATE ATC STAFF STATUS ──
export const updateATCStaffStatus = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = req.params as { id: string }
    const { status } = req.body as { status: string }
    const staff = await prisma.aTCController.update({
      where: { id },
      data: { status: status as any },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        position: true,
        rating: true,
        status: true,
      },
    })
    return reply.send(staff)
  } catch (err) {
    console.error(err)
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

// ── GET CURRENT DAILY HUB ──
export const getCurrentDailyHub = async (_req: FastifyRequest, reply: FastifyReply) => {
  try {
    const targetDate = new Date().toISOString().split('T')[0]
    const hub = await prisma.dailyHub.findUnique({ where: { date: targetDate } })
    return reply.send(hub)
  } catch (err) {
    console.error(err)
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

// ── SET DAILY HUB ──
export const setDailyHub = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const body = setDailyHubSchema.parse(req.body)

    const depName = AIRPORT_NAMES[body.depIcao] || body.depIcao
    const arrName = AIRPORT_NAMES[body.arrIcao] || body.arrIcao

    const hub = await prisma.dailyHub.upsert({
      where: { date: body.date },
      create: {
        depIcao: body.depIcao,
        arrIcao: body.arrIcao,
        depName,
        arrName,
        date: body.date,
      },
      update: {
        depIcao: body.depIcao,
        arrIcao: body.arrIcao,
        depName,
        arrName,
      },
    })
    return reply.send(hub)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return reply.status(400).send({ error: 'Invalid input', details: err.issues })
    }
    console.error(err)
    return reply.status(500).send({ error: 'Internal server error' })
  }
}
