import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { AppointmentService } from '../services/appointment-service.js'
import { addNotificationJob } from '../lib/queue.js'

const appointmentService = new AppointmentService()

export async function appointmentRoutes(app: FastifyInstance) {
  // Listar Agendamentos
  app.get('/', async (request, reply) => {
    const { barbershopId, userId, userRole } = request as any
    const where: any = { barbershopId }

    if (userRole !== 'ADMIN' && userRole !== 'SUPERADMIN') {
      where.barberId = userId
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        customer: { select: { name: true } },
        service: { select: { name: true, price: true } },
        barber: { select: { name: true } }
      },
      orderBy: { date: 'asc' }
    })
    return appointments
  })

  // Listar Agendamentos de Convidado
  app.get('/guest', async (request, reply) => {
    const querySchema = z.object({
      ids: z.string().transform(val => val.split(','))
    })
    const { ids } = querySchema.parse(request.query)

    const appointments = await prisma.appointment.findMany({
      where: { id: { in: ids } },
      include: {
        customer: { select: { name: true } },
        service: { select: { name: true, price: true } },
        barber: { select: { name: true } }
      },
      orderBy: { date: 'desc' }
    })
    return appointments
  })

  // Listar Horários Disponíveis
  app.get('/available-times', async (request, reply) => {
    const querySchema = z.object({
      barberId: z.string().uuid(),
      date: z.string()
    })
    const { barberId, date } = querySchema.parse(request.query)
    const barbershopId = (request as any).barbershopId || request.headers['x-barbershop-id']

    return await appointmentService.getAvailableTimes(
      barbershopId,
      barberId,
      new Date(date)
    )
  })

  // Criar Agendamento
  app.post('/', async (request, reply) => {
    const createSchema = z.object({
      date: z.string().datetime(),
      customerId: z.string().uuid(),
      barberId: z.string().uuid(),
      serviceId: z.string().uuid()
    })

    const { date, customerId, barberId, serviceId } = createSchema.parse(request.body)
    const { barbershopId } = request as any

    try {
      // 1. Criar no Banco (Prioridade Máxima)
      const appointment = await appointmentService.create({
        date: new Date(date),
        customerId,
        barberId,
        serviceId,
        barbershopId
      })

      // 2. Notificação (Em background, sem travar a resposta)
      addNotificationJob({
        appointmentId: appointment.id,
        phone: '5511999999999',
        message: `Agendamento confirmado para as ${new Date(date).toLocaleTimeString()}`,
        sendAt: new Date(new Date(date).getTime() - 60 * 60 * 1000)
      }).catch(err => {
        app.log.error('⚠️ Falha ao adicionar notificação na fila:', err.message)
      })

      return reply.status(201).send(appointment)
    } catch (error: any) {
      return reply.status(400).send({ error: error.message })
    }
  })

  // Concluir Agendamento
  app.patch('/:id/complete', async (request, reply) => {
    const paramsSchema = z.object({ id: z.string().uuid() })
    const { id } = paramsSchema.parse(request.params)
    const { barbershopId } = request as any

    try {
      return await appointmentService.complete(id, barbershopId)
    } catch (error: any) {
      return reply.status(400).send({ error: error.message })
    }
  })

  // Relatórios
  app.get('/reports', async (request, reply) => {
    const querySchema = z.object({
      startDate: z.string().datetime(),
      endDate: z.string().datetime()
    })
    const { startDate, endDate } = querySchema.parse(request.query)
    const { barbershopId } = request as any

    return await appointmentService.getDetailedReports(
      barbershopId, 
      new Date(startDate), 
      new Date(endDate)
    )
  })
}
