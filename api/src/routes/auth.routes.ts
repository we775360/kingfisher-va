import { FastifyInstance } from 'fastify'
import { register, login, getMe } from '../controllers/auth.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'

export const authRoutes = async (app: FastifyInstance) => {
  app.post('/auth/register', register)
  app.post('/auth/login', login)
  app.get('/auth/me', { preHandler: authenticate }, getMe)
}