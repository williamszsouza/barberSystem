import { prisma } from '../lib/prisma.js'
import { addNotificationJob } from '../lib/queue.js'

export class WebhookService {
  async processWhatsAppMessage(remoteJid: string, text: string) {
    const phone = remoteJid.split('@')[0]
    const cleanText = text.trim()

    console.log(`[WhatsApp Webhook] Mensagem de ${phone}: "${cleanText}"`)

    if (cleanText !== '1' && cleanText !== '2') return

    // Busca o agendamento mais recente deste telefone que ainda não foi finalizado/cancelado
    const appointment = await prisma.appointment.findFirst({
      where: {
        customer: { phone: { contains: phone } },
        status: 'SCHEDULED'
      },
      orderBy: { date: 'desc' },
      include: { customer: true, service: true }
    })

    if (!appointment) {
      console.log(`[WhatsApp Webhook] Nenhum agendamento pendente para ${phone}`)
      return
    }

    if (cleanText === '1') {
      // Confirmado! (No seu schema atual, SCHEDULED já é o estado inicial, 
      // então apenas enviamos a confirmação positiva)
      await addNotificationJob({
        appointmentId: appointment.id,
        phone: phone,
        message: `✅ Confirmado! O barbeiro já está te esperando para o serviço: ${appointment.service.name}.`,
        sendAt: new Date()
      })
    } else {
      // Cancelado
      await prisma.appointment.update({
        where: { id: appointment.id },
        data: { status: 'CANCELED' }
      })

      await addNotificationJob({
        appointmentId: appointment.id,
        phone: phone,
        message: `❌ Agendamento cancelado com sucesso. Esperamos te ver em breve!`,
        sendAt: new Date()
      })
    }
  }
}
