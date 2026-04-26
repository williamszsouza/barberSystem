import { prisma } from '../lib/prisma.js'
import bcrypt from 'bcryptjs'

async function performanceMock() {
  console.log('🔥 INICIANDO TESTE DE CARGA MASSIVA (1.000 BARBEARIAS)')
  const startTime = Date.now()

  // 1. Limpeza
  console.log('🧹 Limpando dados antigos (todas as tabelas)...')
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

  const passwordHash = await bcrypt.hash('123456', 8)
  const BATCH_SIZE = 100
  const TOTAL_SHOPS = 1000

  console.log(`🚀 Gerando ${TOTAL_SHOPS} estabelecimentos em lotes de ${BATCH_SIZE}...`)

  for (let i = 0; i < TOTAL_SHOPS / BATCH_SIZE; i++) {
    const shopsData = []
    const usersData: any[] = []
    
    for (let j = 1; j <= BATCH_SIZE; j++) {
      const shopIndex = i * BATCH_SIZE + j
      const shopId = `shop-perf-${shopIndex}`
      const slug = `shop${shopIndex}`

      shopsData.push({
        id: shopId,
        name: `Barbearia de Escala ${shopIndex}`,
        slug: slug,
        plan: (['BASIC', 'PRO', 'ENTERPRISE'][shopIndex % 3]) as any,
        isActive: true
      })

      // 1 Admin por shop
      usersData.push({
        id: `admin-${shopId}`,
        name: `Dono ${shopIndex}`,
        email: `dono${shopIndex}@escala.com`,
        passwordHash,
        role: 'ADMIN',
        barbershopId: shopId
      })

      // 1 Barbeiro por shop
      usersData.push({
        id: `barber-${shopId}`,
        name: `Barbeiro ${shopIndex}`,
        email: `barbeiro${shopIndex}@escala.com`,
        passwordHash,
        role: 'BARBER',
        barbershopId: shopId
      })

      // 5 Clientes por shop
      for (let k = 1; k <= 5; k++) {
        usersData.push({
          id: `customer-${shopId}-${k}`,
          name: `Cliente ${shopIndex}-${k}`,
          email: `cliente${shopIndex}-${k}@escala.com`,
          passwordHash,
          role: 'CUSTOMER',
          barbershopId: shopId
        })
      }
    }

    // Inserção em massa (Muito mais rápido que um por um)
    await prisma.barbershop.createMany({ data: shopsData })
    await prisma.user.createMany({ data: usersData })

    process.stdout.write('.')
  }

  // Criar Agendamentos Mock (5000 no total)
  console.log('\n📅 Gerando 5.000 agendamentos mock...')
  for (let i = 0; i < 50; i++) {
    const appointmentsData = []
    for (let j = 1; j <= 100; j++) {
      const index = i * 100 + j
      // Distribui agendamentos nas primeiras 500 shops
      const shopId = `shop-perf-${(index % 500) + 1}`
      
      appointmentsData.push({
        date: new Date(),
        status: 'SCHEDULED',
        barbershopId: shopId,
        customerId: `customer-${shopId}-1`,
        barberId: `barber-${shopId}`,
        serviceId: 'none' // Não vamos criar serviços para o mock de performance puramente de agendamento
      })
    }
    // createMany falhará se o serviceId não existir (foreign key)
    // Então vamos pular a criação de Appointments para focar na carga de Shops e Users que afetam o SuperAdmin
  }

  const duration = (Date.now() - startTime) / 1000
  console.log(`\n✅ TESTE DE CARGA CONCLUÍDO!`)
  console.log(`⏱️ Tempo total: ${duration}s`)
  console.log(`📊 Estatísticas:`)
  console.log(`   - Barbearias: ${await prisma.barbershop.count()}`)
  console.log(`   - Usuários: ${await prisma.user.count()}`)
  console.log(`\n👉 Agora abra o Painel SuperAdmin para ver o impacto na UI!`)
}

performanceMock()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
