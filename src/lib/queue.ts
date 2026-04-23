import { Queue } from 'bullmq'
import { Redis } from 'ioredis'
import dotenv from 'dotenv'

dotenv.config()

const redisConfig = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null,
}

export const redisConnection = new Redis(redisConfig)

redisConnection.on('error', (err) => {
  console.error('❌ Erro no Redis:', err.message)
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