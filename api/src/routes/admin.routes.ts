import { FastifyInstance } from 'fastify'
import { requireAdmin, requireStaff } from '../middleware/auth.middleware.js'
import {
  getAllPilots, updatePilotStatus,
  getAllPIREPs, updatePIREPStatus,
  getAllAircraft, createAircraft, deleteAircraft,
  getAllRoutes, createRoute, deleteRoute,
  getAllHubs, createHub, deleteHub,
  createAnnouncement, deleteAnnouncement, getStats
} from '../controllers/admin.controller.js'
import {
  listATCStaff, createATCStaff, updateATCStaffStatus,
  getCurrentDailyHub, setDailyHub,
} from '../controllers/admin-atc.controller.js'

export const adminRoutes = async (app: FastifyInstance) => {
  // Stats
  app.get('/admin/stats', { preHandler: requireStaff }, getStats)

  // Pilots
  app.get('/admin/pilots', { preHandler: requireStaff }, getAllPilots)
  app.patch('/admin/pilots/:id/status', { preHandler: requireAdmin }, updatePilotStatus)

  // PIREPs
  app.get('/admin/pireps', { preHandler: requireStaff }, getAllPIREPs)
  app.patch('/admin/pireps/:id/status', { preHandler: requireStaff }, updatePIREPStatus)

  // Aircraft
  app.get('/admin/aircraft', { preHandler: requireStaff }, getAllAircraft)
  app.post('/admin/aircraft', { preHandler: requireAdmin }, createAircraft)
  app.delete('/admin/aircraft/:id', { preHandler: requireAdmin }, deleteAircraft)

  // Routes
  app.get('/admin/routes', { preHandler: requireStaff }, getAllRoutes)
  app.post('/admin/routes', { preHandler: requireAdmin }, createRoute)
  app.delete('/admin/routes/:id', { preHandler: requireAdmin }, deleteRoute)

  // Hubs
  app.get('/admin/hubs', { preHandler: requireStaff }, getAllHubs)
  app.post('/admin/hubs', { preHandler: requireAdmin }, createHub)
  app.delete('/admin/hubs/:id', { preHandler: requireAdmin }, deleteHub)

  // Announcements
  app.post('/admin/announcements', { preHandler: requireAdmin }, createAnnouncement)
  app.delete('/admin/announcements/:id', { preHandler: requireAdmin }, deleteAnnouncement)

  // ATC Staff Management
  app.get('/admin/atc', { preHandler: requireStaff }, listATCStaff)
  app.post('/admin/atc', { preHandler: requireAdmin }, createATCStaff)
  app.patch('/admin/atc/:id/status', { preHandler: requireAdmin }, updateATCStaffStatus)

  // Daily Hubs
  app.get('/admin/daily-hubs/current', { preHandler: requireStaff }, getCurrentDailyHub)
  app.post('/admin/daily-hubs', { preHandler: requireAdmin }, setDailyHub)
}