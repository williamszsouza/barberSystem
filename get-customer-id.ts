import { prisma } from './src/lib/prisma.js'

async function getID() {
  const shop = await prisma.barbershop.findUnique({
    where: { slug: 'barber-homolog' }
  })
  
  if (shop) {
    console.log(`🆔 ID REAL: ${shop.id}`)
  } else {
    console.log('❌ Barbearia não encontrada no banco do Render.')
  }
}

getID().finally(() => prisma.$disconnect())
