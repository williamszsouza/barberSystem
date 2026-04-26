import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import bcrypt from 'bcryptjs'
import { addEmailJob } from '../lib/queue.js'

export async function authRoutes(app: FastifyInstance) {
  // Criar Conta (Register)
  app.post('/register', async (request, reply) => {
    const registerSchema = z.object({
      name: z.string().min(3),
      email: z.string().email(),
      phone: z.string().min(10), // 🚀 OBRIGATÓRIO PARA WHATSAPP
      password: z.string().min(6),
      barbershopId: z.string().uuid()
    })

    const { name, email, phone, password, barbershopId } = registerSchema.parse(request.body)

    const userExists = await prisma.user.findUnique({ where: { email } })
    if (userExists) return reply.status(400).send({ error: 'Usuário já existe' })

    const barbershop = await prisma.barbershop.findUnique({
      where: { id: barbershopId },
      select: { name: true }
    })
    if (!barbershop) return reply.status(400).send({ error: 'Barbearia não encontrada' })

    const passwordHash = await bcrypt.hash(password, 8)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone, // 🚀 SALVANDO O TELEFONE
        passwordHash,
        barbershopId,
        role: 'CUSTOMER'
      }
    })

    // 📧 Enfileirar E-mail de Boas-Vindas
    await addEmailJob({
      type: 'WELCOME_CUSTOMER',
      payload: {
        to: user.email,
        ownerName: user.name,
        barbershopName: barbershop.name
      }
    })

    const token = app.jwt.sign({ id: user.id, role: user.role, barbershopId: user.barbershopId })
    return { 
      user: { id: user.id, name: user.name, email: user.email, role: user.role }, 
      token,
      barbershopId: user.barbershopId 
    }
  })

  // Fazer Login
  app.post('/login', async (request, reply) => {
    const loginSchema = z.object({
      email: z.string().email(),
      password: z.string()
    })

    const { email, password } = loginSchema.parse(request.body)

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return reply.status(400).send({ error: 'Credenciais inválidas' })

    const passwordMatch = await bcrypt.compare(password, user.passwordHash)
    if (!passwordMatch) return reply.status(400).send({ error: 'Credenciais inválidas' })

    const token = app.jwt.sign({ id: user.id, role: user.role, barbershopId: user.barbershopId })
    return { 
      user: { id: user.id, name: user.name, email: user.email, role: user.role }, 
      token,
      barbershopId: user.barbershopId 
    }
  })
}