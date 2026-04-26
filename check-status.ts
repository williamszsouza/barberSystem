import axios from 'axios'

async function checkStatus() {
  const headers = { 'apikey': '4224db922b168' }
  const instance = 'barber_instance'

  try {
    const res = await axios.get(`http://localhost:8080/instance/connectionState/${instance}`, { headers })
    console.log(`📊 STATUS ATUAL:`, res.data.instance.state)
    
    if (res.data.instance.state !== 'open') {
      console.log('⚠️ O WhatsApp NÃO está conectado. Você precisa escanear o QR Code de novo.')
    } else {
      console.log('✅ O WhatsApp está conectado corretamente!')
    }
  } catch (error: any) {
    console.error('❌ Não foi possível obter o status. Talvez a instância tenha caído.')
  }
}

checkStatus()
