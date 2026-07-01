import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import cookie from '@fastify/cookie'
import formbody from '@fastify/formbody'
import dotenv from 'dotenv'
import { authRoutes } from './routes/auth.routes.js'
import { adminRoutes } from './routes/admin.routes.js'
import { bookingRoutes } from './routes/booking.routes.js'
import { pirepRoutes } from './routes/pirep.routes.js'
import { eventRoutes } from './routes/events.routes.js'
import { publicRoutes } from './routes/public.routes.js'
import acarsRoutes from './routes/acars.routes.js'
import { fsacarsRoutes } from './routes/fsacars.routes.js'
import { atcRoutes } from './routes/atc.routes.js'
import { realisticFlightsRoutes } from './routes/realistic-flights.routes.js'
import { initializeDiscordBot } from './discord/discord.js'
dotenv.config()

const app = Fastify({
  logger: true
})

// ── PLUGINS ──
await app.register(cors, {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
})

await app.register(jwt, {
  secret: process.env.JWT_SECRET || 'kingfisher-secret',
})

await app.register(cookie, {
  secret: process.env.JWT_SECRET || 'kingfisher-secret',
})

await app.register(formbody)

// ── ROUTES ──
await app.register(authRoutes, { prefix: '/api/v1' })
await app.register(adminRoutes, { prefix: '/api/v1' })
await app.register(bookingRoutes, { prefix: '/api/v1' })
await app.register(pirepRoutes, { prefix: '/api/v1' })
await app.register(eventRoutes, { prefix: '/api/v1' })
await app.register(publicRoutes, { prefix: '/api/v1' })
await app.register(acarsRoutes, { prefix: '/api/v1/acars' })
await app.register(fsacarsRoutes, { prefix: '/api/v1' })
await app.register(atcRoutes, { prefix: '/api/v1' })
await app.register(realisticFlightsRoutes, { prefix: '/api/v1' })

// ── SEO / PUBLIC FILES ──
app.get('/robots.txt', async (_req, reply) => {
  return reply.type('text/plain').send(`User-agent: *
Allow: /
Sitemap: https://kingfisherva.com/sitemap.xml
`)
})

app.get('/sitemap.xml', async (_req, reply) => {
  const baseUrl = 'https://kingfisherva.com'
  const staticPages = ['', '/login', '/register', '/privacy', '/handbook', '/flights', '/routes', '/live-map', '/roster', '/events', '/fsacars']
  const urls = staticPages.map(p => `  <url>
    <loc>${baseUrl}${p}</loc>
    <changefreq>weekly</changefreq>
    <priority>${p === '' ? '1.0' : '0.8'}</priority>
  </url>`).join('\n')
  return reply.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`)
})

// ── HEALTH CHECK ──
app.get('/health', async () => {
  return { status: 'ok', airline: 'Kingfisher Virtual Airlines', version: '1.0.0' }
})

// ── START ──
try {
  await initializeDiscordBot()
  await app.listen({ port: Number(process.env.PORT) || 8000, host: '0.0.0.0' })
  console.log('🔴 Kingfisher VA API running on http://localhost:8000')
} catch (err) {
  app.log.error(err)
  process.exit(1)
}