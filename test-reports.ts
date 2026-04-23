import Fastify from 'fastify'
import jwt from '@fastify/jwt'
import { appointmentRoutes } from './src/routes/appointments.js'
import dotenv from 'dotenv'
import { prisma } from './src/lib/prisma.js'

dotenv.config()

async function test() {
  const app = Fastify()
  const JWT_SECRET = (process.env.JWT_SECRET || 'barber-system-secret-2024').replace(/['"]/g, '')
  
  app.register(jwt, { secret: JWT_SECRET })
  app.register(appointmentRoutes, { prefix: '/appointments' })
  
  // Mock preHandler hook
  app.addHook('preHandler', async (request, reply) => {
    const authHeader = request.headers.authorization
    const token = authHeader?.replace(/Bearer\s+/i, '')
    
    if (!token) {
      return reply.status(401).send({ error: 'Token ausente' })
    }

    try {
      const payload = await app.jwt.verify(token)
      ;(request as any).userId = (payload as any).id
      ;(request as any).userRole = (payload as any).role
      ;(request as any).barbershopId = (payload as any).barbershopId
    } catch (err: any) {
      return reply.status(401).send({ error: 'Sessão inválida', message: err.message })
    }
  })

  await app.ready()

  const payload = {
    id: 'super-admin-id',
    role: 'SUPERADMIN',
    barbershopId: '6eaef11b-dd00-47b9-b46c-dd1039d22f15'
  }

  const token = app.jwt.sign(payload)
  
  const response = await app.inject({
    method: 'GET',
    url: '/appointments/reports?startDate=2024-01-01T00:00:00Z&endDate=2024-12-31T23:59:59Z',
    headers: {
      authorization: `Bearer ${token}`
    }
  })

  console.log('Response Status:', response.statusCode)
  console.log('Response Body:', response.json())
}

test().catch(console.error)
