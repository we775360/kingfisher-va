import { FastifyInstance } from 'fastify'
import {
  login, getMe, getDailyHub, getMySchedule, getAllSchedules,
  bookSchedule, cancelSchedule, batchCancelSchedule, getPositionStatus,
  getFlights, toggleFlight, getStats,
} from '../controllers/atc.controller.js'
import { authenticateATC } from '../middleware/atc.middleware.js'

export const atcRoutes = async (app: FastifyInstance) => {
  // Public
  app.post('/atc/login', login)

  // Authenticated ATC
  app.get('/atc/me', { preHandler: authenticateATC }, getMe)
  app.get('/atc/my-schedule', { preHandler: authenticateATC }, getMySchedule)
  app.post('/atc/schedule', { preHandler: authenticateATC }, bookSchedule)
  app.delete('/atc/schedule/:id', { preHandler: authenticateATC }, cancelSchedule)
  app.post('/atc/schedule/batch-cancel', { preHandler: authenticateATC }, batchCancelSchedule)
  app.get('/atc/flights', { preHandler: authenticateATC }, getFlights)
  app.patch('/atc/flights/:id/toggle', { preHandler: authenticateATC }, toggleFlight)
  app.get('/atc/stats', { preHandler: authenticateATC }, getStats)
  app.get('/atc/position-status', { preHandler: authenticateATC }, getPositionStatus)

  // Public but requires date context - use token from ATC too
  app.get('/atc/daily-hub', getDailyHub)
  app.get('/atc/schedules', { preHandler: authenticateATC }, getAllSchedules)
}
