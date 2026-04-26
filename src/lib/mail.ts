import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config()

const isMailConfigured = !!(process.env.MAIL_USER && process.env.MAIL_PASS)

// Transportador (só será usado se estiver configurado)
const transporter = isMailConfigured 
  ? nodemailer.createTransport({
      host: process.env.MAIL_HOST || 'smtp.gmail.com',
      port: Number(process.env.MAIL_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    })
  : null

interface WelcomeEmailProps {
  to: string
  ownerName: string
  barbershopName: string
  password?: string
}

interface CustomerAppointmentEmailProps {
  to: string
  customerName: string
  barbershopName: string
  date: string
  time: string
  serviceName: string
  barberName: string
  productsText: string
  totalValue: string
}

interface BarberAppointmentEmailProps {
  to: string
  barberName: string
  customerName: string
  date: string
  time: string
  serviceName: string
  productsText: string
  totalValue: string
}

export async function sendWelcomeEmail({ to, ownerName, barbershopName, password }: WelcomeEmailProps) {
  if (!transporter) {
    console.log('--------------------------------------------------')
    console.log('📧 MODO SIMULAÇÃO DE E-MAIL (SMTP não configurado)')
    console.log(`Para: ${to}`)
    console.log(`Assunto: Bem-vindo à ${barbershopName}`)
    console.log(`Mensagem: Olá ${ownerName}, seu acesso é: ${to} / ${password}`)
    console.log('--------------------------------------------------')
    return
  }

  const loginUrl = 'http://localhost:3000'

  const html = `
    <div style="font-family: sans-serif; background-color: #000; color: #fff; padding: 40px; border-radius: 20px; max-width: 600px; margin: auto;">
      <h1 style="color: #f59e0b; text-align: center; font-size: 24px;">BEM-VINDO AO BARBERSYSTEM!</h1>
      <p>Olá, <strong>${ownerName}</strong>!</p>
      <p>Sua barbearia <strong>${barbershopName}</strong> acaba de ser cadastrada com sucesso.</p>
      
      <div style="background-color: #111; border: 1px solid #333; padding: 20px; border-radius: 10px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #888;">Suas credenciais de acesso:</p>
        <p style="margin: 10px 0 5px 0;"><strong>E-mail:</strong> ${to}</p>
        <p style="margin: 0;"><strong>Senha Temporária:</strong> ${password}</p>
      </div>

      <p style="text-align: center; margin-top: 30px;">
        <a href="${loginUrl}" style="background-color: #f59e0b; color: #000; padding: 15px 30px; text-decoration: none; font-weight: bold; border-radius: 8px; display: inline-block;">
          ACESSAR MEU PAINEL AGORA
        </a>
      </p>
    </div>
  `

  await transporter.sendMail({
    from: '"BarberSystem Team" <no-reply@barbersystem.com>',
    to,
    subject: `Bem-vindo à sua nova Barbearia: ${barbershopName}`,
    html,
  })
}

// 1. E-mail de Boas-Vindas para o Cliente Final
export async function sendCustomerWelcomeEmail({ to, ownerName, barbershopName }: WelcomeEmailProps) {
  if (!transporter) {
    console.log('--------------------------------------------------')
    console.log('📧 MODO SIMULAÇÃO DE E-MAIL')
    console.log(`Para (Cliente): ${to}`)
    console.log(`Assunto: Bem-vindo à ${barbershopName}!`)
    console.log(`Mensagem: Olá ${ownerName}, sua conta foi criada com sucesso!`)
    console.log('--------------------------------------------------')
    return
  }

  const html = `
    <div style="font-family: sans-serif; background-color: #09090b; color: #f4f4f5; padding: 40px; border-radius: 10px; max-width: 600px; margin: auto;">
      <h1 style="color: #f59e0b; text-align: center; font-size: 24px;">BEM-VINDO!</h1>
      <p>Olá, <strong>${ownerName}</strong>!</p>
      <p>Sua conta na <strong>${barbershopName}</strong> foi criada com sucesso.</p>
      <p>Agora você pode agendar seus horários de forma rápida e prática pelo nosso sistema online.</p>
      <p style="text-align: center; margin-top: 30px;">
        <a href="http://localhost:3000" style="background-color: #f59e0b; color: #000; padding: 15px 30px; text-decoration: none; font-weight: bold; border-radius: 8px; display: inline-block;">
          FAZER UM AGENDAMENTO
        </a>
      </p>
    </div>
  `

  await transporter.sendMail({
    from: '"Equipe BarberSystem" <no-reply@barbersystem.com>',
    to,
    subject: `Sua conta na ${barbershopName} foi criada!`,
    html,
  })
}

// 2. E-mail de Confirmação de Agendamento para o Cliente
export async function sendCustomerAppointmentEmail(props: CustomerAppointmentEmailProps) {
  if (!transporter) {
    console.log('--------------------------------------------------')
    console.log('📧 MODO SIMULAÇÃO DE E-MAIL')
    console.log(`Para (Cliente): ${props.to}`)
    console.log(`Assunto: Agendamento Confirmado - ${props.barbershopName}`)
    console.log(`Resumo: ${props.date} às ${props.time} com ${props.barberName} - ${props.serviceName} - Total: R$ ${props.totalValue}`)
    console.log('--------------------------------------------------')
    return
  }

  const productsSection = props.productsText ? `
    <p style="margin-top: 20px;"><strong>Produtos Reservados:</strong></p>
    <p style="color: #a1a1aa; font-size: 14px;">${props.productsText.replace(/\n/g, '<br>')}</p>
  ` : ''

  const html = `
    <div style="font-family: sans-serif; background-color: #09090b; color: #f4f4f5; padding: 40px; border-radius: 10px; max-width: 600px; margin: auto;">
      <h1 style="color: #f59e0b; text-align: center; font-size: 24px;">AGENDAMENTO CONFIRMADO!</h1>
      <p>Olá, <strong>${props.customerName}</strong>. Tudo certo para o seu horário na <strong>${props.barbershopName}</strong>!</p>
      
      <div style="background-color: #18181b; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>📅 Data:</strong> ${props.date}</p>
        <p><strong>⏰ Horário:</strong> ${props.time}h</p>
        <p><strong>✂️ Serviço:</strong> ${props.serviceName}</p>
        <p><strong>👤 Profissional:</strong> ${props.barberName}</p>
        ${productsSection}
        <hr style="border-color: #27272a; margin: 15px 0;">
        <p style="font-size: 18px; text-align: right; margin: 0;"><strong>Total Estimado:</strong> <span style="color: #f59e0b;">R$ ${props.totalValue}</span></p>
      </div>

      <p style="text-align: center; color: #a1a1aa; font-size: 12px; margin-top: 30px;">
        Se precisar cancelar, acesse o sistema com antecedência. Nos vemos lá!
      </p>
    </div>
  `

  await transporter.sendMail({
    from: '"Equipe BarberSystem" <no-reply@barbersystem.com>',
    to: props.to,
    subject: `Agendamento Confirmado: ${props.date} às ${props.time}h`,
    html,
  })
}

// 3. E-mail de Aviso para o Barbeiro / Dono
export async function sendBarberAppointmentEmail(props: BarberAppointmentEmailProps) {
  if (!transporter) {
    console.log('--------------------------------------------------')
    console.log('📧 MODO SIMULAÇÃO DE E-MAIL')
    console.log(`Para (Barbeiro): ${props.to}`)
    console.log(`Assunto: NOVO AGENDAMENTO: ${props.date} às ${props.time}`)
    console.log(`Resumo: Cliente ${props.customerName} marcou ${props.serviceName} - Total: R$ ${props.totalValue}`)
    console.log('--------------------------------------------------')
    return
  }

  const productsSection = props.productsText ? `
    <p style="margin-top: 15px;"><strong>Produtos Reservados:</strong></p>
    <p style="color: #a1a1aa; font-size: 14px;">${props.productsText.replace(/\n/g, '<br>')}</p>
  ` : ''

  const html = `
    <div style="font-family: sans-serif; background-color: #f4f4f5; color: #09090b; padding: 40px; border-radius: 10px; max-width: 600px; margin: auto; border: 1px solid #e4e4e7;">
      <h1 style="color: #f59e0b; text-align: center; font-size: 20px;">NOVO AGENDAMENTO RECEBIDO</h1>
      <p>Olá, <strong>${props.barberName}</strong>!</p>
      <p>O cliente <strong>${props.customerName}</strong> acabou de marcar um horário com você.</p>
      
      <div style="background-color: #fff; padding: 20px; border-radius: 8px; border: 1px solid #e4e4e7; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>📅 Data:</strong> ${props.date}</p>
        <p style="margin: 5px 0;"><strong>⏰ Horário:</strong> ${props.time}h</p>
        <p style="margin: 5px 0;"><strong>✂️ Serviço:</strong> ${props.serviceName}</p>
        ${productsSection}
        <hr style="border-color: #e4e4e7; margin: 15px 0;">
        <p style="font-size: 16px; text-align: right; margin: 0;"><strong>Total a receber:</strong> <span style="color: #10b981;">R$ ${props.totalValue}</span></p>
      </div>
    </div>
  `

  await transporter.sendMail({
    from: '"BarberSystem Avisos" <no-reply@barbersystem.com>',
    to: props.to,
    subject: `Novo Agendamento: ${props.customerName} - ${props.date} às ${props.time}h`,
    html,
  })
}
