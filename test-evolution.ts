import axios from 'axios'

async function ultimateTest() {
  const integrations = ['baileys', 'whatsapp', 'WHATSAPP', 'BAILEYS']
  
  for (const integration of integrations) {
    console.log(`🚀 Testando integração: ${integration}`)
    try {
      const res = await axios.post('http://localhost:8080/instance/create', {
        instanceName: 'barber_instance',
        integration: integration,
        qrcode: true
      }, {
        headers: { 'apikey': '4224db922b168' }
      })
      console.log(`✅✅✅ SUCESSO COM: ${integration}`)
      console.log(res.data)
      return
    } catch (e: any) {
      console.log(`❌ Falhou com ${integration} (Status: ${e.response?.status})`)
    }
  }
}

ultimateTest()
