import { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma.js'

export async function generalRoutes(app: FastifyInstance) {
  // Listar Serviços da Barbearia
  app.get('/services', async (request, reply) => {
    const barbershopId = (request as any).barbershopId
    if (!barbershopId) return reply.status(400).send({ error: 'Tenant ID missing' })

    const services = await prisma.service.findMany({
      where: { barbershopId, isActive: true }
    })
    return services
  })

  // Listar Barbeiros
  app.get('/barbers', async (request, reply) => {
    const barbershopId = (request as any).barbershopId
    const barbers = await prisma.user.findMany({
      where: { barbershopId, role: 'BARBER' },
      select: { id: true, name: true }
    })
    return barbers
  })
}