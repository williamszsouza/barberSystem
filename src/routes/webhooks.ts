import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { WebhookService } from '../services/webhook-service.js'

const webhookService = new WebhookService()

export async function webhookRoutes(app: FastifyInstance) {
  // Rota para receber eventos da Evolution API
  app.post('/evolution', async (request, reply) => {
    const body = request.body as any
    
    // Log básico para depuração em desenvolvimento
    console.log('📬 Webhook recebido da Evolution API:', body)

    try {
      // Extração básica baseada no padrão da Evolution API
      const remoteJid = body.data?.key?.remoteJid || body.remoteJid
      const text = body.data?.message?.conversation || body.text || ''

      if (remoteJid) {
        await webhookService.processWhatsAppMessage(remoteJid, text)
      }
      
      return reply.status(200).send({ success: true })
    } catch (error: any) {
      console.error('❌ Erro ao processar webhook:', error.message)
      return reply.status(500).send({ error: 'Erro interno ao processar webhook' })
    }
  })
}
