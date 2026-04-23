import Fastify from 'fastify'
import jwt from '@fastify/jwt'
import dotenv from 'dotenv'

dotenv.config()

async function run() {
  const app = Fastify()
  const JWT_SECRET = (process.env.JWT_SECRET || 'barber-system-secret-2024').replace(/['"]/g, '')
  
  console.log('JWT_SECRET being used:', JWT_SECRET)
  
  app.register(jwt, { secret: JWT_SECRET })
  await app.ready()

  const payload = {
    id: 'super-admin-id',
    role: 'SUPERADMIN',
    barbershopId: 'some-barbershop-id'
  }

  const token = app.jwt.sign(payload)
  console.log('Generated Token:', token)

  try {
    const decoded = await app.jwt.verify(token)
    console.log('Successfully verified token:', decoded)
  } catch (err: any) {
    console.error('Verification failed!')
    console.error('Error Name:', err.name)
    console.error('Error Message:', err.message)
  }

  // Test with another secret
  const app2 = Fastify()
  app2.register(jwt, { secret: JWT_SECRET + 'wrong' })
  await app2.ready()
  
  try {
    await app2.jwt.verify(token)
  } catch (err: any) {
    console.log('\nExpected failure with wrong secret:')
    console.log('Error Name:', err.name)
    console.log('Error Message:', err.message)
  }
}

run()
