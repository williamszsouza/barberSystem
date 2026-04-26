import { prisma } from './src/lib/prisma.js'

async function sync() {
  console.log('🔄 INICIANDO SINCRONIZAÇÃO AGRESSIVA (RENDER)...')
  
  try {
    // 1. Garante commissionRate
    await prisma.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "commissionRate" DECIMAL(5,2) DEFAULT 50.00;`)
    console.log('✅ Coluna users.commissionRate garantida.')

    // 2. Garante campos da Barbershop
    await prisma.$executeRawUnsafe(`ALTER TABLE "barbershops" ADD COLUMN IF NOT EXISTS "slug" TEXT;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE "barbershops" ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE "barbershops" ADD COLUMN IF NOT EXISTS "stripeSubscriptionId" TEXT;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE "barbershops" ADD COLUMN IF NOT EXISTS "subscriptionStatus" TEXT;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE "barbershops" ADD COLUMN IF NOT EXISTS "nextBillingDate" TIMESTAMP(3);`)
    console.log('✅ Colunas da tabela barbershops garantidas.')

    // 3. Verifica se as colunas estão lá de verdade
    const checkColumns = await prisma.$queryRawUnsafe(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'commissionRate';
    `)
    console.log('📊 Verificação física:', checkColumns)

    console.log('🚀 BANCO SINCRONIZADO E VALIDADO!')
  } catch (error: any) {
    console.error('❌ Erro crítico:', error.message)
  }
}

sync().finally(() => prisma.$disconnect())
