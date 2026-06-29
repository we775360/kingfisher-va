import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import prisma from '../utils/prisma.js'
import { sendBookingCreated, sendBookingCancelled } from '../discord/discord.js'
import axios from 'axios'

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

// ── GET ALL AIRCRAFT (public for pilots) ──
export const getAircraft = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const aircraft = await prisma.aircraft.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    })
    return reply.send(aircraft)
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

    // Get route for earnings calculation
    const route = await prisma.route.findUnique({
      where: { id: body.routeId }
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
        routeId: body.routeId,
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

    // Auto-generate SimBrief OFP if pilot has username set (non-blocking)
    if (pilot.simbriefUsername) {
      generateOFPAuto(booking.id, pilot.simbriefUsername, booking.route, booking.aircraft).catch(err =>
        console.error('Auto OFP Generation Error:', err.message)
      )
    }

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
            simbriefUsername: true,
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

// ── GENERATE SIMBRIEF OFP ──
export const generateOFP = async (req: FastifyRequest, reply: FastifyReply) => {
  const { userId } = req.user as { userId: string }
  const { id } = req.params as { id: string }

  const pilot = await prisma.pilot.findUnique({ where: { userId } })
  if (!pilot) return reply.status(404).send({ error: 'Pilot not found' })
  if (!pilot.simbriefUsername) return reply.status(400).send({ error: 'No SimBrief username set. Add one in Settings.' })

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { route: true, aircraft: true }
  })
  if (!booking) return reply.status(404).send({ error: 'Booking not found' })
  if (booking.pilotId !== pilot.id) return reply.status(403).send({ error: 'Not your booking' })

  const dep = booking.route.depIcao
  const arr = booking.route.arrIcao
  const type = booking.aircraft.icao
  const reg = booking.aircraft.registration
  const fltnum = booking.route.flightNumber.replace('KFR', '').replace('IT', '')
  const airline = 'KFR'
  const username = pilot.simbriefUsername
  const fetchUrl = `https://www.simbrief.com/api/xml.fetcher.php?username=${encodeURIComponent(username)}&json=1`

  const dispatchUrl = `https://www.simbrief.com/system/dispatch.php?orig=${dep}&dest=${arr}&type=${type}&reg=${reg}&airline=${airline}&fltnum=${fltnum}&units=kgs&navlog=1&etops=1&stepclimbs=1&tlr=1&notams=1&firnot=1&auto=1`

  // Try to fetch existing OFP from SimBrief
  let ofpData: any = null
  try {
    const res = await axios.get(fetchUrl, { timeout: 15000 })
    if (res.data && res.data.fetch?.status !== 'error') ofpData = res.data
  } catch (err: any) {
    console.log('SimBrief fetch error:', err.message)
  }

  if (!ofpData) {
    // No OFP exists — return the dispatch URL so frontend can open it in a hidden iframe
    return reply.send({
      success: false,
      needsDispatch: true,
      dispatchUrl,
      message: 'No flight plan found on SimBrief. Opening generator...',
    })
  }

  // Save and return
  const pdfUrl = ofpData?.fetch?.pdf_url || ofpData?.pdf_url || ''
  const staticId = ofpData?.fetch?.params?.static_id || ofpData?.params?.static_id || ''
  const userId_sb = ofpData?.fetch?.params?.user_id || ofpData?.params?.user_id || ''

  try {
    await prisma.booking.update({
      where: { id },
      data: {
        simbriefOfpData: JSON.stringify(ofpData),
        simbriefPdfUrl: pdfUrl,
        simbriefStaticId: staticId,
        simbriefUserId: String(userId_sb || ''),
      }
    })
  } catch { }

  return reply.send({ success: true, ofpData, pdfUrl })
}

// ── FETCH OFP (after dispatch via iframe) ──
export const fetchOFP = async (req: FastifyRequest, reply: FastifyReply) => {
  const { userId } = req.user as { userId: string }
  const { id } = req.params as { id: string }

  const pilot = await prisma.pilot.findUnique({ where: { userId } })
  if (!pilot) return reply.status(404).send({ error: 'Pilot not found' })
  if (!pilot.simbriefUsername) return reply.status(400).send({ error: 'No SimBrief username set.' })

  const booking = await prisma.booking.findUnique({ where: { id } })
  if (!booking) return reply.status(404).send({ error: 'Booking not found' })
  if (booking.pilotId !== pilot.id) return reply.status(403).send({ error: 'Not your booking' })

  const fetchUrl = `https://www.simbrief.com/api/xml.fetcher.php?username=${encodeURIComponent(pilot.simbriefUsername)}&json=1`

  try {
    const res = await axios.get(fetchUrl, { timeout: 15000 })
    const ofpData = res.data
    if (!ofpData || ofpData.fetch?.status === 'error') {
      return reply.status(404).send({ error: 'No OFP found yet. Make sure you are logged into SimBrief and try again.' })
    }

    const pdfUrl = ofpData?.fetch?.pdf_url || ofpData?.pdf_url || ''
    const staticId = ofpData?.fetch?.params?.static_id || ofpData?.params?.static_id || ''
    const userId_sb = ofpData?.fetch?.params?.user_id || ofpData?.params?.user_id || ''

    try {
      await prisma.booking.update({
        where: { id },
        data: {
          simbriefOfpData: JSON.stringify(ofpData),
          simbriefPdfUrl: pdfUrl,
          simbriefStaticId: staticId,
          simbriefUserId: String(userId_sb || ''),
        }
      })
    } catch { }

    return reply.send({ success: true, ofpData, pdfUrl })
  } catch {
    return reply.status(502).send({ error: 'Could not reach SimBrief. Try again.' })
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

// ── UPDATE PILOT SIMBRIEF USERNAME ──
export const updateSimBriefUsername = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { userId } = req.user as { userId: string }
    const schema = z.object({
      simbriefUsername: z.string().min(1).max(100),
    })
    const body = schema.parse(req.body)

    const pilot = await prisma.pilot.findUnique({ where: { userId } })
    if (!pilot) return reply.status(404).send({ error: 'Pilot not found' })

    await prisma.pilot.update({
      where: { userId },
      data: { simbriefUsername: body.simbriefUsername }
    })

    return reply.send({ success: true, simbriefUsername: body.simbriefUsername })
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

// ── AUTO-GENERATE OFP (non-request helper) ──
async function generateOFPAuto(
  bookingId: string,
  simbriefUsername: string,
  route: { depIcao: string; arrIcao: string; flightNumber: string },
  aircraft: { icao: string; registration: string }
) {
  const dep = route.depIcao
  const arr = route.arrIcao
  const type = aircraft.icao
  const reg = aircraft.registration
  const fltnum = route.flightNumber.replace('KFR', '').replace('IT', '')
  const dispatchUrl = `https://www.simbrief.com/system/dispatch.php?orig=${dep}&dest=${arr}&type=${type}&reg=${reg}&airline=KFR&fltnum=${fltnum}&units=kgs&navlog=1&etops=1&stepclimbs=1&tlr=1&notams=1&firnot=1&auto=1`

  await axios.get(dispatchUrl, { maxRedirects: 5, timeout: 15000 })
  const ofpResponse = await axios.get(
    `https://www.simbrief.com/api/xml.fetcher.php?username=${simbriefUsername}&json=1`,
    { timeout: 10000 }
  )
  const ofpData = ofpResponse.data
  if (!ofpData || ofpData.fetch?.status === 'error') return

  const pdfUrl = ofpData?.fetch?.pdf_url || ofpData?.pdf_url || ''
  const staticId = ofpData?.fetch?.params?.static_id || ofpData?.params?.static_id || ''
  const userId_sb = ofpData?.fetch?.params?.user_id || ofpData?.params?.user_id || ''

  try {
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        simbriefOfpData: JSON.stringify(ofpData),
        simbriefPdfUrl: pdfUrl,
        simbriefStaticId: staticId,
        simbriefUserId: String(userId_sb || ''),
      }
    })
  } catch { /* non-critical save */ }
}