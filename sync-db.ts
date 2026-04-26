import { execSync } from 'child_process'
import { prisma } from './src/lib/prisma.js'

async function sync() {
  const dbUrl = "postgresql://user:password@localhost:5432/evolution?schema=public"
  process.env.DATABASE_URL = dbUrl

  console.log('📦 Rodando Migrations...')
  execSync('npx prisma migrate deploy', { stdio: 'inherit', env: process.env })

  console.log('🌱 Rodando Seed...')
  execSync('npx tsx prisma/seed.ts', { stdio: 'inherit', env: process.env })

  console.log('🔍 Buscando o ID da Barbearia criada...')
  const barbershop = await prisma.barbershop.findFirst()
  
  if (barbershop) {
    console.log(`✅ ID ENCONTRADO: ${barbershop.id}`)
    // Esse console.log é para eu capturar o ID e atualizar seu frontend
  }
}

sync().catch(console.error)
