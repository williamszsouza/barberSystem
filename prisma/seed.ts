import { prisma } from '../src/lib/prisma.js'
import bcrypt from 'bcryptjs'

async function main() {
  console.log('🚀 INICIANDO PREPARAÇÃO V1 - AMBIENTE DE HOMOLOGAÇÃO')

  const defaultPassword = await bcrypt.hash('123456', 8)
  const masterPassword = await bcrypt.hash('master2024', 8)

  // 1. LIMPEZA TOTAL (RESET)
  await prisma.auditLog.deleteMany()
  await prisma.transaction.deleteMany()
  await prisma.appointment.deleteMany()
  await prisma.service.deleteMany()
  await prisma.user.deleteMany()
  await prisma.barbershop.deleteMany()

  // 2. CRIAR ESTRUTURA SAAS (SUPERADMIN)
  const hq = await prisma.barbershop.create({
    data: {
      name: "BarberSystem HQ (SaaS)",
      cnpj: "00.000.000/0001-00",
      plan: 'ENTERPRISE',
      isActive: true
    }
  })

  const superAdmin = await prisma.user.create({
    data: {
      name: "William SuperAdmin",
      email: "dono@barbersystem.com",
      passwordHash: masterPassword,
      role: 'SUPERADMIN',
      barbershopId: hq.id
    }
  })

  // 3. CRIAR BARBEARIA MODELO (ADMIN/TENANT)
  const shop = await prisma.barbershop.create({
    data: {
      name: "Barbearia Joe's Premium",
      cnpj: "12.345.678/0001-99",
      plan: 'PRO',
      isActive: true
    }
  })

  // 4. CRIAR USUÁRIOS PADRÃO DO SISTEMA
  
  // O Dono (Admin)
  const adminOwner = await prisma.user.create({
    data: {
      name: "Joe Proprietário",
      email: "admin@joe.com",
      passwordHash: defaultPassword,
      role: 'ADMIN',
      barbershopId: shop.id
    }
  })

  // O Barbeiro (Barber)
  const seniorBarber = await prisma.user.create({
    data: {
      name: "Carlos Barbeiro Sênior",
      email: "carlos@joe.com",
      passwordHash: defaultPassword,
      role: 'BARBER',
      barbershopId: shop.id
    }
  })

  // O Cliente (Customer)
  const testCustomer = await prisma.user.create({
    data: {
      name: "Cliente de Teste",
      email: "cliente@homolog.com",
      passwordHash: defaultPassword,
      role: 'CUSTOMER',
      barbershopId: shop.id
    }
  })

  // 5. CRIAR SERVIÇOS INICIAIS
  await prisma.service.createMany({
    data: [
      { name: "Corte de Cabelo Sênior", price: 65, duration: 40, barbershopId: shop.id },
      { name: "Barba e Toalha Quente", price: 45, duration: 30, barbershopId: shop.id },
      { name: "Combo Imperial (Cabelo + Barba)", price: 95, duration: 60, barbershopId: shop.id }
    ]
  })

  console.log('--------------------------------------------------')
  console.log('✅ AMBIENTE V1 PREPARADO COM SUCESSO!')
  console.log('--------------------------------------------------')
  console.log('🔐 CREDENCIAIS DE HOMOLOGAÇÃO:')
  console.log('1. SUPERADMIN (SaaS Control): dono@barbersystem.com / master2024')
  console.log('2. ADMIN (Dono de Unidade): admin@joe.com / 123456')
  console.log('3. BARBEIRO (Staff): carlos@joe.com / 123456')
  console.log('4. CLIENTE: cliente@homolog.com / 123456')
  console.log('--------------------------------------------------')
  console.log('ID_TENANT_MODELO:', shop.id)
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect())
