import { PrismaClient } from '@prisma/client'

// Padrão Singleton para evitar exaustão de conexões no PostgreSQL
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'dev' ? ['query', 'error', 'warn'] : ['error'],
})

export { prisma }
