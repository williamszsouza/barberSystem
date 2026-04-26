import axios from 'axios'
import fs from 'fs'
import path from 'fs'

async function run() {
  const url = 'http://127.0.0.1:8080/instance/connect/barber_saas'
  const headers = { 'apikey': '4224db922b168' }

  console.log('📡 Buscando Base64...')
  try {
    const res = await axios.get(url, { headers })
    if (res.data && res.data.base64) {
      const base64Data = res.data.base64.replace(/^data:image\/png;base64,/, '')
      const filePath = 'C:\\Users\\biolo\\projects\\barberSystem\\qrcode.png'
      
      // @ts-ignore
      fs.writeFileSync(filePath, base64Data, 'base64')
      console.log('✅ ARQUIVO CRIADO MANUALMENTE EM:', filePath)
    } else {
      console.log('⏳ A API ainda não gerou o código. Tente rodar em 5 segundos.')
    }
  } catch (e: any) {
    console.error('❌ ERRO:', e.message)
  }
}

run()
