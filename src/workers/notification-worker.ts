import pkg from 'bullmq'
const { Worker } = pkg
import { redisConnection } from '../lib/queue.js'
import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

export const notificationWorker = new Worker(
  'notifications',
  async (job) => {
    const { phone, message, appointmentId } = job.data
    
    // Formatar número (garantir que tenha o DDI 55)
    const formattedPhone = phone.startsWith('55') ? phone : `55${phone}`

    console.log(`[WhatsApp] Iniciando envio para ${formattedPhone} (Apt: ${appointmentId})`)

    try {
      // 🚀 Integração com Evolution API
      const response = await axios.post(
        `${process.env.EVOLUTION_API_URL}/message/sendText/${process.env.EVOLUTION_INSTANCE}`,
        {
          number: formattedPhone,
          text: message,
          delay: 1200, // Simular digitação
          linkPreview: true
        },
        {
          headers: {
            'apikey': process.env.EVOLUTION_API_KEY,
            'Content-Type': 'application/json'
          }
        }
      )

      console.log(`✅ WhatsApp enviado com sucesso para ${formattedPhone}`)
      return { success: true, messageId: response.data.key?.id }
    } catch (error: any) {
      console.error(`❌ Falha no envio para ${formattedPhone}:`, error.response?.data || error.message)
      
      // Lançar erro faz o BullMQ tentar novamente (retry) automaticamente
      throw new Error(`Erro na Evolution API: ${error.message}`)
    }
  },
  { 
    connection: redisConnection,
    concurrency: 5 // Processa até 5 envios simultâneos
  }
)

notificationWorker.on('completed', (job) => {
  console.log(`[Worker] Job ${job.id} finalizado.`)
})

notificationWorker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} falhou criticamente: ${err.message}`)
})
