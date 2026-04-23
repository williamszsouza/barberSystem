import { describe, it, expect, vi, beforeEach } from 'vitest'
import { app } from '../app.js'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma.js'

const MOCK_SHOP_ID = '550e8400-e29b-41d4-a716-446655440000'
const MOCK_USER_ID = '550e8400-e29b-41d4-a716-446655440001'
const MOCK_CUSTOMER_ID = '550e8400-e29b-41d4-a716-446655440002'
const MOCK_BARBER_ID = '550e8400-e29b-41d4-a716-446655440003'
const MOCK_SERVICE_ID = '550e8400-e29b-41d4-a716-446655440004'

// Mock do Prisma
vi.mock('@prisma/client', () => {
  const mPrisma = {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    barbershop: {
      findUnique: vi.fn().mockResolvedValue({ id: '550e8400-e29b-41d4-a716-446655440000', isActive: true }),
    },
    service: {
      findUnique: vi.fn().mockResolvedValue({ id: '550e8400-e29b-41d4-a716-446655440004', name: 'Corte', price: 50, duration: 30 }),
    },
    appointment: {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: '550e8400-e29b-41d4-a716-446655440005', ...data })),
      update: vi.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: '550e8400-e29b-41d4-a716-446655440005', status: 'COMPLETED', service: { name: 'Corte', price: 50 } })),
      findMany: vi.fn().mockResolvedValue([]),
      aggregate: vi.fn().mockResolvedValue({ _sum: { amount: 0 } }),
    },
    transaction: {
      create: vi.fn(),
      aggregate: vi.fn().mockResolvedValue({ _sum: { amount: 50 } }),
    },
    $transaction: vi.fn(async (callback) => await callback(mPrisma)),
  }
  return {
    PrismaClient: vi.fn(() => mPrisma),
  }
})

// Mock do Queue
vi.mock('../lib/queue.js', () => ({
  addNotificationJob: vi.fn().mockResolvedValue(true)
}))

describe('Integration Tests', () => {
  const mockedPrisma = prisma as any

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset defaults for mocks if needed
    mockedPrisma.barbershop.findUnique.mockResolvedValue({ id: MOCK_SHOP_ID, isActive: true })
  })

  it('should be able to login and get a token', async () => {
    const passwordHash = await bcrypt.hash('123456', 8)
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: MOCK_USER_ID,
      email: 'test@example.com',
      passwordHash,
      role: 'ADMIN',
      barbershopId: MOCK_SHOP_ID
    })

    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: 'test@example.com',
        password: '123456'
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toHaveProperty('token')
  })

  it('should complete a full appointment flow', async () => {
    // 1. Setup Mock for Login
    const passwordHash = await bcrypt.hash('123456', 8)
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: MOCK_USER_ID,
      email: 'test@example.com',
      passwordHash,
      role: 'ADMIN',
      barbershopId: MOCK_SHOP_ID
    })

    // 2. Perform Login to get real JWT
    const loginRes = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'test@example.com', password: '123456' }
    })
    
    expect(loginRes.statusCode).toBe(200)
    const token = loginRes.json().token
    expect(token).toBeDefined()
    // console.log('DEBUG: Generated Token:', token)

    const date = new Date()
    date.setHours(date.getHours() + 2)
    
    // 3. Create Appointment
    const createRes = await app.inject({
      method: 'POST',
      url: '/appointments',
      headers: { 
        'Authorization': `Bearer ${token}`
      },
      payload: {
        date: date.toISOString(),
        customerId: MOCK_CUSTOMER_ID,
        barberId: MOCK_BARBER_ID,
        serviceId: MOCK_SERVICE_ID
      }
    })

    if (createRes.statusCode !== 201) {
      console.error('Create Appointment Failed:', createRes.json())
    }
    expect(createRes.statusCode).toBe(201)
    const appointmentId = createRes.json().id

    // 4. Complete Appointment
    const completeRes = await app.inject({
      method: 'PATCH',
      url: `/appointments/${appointmentId}/complete`,
      headers: { 
        authorization: `Bearer ${token}`
      }
    })

    expect(completeRes.statusCode).toBe(200)

    // 5. Check Earnings
    const start = new Date()
    start.setHours(0,0,0,0)
    const end = new Date()
    end.setHours(23,59,59,999)

    const earningsRes = await app.inject({
      method: 'GET',
      url: '/appointments/reports',
      headers: { 
        authorization: `Bearer ${token}`
      },
      query: {
        startDate: start.toISOString(),
        endDate: end.toISOString()
      }
    })

    expect(earningsRes.statusCode).toBe(200)
    expect(earningsRes.json()).toHaveProperty('totalRevenue')
  })
})

