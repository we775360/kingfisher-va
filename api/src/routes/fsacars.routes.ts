import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { userquery, dispatch, posrep, pirep } from '../controllers/fsacars.controller.js'

export const fsacarsRoutes = async (app: FastifyInstance) => {
  // Redirect to official FSACARS download page
  app.get('/fsacars/download', async (_req: FastifyRequest, reply: FastifyReply) => {
    return reply.redirect(302, 'https://www.fsacars.com')
  })

  // FSACARS protocol endpoints
  app.all('/fsacars/userquery', userquery)
  app.all('/fsacars/dispatch', dispatch)
  app.post('/fsacars/posrep', posrep)
  app.post('/fsacars/pirep', pirep)
}
