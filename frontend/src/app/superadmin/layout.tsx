'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    if (pathname === '/superadmin/login') {
      setIsAuthorized(true)
      return
    }

    const savedUser = localStorage.getItem('barber_user')
    const user = savedUser ? JSON.parse(savedUser) : null

    if (!user || user.role !== 'SUPERADMIN') {
      router.push('/superadmin/login')
    } else {
      setIsAuthorized(true)
    }
  }, [pathname, router])

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
      </div>
    )
  }

  return <>{children}</>
}
