import { prisma } from './src/lib/prisma.js'

async function updateAll() {
  console.log('🚀 Injetando seu telefone em todos os usuários...')
  const result = await prisma.user.updateMany({
    data: { phone: '5541992522151' }
  })
  console.log(`✅ ${result.count} usuários atualizados com o número 5541992522151`)
}

updateAll().finally(() => prisma.$disconnect())
