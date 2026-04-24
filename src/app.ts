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
import dotenv from 'dotenv'

dotenv.config()

const app = Fastify({ logger: true })

app.register(cors, { 
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-barbershop-id', 'x-user-id', 'x-user-role'],
  credentials: true
})

// 🏥 ROTA DE TESTE (Health Check)
app.get('/', async () => {
  return { status: 'online', message: 'BarberSystem API is running', version: '1.0.0' }
})

const JWT_SECRET = process.env.JWT_SECRET || 'barber-system-secret-2024'
app.register(jwt, { secret: JWT_SECRET })

app.addHook('preHandler', async (request, reply) => {
  const url = request.url.split('?')[0]
  // 1. Definição de Rotas Públicas
  const publicPaths = ['/', '/auth/login', '/auth/register', '/services', '/barbers', '/appointments/available-times', '/appointments/guest']
  const isPublic = publicPaths.some(path => url === path || url.startsWith(path + '/')) || (request.method === 'POST' && url === '/appointments')

  // Identificação básica de estabelecimento
  const tid = request.headers['x-barbershop-id'] || (request.query as any)?.barbershopId
  if (tid) (request as any).barbershopId = tid

  if (isPublic) return

  try {
    const authHeader = request.headers.authorization
    const token = authHeader?.replace(/Bearer\s+/i, '') || (request.query as any)?.token
    
    if (!token) throw new Error('Token ausente')

    // 🛡️ VALIDAÇÃO SEGURA
    const payload: any = await app.jwt.verify(token)
    
    // ATENÇÃO: Acessando como propriedades simples (SEM PARÊNTESES)
    const userId = payload.id
    const userRole = payload.role
    const barbershopId = payload.barbershopId

    if (!userId || !barbershopId) throw new Error('Payload do Token incompleto')

    ;(request as any).userId = userId
    ;(request as any).userRole = userRole
    ;(request as any).barbershopId = barbershopId

    // Verificação SaaS (Barbearia Ativa)
    if (userRole !== 'SUPERADMIN') {
      const shop = await prisma.barbershop.findUnique({
        where: { id: barbershopId },
        select: { isActive: true }
      })
      if (!shop || !shop.isActive) {
        return reply.status(403).send({ error: 'ACESSO_SUSPENSO' })
      }
    }
  } catch (err: any) {
    app.log.error(`[AUTH_ERROR] ${url}: ${err.message}`)
    return reply.status(401).send({ error: 'Sessão inválida. Por favor, logue novamente.' })
  }
})

app.register(authRoutes, { prefix: '/auth' })
app.register(appointmentRoutes, { prefix: '/appointments' })
app.register(financeRoutes, { prefix: '/finance' })
app.register(saasRoutes, { prefix: '/saas' })
app.register(teamRoutes, { prefix: '/team' })
app.register(generalRoutes)

export { app }
