import pkg from 'bullmq'
const { Queue } = pkg
import { Redis } from 'ioredis'
import dotenv from 'dotenv'

dotenv.config()

// 🛡️ Ajuste de Resiliência: Conexão Industrial para Windows/Docker/Cloud (Upstash)
// Higieniza a URL removendo possíveis comandos do CLI do Upstash (--tls -u) e espaços
const rawRedisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379'
const redisUrl = rawRedisUrl
  .replace('redis-cli', '')
  .replace('--tls', '')
  .replace('-u', '')
  .trim()
  .replace('localhost', '127.0.0.1')

// Verifica se a URL usa SSL (Upstash usa rediss:// ou se a string original continha --tls)
const isTls = redisUrl.startsWith('rediss://') || rawRedisUrl.includes('--tls')

const redisConnection = new Redis(redisUrl, { 
  maxRetriesPerRequest: null,
  connectTimeout: 20000, 
  commandTimeout: 20000,
  tls: isTls ? { rejectUnauthorized: false } : undefined, // 🚀 Suporte para Upstash/Render
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000)
    return delay
  }
})

redisConnection.on('connect', () => console.log('✅ [Redis] Conexão estabelecida com sucesso.'))
redisConnection.on('error', (err) => console.error('❌ [Redis] Erro de conexão:', err.message))

export const notificationQueue = new Queue('notifications', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 }
  }
})

export const emailQueue = new Queue('emails', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 }
  }
})

export async function addNotificationJob(data: {
  appointmentId: string
  phone: string
  message: string
  sendAt: Date
}) {
  const delay = new Date(data.sendAt).getTime() - Date.now()
  
  return notificationQueue.add('send-whatsapp', data, {
    delay: delay > 0 ? delay : 0,
    removeOnComplete: true
  })
}

export type EmailJobData = 
  | { type: 'WELCOME_CUSTOMER', payload: { to: string, ownerName: string, barbershopName: string } }
  | { type: 'APPOINTMENT_CUSTOMER', payload: { to: string, customerName: string, barbershopName: string, date: string, time: string, serviceName: string, barberName: string, productsText: string, totalValue: string } }
  | { type: 'APPOINTMENT_BARBER', payload: { to: string, barberName: string, customerName: string, date: string, time: string, serviceName: string, productsText: string, totalValue: string } }

export async function addEmailJob(data: EmailJobData) {
  return emailQueue.add('send-email', data, {
    removeOnComplete: true
  })
}

export { redisConnection }
