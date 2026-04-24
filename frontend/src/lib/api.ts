import axios from 'axios'

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3334'

export const api = axios.create({
  baseURL,
})

// ATUALIZADO PARA O BANCO DE PRODUÇÃO (RENDER)
export const BARBERSHOP_ID = '355ab9a9-b011-4bd2-ac83-cc921c0659dd'

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
      window.location.href = '/'
    }
    return Promise.reject(error)
  }
)
