import { prisma } from '../lib/prisma.js'
import { addMinutes, isBefore, startOfDay, endOfDay, format } from 'date-fns'

export class AppointmentService {
  async create({
    date,
    customerId,
    barberId,
    serviceId,
    barbershopId,
    products
  }: {
    date: Date
    customerId: string
    barberId: string
    serviceId: string
    barbershopId: string
    products?: { productId: string, quantity: number }[]
  }) {
    if (isBefore(date, new Date())) {
      throw new Error('Não é possível agendar em uma data passada.')
    }

    const service = await prisma.service.findUnique({
      where: { id: serviceId }
    })

    if (!service || service.barbershopId !== barbershopId) {
      throw new Error('Serviço inválido para esta unidade.')
    }

    const barber = await prisma.user.findUnique({
      where: { id: barberId }
    })

    if (!barber || barber.barbershopId !== barbershopId || (barber.role !== 'BARBER' && barber.role !== 'ADMIN')) {
      throw new Error('Profissional inválido para esta unidade.')
    }

    const appointmentEnd = addMinutes(date, service.duration)

    // 🏎️ CORREÇÃO DE RACE CONDITION: Usando transação para garantir atomicidade
    return await prisma.$transaction(async (tx) => {
      const conflict = await tx.appointment.findFirst({
        where: {
          barberId,
          status: 'SCHEDULED',
          AND: [
            { date: { lt: appointmentEnd } },
            { date: { gte: startOfDay(date), lte: endOfDay(date) } }
          ]
        },
        include: { service: true }
      })

      if (conflict) {
        const conflictEnd = addMinutes(conflict.date, conflict.service.duration)
        const hasOverlap = (date >= conflict.date && date < conflictEnd) || (appointmentEnd > conflict.date && appointmentEnd <= conflictEnd)

        if (hasOverlap) {
          throw new Error('O barbeiro já possui um agendamento neste horário.')
        }
      }

      // 1. Criar o agendamento principal
      const appointment = await tx.appointment.create({
        data: {
          date,
          customerId,
          barberId,
          serviceId,
          barbershopId,
          status: 'SCHEDULED'
        }
      })

      // 2. Se houver produtos, vinculá-los ao agendamento
      if (products && products.length > 0) {
        const productDetails = await tx.product.findMany({
          where: { id: { in: products.map(p => p.productId) }, barbershopId }
        })

        const appointmentProductsData = products.map(p => {
          const detail = productDetails.find(d => d.id === p.productId)
          if (!detail) throw new Error(`Produto ${p.productId} não encontrado`)
          
          return {
            appointmentId: appointment.id,
            productId: p.productId,
            quantity: p.quantity,
            priceAtTime: detail.price
          }
        })

        await tx.appointmentProduct.createMany({
          data: appointmentProductsData
        })
      }

      return appointment
    }, {
      isolationLevel: 'Serializable' // Nível máximo de proteção contra concorrência
    })
  }

  async complete(appointmentId: string, barbershopId: string) {
    return await prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.update({
        where: { id: appointmentId, barbershopId },
        data: { status: 'COMPLETED' },
        include: { 
          service: true, 
          barber: true,
          products: {
            include: { product: true }
          }
        }
      })

      // 1. Calcular Valor Total (Serviço + Produtos reservados)
      let totalValue = Number(appointment.service.price)
      appointment.products.forEach(p => {
        totalValue += Number(p.priceAtTime) * p.quantity
      })

      // 2. Calcular Comissão do Barbeiro
      const commissionRate = Number(appointment.barber.commissionRate) / 100
      const barberCommission = totalValue * commissionRate

      // 3. Lançar Receita Bruta (Entrada)
      await tx.transaction.create({
        data: {
          amount: totalValue,
          type: 'INCOME',
          description: `Finalização Agendamento: ${appointment.service.name} (Ref: ${appointment.id})`,
          barbershopId,
          appointmentId: appointment.id
        }
      })

      // 4. Lançar Comissão do Barbeiro (Saída/Despesa)
      await tx.transaction.create({
        data: {
          amount: barberCommission,
          type: 'EXPENSE',
          description: `Comissão do Profissional: ${appointment.barber.name} (${appointment.barber.commissionRate}%)`,
          barbershopId,
          appointmentId: appointment.id
        }
      })

      return appointment
    })
  }

  async getEarnings(barbershopId: string, startDate: Date, endDate: Date) {
    const earnings = await prisma.transaction.aggregate({
      where: {
        barbershopId,
        type: 'INCOME',
        date: { gte: startDate, lte: endDate }
      },
      _sum: { amount: true }
    })
    return earnings._sum.amount || 0
  }

  async getAvailableTimes(barbershopId: string, barberId: string, date: Date) {
    const dayOfWeek = date.getDay()
    
    // 1. Buscar Horário de Funcionamento
    const businessHours = await prisma.businessHours.findUnique({
      where: { barbershopId_dayOfWeek: { barbershopId, dayOfWeek } }
    })

    // 🛡️ ARCHITECTURE DEFENSIVE: Se não houver configuração, assume padrão 09:00 - 18:00
    // em vez de fechar a agenda (evita o erro de "Agenda Cheia" em novas barbearias)
    const openTime = businessHours ? businessHours.openTime : "09:00"
    const closeTime = businessHours ? businessHours.closeTime : "18:00"
    const isClosed = businessHours ? businessHours.isClosed : (dayOfWeek === 0) // Fecha aos domingos por padrão

    if (isClosed) {
      return [] // Barbearia fechada neste dia
    }

    // 2. Gerar slots baseados no funcionamento resolvido
    const allPossibleSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00']
    
    const validSlots = allPossibleSlots.filter(slot => {
      return slot >= openTime && slot < closeTime
    })

    // 3. Buscar Agendamentos Existentes
    const appointments = await prisma.appointment.findMany({
      where: {
        barberId,
        barbershopId,
        status: 'SCHEDULED',
        date: { gte: startOfDay(date), lte: endOfDay(date) }
      }
    })

    // 4. Buscar Bloqueios (TimeOff)
    const timeOffs = await prisma.timeOff.findMany({
      where: {
        barberId,
        startTime: { lte: endOfDay(date) },
        endTime: { gte: startOfDay(date) }
      }
    })

    const occupiedTimes = appointments.map(apt => format(apt.date, 'HH:mm'))

    return validSlots.map(time => {
      // Verificar se o slot cai dentro de um TimeOff
      const slotDate = new Date(date)
      const [h, m] = time.split(':')
      slotDate.setHours(Number(h), Number(m), 0, 0)

      const isBlocked = timeOffs.some(off => {
        return slotDate >= off.startTime && slotDate < off.endTime
      })

      return {
        time,
        isAvailable: !occupiedTimes.includes(time) && !isBlocked
      }
    })
  }

  async cancel(appointmentId: string, barbershopId: string, userId: string, role: string) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId, barbershopId },
      include: { barbershop: true }
    })

    if (!appointment) throw new Error('Agendamento não encontrado.')

    // Se for CLIENTE, validar antecedência
    if (role === 'CUSTOMER') {
      const now = new Date()
      const limitDate = addMinutes(now, appointment.barbershop.cancelTimeLimit * 60)
      
      if (isBefore(appointment.date, limitDate)) {
        throw new Error(`Cancelamento permitido apenas com ${appointment.barbershop.cancelTimeLimit}h de antecedência.`)
      }
    }

    return await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'CANCELED' }
    })
  }

  async checkBarberAvailability(barbershopId: string, barberId: string, date: Date) {
    const available = await this.getAvailableTimes(barbershopId, barberId, date)
    // Retorna true se houver pelo menos um slot isAvailable: true
    return available.some(slot => slot.isAvailable)
  }

  async getDetailedReports(barbershopId: string, startDate: Date, endDate: Date) {
    // 🚀 OTIMIZAÇÃO: Usar agregação nativa do banco de dados (Muito mais rápido em larga escala)
    const totalRevenue = await prisma.transaction.aggregate({
      where: {
        barbershopId,
        type: 'INCOME',
        date: { gte: startDate, lte: endDate }
      },
      _sum: { amount: true }
    })

    const appointmentsCount = await prisma.appointment.count({
      where: {
        barbershopId,
        date: { gte: startDate, lte: endDate },
        status: 'COMPLETED'
      }
    })

    // Estatísticas por barbeiro (Top 5)
    // 🚀 OTIMIZAÇÃO: Já buscamos o total acumulado por barbeiro via Transaction
    const perBarberStats = await prisma.transaction.groupBy({
      by: ['appointmentId'],
      where: {
        barbershopId,
        type: 'INCOME',
        date: { gte: startDate, lte: endDate },
        appointmentId: { not: null }
      },
      _sum: { amount: true }
    })

    // Como o groupBy por appointmentId nos dá transações individuais, 
    // precisamos consolidar por barbeiro.
    // Mas o Prisma groupBy não permite fazer join em relações profundas no "by".
    // Então vamos buscar os appointments completados no período e seus barbeiros.
    const appointmentsWithBarbers = await prisma.appointment.findMany({
      where: {
        barbershopId,
        status: 'COMPLETED',
        date: { gte: startDate, lte: endDate }
      },
      select: {
        barberId: true,
        service: { select: { price: true } }
      }
    })

    const consolidated = appointmentsWithBarbers.reduce((acc: any, curr) => {
      if (!acc[curr.barberId]) {
        acc[curr.barberId] = { count: 0, total: 0 }
      }
      acc[curr.barberId].count += 1
      acc[curr.barberId].total += Number(curr.service.price)
      return acc
    }, {})

    // Busca nomes dos barbeiros
    const barberIds = Object.keys(consolidated)
    const barberDetails = await prisma.user.findMany({
      where: { id: { in: barberIds } },
      select: { id: true, name: true }
    })

    const barbers = barberIds.map(id => ({
      name: barberDetails.find(d => d.id === id)?.name || 'Desconhecido',
      count: consolidated[id].count,
      total: consolidated[id].total
    })).sort((a, b) => b.total - a.total)

    return {
      totalRevenue: totalRevenue._sum.amount || 0,
      appointmentsCount,
      barbers
    }
  }
}
