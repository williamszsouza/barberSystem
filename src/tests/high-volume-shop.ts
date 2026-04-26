import { prisma } from '../lib/prisma.js'
import bcrypt from 'bcryptjs'
import { subDays, startOfMonth, addDays } from 'date-fns'

async function highVolumeMock() {
  console.log('🔥 INICIANDO MOCK DE ALTA VOLUMETRIA (UNIDADE SOLO)')
  const startTime = Date.now()

  const slug = 'heavy-shop'
  const passwordHash = await bcrypt.hash('123456', 8)

  // 1. Limpeza focada nesta unidade (para não apagar as 1000 outras shops se existirem)
  console.log(`🧹 Limpando dados da unidade [${slug}]...`)
  const existing = await prisma.barbershop.findUnique({ where: { slug } })
  if (existing) {
    await prisma.transaction.deleteMany({ where: { barbershopId: existing.id } })
    await prisma.appointmentProduct.deleteMany({ where: { appointment: { barbershopId: existing.id } } })
    await prisma.appointment.deleteMany({ where: { barbershopId: existing.id } })
    await prisma.user.deleteMany({ where: { barbershopId: existing.id } })
    await prisma.service.deleteMany({ where: { barbershopId: existing.id } })
    await prisma.product.deleteMany({ where: { barbershopId: existing.id } })
    await prisma.barbershop.delete({ where: { id: existing.id } })
  }

  // 2. Criar Barbearia
  const shop = await prisma.barbershop.create({
    data: {
      name: "Barbearia de Shopping (Alta Escala)",
      slug: slug,
      plan: "ENTERPRISE",
      isActive: true
    }
  })

  // 🛡️ NOVO: Criar Horários de Funcionamento (Seg-Sáb, 09h às 19h)
  const days = [1, 2, 3, 4, 5, 6]
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

  // 3. Criar Barbeiro e Admin
  const admin = await prisma.user.create({
    data: { name: 'Dono Heavy', email: 'admin@heavy.com', passwordHash, role: 'ADMIN', barbershopId: shop.id }
  })
  const barber = await prisma.user.create({
    data: { name: 'Barbeiro Pro', email: 'barber@heavy.com', passwordHash, role: 'BARBER', commissionRate: 50.00, barbershopId: shop.id }
  })
  const service = await prisma.service.create({
    data: { name: 'Corte Premium', price: 100, duration: 30, barbershopId: shop.id }
  })

  // 4. Criar 1.000 Clientes
  console.log('👥 Gerando 1.000 clientes fixos...')
  const customersData = []
  for (let i = 1; i <= 1000; i++) {
    customersData.push({
      id: `c-heavy-${i}`,
      name: `Cliente Fiel ${i}`,
      email: `cliente${i}@heavy.com`,
      passwordHash,
      role: 'CUSTOMER',
      barbershopId: shop.id
    })
  }
  await prisma.user.createMany({ data: customersData as any })

  // 5. Criar 3.500 Agendamentos (700 por mês nos últimos 5 meses)
  console.log('📅 Gerando 3.500 agendamentos e transações (Histórico de 5 meses)...')
  
  for (let month = 0; month < 5; month++) {
    const appointmentsMonth: any[] = []
    const transactionsMonth: any[] = []
    
    for (let day = 0; day < 700; day++) {
      const aptId = `apt-heavy-${month}-${day}`
      const date = subDays(new Date(), (month * 30) + (day % 30))

      appointmentsMonth.push({
        id: aptId,
        date: date,
        status: 'COMPLETED',
        barbershopId: shop.id,
        customerId: `c-heavy-${(day % 1000) + 1}`,
        barberId: barber.id,
        serviceId: service.id
      })

      // Transação de Entrada (Receita)
      transactionsMonth.push({
        amount: 100,
        type: 'INCOME',
        description: 'Corte Premium',
        date: date,
        barbershopId: shop.id,
        appointmentId: aptId
      })

      // Transação de Saída (Comissão) - NÃO vinculamos o appointmentId aqui para evitar erro de UNIQUE
      transactionsMonth.push({
        amount: 50,
        type: 'EXPENSE',
        description: `Comissão Barbeiro (Ref Apt: ${aptId})`,
        date: date,
        barbershopId: shop.id
        // appointmentId: aptId // 🚀 REMOVIDO para evitar conflito de Unique Key
      })
    }

    await prisma.appointment.createMany({ data: appointmentsMonth })
    await prisma.transaction.createMany({ data: transactionsMonth })
    process.stdout.write('.')
  }

  const duration = (Date.now() - startTime) / 1000
  console.log(`\n✅ MOCK CONCLUÍDO!`)
  console.log(`⏱️ Tempo de geração: ${duration}s`)
  console.log(`📊 Estatísticas da Unidade [${slug}]:`)
  console.log(`   - Clientes: 1.000`)
  console.log(`   - Atendimentos Totais: 3.500`)
  console.log(`   - Movimentação Financeira: 7.000 transações geradas`)
  console.log(`\n👉 Agora teste o endpoint de relatórios para esta unidade!`)
}

highVolumeMock()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
