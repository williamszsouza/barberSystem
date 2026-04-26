import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'

export async function serviceRoutes(app: FastifyInstance) {
  // Middleware de proteção: Apenas ADMIN da barbearia
  app.addHook('preHandler', async (request, reply) => {
    const { userRole } = request as any
    if (userRole !== 'ADMIN' && userRole !== 'SUPERADMIN') {
      return reply.status(403).send({ error: 'Acesso restrito ao administrador' })
    }
  })

  // Listar todos os serviços da barbearia
  app.get('/', async (request) => {
    const { barbershopId } = request as any
    const querySchema = z.object({
      page: z.string().optional().transform(Number).default('1'),
      limit: z.string().optional().transform(Number).default('20')
    })
    const { page, limit } = querySchema.parse(request.query)
    const skip = (page - 1) * limit

    const [total, items] = await Promise.all([
      prisma.service.count({ where: { barbershopId } }),
      prisma.service.findMany({
        where: { barbershopId },
        take: limit,
        skip,
        orderBy: { createdAt: 'asc' }
      })
    ])

    return {
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      data: items
    }
  })

  // Criar novo serviço
  app.post('/', async (request, reply) => {
    const createSchema = z.object({
      name: z.string().min(2),
      price: z.number().positive(),
      duration: z.number().int().positive(),
      description: z.string().optional()
    })

    const { name, price, duration, description } = createSchema.parse(request.body)
    const { barbershopId } = request as any

    const service = await prisma.service.create({
      data: {
        name,
        price,
        duration,
        description,
        barbershopId
      }
    })

    return reply.status(201).send(service)
  })

  // Editar serviço
  app.patch('/:id', async (request, reply) => {
    const paramsSchema = z.object({ id: z.string().uuid() })
    const bodySchema = z.object({
      name: z.string().optional(),
      price: z.number().optional(),
      duration: z.number().optional(),
      isActive: z.boolean().optional()
    })

    const { id } = paramsSchema.parse(request.params)
    const data = bodySchema.parse(request.body)
    const { barbershopId } = request as any

    const updated = await prisma.service.update({
      where: { id, barbershopId },
      data
    })

    return updated
  })

  // Remover serviço (ou desativar)
  app.delete('/:id', async (request, reply) => {
    const paramsSchema = z.object({ id: z.string().uuid() })
    const { id } = paramsSchema.parse(request.params)
    const { barbershopId } = request as any

    await prisma.service.delete({
      where: { id, barbershopId }
    })

    return reply.status(204).send()
  })
}
