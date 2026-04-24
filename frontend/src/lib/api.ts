import axios from 'axios'

// 🛡️ Suporte a múltiplos nomes de variáveis para evitar erros de deploy
const baseURL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_API_PUBLIC_URL || 'http://localhost:3334'

console.log('[API] Conectando em:', baseURL)

export const api = axios.create({
  baseURL,
})

export const BARBERSHOP_ID = 'bb006384-57cf-4d5b-bce3-d7b8d60e7ddb'

api.interceptors.request.use((config) => {
  const savedUser = typeof window !== 'undefined' ? localStorage.getItem('barber_user') : null
  const user = savedUser ? JSON.parse(savedUser) : null
  const token = typeof window !== 'undefined' ? localStorage.getItem('barber_token') : null

  if (user) {
    config.headers['x-barbershop-id'] = user.barbershopId
    config.headers['x-user-id'] = user.id
    config.headers['x-user-role'] = user.role
  } else {
    config.headers['x-barbershop-id'] = BARBERSHOP_ID
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRoute = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/register')
    
    if ((error.response?.status === 403 || error.response?.status === 401) && !isAuthRoute) {
      localStorage.removeItem('barber_user')
      localStorage.removeItem('barber_token')
      
      const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('barber_user') || '{}') : null
      
      if (user?.role === 'SUPERADMIN' || window.location.pathname.startsWith('/superadmin')) {
        window.location.href = '/superadmin/login'
      } else {
        window.location.href = '/'
      }
    }
    return Promise.reject(error)
  }
)
