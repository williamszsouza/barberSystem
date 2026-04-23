import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import bcrypt from 'bcryptjs'
import { sendWelcomeEmail } from '../lib/mail.js'

export async function saasRoutes(app: FastifyInstance) {
  app.addHook('preHandler', async (request, reply) => {
    const { userRole } = request as any
    if (userRole !== 'SUPERADMIN') {
      return reply.status(403).send({ error: 'Acesso restrito ao SuperAdmin' })
    }
  })

  app.get('/barbershops', async () => {
    return await prisma.barbershop.findMany({
      include: { _count: { select: { users: true, appointments: true } } }
    })
  })

  // CRIAR NOVA BARBEARIA + CONTA DO DONO + ENVIO DE E-MAIL
  app.post('/barbershops', async (request, reply) => {
    const createSchema = z.object({
      name: z.string().min(3),
      cnpj: z.string().optional(),
      plan: z.enum(['BASIC', 'PRO', 'ENTERPRISE']).default('BASIC'),
      ownerName: z.string().min(3),
      ownerEmail: z.string().email(),
      ownerPassword: z.string().min(6)
    })

    const { name, cnpj, plan, ownerName, ownerEmail, ownerPassword } = createSchema.parse(request.body)
    const { userId } = request as any

    const emailExists = await prisma.user.findUnique({ where: { email: ownerEmail } })
    if (emailExists) return reply.status(400).send({ error: 'Este e-mail de proprietário já está em uso.' })

    const passwordHash = await bcrypt.hash(ownerPassword, 8)

    const result = await prisma.$transaction(async (tx) => {
      const barbershop = await tx.barbershop.create({
        data: { name, cnpj, plan }
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
      // Não barramos a criação se o e-mail falhar, mas logamos o erro
    }

    await prisma.auditLog.create({
      data: {
        action: 'TENANT_CREATED',
        entity: 'BARBERSHOP',
        entityId: result.barbershop.id,
        userId: userId,
        barbershopId: result.barbershop.id,
        details: `Barbearia "${name}" criada e e-mail enviado para ${ownerEmail}`
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
        userId: userId,
        barbershopId: id,
        details: `Barbearia ${barbershop.name} foi ${updated.isActive ? 'ativada' : 'suspensa'} pelo SuperAdmin.`
      }
    })

    return updated
  })

  app.get('/audit-logs', async () => {
    return await prisma.auditLog.findMany({
      include: {
        user: { select: { name: true, email: true } },
        barbershop: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    })
  })
}
