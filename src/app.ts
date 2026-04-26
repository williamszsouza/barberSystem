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
import { productRoutes } from './routes/products.js'
import { webhookRoutes } from './routes/webhooks.js'
import { campaignRoutes } from './routes/campaigns.js'
import { configRoutes } from './routes/config.js'
import dotenv from 'dotenv'

dotenv.config()

const app = Fastify({ logger: true })

app.register(cors, { 
  origin: (origin, cb) => {
    // 🛡️ Permite Localhost, Vercel (Homologação) e seu Domínio Oficial
    if (!origin || /localhost/.test(origin) || /\.vercel\.app$/.test(origin) || /\.barbersystem\.com$/.test(origin)) {
      cb(null, true)
      return
    }
    cb(new Error('CORS blocked'), false)
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-barbershop-id', 'x-user-id', 'x-user-role'],
  credentials: true
})

const JWT_SECRET = (process.env.JWT_SECRET || 'barber-system-secret-2024').trim()
app.register(jwt, { secret: JWT_SECRET })

app.addHook('preHandler', async (request, reply) => {
  const url = request.url.split('?')[0]
  
  const publicPaths = ['/', '/auth/login', '/auth/register', '/services', '/barbers', '/appointments/available-times', '/appointments/guest', '/products', '/webhooks/evolution', '/saas/webhook/payment', '/barbershops/by-slug']
  const isPublic = publicPaths.some(path => url === path || url.startsWith(path + '/')) || (request.method === 'POST' && url === '/appointments')

  // Tenta capturar barbershopId de qualquer lugar possível (headers, query ou slug)
  let tid = request.headers['x-barbershop-id'] || (request.query as any)?.barbershopId
  
  // Se não tem ID, mas tem Slug na query/parâmetros, vamos tentar resolver
  const slug = (request.query as any)?.slug || (request.params as any)?.slug
  if (!tid && slug) {
    const shop = await prisma.barbershop.findUnique({ where: { slug }, select: { id: true } })
    if (shop) tid = shop.id
  }

  if (tid) {
    (request as any).barbershopId = tid
    console.log(`[DEBUG] Contexto resolvido: Barbearia ${tid} | Rota: ${url}`)
  }

  if (isPublic) return

  const authHeader = request.headers.authorization
  const queryToken = (request.query as any)?.token
  const token = authHeader?.replace(/Bearer\s+/i, '') || queryToken

  if (!token) {
    return reply.status(401).send({ error: 'Sessão expirada. Faça login novamente.' })
  }

  try {
    const payload: any = await app.jwt.verify(token)
    
    // 🛡️ Injeção de Dados do Usuário Logado
    ;(request as any).userId = payload.id
    ;(request as any).userRole = payload.role
    ;(request as any).barbershopId = payload.barbershopId

    // 🛡️ Verificação de suspensão para usuários normais (Pula se for SUPERADMIN)
    if (payload.role !== 'SUPERADMIN') {
      const shop = await prisma.barbershop.findUnique({
        where: { id: payload.barbershopId },
        select: { isActive: true }
      })
      if (!shop || !shop.isActive) {
        return reply.status(403).send({ error: 'ACESSO_SUSPENSO' })
      }
    }
  } catch (err: any) {
    return reply.status(401).send({ error: 'Sessão inválida. Faça login novamente.' })
  }
})

app.register(authRoutes, { prefix: '/auth' })
app.register(appointmentRoutes, { prefix: '/appointments' })
app.register(financeRoutes, { prefix: '/finance' })
app.register(saasRoutes, { prefix: '/saas' })
app.register(teamRoutes, { prefix: '/team' })
app.register(serviceRoutes, { prefix: '/services-mgmt' }) // Rota privada de gestão
app.register(productRoutes, { prefix: '/products-mgmt' }) // Rota privada de gestão
app.register(webhookRoutes, { prefix: '/webhooks' }) // Rota de Webhooks 🚀
app.register(campaignRoutes, { prefix: '/marketing' }) // Rota de Marketing 🚀
app.register(configRoutes, { prefix: '/config' }) // Rota de Configurações 🚀
app.register(generalRoutes)

export { app }
