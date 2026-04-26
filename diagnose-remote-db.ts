import { prisma } from './src/lib/prisma.js'

async function diagnose() {
  console.log('🧐 INVESTIGANDO BANCO REMOTO...')
  
  try {
    // 1. Verifica se a tabela de migrations existe e o que tem nela
    const migrations: any[] = await prisma.$queryRawUnsafe(`
      SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
    `)
    console.log('📂 Tabelas encontradas:', migrations.map(m => m.table_name))

    const migrationHistory: any[] = await prisma.$queryRawUnsafe(`
      SELECT * FROM "_prisma_migrations" LIMIT 10;
    `).catch(() => [])
    
    if (migrationHistory.length > 0) {
      console.log('🚩 Histórico de Migrations AINDA EXISTE!')
      migrationHistory.forEach(m => console.log(`- ${m.migration_name}: ${m.applied_steps_count} steps (Status: ${m.logs ? 'FAILED' : 'OK'})`))
    } else {
      console.log('✅ Histórico de Migrations está VAZIO ou NÃO EXISTE.')
    }

  } catch (error: any) {
    console.error('❌ Erro no diagnóstico:', error.message)
  }
}

diagnose().finally(() => prisma.$disconnect())
