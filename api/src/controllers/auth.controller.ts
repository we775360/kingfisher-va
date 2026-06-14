import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import prisma from '../utils/prisma.js'
import { hashPassword, verifyPassword, generatePilotId, generateToken } from '../utils/auth.js'
import { sendPilotRegistered } from '../discord/discord.js'

// ── SCHEMAS ──
const registerSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

// ── REGISTER ──
export const register = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const body = registerSchema.parse(req.body)

    const existing = await prisma.user.findUnique({
      where: { email: body.email }
    })

    if (existing) {
      return reply.status(400).send({ error: 'Email already registered' })
    }

    const pilotCount = await prisma.pilot.count()
    const hashedPassword = await hashPassword(body.password)
    const emailVerifyToken = generateToken()

    const user = await prisma.user.create({
      data: {
        email: body.email,
        password: hashedPassword,
        emailVerifyToken,
        pilot: {
          create: {
            firstName: body.firstName,
            lastName: body.lastName,
            pilotId: generatePilotId(pilotCount),
            callsign: generatePilotId(pilotCount),
            rank: 'Student Pilot',
          }
        }
      },
      include: { pilot: true }
    })

    await sendPilotRegistered(
      user.pilot!.pilotId,
      `${user.pilot!.firstName} ${user.pilot!.lastName}`,
      user.pilot!.rank
    )

    const token = await reply.jwtSign(
      { userId: user.id, role: user.role },
      { expiresIn: '7d' }
    )

    return reply.status(201).send({
      message: 'Registration successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        pilot: {
          id: user.pilot?.id,
          pilotId: user.pilot?.pilotId,
          firstName: user.pilot?.firstName,
          lastName: user.pilot?.lastName,
          rank: user.pilot?.rank,
          totalHours: user.pilot?.totalHours,
        }
      }
    })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return reply.status(400).send({ error: 'Invalid input', details: err.issues })
    }
    console.error(err)
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

// ── LOGIN ──
export const login = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const body = loginSchema.parse(req.body)

    const user = await prisma.user.findUnique({
      where: { email: body.email },
      include: { pilot: true }
    })

    if (!user) {
      return reply.status(401).send({ error: 'Invalid email or password' })
    }

    const validPassword = await verifyPassword(body.password, user.password)

    if (!validPassword) {
      return reply.status(401).send({ error: 'Invalid email or password' })
    }

    if (user.pilot?.status === 'BANNED') {
      return reply.status(403).send({ error: 'Your account has been banned' })
    }

    if (user.pilot?.status === 'SUSPENDED') {
      return reply.status(403).send({ error: 'Your account has been suspended' })
    }

    const token = await reply.jwtSign(
      { userId: user.id, role: user.role },
      { expiresIn: '7d' }
    )

    return reply.send({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        pilot: {
          id: user.pilot?.id,
          pilotId: user.pilot?.pilotId,
          firstName: user.pilot?.firstName,
          lastName: user.pilot?.lastName,
          rank: user.pilot?.rank,
          totalHours: user.pilot?.totalHours,
          status: user.pilot?.status,
        }
      }
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
    const { userId } = req.user as { userId: string, role: string }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { pilot: true }
    })

    if (!user) {
      return reply.status(404).send({ error: 'User not found' })
    }

    return reply.send({
      id: user.id,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      pilot: user.pilot,
    })
  } catch (err) {
    console.error(err)
    return reply.status(500).send({ error: 'Internal server error' })
  }
}