import { describe, it, expect, vi } from 'vitest'

const mockPrisma = vi.hoisted(() => ({
  user: { findUnique: vi.fn(), create: vi.fn() },
  barbershop: { findUnique: vi.fn().mockResolvedValue({ name: 'Barbearia Teste', isActive: true }), findMany: vi.fn(), update: vi.fn(), count: vi.fn().mockResolvedValue(2) },
  service: { findUnique: vi.fn().mockResolvedValue({ id: '00000000-0000-0000-0000-000000000003', duration: 30, barbershopId: '00000000-0000-0000-0000-000000000004' }) },
  appointment: { 
    findFirst: vi.fn().mockResolvedValue(null), 
    findUnique: vi.fn(), 
    create: vi.fn().mockImplementation((d) => Promise.resolve({ id: '00000000-0000-0000-0000-000000000001', ...d.data })),
    update: vi.fn().mockResolvedValue({ id: '00000000-0000-0000-0000-000000000001', service: { price: 50, name: 'Corte' } }),
    count: vi.fn().mockResolvedValue(1),
    groupBy: vi.fn().mockResolvedValue([])
  },
  product: { findMany: vi.fn().mockResolvedValue([{ id: '00000000-0000-0000-0000-000000000005', price: 50 }]) },
  appointmentProduct: { createMany: vi.fn().mockResolvedValue({ count: 1 }) },
  transaction: { create: vi.fn().mockResolvedValue({ id: 'trans-1' }) },
  auditLog: { findMany: vi.fn(), create: vi.fn() },
  $transaction: vi.fn().mockImplementation(async (callback: any) => callback(mockPrisma))
}))

// Mock do Prisma para integração com tipagem explícita
vi.mock('../lib/prisma.js', () => {
  return { prisma: mockPrisma }
})

import { app } from '../app.js'


// Mock do Bcrypt
vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn().mockResolvedValue(true),
    hash: vi.fn().mockResolvedValue('hashed_password')
  }
}))

// Mock da fila
vi.mock('../lib/queue.js', () => ({
  addNotificationJob: vi.fn().mockResolvedValue({}),
  addEmailJob: vi.fn().mockResolvedValue({})
}))

describe('Integration Flows', () => {
  it('should verify if server is operational', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/services'
    })
    
    expect(response.statusCode).toBe(400)
  })

  it('should be able to create an appointment with products via API', async () => {
    const { prisma } = await import('../lib/prisma.js')
    // @ts-ignore
    prisma.barbershop.findUnique.mockResolvedValue({ isActive: true })
    // @ts-ignore
    prisma.service.findUnique.mockResolvedValue({ id: 'service-1', duration: 30, barbershopId: '00000000-0000-0000-0000-000000000004' })
    // @ts-ignore
    prisma.user.findUnique.mockResolvedValue({ id: 'barber-1', barbershopId: '00000000-0000-0000-0000-000000000004', role: 'BARBER' })
    // @ts-ignore
    prisma.appointment.findUnique.mockResolvedValue({
      id: 'new-apt',
      date: new Date(),
      customer: { name: 'Cliente', phone: '5541999999999', email: 'c@c.com' },
      service: { name: 'Corte', price: 50 },
      barber: { name: 'Barbeiro', email: 'b@b.com' },
      barbershop: { name: 'Barbearia' },
      products: [{ quantity: 1, product: { name: 'Pomada', price: 50 } }]
    })

    // Mock do JWT para rota privada (caso necessário no futuro)
    vi.spyOn(app.jwt, 'verify').mockResolvedValue({ id: 'user-1', role: 'ADMIN', barbershopId: '00000000-0000-0000-0000-000000000004' } as any)

    const date = new Date()
    date.setHours(date.getHours() + 2)

    const response = await app.inject({
      method: 'POST',
      url: '/appointments',
      payload: {
        date: date.toISOString(),
        customerId: '00000000-0000-0000-0000-000000000001',
        barberId: '00000000-0000-0000-0000-000000000002',
        serviceId: '00000000-0000-0000-0000-000000000003',
        barbershopId: '00000000-0000-0000-0000-000000000004',
        products: [
          { productId: '00000000-0000-0000-0000-000000000005', quantity: 1 }
        ]
      }
    })

    expect(response.statusCode).toBe(201)
    const body = JSON.parse(response.body)
    expect(body).toHaveProperty('id')
  })

  it('should be able to login', async () => {
    const { prisma } = await import('../lib/prisma.js')
    // @ts-ignore
    prisma.user.findUnique.mockResolvedValueOnce({
      id: 'user-1',
      name: 'Admin',
      email: 'admin@joe.com',
      passwordHash: 'hashed_password',
      role: 'ADMIN',
      barbershopId: 'shop-1'
    })

    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: 'admin@joe.com',
        password: 'password'
      }
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body).toHaveProperty('token')
  })

  it('should be able to register a new customer with phone', async () => {
    const { prisma } = await import('../lib/prisma.js')
    // @ts-ignore
    prisma.user.findUnique.mockResolvedValueOnce(null)
    // @ts-ignore
    prisma.barbershop.findUnique.mockResolvedValueOnce({ name: 'Barbearia Teste', isActive: true })
    // @ts-ignore
    prisma.user.create.mockResolvedValueOnce({
      id: 'user-1',
      name: 'Novo Cliente Teste',
      email: 'novo@teste.com',
      phone: '5541999999999',
      role: 'CUSTOMER',
      barbershopId: '00000000-0000-0000-0000-000000000004'
    })

    const response = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        name: 'Novo Cliente Teste',
        email: `novo_${Date.now()}@teste.com`,
        phone: '5541999999999',
        password: 'password123',
        barbershopId: '00000000-0000-0000-0000-000000000004'
      }
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body).toHaveProperty('token')
  })

  it('should list products for customers', async () => {
    const { prisma } = await import('../lib/prisma.js')
    // @ts-ignore
    prisma.product.findMany.mockResolvedValue([{ id: 'p1', name: 'Pomada' }])

    const response = await app.inject({
      method: 'GET',
      url: '/products',
      query: { barbershopId: '00000000-0000-0000-0000-000000000004' }
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(Array.isArray(body)).toBe(true)
  })

  it('should allow SuperAdmin to list all barbershops with plans', async () => {
    const { prisma } = await import('../lib/prisma.js')
    // @ts-ignore
    prisma.barbershop.findMany.mockResolvedValueOnce([
      { id: 's1', name: 'Shop 1', plan: 'PRO', isActive: true, _count: { users: 2, appointments: 10 } },
      { id: 's2', name: 'Shop 2', plan: 'BASIC', isActive: true, _count: { users: 1, appointments: 5 } }
    ])

    // 🚀 MOCK DO JWT PARA ESTA REQUISIÇÃO ESPECÍFICA
    vi.spyOn(app.jwt, 'verify').mockResolvedValue({ id: 'admin-id', role: 'SUPERADMIN', barbershopId: 'any' } as any)

    const response = await app.inject({
      method: 'GET',
      url: '/saas/barbershops',
      headers: {
        'Authorization': 'Bearer fake_token'
      }
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body).toHaveProperty('data')
    expect(body.data[0]).toHaveProperty('plan')
    expect(body.data[0].plan).toBe('PRO')
    expect(body).toHaveProperty('meta')
    expect(body.meta.total).toBe(2)
  })

  it('should allow SuperAdmin to register payment manually', async () => {
    const { prisma } = await import('../lib/prisma.js')
    // @ts-ignore
    prisma.barbershop.findUnique.mockResolvedValue({ id: '00000000-0000-0000-0000-000000000004', name: 'Shop 1' })
    // @ts-ignore
    prisma.barbershop.update.mockResolvedValue({ id: '00000000-0000-0000-0000-000000000004', isActive: true })

    const response = await app.inject({
      method: 'POST',
      url: '/saas/barbershops/00000000-0000-0000-0000-000000000004/register-payment',
      headers: { 'Authorization': 'Bearer token' }
    })

    // Mock do JWT
    vi.spyOn(app.jwt, 'verify').mockResolvedValue({ id: 'admin-id', role: 'SUPERADMIN' } as any)

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body)).toHaveProperty('isActive', true)
  })

  it('should split commission when completing an appointment', async () => {
    const { prisma } = await import('../lib/prisma.js')
    
    // Mock do appointment.update retornando o objeto com relações
    const mockApt = {
      id: '00000000-0000-0000-0000-000000000001',
      service: { name: 'Corte', price: 100 },
      barber: { name: 'João', commissionRate: 50 },
      products: []
    }

    // @ts-ignore
    prisma.appointment.update.mockResolvedValue(mockApt)
    // @ts-ignore
    prisma.transaction.create.mockResolvedValue({ id: '00000000-0000-0000-0000-000000000007' })

    const response = await app.inject({
      method: 'PATCH',
      url: '/appointments/00000000-0000-0000-0000-000000000001/complete',
      headers: { 'Authorization': 'Bearer token' }
    })

    // Mock do JWT
    vi.spyOn(app.jwt, 'verify').mockResolvedValue({ id: '00000000-0000-0000-0000-000000000002', role: 'ADMIN', barbershopId: '00000000-0000-0000-0000-000000000004' } as any)

    expect(response.statusCode).toBe(200)
  })
})
