import { Worker } from 'bullmq'
import { redisConnection } from '../lib/queue.js'

export const notificationWorker = new Worker(
  'notifications',
  async (job) => {
    const { phone, message, appointmentId } = job.data

    console.log(`[Worker] Processando notificação para o agendamento ${appointmentId}`)
    console.log(`[Worker] Enviando WhatsApp para ${phone}: "${message}"`)

    return { success: true }
  },
  { connection: redisConnection }
)

notificationWorker.on('completed', (job) => {
  console.log(`[Worker] Job ${job.id} concluído com sucesso!`)
})

notificationWorker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} falhou: ${err.message}`)
})