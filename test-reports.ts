import { prisma } from './src/lib/prisma.js'

async function checkLastAppointment() {
  console.log('🔍 ANALISANDO ÚLTIMO AGENDAMENTO...')
  
  const lastApt = await prisma.appointment.findFirst({
    orderBy: { createdAt: 'desc' },
    include: {
      customer: true,
      barbershop: true
    }
  })

  if (!lastApt) {
    console.log('❌ Nenhum agendamento encontrado no banco.')
    return
  }

  console.log(`📅 Data: ${lastApt.date}`)
  console.log(`👤 Cliente: ${lastApt.customer.name}`)
  console.log(`📱 Telefone no Banco: "${lastApt.customer.phone}"`)
  console.log(`💈 Unidade: ${lastApt.barbershop.name}`)

  if (!lastApt.customer.phone) {
    console.log('⚠️ ALERTA: O cliente está sem telefone! Por isso o WhatsApp não dispara.')
  }
}

checkLastAppointment()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
