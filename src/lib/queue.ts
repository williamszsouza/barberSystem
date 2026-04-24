import pkg from 'bullmq'
const { Queue } = pkg
import { Redis } from 'ioredis'
import dotenv from 'dotenv'

dotenv.config()

// 🛡️ DINAMISMO: Suporte a URL completa (Upstash/Render) ou host/port separado
const redisConnection = process.env.REDIS_URL 
  ? new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null })
  : new Redis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: Number(process.env.REDIS_PORT) || 6379,
      maxRetriesPerRequest: null,
    })

redisConnection.on('error', (err) => {
  // Em produção, apenas logamos o erro sem derrubar o servidor
  console.error('❌ Erro no Redis:', err.message)
})

redisConnection.on('connect', () => {
  console.log('✅ Conectado ao Redis com sucesso!')
})

export const notificationQueue = new Queue('notifications', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    }
  }
})

export async function addNotificationJob(data: {
  appointmentId: string
  phone: string
  message: string
  sendAt: Date
}) {
  const delay = new Date(data.sendAt).getTime() - Date.now()
  
  await notificationQueue.add('send-whatsapp', data, {
    delay: delay > 0 ? delay : 0
  })
}

export { redisConnection }
