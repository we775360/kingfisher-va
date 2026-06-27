import { FastifyRequest, FastifyReply } from 'fastify'
import prisma from '../utils/prisma.js'

export const authenticate = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    await req.jwtVerify()
  } catch {
    return reply.status(401).send({ error: 'Unauthorized' })
  }
}

export const requireAdmin = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    await req.jwtVerify()
    const { userId } = req.user as { userId: string, role: string }
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } })
    if (!user || user.role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Admin access required' })
    }
  } catch {
    return reply.status(401).send({ error: 'Unauthorized' })
  }
}

export const requireStaff = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    await req.jwtVerify()
    const { userId } = req.user as { userId: string, role: string }
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } })
    if (!user || (user.role !== 'ADMIN' && user.role !== 'STAFF')) {
      return reply.status(403).send({ error: 'Staff access required' })
    }
  } catch {
    return reply.status(401).send({ error: 'Unauthorized' })
  }
}