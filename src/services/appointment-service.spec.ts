import { describe, it, expect, vi } from 'vitest'
import { AppointmentService } from './appointment-service.js'

// Mock do Prisma com tipagem explícita
vi.mock('../lib/prisma.js', () => {
  const mPrisma: any = {
    service: {
      findUnique: vi.fn().mockResolvedValue({ id: 'service-1', duration: 30, barbershopId: 'tenant-1' })
    },
    user: {
      findUnique: vi.fn().mockResolvedValue({ id: 'barber-1', barbershopId: 'tenant-1', role: 'BARBER' })
    },
    appointment: {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockImplementation((data) => Promise.resolve({ id: 'new-apt', ...data.data }))
    },
    $transaction: vi.fn().mockImplementation(async (callback: (tx: any) => Promise<any>) => {
      const tx: any = {
        appointment: {
          findFirst: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockImplementation((data) => Promise.resolve({ id: 'new-apt', ...data.data }))
        },
        product: {
          findMany: vi.fn().mockResolvedValue([
            { id: 'prod-1', name: 'Pomada', price: 45.00 }
          ])
        },
        appointmentProduct: {
          createMany: vi.fn().mockResolvedValue({ count: 1 })
        }
      }
      return callback(tx)
    })
  }
  return { prisma: mPrisma }
})

describe('AppointmentService', () => {
  it('should be able to create a new appointment', async () => {
    const service = new AppointmentService()
    const date = new Date()
    date.setHours(date.getHours() + 2)

    const appointment = await service.create({
      date,
      barberId: 'barber-1',
      customerId: 'customer-1',
      serviceId: 'service-1',
      barbershopId: 'tenant-1'
    })

    expect(appointment).toHaveProperty('id')
  })

  it('should be able to create an appointment with products', async () => {
    const service = new AppointmentService()
    const date = new Date()
    date.setHours(date.getHours() + 2)

    const appointment = await service.create({
      date,
      barberId: 'barber-1',
      customerId: 'customer-1',
      serviceId: 'service-1',
      barbershopId: 'tenant-1',
      products: [
        { productId: 'prod-1', quantity: 1 }
      ]
    })

    expect(appointment).toHaveProperty('id')
  })

  it('should not be able to create an appointment in the past', async () => {
    const service = new AppointmentService()
    const pastDate = new Date()
    pastDate.setHours(pastDate.getHours() - 1)

    await expect(service.create({
      date: pastDate,
      barberId: 'barber-1',
      customerId: 'customer-1',
      serviceId: 'service-1',
      barbershopId: 'tenant-1'
    })).rejects.toThrow()
  })
})
