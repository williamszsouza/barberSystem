import { prisma } from './src/lib/prisma.js'

async function get() {
  const b = await prisma.barbershop.findFirst({ where: { name: "Barbearia Joe's Premium" } })
  const c = await prisma.user.findFirst({ where: { email: 'cliente@homolog.com' } })
  console.log('ID_TENANT:', b?.id)
  console.log('ID_CLIENTE:', c?.id)
}
get().finally(() => prisma.$disconnect())
