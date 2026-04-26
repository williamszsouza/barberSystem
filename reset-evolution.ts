import axios from 'axios'

async function resetWithFixedToken() {
  const headers = { 'apikey': '4224db922b168' }
  const url = 'http://127.0.0.1:8080/instance'

  console.log('🧹 Limpando...')
  try { await axios.delete(`${url}/delete/barber_saas`, { headers }) } catch (e) {}

  console.log('🚀 Criando com Chave Fixa [4224db922b168]...')
  try {
    await axios.post(`${url}/create`, {
      instanceName: 'barber_saas',
      token: '4224db922b168', // 🚀 CHAVE UNIFICADA
      integration: 'baileys'
    }, { headers })
    console.log('✅ SUCESSO!')
  } catch (e: any) {
    console.error('❌ Erro:', e.response?.data || e.message)
  }
}

resetWithFixedToken()
