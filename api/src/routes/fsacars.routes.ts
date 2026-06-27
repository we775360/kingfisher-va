import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { userquery, dispatch, posrep, pirep } from '../controllers/fsacars.controller.js'

import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
const __dirname = dirname(fileURLToPath(import.meta.url))
const zipPath = join(__dirname, '..', '..', 'public', 'fsacars-client.zip')
let zipBuffer: Buffer | null = null
try { zipBuffer = readFileSync(zipPath) } catch {}

export const fsacarsRoutes = async (app: FastifyInstance) => {
  // Download pre-configured FSACARS client
  app.get('/fsacars/download', async (_req: FastifyRequest, reply: FastifyReply) => {
    if (!zipBuffer) {
      return reply.status(404).send({ error: 'FSACARS client not available for download' })
    }
    return reply
      .type('application/zip')
      .header('Content-Disposition', 'attachment; filename="kingfisher-fsacars-client.zip"')
      .send(zipBuffer)
  })

  // FSACARS protocol endpoints
  app.all('/fsacars/userquery', userquery)
  app.all('/fsacars/dispatch', dispatch)
  app.post('/fsacars/posrep', posrep)
  app.post('/fsacars/pirep', pirep)
}
