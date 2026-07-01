import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import prisma from '../utils/prisma.js'
import { sendPIREPApproved, sendPIREPRejected, sendAnnouncement } from '../discord/discord.js'
const HOURLY_RATE = 500

// ── GET ALL PILOTS (all registered users with pilot data) ──
export const getAllPilots = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        pilot: true
      },
      orderBy: { createdAt: 'desc' }
    })
    return reply.send(users)
  } catch (err) {
    console.error(err)
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

// ── UPDATE PILOT STATUS ──
export const updatePilotStatus = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = req.params as { id: string }
    const { status } = req.body as { status: string }
    const pilot = await prisma.pilot.update({
      where: { id },
      data: { status: status as any }
    })
    
    // Optional: Add notification for pilot status change if needed
    // For now, we focus on the core actions requested.
    
    return reply.send(pilot)
  } catch (err) {
    console.error(err)
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

// ── GET ALL PIREPS ──
export const getAllPIREPs = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const pireps = await prisma.pIREP.findMany({
      include: {
        pilot: { select: { firstName: true, lastName: true, pilotId: true } },
        aircraft: { select: { name: true, registration: true } },
      },
      orderBy: { createdAt: 'desc' }
    })
    return reply.send(pireps)
  } catch (err) {
    console.error(err)
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

// ── UPDATE PIREP STATUS ──
async function updateAircraftAfterFlight(aircraftId: string, arrIcao: string, flightTime: number) {
  const aircraft = await prisma.aircraft.findUnique({ where: { id: aircraftId } })
  if (!aircraft) return

  const newTotalHours = aircraft.totalFlightHours + flightTime
  const needsMaintenance = newTotalHours >= (aircraft.maintenanceThreshold || 50)

  await prisma.aircraft.update({
    where: { id: aircraftId },
    data: {
      currentLocation: arrIcao,
      totalFlightHours: newTotalHours,
      ...(needsMaintenance ? {
        maintenanceStatus: 'IN_MAINTENANCE',
        maintenanceUntil: new Date(Date.now() + 6 * 3600000),
      } : {}),
    },
  })
}

export const updatePIREPStatus = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = req.params as { id: string }
    const { status, staffNotes } = req.body as { status: string, staffNotes?: string }
    const pirep = await prisma.pIREP.update({
      where: { id },
      data: { status: status as any, staffNotes },
      include: { pilot: true }
    })

    if (status === 'APPROVED') {
      const earnings = pirep.flightTime * HOURLY_RATE
      await prisma.pilot.update({
        where: { id: pirep.pilotId },
        data: {
          totalHours: { increment: pirep.flightTime },
          totalFlights: { increment: 1 },
          totalDistance: { increment: pirep.distance },
          walletBalance: { increment: earnings },
        }
      })

      // Update aircraft location and hours
      await updateAircraftAfterFlight(pirep.aircraftId, pirep.arrIcao, pirep.flightTime)

      if (pirep.bookingId) {
        await prisma.booking.update({
          where: { id: pirep.bookingId },
          data: { status: 'APPROVED', earnings }
        })
      }

      // Check if this PIREP matches a realistic flight
      const realisticFlight = await prisma.realisticFlight.findFirst({
        where: {
          flightNumber: pirep.flightNumber,
          pilotId: pirep.pilotId,
          status: 'BOOKED',
        },
      })
      if (realisticFlight) {
        await prisma.realisticFlight.update({
          where: { id: realisticFlight.id },
          data: { status: 'COMPLETED', depConfirmed: true, arrConfirmed: true },
        })
        // Add extra $200/hr for realistic flight ($700 - $500)
        const extraEarnings = Math.round(pirep.flightTime * 200)
        await prisma.pilot.update({
          where: { id: pirep.pilotId },
          data: { walletBalance: { increment: extraEarnings } },
        })
      }
      
      // Discord Notification
      await sendPIREPApproved(
        pirep.pilot.pilotId,
        `${pirep.pilot.firstName} ${pirep.pilot.lastName}`,
        pirep.flightNumber,
        realisticFlight ? earnings + Math.round(pirep.flightTime * 200) : earnings
      ).catch(err => console.error('Discord Notify Error:', err))

    } else if (status === 'REJECTED') {
      if (pirep.bookingId) {
        await prisma.booking.update({
          where: { id: pirep.bookingId },
          data: { status: 'UPCOMING' } // Reset to upcoming so they can refile or cancel
        })
      }

      // Discord Notification
      await sendPIREPRejected(
        pirep.pilot.pilotId,
        `${pirep.pilot.firstName} ${pirep.pilot.lastName}`,
        pirep.flightNumber,
        staffNotes
      ).catch(err => console.error('Discord Notify Error:', err))
    }

    return reply.send(pirep)
  } catch (err) {
    console.error(err)
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

// ── GET ALL AIRCRAFT ──
export const getAllAircraft = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const aircraft = await prisma.aircraft.findMany({ orderBy: { name: 'asc' } })
    return reply.send(aircraft)
  } catch (err) {
    console.error(err)
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

// ── CREATE AIRCRAFT ──
export const createAircraft = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const schema = z.object({
      icao: z.string().min(1),
      name: z.string().min(1),
      registration: z.string().min(1),
      type: z.string().min(1),
      engines: z.string().min(1),
      pax: z.number().int(),
      range: z.number().int(),
      cruiseSpeed: z.number().int(),
      hub: z.string().optional(),
    })
    const body = schema.parse(req.body)
    const aircraft = await prisma.aircraft.create({ data: body })
    return reply.status(201).send(aircraft)
  } catch (err) {
    if (err instanceof z.ZodError) return reply.status(400).send({ error: 'Invalid input', details: err.issues })
    console.error(err)
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

// ── DELETE AIRCRAFT ──
export const deleteAircraft = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = req.params as { id: string }
    await prisma.aircraft.delete({ where: { id } })
    return reply.send({ message: 'Aircraft deleted' })
  } catch (err) {
    console.error(err)
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

// ── GET ALL ROUTES ──
export const getAllRoutes = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const routes = await prisma.route.findMany({ orderBy: { flightNumber: 'asc' } })
    return reply.send(routes)
  } catch (err) {
    console.error(err)
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

// ── CREATE ROUTE ──
export const createRoute = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const schema = z.object({
      flightNumber: z.string().min(1),
      depIcao: z.string().min(4).max(4),
      arrIcao: z.string().min(4).max(4),
      depName: z.string().min(1),
      arrName: z.string().min(1),
      distance: z.number().int(),
      duration: z.number().int(),
      allowedTypes: z.array(z.string()).nullable().optional(),
    })
    const body = schema.parse(req.body)
    const route = await prisma.route.create({
      data: {
        flightNumber: body.flightNumber,
        depIcao: body.depIcao,
        arrIcao: body.arrIcao,
        depName: body.depName,
        arrName: body.arrName,
        distance: body.distance,
        duration: body.duration,
        allowedTypes: body.allowedTypes ?? undefined,
      },
    })
    return reply.status(201).send(route)
  } catch (err) {
    if (err instanceof z.ZodError) return reply.status(400).send({ error: 'Invalid input', details: err.issues })
    console.error(err)
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

// ── DELETE ROUTE ──
export const deleteRoute = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = req.params as { id: string }
    await prisma.route.delete({ where: { id } })
    return reply.send({ message: 'Route deleted' })
  } catch (err) {
    console.error(err)
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

// ── GET ALL HUBS ──
export const getAllHubs = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const hubs = await prisma.hub.findMany({ orderBy: { name: 'asc' } })
    return reply.send(hubs)
  } catch (err) {
    console.error(err)
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

// ── CREATE HUB ──
export const createHub = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const schema = z.object({
      icao: z.string().min(4).max(4),
      name: z.string().min(1),
      city: z.string().min(1),
      country: z.string().min(1),
    })
    const body = schema.parse(req.body)
    const hub = await prisma.hub.create({ data: body })
    return reply.status(201).send(hub)
  } catch (err) {
    if (err instanceof z.ZodError) return reply.status(400).send({ error: 'Invalid input', details: err.issues })
    console.error(err)
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

// ── DELETE HUB ──
export const deleteHub = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = req.params as { id: string }
    await prisma.hub.delete({ where: { id } })
    return reply.send({ message: 'Hub deleted' })
  } catch (err) {
    console.error(err)
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

// ── CREATE ANNOUNCEMENT ──
export const createAnnouncement = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const schema = z.object({
      title: z.string().min(1),
      content: z.string().min(1),
      author: z.string().min(1),
      isPinned: z.boolean().optional(),
    })
    const body = schema.parse(req.body)
    const announcement = await prisma.announcement.create({ data: body })

    // Discord Notification
    await sendAnnouncement(
      announcement.title,
      announcement.content,
      announcement.author
    ).catch(err => console.error('Discord Notify Error:', err))

    return reply.status(201).send(announcement)
  } catch (err) {
    if (err instanceof z.ZodError) return reply.status(400).send({ error: 'Invalid input', details: err.issues })
    console.error(err)
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

// ── DELETE ANNOUNCEMENT ──
export const deleteAnnouncement = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = req.params as { id: string }
    await prisma.announcement.delete({ where: { id } })
    return reply.send({ message: 'Announcement deleted' })
  } catch (err) {
    console.error(err)
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

// ── GET STATS ──
export const getStats = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const [totalPilots, totalFlights, totalAircraft, totalRoutes, pendingPireps] = await Promise.all([
      prisma.user.count(),
      prisma.pIREP.count({ where: { status: 'APPROVED' } }),
      prisma.aircraft.count(),
      prisma.route.count(),
      prisma.pIREP.count({ where: { status: 'PENDING' } }),
    ])
    return reply.send({ totalPilots, totalFlights, totalAircraft, totalRoutes, pendingPireps })
  } catch (err) {
    console.error(err)
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

// ── UPDATE AIRCRAFT ──
export const updateAircraft = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = req.params as { id: string }
    const schema = z.object({
      icao: z.string().min(1).optional(),
      name: z.string().min(1).optional(),
      registration: z.string().min(1).optional(),
      type: z.string().min(1).optional(),
      engines: z.string().min(1).optional(),
      pax: z.number().int().optional(),
      range: z.number().int().optional(),
      cruiseSpeed: z.number().int().optional(),
      hub: z.string().optional(),
      currentLocation: z.string().optional(),
      maintenanceThreshold: z.number().int().optional(),
      maintenanceStatus: z.enum(['AVAILABLE', 'IN_MAINTENANCE']).optional(),
      isActive: z.boolean().optional(),
    })
    const body = schema.parse(req.body)
    const aircraft = await prisma.aircraft.update({
      where: { id },
      data: {
        ...body,
        ...(body.maintenanceStatus === 'AVAILABLE' ? { maintenanceUntil: null } : {}),
      },
    })
    return reply.send(aircraft)
  } catch (err) {
    if (err instanceof z.ZodError) return reply.status(400).send({ error: 'Invalid input', details: err.issues })
    console.error(err)
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

// ── UPDATE ROUTE TYPES ──
export const updateRouteTypes = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = req.params as { id: string }
    const schema = z.object({
      allowedTypes: z.array(z.string()).nullable(),
    })
    const body = schema.parse(req.body)
    const route = await prisma.route.update({
      where: { id },
      data: { allowedTypes: body.allowedTypes ?? undefined },
    })
    return reply.send(route)
  } catch (err) {
    if (err instanceof z.ZodError) return reply.status(400).send({ error: 'Invalid input', details: err.issues })
    console.error(err)
    return reply.status(500).send({ error: 'Internal server error' })
  }
}