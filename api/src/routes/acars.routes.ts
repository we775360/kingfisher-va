import { FastifyInstance } from 'fastify'
import {
  startLiveFlight,
  updatePosition,
  endLiveFlight
} from '../controllers/acars.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'

export default async function acarsRoutes(fastify: FastifyInstance) {
  // Tracking endpoints
  fastify.post('/start', { preHandler: [authenticate] }, startLiveFlight)
  fastify.post('/position', { preHandler: [authenticate] }, updatePosition)
  fastify.post('/end', { preHandler: [authenticate] }, endLiveFlight)
}
