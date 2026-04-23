import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // 1. Limpar banco
  await prisma.transaction.deleteMany()
  await prisma.appointment.deleteMany()
  await prisma.service.deleteMany()
  await prisma.user.deleteMany()
  await prisma.barbershop.deleteMany()

  const hashedPassword = await bcrypt.hash('123456', 8)
  const masterPassword = await bcrypt.hash('master2024', 8)

  // 1.1 Criar conta de SuperAdmin (Você)
  // O SuperAdmin precisa estar vinculado a uma barbearia "Sede", mas pode ver todas
  const masterBarbershop = await prisma.barbershop.create({
    data: {
      name: "BarberSystem HQ",
      cnpj: "00.000.000/0001-00",
    }
  })

  await prisma.user.create({
    data: {
      name: "Dono do Sistema",
      email: "dono@barbersystem.com",
      passwordHash: masterPassword,
      role: 'SUPERADMIN',
      barbershopId: masterBarbershop.id
    }
  })

  // 2. Criar Barbearia (Tenant)
  const barbershop = await prisma.barbershop.create({
    data: {
      name: "Barbearia do Joe",
      description: "A melhor da cidade",
      cnpj: "12.345.678/0001-99"
    }
  })

  // 3. Criar Admin
  const admin = await prisma.user.create({
    data: {
      name: "Joe Admin",
      email: "admin@joe.com",
      passwordHash: hashedPassword,
      role: 'ADMIN',
      barbershopId: barbershop.id
    }
  })

  // 4. Criar Barbeiro
  const barber = await prisma.user.create({
    data: {
      name: "Carlos Barbeiro",
      email: "carlos@joe.com",
      passwordHash: hashedPassword,
      role: 'BARBER',
      barbershopId: barbershop.id
    }
  })

  // 4.1 Criar Cliente de Teste
  const customer = await prisma.user.create({
    data: {
      name: "Cliente Teste",
      email: "cliente@gmail.com",
      passwordHash: hashedPassword,
      role: 'CUSTOMER',
      barbershopId: barbershop.id
    }
  })

  // 5. Criar Serviços
  await prisma.service.createMany({
    data: [
      { name: "Corte Masculino", price: 50, duration: 30, barbershopId: barbershop.id },
      { name: "Barba Terapia", price: 35, duration: 20, barbershopId: barbershop.id },
      { name: "Combo (Cabelo + Barba)", price: 75, duration: 50, barbershopId: barbershop.id }
    ]
  })

  console.log({
    message: "Banco de dados populado com sucesso!",
    barbershopId: barbershop.id,
    adminEmail: admin.email,
    barberEmail: barber.email,
    customerId: customer.id
  })
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect())
