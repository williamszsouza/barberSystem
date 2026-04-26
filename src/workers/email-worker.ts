import pkg from 'bullmq'
const { Worker } = pkg
import { redisConnection, EmailJobData } from '../lib/queue.js'
import { 
  sendCustomerWelcomeEmail, 
  sendCustomerAppointmentEmail, 
  sendBarberAppointmentEmail 
} from '../lib/mail.js'

console.log('📧 [Worker] Motor de e-mails iniciado e aguardando mensagens...')

export const emailWorker = new Worker(
  'emails',
  async (job) => {
    const { type, payload } = job.data as EmailJobData
    console.log(`📩 [Worker E-mail] Processando tarefa: ${type} (Job: ${job.id})`)

    try {
      switch (type) {
        case 'WELCOME_CUSTOMER':
          await sendCustomerWelcomeEmail(payload)
          break
        
        case 'APPOINTMENT_CUSTOMER':
          await sendCustomerAppointmentEmail(payload)
          break
        
        case 'APPOINTMENT_BARBER':
          await sendBarberAppointmentEmail(payload)
          break

        default:
          console.error(`❌ [Worker E-mail] Tipo de tarefa desconhecido: ${type}`)
      }

      console.log(`✅ [Worker E-mail] Tarefa ${type} concluída com sucesso.`)
    } catch (error: any) {
      console.error(`❌ [Worker E-mail] Falha ao processar tarefa ${type}:`, error.message)
      throw error // BullMQ tentará novamente baseado no backoff
    }
  },
  { 
    connection: redisConnection,
    concurrency: 2 // Processa até 2 e-mails simultâneos
  }
)

emailWorker.on('failed', (job, err) => {
  console.error(`[Worker E-mail] Job ${job?.id} falhou criticamente: ${err.message}`)
})
