import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { WebhookService } from '../services/webhook-service.js'

const webhookService = new WebhookService()

export async function webhookRoutes(app: FastifyInstance) {
  // Rota para receber eventos da Evolution API
  app.post('/evolution', async (request, reply) => {
    // Log básico para depuração em desenvolvimento
    console.log('📬 Webhook recebido da Evolution API:', request.body)

    try {
      await webhookService.processWhatsAppMessage(request.body)
      return reply.status(200).send({ success: true })
    } catch (error: any) {
      console.error('❌ Erro ao processar webhook:', error.message)
      return reply.status(500).send({ error: 'Erro interno ao processar webhook' })
    }
  })
}
