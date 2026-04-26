import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { AppointmentService } from '../services/appointment-service.js'

const appointmentService = new AppointmentService()

export async function generalRoutes(app: FastifyInstance) {
  app.get('/services', async (request, reply) => {
    const barbershopId = (request as any).barbershopId
    if (!barbershopId) return reply.status(400).send({ error: 'Tenant ID missing' })

    const services = await prisma.service.findMany({
      where: { barbershopId, isActive: true }
    })
    return services
  })

  // Listar Produtos (Público)
  app.get('/products', async (request, reply) => {
    const barbershopId = (request as any).barbershopId
    if (!barbershopId) return reply.status(400).send({ error: 'Tenant ID missing' })

    const products = await prisma.product.findMany({
      where: { barbershopId, isActive: true, stock: { gt: 0 } }
    })
    return products
  })

  // Buscar Barbearia por Slug (Resolução de Subdomínio)
  app.get('/barbershops/by-slug/:slug', async (request, reply) => {
    const paramsSchema = z.object({ slug: z.string() })
    const { slug } = paramsSchema.parse(request.params)

    const barbershop = await prisma.barbershop.findUnique({
      where: { slug, isActive: true },
      select: { id: true, name: true, slug: true, plan: true }
    })

    if (!barbershop) {
      return reply.status(404).send({ error: 'Barbearia não encontrada' })
    }

    return barbershop
  })

  // Listar Barbeiros (Com filtro de disponibilidade opcional)
  app.get('/barbers', async (request, reply) => {
    const barbershopId = (request as any).barbershopId
    const { date } = request.query as { date?: string }

    const barbers = await prisma.user.findMany({
      where: { barbershopId, role: 'BARBER' },
      select: { id: true, name: true }
    })

    // Se uma data for enviada, verificamos quem tem horário
    if (date) {
      const barbersWithAvailability = await Promise.all(
        barbers.map(async (barber) => {
          const hasAvailability = await appointmentService.checkBarberAvailability(
            barbershopId,
            barber.id,
            new Date(date)
          )
          return { ...barber, hasAvailability }
        })
      )
      return barbersWithAvailability
    }

    return barbers.map(b => ({ ...b, hasAvailability: true }))
  })
}
