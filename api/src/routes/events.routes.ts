import { FastifyInstance } from 'fastify'
import { authenticate } from '../middleware/auth.middleware.js'
import { requireAdmin } from '../middleware/auth.middleware.js'
import { getEvents, joinEvent, leaveEvent, createEvent, deleteEvent } from '../controllers/events.controller.js'

export const eventRoutes = async (app: FastifyInstance) => {
  app.get('/events', { preHandler: authenticate }, getEvents)
  app.post('/events/:id/join', { preHandler: authenticate }, joinEvent)
  app.delete('/events/:id/leave', { preHandler: authenticate }, leaveEvent)
  app.post('/events', { preHandler: requireAdmin }, createEvent)
  app.delete('/events/:id', { preHandler: requireAdmin }, deleteEvent)
}