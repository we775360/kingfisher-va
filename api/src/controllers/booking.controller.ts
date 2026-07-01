import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import prisma from '../utils/prisma.js'
import { sendBookingCreated, sendBookingCancelled } from '../discord/discord.js'

const HOURLY_RATE = 500 // $500 per flight hour

// ── GET ALL ROUTES (public for pilots) ──
export const getRoutes = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const routes = await prisma.route.findMany({
      where: { isActive: true },
      orderBy: { flightNumber: 'asc' },
    })
    return reply.send(routes)
  } catch (err) {
    console.error(err)
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

// ── GET AIRCRAFT WITH MAINTENANCE STATUS ──
export const getAircraft = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const aircraft = await prisma.aircraft.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    })
    // Auto-reset maintenance if time has passed
    const now = new Date()
    const updated = await Promise.all(aircraft.map(async (a) => {
      if (a.maintenanceStatus === 'IN_MAINTENANCE' && a.maintenanceUntil && a.maintenanceUntil <= now) {
        return prisma.aircraft.update({
          where: { id: a.id },
          data: { maintenanceStatus: 'AVAILABLE', maintenanceUntil: null },
        })
      }
      return a
    }))
    return reply.send(updated)
  } catch (err) {
    console.error(err)
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

// ── GET ROUTES FOR AIRCRAFT (filtered by location + type) ──
export const getRoutesForAircraft = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { aircraftId } = req.params as { aircraftId: string }
    const aircraft = await prisma.aircraft.findUnique({ where: { id: aircraftId } })
    if (!aircraft) return reply.status(404).send({ error: 'Aircraft not found' })

    // Auto-reset maintenance if time passed
    const now = new Date()
    if (aircraft.maintenanceStatus === 'IN_MAINTENANCE' && aircraft.maintenanceUntil && aircraft.maintenanceUntil <= now) {
      await prisma.aircraft.update({
        where: { id: aircraft.id },
        data: { maintenanceStatus: 'AVAILABLE', maintenanceUntil: null },
      })
      aircraft.maintenanceStatus = 'AVAILABLE'
      aircraft.maintenanceUntil = null
    }

    const fromLocation = aircraft.currentLocation || aircraft.hub
    if (!fromLocation) {
      return reply.send({ routes: [], aircraft })
    }

    // Get all routes from current location where allowedTypes includes aircraft type or is null
    const routes = await prisma.route.findMany({
      where: {
        isActive: true,
        depIcao: fromLocation,
      },
      orderBy: { flightNumber: 'asc' },
    })

    const filteredRoutes = routes.filter(r => {
      if (!r.allowedTypes) return true
      const allowed = r.allowedTypes as string[]
      return allowed.includes(aircraft.type)
    })

    // Add return-to-hub route if aircraft is not at hub
    let returnRoute = null
    if (aircraft.hub && aircraft.currentLocation && aircraft.currentLocation !== aircraft.hub) {
      const hubRoute = filteredRoutes.find(r => r.arrIcao === aircraft.hub)
      if (!hubRoute) {
        returnRoute = {
          id: 'return-to-hub',
          flightNumber: 'KFR-RTH',
          depIcao: aircraft.currentLocation,
          arrIcao: aircraft.hub,
          depName: `From ${aircraft.currentLocation}`,
          arrName: `Return to ${aircraft.hub}`,
          distance: 0,
          duration: 60,
          isActive: true,
          allowedTypes: null,
          isReturnRoute: true,
        }
      }
    }

    return reply.send({ routes: filteredRoutes, returnRoute, aircraft })
  } catch (err) {
    console.error(err)
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

// ── CREATE BOOKING ──
export const createBooking = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { userId } = req.user as { userId: string }

    const schema = z.object({
      routeId: z.string().min(1),
      aircraftId: z.string().min(1),
      depTime: z.string().min(1),
      network: z.string().min(1),
    })

    const body = schema.parse(req.body)

    const pilot = await prisma.pilot.findUnique({
      where: { userId }
    })

    if (!pilot) {
      return reply.status(404).send({ error: 'Pilot not found' })
    }

    // Check no other upcoming booking exists for same route/time
    const existing = await prisma.booking.findFirst({
      where: {
        pilotId: pilot.id,
        status: 'UPCOMING',
      }
    })

    if (existing) {
      return reply.status(400).send({ error: 'You already have an upcoming booking. Complete or cancel it first.' })
    }

    // Handle return-to-hub special route
    let routeId = body.routeId
    if (routeId === 'return-to-hub') {
      const aircraft = await prisma.aircraft.findUnique({ where: { id: body.aircraftId } })
      if (!aircraft || !aircraft.currentLocation || !aircraft.hub) {
        return reply.status(400).send({ error: 'Cannot create return-to-hub booking: aircraft has no hub or current location' })
      }
      // Find or create a temporary return route
      let rthRoute = await prisma.route.findFirst({
        where: {
          depIcao: aircraft.currentLocation,
          arrIcao: aircraft.hub,
        },
      })
      if (!rthRoute) {
        rthRoute = await prisma.route.create({
          data: {
            flightNumber: `RTH-${aircraft.registration}`,
            depIcao: aircraft.currentLocation,
            arrIcao: aircraft.hub,
            depName: `Return from ${aircraft.currentLocation}`,
            arrName: `Return to ${aircraft.hub}`,
            distance: 0,
            duration: 60,
          },
        })
      }
      routeId = rthRoute.id
    }

    // Get route for earnings calculation
    const route = await prisma.route.findUnique({
      where: { id: routeId }
    })

    if (!route) {
      return reply.status(404).send({ error: 'Route not found' })
    }

    // Calculate estimated earnings
    const estimatedHours = route.duration / 60
    const estimatedEarnings = estimatedHours * HOURLY_RATE

    const booking = await prisma.booking.create({
      data: {
        pilotId: pilot.id,
        routeId,
        aircraftId: body.aircraftId,
        depTime: new Date(body.depTime),
        network: body.network,
        earnings: estimatedEarnings,
      },
      include: {
        route: true,
        aircraft: true,
      }
    })

    // Discord Notification
    await sendBookingCreated(
      pilot.pilotId,
      `${pilot.firstName} ${pilot.lastName}`,
      booking.route.flightNumber,
      booking.route.depIcao,
      booking.route.arrIcao
    ).catch(err => console.error('Discord Notify Error:', err))

    return reply.status(201).send(booking)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return reply.status(400).send({ error: 'Invalid input', details: err.issues })
    }
    console.error(err)
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

// ── GET MY BOOKINGS ──
export const getMyBookings = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { userId } = req.user as { userId: string }

    const pilot = await prisma.pilot.findUnique({
      where: { userId }
    })

    if (!pilot) {
      return reply.status(404).send({ error: 'Pilot not found' })
    }

    const bookings = await prisma.booking.findMany({
      where: { pilotId: pilot.id },
      include: {
        route: true,
        aircraft: true,
        pirep: true,
      },
      orderBy: { createdAt: 'desc' }
    })

    return reply.send(bookings)
  } catch (err) {
    console.error(err)
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

// ── CANCEL BOOKING ──
export const cancelBooking = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { userId } = req.user as { userId: string }
    const { id } = req.params as { id: string }

    const pilot = await prisma.pilot.findUnique({ where: { userId } })
    if (!pilot) return reply.status(404).send({ error: 'Pilot not found' })

    const booking = await prisma.booking.findUnique({ 
      where: { id },
      include: { route: true }
    })
    if (!booking) return reply.status(404).send({ error: 'Booking not found' })
    if (booking.pilotId !== pilot.id) return reply.status(403).send({ error: 'Not your booking' })
    if (booking.status !== 'UPCOMING') return reply.status(400).send({ error: 'Cannot cancel this booking' })

    await prisma.booking.update({
      where: { id },
      data: { status: 'CANCELLED' }
    })

    // Discord Notification
    await sendBookingCancelled(
      pilot.pilotId,
      `${pilot.firstName} ${pilot.lastName}`,
      booking.route.flightNumber
    ).catch(err => console.error('Discord Notify Error:', err))

    return reply.send({ message: 'Booking cancelled' })
  } catch (err) {
    console.error(err)
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

// ── GET BOOKING BY ID ──
export const getBookingById = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { userId } = req.user as { userId: string }
    const { id } = req.params as { id: string }

    const pilot = await prisma.pilot.findUnique({ where: { userId } })
    if (!pilot) return reply.status(404).send({ error: 'Pilot not found' })

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        route: true,
        aircraft: true,
        pirep: true,
        pilot: {
          select: {
            pilotId: true,
            firstName: true,
            lastName: true,
            rank: true,
            callsign: true,
          }
        }
      }
    })

    if (!booking) return reply.status(404).send({ error: 'Booking not found' })
    if (booking.pilotId !== pilot.id) return reply.status(403).send({ error: 'Not your booking' })

    return reply.send(booking)
  } catch (err) {
    console.error(err)
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

// ── CHANGE NETWORK ──
export const changeBookingNetwork = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { userId } = req.user as { userId: string }
    const { id } = req.params as { id: string }

    const schema = z.object({
      network: z.enum(['Offline', 'VATSIM', 'IVAO']),
    })
    const body = schema.parse(req.body)

    const pilot = await prisma.pilot.findUnique({ where: { userId } })
    if (!pilot) return reply.status(404).send({ error: 'Pilot not found' })

    const booking = await prisma.booking.findUnique({ where: { id } })
    if (!booking) return reply.status(404).send({ error: 'Booking not found' })
    if (booking.pilotId !== pilot.id) return reply.status(403).send({ error: 'Not your booking' })
    if (booking.status !== 'UPCOMING') return reply.status(400).send({ error: 'Can only change network on upcoming bookings' })

    await prisma.booking.update({
      where: { id },
      data: { network: body.network }
    })

    return reply.send({ success: true, network: body.network })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return reply.status(400).send({ error: 'Invalid input', details: err.issues })
    }
    console.error(err)
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

// ── GET WALLET ──
export const getWallet = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { userId } = req.user as { userId: string }

    const pilot = await prisma.pilot.findUnique({
      where: { userId },
      select: {
        walletBalance: true,
        totalHours: true,
        totalFlights: true,
        bookings: {
          where: { status: 'APPROVED' },
          select: { earnings: true, createdAt: true, route: { select: { flightNumber: true, depIcao: true, arrIcao: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }
      }
    })

    if (!pilot) return reply.status(404).send({ error: 'Pilot not found' })

    return reply.send(pilot)
  } catch (err) {
    console.error(err)
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

