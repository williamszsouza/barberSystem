import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import bcrypt from 'bcryptjs'

export async function teamRoutes(app: FastifyInstance) {
  // Middleware de proteção: Apenas ADMIN da barbearia
  app.addHook('preHandler', async (request, reply) => {
    const { userRole } = request as any
    if (userRole !== 'ADMIN' && userRole !== 'SUPERADMIN') {
      return reply.status(403).send({ error: 'Acesso restrito ao dono da barbearia' })
    }
  })

  // Listar Equipe (Barbeiros)
  app.get('/', async (request) => {
    const { barbershopId } = request as any
    const querySchema = z.object({
      page: z.string().optional().transform(Number).default('1'),
      limit: z.string().optional().transform(Number).default('20')
    })
    const { page, limit } = querySchema.parse(request.query)
    const skip = (page - 1) * limit

    const [total, items] = await Promise.all([
      prisma.user.count({ where: { barbershopId, role: 'BARBER' } }),
      prisma.user.findMany({
        where: { barbershopId, role: 'BARBER' },
        select: { id: true, name: true, email: true, phone: true, createdAt: true },
        take: limit,
        skip,
        orderBy: { name: 'asc' }
      })
    ])

    return {
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      data: items
    }
  })

  // Adicionar Novo Barbeiro
  app.post('/', async (request, reply) => {
    const createSchema = z.object({
      name: z.string().min(3),
      email: z.string().email(),
      password: z.string().min(6),
      phone: z.string().optional()
    })

    const { name, email, password, phone } = createSchema.parse(request.body)
    const { barbershopId } = request as any

    const userExists = await prisma.user.findUnique({ where: { email } })
    if (userExists) return reply.status(400).send({ error: 'Este e-mail já está em uso' })

    const passwordHash = await bcrypt.hash(password, 8)

    const barber = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        phone,
        role: 'BARBER',
        barbershopId
      }
    })

    return reply.status(201).send({ id: barber.id, name: barber.name, email: barber.email })
  })

  // Remover Barbeiro
  app.delete('/:id', async (request, reply) => {
    const paramsSchema = z.object({ id: z.string().uuid() })
    const { id } = paramsSchema.parse(request.params)
    const { barbershopId } = request as any

    // Verificar se o barbeiro pertence a esta barbearia
    const barber = await prisma.user.findFirst({
      where: { id, barbershopId, role: 'BARBER' }
    })

    if (!barber) return reply.status(404).send({ error: 'Barbeiro não encontrado na sua equipe' })

    await prisma.user.delete({ where: { id } })
    return reply.status(204).send()
  })
}