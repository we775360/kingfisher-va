import { FastifyRequest, FastifyReply } from 'fastify'

export const authenticateATC = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const decoded = await req.jwtVerify<{ controllerId: string; role: string }>()
    if (decoded.role !== 'ATC') {
      return reply.status(403).send({ error: 'ATC access required' })
    }
    ;(req as any).controllerId = decoded.controllerId
  } catch {
    return reply.status(401).send({ error: 'Invalid or expired ATC token' })
  }
}
