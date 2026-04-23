import { prisma } from '../lib/prisma.js'
import { addMinutes, isBefore, startOfDay, endOfDay, format } from 'date-fns'

export class AppointmentService {
  async create({
    date,
    customerId,
    barberId,
    serviceId,
    barbershopId
  }: {
    date: Date
    customerId: string
    barberId: string
    serviceId: string
    barbershopId: string
  }) {
    if (isBefore(date, new Date())) {
      throw new Error('Não é possível agendar em uma data passada.')
    }

    const service = await prisma.service.findUnique({
      where: { id: serviceId }
    })

    if (!service) throw new Error('Serviço não encontrado.')

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

      return await tx.appointment.create({
        data: {
          date,
          customerId,
          barberId,
          serviceId,
          barbershopId,
          status: 'SCHEDULED'
        }
      })
    }, {
      isolationLevel: 'Serializable' // Nível máximo de proteção contra concorrência
    })
  }

  async complete(appointmentId: string, barbershopId: string) {
    return await prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.update({
        where: { id: appointmentId, barbershopId },
        data: { status: 'COMPLETED' },
        include: { service: true }
      })

      await tx.transaction.create({
        data: {
          amount: appointment.service.price,
          type: 'INCOME',
          description: `Serviço: ${appointment.service.name}`,
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
    const workHours = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00']
    const appointments = await prisma.appointment.findMany({
      where: {
        barberId,
        barbershopId,
        status: 'SCHEDULED',
        date: { gte: startOfDay(date), lte: endOfDay(date) }
      }
    })

    const occupiedTimes = appointments.map(apt => format(apt.date, 'HH:mm'))
    return workHours.map(time => ({
      time,
      isAvailable: !occupiedTimes.includes(time)
    }))
  }

  async getDetailedReports(barbershopId: string, startDate: Date, endDate: Date) {
    const totalRevenue = await prisma.transaction.aggregate({
      where: {
        barbershopId,
        type: 'INCOME',
        date: { gte: startDate, lte: endDate }
      },
      _sum: { amount: true }
    })

    const appointments = await prisma.appointment.findMany({
      where: {
        barbershopId,
        status: 'COMPLETED',
        date: { gte: startDate, lte: endDate }
      },
      include: {
        barber: { select: { name: true } },
        service: { select: { price: true } }
      }
    })

    const perBarberStats = appointments.reduce((acc: any, curr) => {
      const barberName = curr.barber.name
      if (!acc[barberName]) acc[barberName] = { name: barberName, total: 0, count: 0 }
      acc[barberName].total += Number(curr.service.price)
      acc[barberName].count += 1
      return acc
    }, {})

    return {
      totalRevenue: totalRevenue._sum.amount || 0,
      appointmentsCount: appointments.length,
      barbers: Object.values(perBarberStats)
    }
  }
}
