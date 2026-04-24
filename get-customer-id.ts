import { prisma } from './src/lib/prisma.js'

async function get() {
  const c = await prisma.user.findFirst({ where: { email: 'cliente@homolog.com' } })
  console.log('ID_CLIENTE:', c?.id)
}
get().finally(() => prisma.$disconnect())
