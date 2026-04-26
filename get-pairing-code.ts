import axios from 'axios'

async function getPairingCode() {
  const headers = { 'apikey': '4224db922b168' }
  const instance = 'barber_instance'
  const phone = '5541992846326'

  console.log(`🚀 Solicitando Pairing Code para ${phone}...`)
  try {
    const res = await axios.get(`http://localhost:8080/instance/connectionState/${instance}?number=${phone}`, { headers })
    // Algumas versões usam a busca de status para disparar o pairing
    console.log('\n✅ SEU CÓDIGO:', res.data.instance.pairingCode || 'Código indisponível nesta versão')
    console.log('\n👉 O QUE FAZER:')
    console.log('1. No WhatsApp: Configurações -> Aparelhos Conectados')
    console.log('2. Clique em: CONECTAR UM APARELHO')
    console.log('3. Embaixo da câmera, clique em: CONECTAR COM NÚMERO DE TELEFONE')
    console.log('4. Digite o código acima!')
  } catch (error: any) {
    console.error('❌ Erro:', error.response?.data || error.message)
  }
}

getPairingCode()
