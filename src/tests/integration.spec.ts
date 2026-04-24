import { describe, it, expect, vi } from 'vitest'
import { app } from '../app.js'

// Mock do Prisma para integração com tipagem explícita
vi.mock('../lib/prisma.js', () => {
  const mPrisma: any = {
    user: {
      findUnique: vi.fn().mockResolvedValue({
        id: 'user-1',
        name: 'Admin',
        email: 'admin@joe.com',
        passwordHash: '$2b$08$hashedpassword',
        role: 'ADMIN',
        barbershopId: 'shop-1'
      })
    },
    barbershop: {
      findUnique: vi.fn().mockResolvedValue({ isActive: true })
    },
    $transaction: vi.fn().mockImplementation(async (callback: (tx: any) => Promise<any>) => {
      const tx: any = {
        appointment: {
          findFirst: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockImplementation((data) => Promise.resolve({ id: 'new-apt', ...data.data })),
          update: vi.fn().mockResolvedValue({ id: 'apt-1', service: { price: 50, name: 'Corte' } })
        },
        transaction: {
          create: vi.fn().mockResolvedValue({ id: 'trans-1' })
        }
      }
      return callback(tx)
    })
  }
  return { prisma: mPrisma }
})

describe('Integration Flows', () => {
  it('should verify if server is operational', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/services'
    })
    
    // Como não passamos o ID da barbearia, ele deve dar 400
    expect(response.statusCode).toBe(400)
  })
})
