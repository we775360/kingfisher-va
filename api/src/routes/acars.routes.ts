import { FastifyInstance } from 'fastify'
import {
  getSimBriefData,
  startLiveFlight,
  updatePosition,
  endLiveFlight
} from '../controllers/acars.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'

export default async function acarsRoutes(fastify: FastifyInstance) {
  // Public-ish but requires pilot auth
  fastify.get('/simbrief', { preHandler: [authenticate] }, getSimBriefData)
  
  // Tracking endpoints
  fastify.post('/start', { preHandler: [authenticate] }, startLiveFlight)
  fastify.post('/position', { preHandler: [authenticate] }, updatePosition)
  fastify.post('/end', { preHandler: [authenticate] }, endLiveFlight)
}
