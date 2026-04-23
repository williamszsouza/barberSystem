import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AppointmentService } from './appointment-service'
import { PrismaClient } from '@prisma/client'
import { addMinutes } from 'date-fns'

// Mock do Prisma
vi.mock('@prisma/client', () => {
  const mPrisma = {
    service: {
      findUnique: vi.fn(),
    },
    appointment: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      aggregate: vi.fn(),
    },
    transaction: {
      create: vi.fn(),
      aggregate: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(mPrisma)),
  }
  return {
    PrismaClient: vi.fn(() => mPrisma),
  }
})

describe('AppointmentService', () => {
  let service: AppointmentService
  let prisma: any

  beforeEach(() => {
    vi.clearAllMocks()
    service = new AppointmentService()
    prisma = new PrismaClient()
  })

  it('should be able to create a new appointment', async () => {
    const date = new Date()
    date.setHours(date.getHours() + 2)

    prisma.service.findUnique.mockResolvedValue({ id: 'service-1', duration: 30 })
    prisma.appointment.findFirst.mockResolvedValue(null)
    prisma.appointment.create.mockImplementation(({ data }: any) => Promise.resolve({ id: 'new-apt', ...data }))

    const appointment = await service.create({
      date,
      barberId: 'barber-1',
      customerId: 'customer-1',
      serviceId: 'service-1',
      barbershopId: 'tenant-1'
    })

    expect(appointment).toHaveProperty('id')
    expect(appointment.barberId).toBe('barber-1')
    expect(prisma.appointment.create).toHaveBeenCalled()
  })

  it('should not be able to create an appointment in the past', async () => {
    const pastDate = new Date()
    pastDate.setHours(pastDate.getHours() - 1)

    await expect(service.create({
      date: pastDate,
      barberId: 'barber-1',
      customerId: 'customer-1',
      serviceId: 'service-1',
      barbershopId: 'tenant-1'
    })).rejects.toThrow('Não é possível agendar em uma data passada.')
  })

  it('should not be able to create an appointment if there is a conflict', async () => {
    const date = new Date()
    date.setHours(date.getHours() + 2)
    
    // Simula que existe um serviço de 30 min
    prisma.service.findUnique.mockResolvedValue({ id: 'service-1', duration: 30 })
    
    // Simula um conflito: já existe um agendamento no mesmo horário
    prisma.appointment.findFirst.mockResolvedValue({
      id: 'existing-apt',
      date: date,
      service: { duration: 30 }
    })

    await expect(service.create({
      date,
      barberId: 'barber-1',
      customerId: 'customer-1',
      serviceId: 'service-1',
      barbershopId: 'tenant-1'
    })).rejects.toThrow('O barbeiro já possui um agendamento neste horário.')
  })
})
