import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import { prisma } from './lib/prisma.js'
import { appointmentRoutes } from './routes/appointments.js'
import { generalRoutes } from './routes/general.js'
import { authRoutes } from './routes/auth.js'
import { financeRoutes } from './routes/finance.js'
import { saasRoutes } from './routes/saas.js'
import { teamRoutes } from './routes/team.js'
import { serviceRoutes } from './routes/services.js'
import dotenv from 'dotenv'

dotenv.config()

const app = Fastify({ logger: true })

app.register(cors, { 
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-barbershop-id', 'x-user-id', 'x-user-role'],
  credentials: true
})

const JWT_SECRET = (process.env.JWT_SECRET || 'barber-system-secret-2024').trim()
app.register(jwt, { secret: JWT_SECRET })

app.addHook('preHandler', async (request, reply) => {
  const url = request.url.split('?')[0]
  
  const publicPaths = ['/', '/auth/login', '/auth/register', '/services', '/barbers', '/appointments/available-times', '/appointments/guest']
  const isPublic = publicPaths.some(path => url === path || url.startsWith(path + '/')) || (request.method === 'POST' && url === '/appointments')

  const tid = request.headers['x-barbershop-id'] || (request.query as any)?.barbershopId
  if (tid) (request as any).barbershopId = tid

  if (isPublic) {
    if ((request.headers.authorization || (request.query as any)?.token)) {
      try {
        const token = request.headers.authorization?.replace(/Bearer\s+/i, '') || (request.query as any)?.token
        const decoded = await app.jwt.verify(token) as any
        (request as any).barbershopId = decoded.barbershopId
      } catch {}
    }
    return
  }

  const authHeader = request.headers.authorization
  const queryToken = (request.query as any)?.token
  const token = authHeader?.replace(/Bearer\s+/i, '') || queryToken

  if (!token) {
    return reply.status(401).send({ error: 'Token ausente.' })
  }

  try {
    const payload: any = await app.jwt.verify(token)
    ;(request as any).userId = payload.id
    ;(request as any).userRole = payload.role
    ;(request as any).barbershopId = payload.barbershopId

    if (payload.role !== 'SUPERADMIN') {
      const shop = await prisma.barbershop.findUnique({
        where: { id: payload.barbershopId },
        select: { isActive: true }
      })
      if (!shop || !shop.isActive) return reply.status(403).send({ error: 'ACESSO_SUSPENSO' })
    }
  } catch (err: any) {
    return reply.status(401).send({ error: 'Sessão inválida.' })
  }
})

app.register(authRoutes, { prefix: '/auth' })
app.register(appointmentRoutes, { prefix: '/appointments' })
app.register(financeRoutes, { prefix: '/finance' })
app.register(saasRoutes, { prefix: '/saas' })
app.register(teamRoutes, { prefix: '/team' })
app.register(serviceRoutes, { prefix: '/services-mgmt' }) // Rota privada de gestão
app.register(generalRoutes)

export { app }
