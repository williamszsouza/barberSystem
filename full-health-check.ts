import { Redis } from 'ioredis'
import { prisma } from './src/lib/prisma.js'
import axios from 'axios'
import dotenv from 'dotenv'
import fs from 'fs'

dotenv.config()

async function fullHealthCheck() {
  console.log('🏁 INICIANDO CHECK-UP COMPLETO DO SISTEMA...\n')

  // 1. Check Redis
  console.log('🔌 1. Testando Redis (Fila BullMQ)...')
  const redis = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
    connectTimeout: 5000,
    maxRetriesPerRequest: 0
  })
  try {
    await redis.ping()
    console.log('✅ Redis: ONLINE')
  } catch (e: any) {
    console.error('❌ Redis: OFFLINE - Erro:', e.message)
  } finally {
    redis.disconnect()
  }

  // 2. Check Database
  console.log('\n🗄️ 2. Testando Banco de Dados (Prisma)...')
  try {
    await prisma.$connect()
    const users = await prisma.user.count()
    console.log(`✅ Banco: ONLINE (${users} usuários encontrados)`)
  } catch (e: any) {
    console.error('❌ Banco: ERRO -', e.message)
  }

  // 3. Check Evolution API
  console.log('\n📱 3. Testando Evolution API (WhatsApp)...')
  const url = 'http://127.0.0.1:8080'
  const apikey = '4224db922b168'
  const instance = 'barber_instance'

  try {
    const res = await axios.get(`${url}/instance/fetchInstances`, { headers: { apikey } })
    const exists = res.data.find((i: any) => i.instanceName === instance)
    
    if (exists) {
      console.log(`✅ Evolution: ONLINE (Instância [${instance}] ativa)`)
      const state = await axios.get(`${url}/instance/connectionState/${instance}`, { headers: { apikey } })
      console.log(`📡 Status do WhatsApp: ${state.data.instance.state}`)
      
      if (state.data.instance.state !== 'open') {
        console.log('📸 Gerando QR Code novo para conexão...')
        const qr = await axios.get(`${url}/instance/connect/${instance}`, { headers: { apikey } })
        if (qr.data.base64) {
          fs.writeFileSync('qrcode.png', qr.data.base64.replace(/^data:image\/png;base64,/, ''), 'base64')
          console.log('👉 QR Code salvo em qrcode.png. ESCANEIE AGORA!')
        }
      }
    } else {
      console.log(`⚠️ Evolution: ONLINE (Criando instância [${instance}]...)`)
      await axios.post(`${url}/instance/create`, { instanceName: instance, integration: 'baileys' }, { headers: { apikey } })
      console.log('✅ Instância criada! Rode o check-up novamente em 5 segundos.')
    }
  } catch (e: any) {
    console.error('❌ Evolution: ERRO -', e.response?.data || e.message)
  }
}

fullHealthCheck().finally(() => prisma.$disconnect())
