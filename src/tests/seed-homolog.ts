import { prisma } from '../lib/prisma.js'
import bcrypt from 'bcryptjs'

async function seedHomolog() {
  console.log('🚀 PREPARANDO AMBIENTE DE HOMOLOGAÇÃO...')

  const passwordHash = await bcrypt.hash('123456', 8)

  // 1. LIMPEZA TOTAL (Cuidado: Isso apaga o banco)
  await prisma.auditLog.deleteMany()
  await prisma.transaction.deleteMany()
  await prisma.appointmentProduct.deleteMany()
  await prisma.appointment.deleteMany()
  await prisma.service.deleteMany()
  await prisma.product.deleteMany()
  await prisma.businessHours.deleteMany()
  await prisma.campaign.deleteMany()
  await prisma.timeOff.deleteMany()
  await prisma.user.deleteMany()
  await prisma.barbershop.deleteMany()

  // 2. CRIAR SUPERADMIN (VOCÊ)
  const superShop = await prisma.barbershop.create({
    data: { name: 'BarberSystem SaaS', slug: 'admin', plan: 'ENTERPRISE' }
  })
  await prisma.user.create({
    data: {
      name: 'William SuperAdmin',
      email: 'william@barbersystem.com',
      passwordHash: await bcrypt.hash('master2024', 8),
      role: 'SUPERADMIN',
      barbershopId: superShop.id
    }
  })

  // 3. CRIAR BARBEARIA ÚNICA
  const shop = await prisma.barbershop.create({
    data: {
      name: 'Barbearia Homologação',
      slug: 'barber-homolog',
      plan: 'PRO',
      isActive: true,
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  })

  // 4. CRIAR DONO (ADMIN)
  await prisma.user.create({
    data: {
      name: 'Dono da Barbearia',
      email: 'dono@barberhomolog.com',
      passwordHash,
      role: 'ADMIN',
      barbershopId: shop.id
    }
  })

  // 5. CRIAR BARBEIRO
  await prisma.user.create({
    data: {
      name: 'Barbeiro Profissional',
      email: 'barbeiro@barberhomolog.com',
      passwordHash,
      role: 'BARBER',
      commissionRate: 50.00,
      barbershopId: shop.id
    }
  })

  // 6. CRIAR CLIENTE
  await prisma.user.create({
    data: {
      name: 'Cliente Teste',
      email: 'cliente@teste.com',
      passwordHash,
      role: 'CUSTOMER',
      phone: '5541999999999',
      barbershopId: shop.id
    }
  })

  // 7. HORÁRIOS PADRÃO
  const days = [1, 2, 3, 4, 5, 6]
  for (const day of days) {
    await prisma.businessHours.create({
      data: { dayOfWeek: day, openTime: "09:00", closeTime: "18:00", barbershopId: shop.id }
    })
  }

  console.log('✅ AMBIENTE DE HOMOLOGAÇÃO PREPARADO!')
  console.log('--------------------------------------------------')
  console.log('1. SUPERADMIN: william@barbersystem.com / master2024')
  console.log('2. DONO: dono@barberhomolog.com / 123456')
  console.log('3. BARBEIRO: barbeiro@barberhomolog.com / 123456')
  console.log('4. CLIENTE: cliente@teste.com / 123456')
  console.log('--------------------------------------------------')
  console.log('SLUG: barber-homolog')
}

seedHomolog()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
