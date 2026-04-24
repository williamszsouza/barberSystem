import pkg from 'bullmq'
const { Queue } = pkg
import { Redis } from 'ioredis'
import dotenv from 'dotenv'

dotenv.config()

// 🛡️ Ajuste de Resiliência: Conexão com Timeouts curtos para não travar a API
const redisConnection = process.env.REDIS_URL 
  ? new Redis(process.env.REDIS_URL, { 
      maxRetriesPerRequest: null,
      connectTimeout: 5000, // Desiste após 5 segundos
      commandTimeout: 3000  // Desiste do comando após 3 segundos
    })
  : new Redis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: Number(process.env.REDIS_PORT) || 6379,
      maxRetriesPerRequest: null,
      connectTimeout: 5000
    })

redisConnection.on('error', (err) => {
  console.error('❌ Erro no Redis:', err.message)
})

export const notificationQueue = new Queue('notifications', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 }
  }
})

export async function addNotificationJob(data: {
  appointmentId: string
  phone: string
  message: string
  sendAt: Date
}) {
  const delay = new Date(data.sendAt).getTime() - Date.now()
  
  // O BullMQ agora retorna a promessa, mas o controller não vai mais dar 'await' nela
  return notificationQueue.add('send-whatsapp', data, {
    delay: delay > 0 ? delay : 0,
    removeOnComplete: true // Economiza memória no Redis
  })
}

export { redisConnection }
