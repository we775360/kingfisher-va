import { FastifyInstance } from 'fastify'
import prisma from '../utils/prisma.js'

export const publicRoutes = async (app: FastifyInstance) => {

  app.get('/public/stats', async (_, reply) => {
    try {
      const [pilots, routes, flights] = await Promise.all([
        prisma.pilot.count(),
        prisma.route.count(),
        prisma.pIREP.count({
          where: {
            status: 'APPROVED'
          }
        })
      ])

      return {
        pilots,
        routes,
        flights
      }

    } catch (error) {
      app.log.error(error)
      return reply.code(500).send({
        message: 'Failed to load stats'
      })
    }
  })

  app.get('/public/events', async () => {
    return prisma.event.findMany({
      orderBy: { date: 'asc' }
    })
  })

  app.get('/public/routes', async () => {
    return prisma.route.findMany({
      where: { isActive: true }
    })
  })

  app.get('/public/fleet', async () => {
    return prisma.aircraft.findMany({
      where: { isActive: true }
    })
  })

  app.get('/public/pilots', async () => {
    return prisma.pilot.findMany({
      where: { status: 'ACTIVE' },
      select: {
        pilotId: true,
        firstName: true,
        lastName: true,
        rank: true,
        totalHours: true,
        totalFlights: true,
        points: true
      },
      orderBy: {
        totalHours: 'desc'
      }
    })
  })

  app.get('/public/live-flights', async () => {
    return prisma.liveFlight.findMany({
      include: {
        pilot: {
          select: {
            pilotId: true,
            firstName: true,
            lastName: true,
            rank: true
          }
        }
      }
    })
  })

  app.get('/public/announcements', async () => {
    return prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5
    })
  })
}