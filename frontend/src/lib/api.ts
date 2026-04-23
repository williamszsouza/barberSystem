import axios from 'axios'

// 🛡️ DINAMISMO: Em produção usa a variável do Render, em dev usa localhost
const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3334'

export const api = axios.create({
  baseURL,
})

export const BARBERSHOP_ID = '6eaef11b-dd00-47b9-b46c-dd1039d22f15'

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
      const savedUser = typeof window !== 'undefined' ? localStorage.getItem('barber_user') : null
      const user = savedUser ? JSON.parse(savedUser) : null
      localStorage.clear()
      if (user?.role === 'SUPERADMIN') {
        window.location.href = '/superadmin/login'
      } else {
        window.location.href = '/'
      }
    }
    return Promise.reject(error)
  }
)
