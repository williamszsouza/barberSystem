import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'

export async function configRoutes(app: FastifyInstance) {
  // Middleware de proteção: Apenas ADMIN
  app.addHook('preHandler', async (request, reply) => {
    const { userRole } = request as any
    if (userRole !== 'ADMIN' && userRole !== 'SUPERADMIN') {
      return reply.status(403).send({ error: 'Acesso negado' })
    }
  })

  // 1. Listar Horários de Funcionamento
  app.get('/business-hours', async (request) => {
    const { barbershopId } = request as any
    return await prisma.businessHours.findMany({
      where: { barbershopId },
      orderBy: { dayOfWeek: 'asc' }
    })
  })

  // 2. Atualizar Horário de Funcionamento
  app.put('/business-hours', async (request, reply) => {
    const bodySchema = z.array(z.object({
      dayOfWeek: z.number().int().min(0).max(6),
      openTime: z.string(),
      closeTime: z.string(),
      isClosed: z.boolean()
    }))

    const data = bodySchema.parse(request.body)
    const { barbershopId } = request as any

    for (const hour of data) {
      await prisma.businessHours.upsert({
        where: { barbershopId_dayOfWeek: { barbershopId, dayOfWeek: hour.dayOfWeek } },
        update: { 
          openTime: hour.openTime, 
          closeTime: hour.closeTime, 
          isClosed: hour.isClosed 
        },
        create: { 
          barbershopId, 
          dayOfWeek: hour.dayOfWeek, 
          openTime: hour.openTime, 
          closeTime: hour.closeTime, 
          isClosed: hour.isClosed 
        }
      })
    }

    return { success: true }
  })

  // 3. Gerenciar Bloqueios (TimeOff)
  app.get('/time-off', async (request) => {
    const { barbershopId } = request as any
    return await prisma.timeOff.findMany({
      where: { barber: { barbershopId } },
      include: { barber: { select: { name: true } } },
      orderBy: { startTime: 'desc' }
    })
  })

  app.post('/time-off', async (request, reply) => {
    const bodySchema = z.object({
      barberId: z.string().uuid(),
      startTime: z.string().datetime(),
      endTime: z.string().datetime(),
      reason: z.string().optional()
    })

    const { barberId, startTime, endTime, reason } = bodySchema.parse(request.body)
    
    const timeOff = await prisma.timeOff.create({
      data: {
        barberId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        reason
      }
    })

    return reply.status(201).send(timeOff)
  })

  app.delete('/time-off/:id', async (request, reply) => {
    const paramsSchema = z.object({ id: z.string().uuid() })
    const { id } = paramsSchema.parse(request.params)

    await prisma.timeOff.delete({ where: { id } })
    return reply.status(204).send()
  })

  // 4. Configurações Gerais da Unidade
  app.patch('/settings', async (request) => {
    const bodySchema = z.object({
      cancelTimeLimit: z.number().int().min(0)
    })
    const { cancelTimeLimit } = bodySchema.parse(request.body)
    const { barbershopId } = request as any

    return await prisma.barbershop.update({
      where: { id: barbershopId },
      data: { cancelTimeLimit }
    })
  })
}
