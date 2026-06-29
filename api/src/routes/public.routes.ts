import { FastifyInstance } from 'fastify'
import prisma from '../utils/prisma.js'
import { positionBus } from '../utils/position-bus.js'
import axios from 'axios'

export const publicRoutes = async (app: FastifyInstance) => {

  app.get('/public/stats', async (_, reply) => {
    try {
      const [pilots, routes, flights] = await Promise.all([
        prisma.pilot.count(),
        prisma.route.count(),
        prisma.pIREP.count({ where: { status: 'APPROVED' } })
      ])
      return { pilots, routes, flights }
    } catch (error) {
      app.log.error(error)
      return reply.code(500).send({ message: 'Failed to load stats' })
    }
  })

  app.get('/public/events', async () => {
    return prisma.event.findMany({ orderBy: { date: 'asc' } })
  })

  app.get('/public/routes', async () => {
    return prisma.route.findMany({ where: { isActive: true } })
  })

  app.get('/public/fleet', async () => {
    return prisma.aircraft.findMany({ where: { isActive: true } })
  })

  app.get('/public/pilots', async () => {
    return prisma.pilot.findMany({
      where: { status: 'ACTIVE' },
      select: {
        pilotId: true, firstName: true, lastName: true, rank: true,
        totalHours: true, totalFlights: true, points: true, walletBalance: true
      },
      orderBy: { totalHours: 'desc' }
    })
  })

  app.get('/public/live-flights', async () => {
    const stale = new Date(Date.now() - 3 * 60 * 1000)
    // Clean up stale flights
    await prisma.liveFlight.deleteMany({ where: { lastUpdate: { lt: stale } } })
    return prisma.liveFlight.findMany({
      where: { lastUpdate: { gte: stale } },
      include: {
        pilot: {
          select: { pilotId: true, firstName: true, lastName: true, rank: true }
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

  // ── WEATHER PROXY (aviationweather.gov blocks CORS from browsers) ──
  app.get('/public/weather/metar/:icao', async (req, reply) => {
    try {
      const { icao } = req.params as { icao: string }
      const res = await axios.get(`https://aviationweather.gov/api/data/metar?ids=${icao}&format=raw`, { timeout: 8000 })
      return reply.type('text/plain').send(res.data)
    } catch {
      return reply.type('text/plain').send('METAR unavailable')
    }
  })

  app.get('/public/weather/notam/:icao', async (req, reply) => {
    try {
      const { icao } = req.params as { icao: string }
      const res = await axios.get(`https://www.aviationweather.gov/api/data/notam?ids=${icao}&format=raw`, { timeout: 8000 })
      return reply.type('text/plain').send(res.data)
    } catch {
      return reply.type('text/plain').send('NOTAMs unavailable')
    }
  })

  app.get('/public/live-flights/stream', async (_req, reply) => {
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    })

    reply.raw.write('data: {"type":"connected"}\n\n')

    const onPosition = (data: any) => {
      try {
        reply.raw.write(`data: ${JSON.stringify({ type: 'position', ...data })}\n\n`)
      } catch { }
    }

    positionBus.on('position', onPosition)

    const keepAlive = setInterval(() => {
      try {
        reply.raw.write(':keepalive\n\n')
      } catch {
        clearInterval(keepAlive)
      }
    }, 15000)

    _req.raw.on('close', () => {
      positionBus.off('position', onPosition)
      clearInterval(keepAlive)
    })
  })
}
