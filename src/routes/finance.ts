import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { startOfDay, endOfDay } from 'date-fns'

export async function financeRoutes(app: FastifyInstance) {
  app.get('/transactions', async (request, reply) => {
    const querySchema = z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      barberId: z.string().uuid().optional(),
      search: z.string().optional(),
      page: z.string().transform(Number).default('1'),
      limit: z.string().transform(Number).default('10')
    })

    const { startDate, endDate, barberId, search, page, limit } = querySchema.parse(request.query)
    const barbershopId = (request as any).barbershopId

    const skip = (page - 1) * limit

    const dateFilter = startDate && endDate ? {
      date: {
        gte: startOfDay(new Date(startDate)),
        lte: endOfDay(new Date(endDate))
      }
    } : {}

    const where: any = {
      barbershopId,
      ...dateFilter,
      ...(barberId || search ? {
        appointment: {
          ...(barberId ? { barberId } : {}),
          ...(search ? {
            customer: {
              name: { contains: search, mode: 'insensitive' }
            }
          } : {})
        }
      } : {})
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          appointment: {
            include: {
              customer: { select: { name: true } },
              barber: { select: { name: true } },
              service: { select: { name: true } }
            }
          }
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit
      }),
      prisma.transaction.count({ where })
    ])

    return {
      transactions,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit)
      }
    }
  })
}