import pkg from 'bullmq'
const { Worker } = pkg
import { redisConnection } from '../lib/queue.js'
import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

console.log('🤖 [Worker] Motor de notificações iniciado e aguardando mensagens...')

export const notificationWorker = new Worker(
  'notifications',
  async (job) => {
    console.log(`📩 [Worker] Nova tarefa recebida: ${job.id}`)
    const { phone, message, appointmentId } = job.data
    
    // Formatar número (garantir que tenha o DDI 55)
    const formattedPhone = phone.startsWith('55') ? phone : `55${phone}`

    console.log(`[WhatsApp] Iniciando envio para ${formattedPhone} (Apt: ${appointmentId})`)

    // 🛡️ MODO SIMULADO: Evita dependência da Evolution API em desenvolvimento
    if (process.env.MOCK_WHATSAPP === 'true') {
      console.log('--------------------------------------------------')
      console.log('🤖 [MOCK WHATSAPP] Simulação de Envio:')
      console.log(`📱 Para: ${formattedPhone}`)
      console.log(`💬 Mensagem: ${message}`)
      console.log('--------------------------------------------------')
      return { success: true, mocked: true }
    }

    try {
      // 🚀 Integração com Evolution API (v1.8.2) com TIMEOUT
      const response = await axios.post(
        `${process.env.EVOLUTION_API_URL}/message/sendText/${process.env.EVOLUTION_INSTANCE}`,
        {
          number: formattedPhone,
          textMessage: {
            text: message
          },
          delay: 1200, 
          linkPreview: true
        },
        {
          timeout: 15000, // 🛡️ Não trava o worker se a API demorar
          headers: {
            'apikey': process.env.EVOLUTION_API_KEY,
            'Content-Type': 'application/json'
          }
        }
      )

      console.log(`✅ WhatsApp enviado com sucesso para ${formattedPhone}`)
      return { success: true, messageId: response.data.key?.id }
    } catch (error: any) {
      const status = error.response?.status
      const errorMsg = error.response?.data?.response?.message || error.message

      console.error(`❌ Falha no envio para ${formattedPhone}:`, {
        status,
        error: error.response?.data?.error || 'Erro de Conexão',
        response: errorMsg
      })

      // Se for erro de autenticação ou rota inexistente, não adianta tentar de novo
      if (status === 401 || status === 403 || status === 404) {
        throw new Error(`Erro fatal na Evolution API (Status ${status}): ${JSON.stringify(errorMsg)}`)
      }
      
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
