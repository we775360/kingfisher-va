import { FastifyInstance } from 'fastify'
import { authenticate } from '../middleware/auth.middleware.js'
import { createPIREP, getMyPIREPs } from '../controllers/pirep.controller.js'

export const pirepRoutes = async (app: FastifyInstance) => {
  app.post('/pireps', { preHandler: authenticate }, createPIREP)
  app.get('/pireps/my', { preHandler: authenticate }, getMyPIREPs)
}