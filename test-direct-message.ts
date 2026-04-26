import axios from 'axios'

async function testV182() {
  const phone = '5541992522151'
  const url = 'http://localhost:8080/message/sendText/barber_instance'
  const apikey = '4224db922b168'

  console.log(`🚀 Disparando para ${phone} no padrão v1.8.2...`)

  try {
    const res = await axios.post(url, {
      number: phone,
      textMessage: {
        text: "✅ VITÓRIA! Se você recebeu isso, a integração do seu SaaS está 100% pronta para venda! ✂️💈"
      }
    }, { headers: { apikey } })
    
    console.log('✅ SUCESSO NO DISPARO!')
    console.log('ID da Mensagem:', res.data.key?.id)
  } catch (e: any) {
    console.error('❌ ERRO:', e.response?.data || e.message)
  }
}

testV182()
