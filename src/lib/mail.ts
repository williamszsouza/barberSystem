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
  password: string
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
