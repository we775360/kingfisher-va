import { FastifyInstance } from 'fastify'
import {
  getAvailableFlights, getMyBookings, bookFlight, cancelBooking, getRealisticFlightById,
  changeRealisticNetwork, atcCancelBooking,
} from '../controllers/realistic-flights.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'
import { authenticateATC } from '../middleware/atc.middleware.js'

export const realisticFlightsRoutes = async (app: FastifyInstance) => {
  app.get('/realistic-flights', getAvailableFlights)
  app.get('/realistic-flights/my', { preHandler: authenticate }, getMyBookings)
  app.get('/realistic-flights/:id', { preHandler: authenticate }, getRealisticFlightById)
  app.post('/realistic-flights/book', { preHandler: authenticate }, bookFlight)
  app.patch('/realistic-flights/:id/cancel', { preHandler: authenticate }, cancelBooking)
  app.patch('/realistic-flights/:id/network', { preHandler: authenticate }, changeRealisticNetwork)
  app.patch('/realistic-flights/:id/atc-cancel', { preHandler: authenticateATC }, atcCancelBooking)
}
