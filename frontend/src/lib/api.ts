import axios from 'axios'

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3334'
})

// 🌐 Lógica de Resolução Dinâmica de Tenant (Subdomínio)
export const resolveBarbershop = async () => {
  if (typeof window === 'undefined') return null

  const hostname = window.location.hostname
  const parts = hostname.split('.')

  // Detecção de subdomínio
  let slug = parts.length > 1 && parts[0] !== 'localhost' ? parts[0] : null

  if (!slug) {
    return localStorage.getItem('barber_tenant_id') || '8ca52926-30b1-4fe9-946b-e833af6eb601'
  }

  try {
    const res = await api.get(`/barbershops/by-slug/${slug}`)
    const shopId = res.data.id
    localStorage.setItem('barber_tenant_id', shopId)
    console.log(`✅ Tenant Resolvido: ${slug} -> ${shopId}`)
    return shopId
  } catch (e) {
    console.error('❌ Falha ao resolver barbearia pelo subdomínio:', slug)
    return localStorage.getItem('barber_tenant_id')
  }
}

// 🛡️ CORREÇÃO: BARBERSHOP_ID agora é um Getter dinâmico
export const getActiveBarbershopId = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('barber_tenant_id') || '8ca52926-30b1-4fe9-946b-e833af6eb601'
  }
  return '8ca52926-30b1-4fe9-946b-e833af6eb601'
}

// Para manter compatibilidade com o código atual:
export const BARBERSHOP_ID = getActiveBarbershopId()


api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('barber_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403 && error.response?.data?.error === 'ACESSO_SUSPENSO') {
      if (typeof window !== 'undefined') {
        window.location.href = '/suspensa'
      }
    }
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        localStorage.removeItem('barber_token')
        localStorage.removeItem('barber_user')
        window.location.href = '/'
      }
    }
    return Promise.reject(error)
  }
)
