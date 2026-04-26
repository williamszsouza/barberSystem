import { prisma } from '../lib/prisma.js'
import { addNotificationJob, addEmailJob } from '../lib/queue.js'
import { subDays } from 'date-fns'

export class CampaignService {
  async runRetentionCampaign(barbershopId: string, daysIdle: number, message: string) {
    const thresholdDate = subDays(new Date(), daysIdle)

    // 1. Buscar clientes que não agendam há X dias
    // (Lógica: Clientes que tiveram agendamento, mas o último foi antes do threshold)
    const idleCustomers = await prisma.user.findMany({
      where: {
        barbershopId,
        role: 'CUSTOMER',
        appointmentsAsCustomer: {
          some: {
            date: { lte: thresholdDate },
            status: 'COMPLETED'
          },
          none: {
            date: { gt: thresholdDate }
          }
        }
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true
      }
    })

    // 2. Registrar a Campanha
    const campaign = await prisma.campaign.create({
      data: {
        name: `Retenção ${daysIdle} dias`,
        target: `IDLE_${daysIdle}_DAYS`,
        message,
        barbershopId,
        status: 'PROCESSING',
        recipients: idleCustomers.length
      }
    })

    // 3. Disparar Mensagens (Fila)
    for (const customer of idleCustomers) {
      // WhatsApp
      if (customer.phone) {
        await addNotificationJob({
          appointmentId: 'campaign-' + campaign.id,
          phone: customer.phone,
          message: `Olá, ${customer.name}! ${message}`,
          sendAt: new Date()
        })
      }

      // E-mail
      await addEmailJob({
        type: 'WELCOME_CUSTOMER', // Reutilizando template ou criando novo
        payload: {
          to: customer.email,
          ownerName: customer.name,
          barbershopName: 'Novidades da Barbearia'
        }
      })
    }

    // 4. Finalizar
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: 'COMPLETED' }
    })

    return { recipients: idleCustomers.length }
  }

  async getCampaigns(barbershopId: string) {
    return await prisma.campaign.findMany({
      where: { barbershopId },
      orderBy: { createdAt: 'desc' }
    })
  }
}
