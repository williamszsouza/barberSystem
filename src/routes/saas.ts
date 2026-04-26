import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import bcrypt from 'bcryptjs'
import { sendWelcomeEmail } from '../lib/mail.js'

// 💰 Configuração Central de Preços e Limites do SaaS
export const SAAS_PLANS = {
  BASIC: {
    name: 'Basic',
    price: 89.90,
    maxBarbers: 1,
    features: ['Agendamentos Ilimitados', 'E-mail Marketing']
  },
  PRO: {
    name: 'Pro',
    price: 159.90,
    maxBarbers: 5,
    features: ['WhatsApp Ilimitado', 'Vitrine de Produtos', 'Até 5 Barbeiros']
  },
  ENTERPRISE: {
    name: 'Enterprise',
    price: 299.90,
    maxBarbers: 999,
    features: ['Tudo do PRO', 'Equipe Ilimitada', 'Relatórios Avançados']
  }
}

export async function saasRoutes(app: FastifyInstance) {
  app.addHook('preHandler', async (request, reply) => {
    const { userRole } = request as any
    if (userRole !== 'SUPERADMIN') {
      return reply.status(403).send({ error: 'Acesso restrito ao SuperAdmin' })
    }
  })

  // Retorna a configuração de planos para o Frontend
  app.get('/plans', async () => {
    return SAAS_PLANS
  })

  app.get('/barbershops', async (request) => {
    const querySchema = z.object({
      page: z.string().optional().transform(Number).default('1'),
      limit: z.string().optional().transform(Number).default('20')
    })
    const { page, limit } = querySchema.parse(request.query)
    const skip = (page - 1) * limit

    const [total, totalActive, totalSuspended, items] = await Promise.all([
      prisma.barbershop.count(),
      prisma.barbershop.count({ where: { isActive: true } }),
      prisma.barbershop.count({ where: { isActive: false } }),
      prisma.barbershop.findMany({
        take: limit,
        skip,
        include: { _count: { select: { users: true, appointments: true } } },
        orderBy: { createdAt: 'desc' }
      })
    ])

    return {
      meta: { 
        total, 
        totalActive, 
        totalSuspended, 
        page, 
        limit, 
        totalPages: Math.ceil(total / limit) 
      },
      data: items
    }
  })

  // CRIAR NOVA BARBEARIA + CONTA DO DONO + ENVIO DE E-MAIL
  app.post('/barbershops', async (request, reply) => {
    const createSchema = z.object({
      name: z.string().min(3),
      cnpj: z.string().optional(),
      slug: z.string().min(3),
      plan: z.enum(['BASIC', 'PRO', 'ENTERPRISE']).default('BASIC'),
      ownerName: z.string().min(3),
      ownerEmail: z.string().email(),
      ownerPassword: z.string().min(6)
    })

    const { name, cnpj, slug, plan, ownerName, ownerEmail, ownerPassword } = createSchema.parse(request.body)
    const { userId } = request as any

    const emailExists = await prisma.user.findUnique({ where: { email: ownerEmail } })
    if (emailExists) return reply.status(400).send({ error: 'Este e-mail de proprietário já está em uso.' })

    const slugExists = await prisma.barbershop.findUnique({ where: { slug } })
    if (slugExists) return reply.status(400).send({ error: 'Este subdomínio (slug) já está em uso.' })

    const passwordHash = await bcrypt.hash(ownerPassword, 8)

    const result = await prisma.$transaction(async (tx) => {
      const barbershop = await tx.barbershop.create({
        data: { 
          name, 
          cnpj, 
          slug, 
          plan,
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dias de trial/inicial
        }
      })

      const owner = await tx.user.create({
        data: {
          name: ownerName,
          email: ownerEmail,
          passwordHash,
          role: 'ADMIN',
          barbershopId: barbershop.id
        }
      })

      return { barbershop, owner }
    })

    // 📧 ENVIO DE E-MAIL AUTOMÁTICO
    try {
      await sendWelcomeEmail({
        to: ownerEmail,
        ownerName: ownerName,
        barbershopName: name,
        password: ownerPassword
      })
      console.log(`✅ E-mail de boas-vindas enviado para ${ownerEmail}`)
    } catch (mailError) {
      console.error('❌ Falha ao enviar e-mail:', mailError)
    }

    await prisma.auditLog.create({
      data: {
        action: 'TENANT_CREATED',
        entity: 'BARBERSHOP',
        entityId: result.barbershop.id,
        userId: userId,
        barbershopId: result.barbershop.id,
        details: `Barbearia "${name}" criada com slug "${slug}" e e-mail enviado para ${ownerEmail}`
      }
    })

    return reply.status(201).send(result)
  })

  app.patch('/barbershops/:id/toggle-status', async (request, reply) => {
    const paramsSchema = z.object({ id: z.string().uuid() })
    const { id } = paramsSchema.parse(request.params)
    const { userId } = request as any

    const barbershop = await prisma.barbershop.findUnique({ where: { id } })
    if (!barbershop) return reply.status(404).send({ error: 'Barbearia não encontrada' })

    const updated = await prisma.barbershop.update({
      where: { id },
      data: { isActive: !barbershop.isActive }
    })

    await prisma.auditLog.create({
      data: {
        action: updated.isActive ? 'TENANT_ACTIVATED' : 'TENANT_SUSPENDED',
        entity: 'BARBERSHOP',
        entityId: id,
        userId: userId || 'SYSTEM', // 🛡️ Fallback para evitar erro 500 se o token falhar
        barbershopId: id,
        details: `Barbearia ${barbershop.name} foi ${updated.isActive ? 'ativada' : 'suspensa'} pelo SuperAdmin.`
      }
    })

    return updated
  })

  // 💰 Registrar Pagamento Manual (Feature 1 - V2)
  app.post('/barbershops/:id/register-payment', async (request, reply) => {
    const paramsSchema = z.object({ id: z.string().uuid() })
    const { id } = paramsSchema.parse(request.params)
    const { userId } = request as any

    const barbershop = await prisma.barbershop.findUnique({ where: { id } })
    if (!barbershop) return reply.status(404).send({ error: 'Barbearia não encontrada' })

    // Adiciona 30 dias a partir de hoje
    const nextDate = new Date()
    nextDate.setDate(nextDate.getDate() + 30)

    const updated = await prisma.barbershop.update({
      where: { id },
      data: { 
        isActive: true,
        subscriptionStatus: 'active',
        nextBillingDate: nextDate
      }
    })

    await prisma.auditLog.create({
      data: {
        action: 'PAYMENT_REGISTERED',
        entity: 'BARBERSHOP',
        entityId: id,
        userId: userId,
        barbershopId: id,
        details: `Pagamento registrado manualmente. Próximo vencimento: ${nextDate.toLocaleDateString()}`
      }
    })

    return updated
  })
}
