import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { CampaignService } from '../services/campaign-service.js'

const campaignService = new CampaignService()

export async function campaignRoutes(app: FastifyInstance) {
  // Middleware de proteção: Apenas ADMIN
  app.addHook('preHandler', async (request, reply) => {
    const { userRole } = request as any
    if (userRole !== 'ADMIN' && userRole !== 'SUPERADMIN') {
      return reply.status(403).send({ error: 'Acesso negado' })
    }
  })

  // Listar Campanhas
  app.get('/', async (request) => {
    const { barbershopId } = request as any
    return await campaignService.getCampaigns(barbershopId)
  })

  // Disparar Campanha de Retenção
  app.post('/run-retention', async (request, reply) => {
    const bodySchema = z.object({
      daysIdle: z.number().int().min(1),
      message: z.string().min(10)
    })

    const { daysIdle, message } = bodySchema.parse(request.body)
    const { barbershopId } = request as any

    const result = await campaignService.runRetentionCampaign(barbershopId, daysIdle, message)
    return reply.status(200).send(result)
  })
}
