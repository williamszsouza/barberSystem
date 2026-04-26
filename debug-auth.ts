import axios from 'axios'
import { prisma } from './src/lib/prisma.js'
import dotenv from 'dotenv'

dotenv.config()

async function debugWhatsApp() {
  console.log('🔍 INICIANDO DIAGNÓSTICO DE WHATSAPP...')
  
  const phone = '5541992522151'
  const instance = 'barber_instance'
  const apikey = '4224db922b168'
  const url = 'http://localhost:8080'

  console.log(`1. Verificando se a instância [${instance}] está ativa na API...`)
  try {
    const check = await axios.get(`${url}/instance/fetchInstances`, { headers: { apikey } })
    const exists = check.data.find((i: any) => i.instanceName === instance)
    
    if (!exists) {
      console.error(`❌ ERRO: A instância [${instance}] não existe na Evolution API!`)
      console.log('Instâncias encontradas:', check.data.map((i: any) => i.instanceName))
      return
    }
    console.log(`✅ Instância [${instance}] encontrada e ativa!`)
  } catch (e: any) {
    console.error('❌ ERRO ao conectar na Evolution API. O Docker está rodando?')
    return
  }

  console.log(`2. Tentando disparo de teste para ${phone}...`)
  try {
    const res = await axios.post(`${url}/message/sendText/${instance}`, {
      number: phone,
      text: "Teste de Diagnóstico BarberSystem! ✂️",
      delay: 100
    }, { headers: { apikey } })

    console.log('✅ SUCESSO NO DISPARO!')
    console.log('Resposta:', JSON.stringify(res.data))
  } catch (error: any) {
    console.error('❌ FALHA NO ENVIO:')
    console.error(error.response?.data || error.message)
  }
}

debugWhatsApp()
