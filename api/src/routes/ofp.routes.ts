import { FastifyInstance } from 'fastify'
import { generateOFPData, downloadOFPPDF } from '../controllers/ofp.controller.js'

export const ofpRoutes = async (app: FastifyInstance) => {
  app.get('/ofp/generate', generateOFPData)
  app.get('/ofp/download', downloadOFPPDF)
}
