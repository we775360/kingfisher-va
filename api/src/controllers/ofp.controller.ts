import { FastifyRequest, FastifyReply } from 'fastify'
import { generateOFP } from '../services/flight-planning/ofp-generator.js'
import { generateOFPPDF } from '../services/flight-planning/pdf-generator.js'
import prisma from '../utils/prisma.js'

export async function generateOFPData(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { bookingId, type: bookingType } = req.query as { bookingId: string; type: string }

    if (!bookingId) {
      return reply.status(400).send({ error: 'bookingId is required' })
    }

    let booking: any
    const isStandard = bookingType === 'standard' || !bookingType

    if (isStandard) {
      booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { route: true, aircraft: true, pilot: { include: { user: true } } },
      })
    } else {
      booking = await prisma.realisticFlight.findUnique({
        where: { id: bookingId },
      })
      if (booking) {
        const pilot = await prisma.pilot.findUnique({ where: { id: booking.pilotId }, include: { user: true } })
        booking = { ...booking, pilot, route: { depIcao: booking.depIcao, arrIcao: booking.arrIcao, flightNumber: booking.flightNumber, distance: booking.distance }, aircraft: { icao: booking.aircraftType || 'A320', name: '', registration: '' } }
      }
    }

    if (!booking) {
      return reply.status(404).send({ error: 'Booking not found' })
    }

    const depIcao = booking.route?.depIcao || booking.depIcao
    const arrIcao = booking.route?.arrIcao || booking.arrIcao
    const aircraftIcao = booking.aircraft?.icao || booking.aircraftType || 'A320'
    const aircraftReg = booking.aircraft?.registration || 'VT-KFR'
    const flightNumber = booking.route?.flightNumber || booking.flightNumber || 'KFR000'

    const paxCount = 132
    const cargoKg = 1800

    const ofpData = await generateOFP({
      flightNumber,
      depIcao,
      arrIcao,
      altnIcao: 'OMAA',
      aircraftIcao: aircraftIcao,
      aircraftReg,
      paxCount,
      cargoKg,
      routeString: '',
      pilotName: booking.pilot?.firstName ? `${booking.pilot.firstName} ${booking.pilot.lastName || ''}`.trim() : undefined,
      pilotCallsign: booking.pilot?.callsign,
    })

    return reply.send(ofpData)
  } catch (err: any) {
    return reply.status(500).send({ error: err.message || 'Failed to generate OFP' })
  }
}

export async function downloadOFPPDF(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { bookingId, type: bookingType } = req.query as { bookingId: string; type: string }

    if (!bookingId) {
      return reply.status(400).send({ error: 'bookingId is required' })
    }

    let booking: any
    const isStandard = bookingType === 'standard' || !bookingType

    if (isStandard) {
      booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { route: true, aircraft: true, pilot: { include: { user: true } } },
      })
    } else {
      booking = await prisma.realisticFlight.findUnique({
        where: { id: bookingId },
      })
      if (booking) {
        const pilot = await prisma.pilot.findUnique({ where: { id: booking.pilotId }, include: { user: true } })
        booking = { ...booking, pilot, route: { depIcao: booking.depIcao, arrIcao: booking.arrIcao, flightNumber: booking.flightNumber, distance: booking.distance }, aircraft: { icao: booking.aircraftType || 'A320', name: '', registration: '' } }
      }
    }

    if (!booking) {
      return reply.status(404).send({ error: 'Booking not found' })
    }

    const depIcao = booking.route?.depIcao || booking.depIcao
    const arrIcao = booking.route?.arrIcao || booking.arrIcao
    const aircraftIcao = booking.aircraft?.icao || booking.aircraftType || 'A320'
    const aircraftReg = booking.aircraft?.registration || 'VT-KFR'
    const flightNumber = booking.route?.flightNumber || booking.flightNumber || 'KFR000'

    const paxCount = 132
    const cargoKg = 1800

    const ofpData = await generateOFP({
      flightNumber,
      depIcao,
      arrIcao,
      altnIcao: 'OMAA',
      aircraftIcao,
      aircraftReg,
      paxCount,
      cargoKg,
      routeString: '',
      pilotName: booking.pilot?.firstName ? `${booking.pilot.firstName} ${booking.pilot.lastName || ''}`.trim() : undefined,
      pilotCallsign: booking.pilot?.callsign,
    })

    const pdfBuffer = await generateOFPPDF(ofpData)

    reply.header('Content-Type', 'application/pdf')
    reply.header('Content-Disposition', `attachment; filename="OFP-${flightNumber}-${depIcao}-${arrIcao}.pdf"`)
    return reply.send(pdfBuffer)
  } catch (err: any) {
    return reply.status(500).send({ error: err.message || 'Failed to generate OFP PDF' })
  }
}
