import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { AppointmentService } from '../services/appointment-service.js'
import { addNotificationJob, addEmailJob } from '../lib/queue.js'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const appointmentService = new AppointmentService()

export async function appointmentRoutes(app: FastifyInstance) {
  // 1. Listar Agendamentos (Privada)
  app.get('/', async (request, reply) => {
    const { barbershopId, userId, userRole } = request as any
    const querySchema = z.object({
      page: z.string().optional().transform(Number).default('1'),
      limit: z.string().optional().transform(Number).default('20')
    })
    const { page, limit } = querySchema.parse(request.query)
    const skip = (page - 1) * limit

    const where: any = { barbershopId }

    if (userRole === 'BARBER') {
      where.barberId = userId
    } else if (userRole === 'CUSTOMER') {
      where.customerId = userId 
    }

    const [total, items] = await Promise.all([
      prisma.appointment.count({ where }),
      prisma.appointment.findMany({
        where,
        take: limit,
        skip,
        include: {
          customer: { select: { name: true } },
          service: { select: { name: true, price: true } },
          barber: { select: { name: true } },
          products: {
            include: { product: { select: { name: true } } }
          }
        },
        orderBy: { date: 'asc' }
      })
    ])

    return {
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      data: items
    }
  })


  // 2. Listar Agendamentos de Convidado (Pública, requer barbershopId)
  app.get('/guest', async (request) => {
    const querySchema = z.object({
      ids: z.string().transform(val => val.split(',')),
      barbershopId: z.string().uuid() // 🚀 Blindagem de Tenant
    })
    const { ids, barbershopId } = querySchema.parse(request.query)

    return await prisma.appointment.findMany({
      where: { 
        id: { in: ids },
        barbershopId // 🛡️ Apenas agendamentos desta barbearia
      },
      include: {
        customer: { select: { name: true } },
        service: { select: { name: true, price: true } },
        barber: { select: { name: true } }
      },
      orderBy: { date: 'desc' }
    })
  })

  // 3. Listar Horários Disponíveis (Pública)
  app.get('/available-times', async (request) => {
    const querySchema = z.object({
      barberId: z.string().uuid(),
      date: z.string()
    })
    const { barberId, date } = querySchema.parse(request.query)
    const { barbershopId } = request as any

    return await appointmentService.getAvailableTimes(
      barbershopId,
      barberId,
      new Date(date)
    )
  })

  // 4. Criar Agendamento (Pública)
  app.post('/', async (request, reply) => {
    const createSchema = z.object({
      date: z.string().datetime(),
      customerId: z.string().uuid(),
      barberId: z.string().uuid(),
      serviceId: z.string().uuid(),
      barbershopId: z.string().uuid().optional(),
      products: z.array(z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().min(1)
      })).optional()
    })

    const { date, customerId, barberId, serviceId, barbershopId: bodyBarbershopId, products } = createSchema.parse(request.body)
    
    // Tenta pegar do corpo, se não tiver, tenta do header (injetado pelo interceptor) ou request
    const barbershopId = bodyBarbershopId || (request as any).barbershopId || request.headers['x-barbershop-id']

    if (!barbershopId) {
      return reply.status(400).send({ error: 'Barbershop ID is required' })
    }

    try {
      const appointment = await appointmentService.create({
        date: new Date(date),
        customerId,
        barberId,
        serviceId,
        barbershopId,
        products // Passa os produtos para o service
      })

      const fullApt = await prisma.appointment.findUnique({
        where: { id: appointment.id },
        include: {
          customer: { select: { name: true, phone: true, email: true } },
          service: { select: { name: true, price: true } },
          barber: { select: { name: true, email: true } },
          barbershop: { select: { name: true } },
          products: {
            include: { product: { select: { name: true, price: true } } }
          }
        }
      })

      if (fullApt) {
        const timeStr = format(new Date(date), "HH:mm'h'")
        const dateStr = format(new Date(date), "dd/MM (EEEE)", { locale: ptBR })
        
        let totalValue = Number(fullApt.service.price)
        let productsList = ''
        
        if (fullApt.products.length > 0) {
          productsList = fullApt.products.map(p => {
            const subtotal = Number(p.product.price) * p.quantity
            totalValue += subtotal
            return `- ${p.quantity}x ${p.product.name} (R$ ${subtotal.toFixed(2)})`
          }).join('\n')
        }

        const totalFormatted = totalValue.toFixed(2)

        // 🟢 1. Enfileirar WhatsApp (Se tiver telefone)
        if (fullApt.customer.phone) {
          console.log(`[Queue] Tentando enfileirar WhatsApp para ${fullApt.customer.phone}...`)
          let waMessage = `Olá, ${fullApt.customer.name}! Seu horário para *${fullApt.service.name}* na *${fullApt.barbershop.name}* foi confirmado para *${dateStr}* às *${timeStr}*. ✂️`

          if (productsList) {
            waMessage += `\n\n🎁 *Produtos reservados:*\n${productsList}\n\nEles estarão te esperando na recepção!\n*Valor Total:* R$ ${totalFormatted}`
          }

          await addNotificationJob({
            appointmentId: appointment.id,
            phone: fullApt.customer.phone,
            message: waMessage,
            sendAt: new Date()
          })
        }

        // 📧 2. Enfileirar E-mail para o Cliente
        await addEmailJob({
          type: 'APPOINTMENT_CUSTOMER',
          payload: {
            to: fullApt.customer.email,
            customerName: fullApt.customer.name,
            barbershopName: fullApt.barbershop.name,
            date: dateStr,
            time: format(new Date(date), "HH:mm"),
            serviceName: fullApt.service.name,
            barberName: fullApt.barber.name,
            productsText: productsList,
            totalValue: totalFormatted
          }
        })

        // 📧 3. Enfileirar E-mail para o Barbeiro (Dono)
        await addEmailJob({
          type: 'APPOINTMENT_BARBER',
          payload: {
            to: 'ywillsz16@gmail.com', // 🚀 FIXADO PARA SEU E-MAIL DE TESTE
            barberName: fullApt.barber.name,
            customerName: fullApt.customer.name,
            date: dateStr,
            time: format(new Date(date), "HH:mm"),
            serviceName: fullApt.service.name,
            productsText: productsList,
            totalValue: totalFormatted
          }
        })
        
        console.log(`[Queue] Notificações (WhatsApp e E-mail) enviadas para fila.`)
      }

      return reply.status(201).send(appointment)
    } catch (error: any) {
      console.error('❌ ERRO NO AGENDAMENTO:', error.message)
      return reply.status(400).send({ error: error.message })
    }
  })

  // 5. Concluir Agendamento (Privada)
  app.patch('/:id/complete', async (request, reply) => {
    const paramsSchema = z.object({ id: z.string().uuid() })
    const { id } = paramsSchema.parse(request.params)
    const { barbershopId } = request as any

    try {
      return await appointmentService.complete(id, barbershopId)
    } catch (error: any) {
      console.error('❌ ERRO NO AGENDAMENTO:', error.message)
      return reply.status(400).send({ error: error.message })
    }
  })

  // 7. Cancelar Agendamento (Privada/Pública dependendo do contexto)
  app.patch('/:id/cancel', async (request, reply) => {
    const paramsSchema = z.object({ id: z.string().uuid() })
    const { id } = paramsSchema.parse(request.params)
    const { barbershopId, userId, userRole } = request as any

    try {
      return await appointmentService.cancel(id, barbershopId, userId, userRole)
    } catch (error: any) {
      console.error('❌ ERRO AO CANCELAR:', error.message)
      return reply.status(400).send({ error: error.message })
    }
  })

  // 6. Relatórios (Privada)
  app.get('/reports', async (request) => {
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
