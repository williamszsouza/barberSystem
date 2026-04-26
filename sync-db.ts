import { prisma } from './src/lib/prisma.js'

async function nukeAndSync() {
  console.log('☢️ INICIANDO OPERAÇÃO NUKE NO BANCO DO RENDER...')
  
  try {
    // 1. Deleta a tabela de histórico de migrations (A raiz de todo o mal)
    console.log('🗑️ Removendo histórico de migrations...')
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "_prisma_migrations" CASCADE;`)
    
    // 2. Limpa todas as tabelas para garantir que as migrations possam rodar do zero
    // Como estamos em homologação, isso é o mais seguro para estabilizar.
    console.log('🧹 Limpando tabelas existentes...')
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "transactions" CASCADE;`)
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "appointment_products" CASCADE;`)
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "appointments" CASCADE;`)
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "products" CASCADE;`)
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "services" CASCADE;`)
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "business_hours" CASCADE;`)
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "campaigns" CASCADE;`)
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "time_offs" CASCADE;`)
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "audit_logs" CASCADE;`)
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "users" CASCADE;`)
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "barbershops" CASCADE;`)

    console.log('✅ Banco de dados resetado e limpo com sucesso!')
    console.log('🚀 O Render agora verá um banco 100% novo e as migrations passarão de primeira.')
  } catch (error: any) {
    console.error('❌ Erro durante a operação:', error.message)
  }
}

nukeAndSync().finally(() => prisma.$disconnect())
