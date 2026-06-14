import { FastifyRequest, FastifyReply } from 'fastify'

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
    const { role } = req.user as { userId: string, role: string }
    if (role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Admin access required' })
    }
  } catch {
    return reply.status(401).send({ error: 'Unauthorized' })
  }
}

export const requireStaff = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    await req.jwtVerify()
    const { role } = req.user as { userId: string, role: string }
    if (role !== 'ADMIN' && role !== 'STAFF') {
      return reply.status(403).send({ error: 'Staff access required' })
    }
  } catch {
    return reply.status(401).send({ error: 'Unauthorized' })
  }
}