import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'

export async function productRoutes(app: FastifyInstance) {
  // Middleware de proteção: Apenas ADMIN da barbearia
  app.addHook('preHandler', async (request, reply) => {
    const { userRole } = request as any
    if (userRole !== 'ADMIN' && userRole !== 'SUPERADMIN') {
      return reply.status(403).send({ error: 'Acesso restrito ao administrador' })
    }
  })

  // Listar todos os produtos para o Admin
  app.get('/', async (request) => {
    const { barbershopId } = request as any
    const querySchema = z.object({
      page: z.string().optional().transform(Number).default('1'),
      limit: z.string().optional().transform(Number).default('20')
    })
    const { page, limit } = querySchema.parse(request.query)
    const skip = (page - 1) * limit

    const [total, items] = await Promise.all([
      prisma.product.count({ where: { barbershopId } }),
      prisma.product.findMany({
        where: { barbershopId },
        take: limit,
        skip,
        orderBy: { createdAt: 'desc' }
      })
    ])

    return {
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      data: items
    }
  })

  // Criar novo produto
  app.post('/', async (request, reply) => {
    const createSchema = z.object({
      name: z.string().min(2),
      price: z.number().positive(),
      stock: z.number().int().min(0),
      description: z.string().optional(),
      imageUrl: z.string().optional()
    })

    const { name, price, stock, description, imageUrl } = createSchema.parse(request.body)
    const { barbershopId } = request as any

    const product = await prisma.product.create({
      data: {
        name,
        price,
        stock,
        description,
        imageUrl,
        barbershopId
      }
    })

    return reply.status(201).send(product)
  })

  // Editar produto
  app.patch('/:id', async (request, reply) => {
    const paramsSchema = z.object({ id: z.string().uuid() })
    const bodySchema = z.object({
      name: z.string().optional(),
      price: z.number().optional(),
      stock: z.number().int().optional(),
      description: z.string().optional(),
      imageUrl: z.string().optional(),
      isActive: z.boolean().optional()
    })

    const { id } = paramsSchema.parse(request.params)
    const data = bodySchema.parse(request.body)
    const { barbershopId } = request as any

    const updated = await prisma.product.update({
      where: { id, barbershopId },
      data
    })

    return updated
  })

  // Remover produto
  app.delete('/:id', async (request, reply) => {
    const paramsSchema = z.object({ id: z.string().uuid() })
    const { id } = paramsSchema.parse(request.params)
    const { barbershopId } = request as any

    await prisma.product.delete({
      where: { id, barbershopId }
    })

    return reply.status(204).send()
  })
}
