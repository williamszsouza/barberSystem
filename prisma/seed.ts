import { prisma } from '../src/lib/prisma.js'
import bcrypt from 'bcryptjs'

async function main() {
  console.log('🚀 INICIANDO PREPARAÇÃO V3 - MULTI-TENANT POR SUBDOMÍNIO')

  const defaultPassword = await bcrypt.hash('123456', 8)

  // 1. LIMPEZA TOTAL
  await prisma.auditLog.deleteMany()
  await prisma.transaction.deleteMany()
  await prisma.appointmentProduct.deleteMany()
  await prisma.appointment.deleteMany()
  await prisma.product.deleteMany()
  await prisma.service.deleteMany()
  await prisma.businessHours.deleteMany()
  await prisma.campaign.deleteMany()
  await prisma.timeOff.deleteMany()
  await prisma.user.deleteMany()
  await prisma.barbershop.deleteMany()

  // 2. CRIAR SUPERADMIN
  const superPassword = await bcrypt.hash('master2024', 8)
  const hq = await prisma.barbershop.create({
    data: {
      name: "BarberSystem HQ (SaaS)",
      slug: "admin", // Slug reservado
      plan: "ENTERPRISE"
    }
  })

  await prisma.user.create({
    data: {
      name: "William Mestre",
      email: "dono@barbersystem.com",
      passwordHash: superPassword,
      role: "SUPERADMIN",
      barbershopId: hq.id
    }
  })

  // 3. CRIAR BARBEARIA MODELO
  const shop = await prisma.barbershop.create({
    data: {
      name: "Barbearia Joe's Premium",
      slug: "joe", // 🚀 SUBDOMÍNIO: joe.localhost:3000
      plan: "PRO"
    }
  })

  // 4. CRIAR USUÁRIOS (DONO, BARBEIRO, CLIENTE)
  const admin = await prisma.user.create({
    data: {
      name: "Joe Admin",
      email: "admin@joe.com",
      passwordHash: defaultPassword,
      role: "ADMIN",
      barbershopId: shop.id
    }
  })

  const barber = await prisma.user.create({
    data: {
      name: "Carlos Barbeiro Sênior",
      email: "carlos@joe.com",
      passwordHash: defaultPassword,
      role: "BARBER",
      commissionRate: 50.00,
      barbershopId: shop.id
    }
  })

  const customer = await prisma.user.create({
    data: {
      name: "Cliente Homologação",
      email: "cliente@homolog.com",
      passwordHash: defaultPassword,
      role: "CUSTOMER",
      phone: "5541992522151",
      barbershopId: shop.id
    }
  })

  // 5. CRIAR HORÁRIOS DE FUNCIONAMENTO
  const days = [1, 2, 3, 4, 5, 6] // Segunda a Sábado
  for (const day of days) {
    await prisma.businessHours.create({
      data: {
        dayOfWeek: day,
        openTime: "09:00",
        closeTime: "19:00",
        barbershopId: shop.id
      }
    })
  }

  // 6. CRIAR SERVIÇOS E PRODUTOS
  await prisma.service.createMany({
    data: [
      { name: "Degradê Navalhado", price: 65, duration: 40, barbershopId: shop.id },
      { name: "Barba e Toalha", price: 45, duration: 30, barbershopId: shop.id }
    ]
  })

  await prisma.product.createMany({
    data: [
      { name: "Pomada Matte", price: 45.90, stock: 15, barbershopId: shop.id },
      { name: "Óleo Premium", price: 35.00, stock: 10, barbershopId: shop.id }
    ]
  })

  console.log('✅ AMBIENTE V3 PRONTO PARA SUBDOMÍNIOS!')
  console.log('👉 Acesse: http://joe.localhost:3000')
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect())
