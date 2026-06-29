import { FastifyInstance } from 'fastify'
import { authenticate } from '../middleware/auth.middleware.js'
import prisma from '../utils/prisma.js'
import {
  getRoutes,
  getAircraft,
  createBooking,
  getMyBookings,
  cancelBooking,
  getWallet,
  getBookingById,
  generateOFP,
  changeBookingNetwork,
  updateSimBriefUsername,
} from '../controllers/booking.controller.js'

export const bookingRoutes = async (app: FastifyInstance) => {
  app.get('/routes', { preHandler: authenticate }, getRoutes)
  app.get('/aircraft', { preHandler: authenticate }, getAircraft)
  app.post('/bookings', { preHandler: authenticate }, createBooking)
  app.get('/bookings/my', { preHandler: authenticate }, getMyBookings)
  app.get('/bookings/:id', { preHandler: authenticate }, getBookingById)
  app.post('/bookings/:id/generate-ofp', { preHandler: authenticate }, generateOFP)
  app.patch('/bookings/:id/network', { preHandler: authenticate }, changeBookingNetwork)
  app.patch('/bookings/:id/cancel', { preHandler: authenticate }, cancelBooking)
  app.patch('/pilot/simbrief', { preHandler: authenticate }, updateSimBriefUsername)
  app.get('/wallet', { preHandler: authenticate }, getWallet)
  app.get('/roster', { preHandler: authenticate }, async (req, reply) => {
  const pilots = await prisma.pilot.findMany({
    where: { status: 'ACTIVE' },
    select: {
      id: true,
      pilotId: true,
      firstName: true,
      lastName: true,
      callsign: true,
      rank: true,
      totalHours: true,
      totalFlights: true,
      hub: true,
      joinedAt: true,
    },
    orderBy: { totalHours: 'desc' }
  })
  return reply.send(pilots)
})
  app.get('/announcements', async (req, reply) => {
  const announcements = await prisma.announcement.findMany({
    orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    take: 10,
  })
  return reply.send(announcements)
})
}
