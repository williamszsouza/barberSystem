'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useEffect, useState } from 'react'
import { resolveBarbershop } from '@/lib/api'
import { Loader2 } from 'lucide-react'

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    async function init() {
      // 🌐 Resolve o tenant por subdomínio ao carregar a página
      await resolveBarbershop()
      setIsReady(true)
    }
    init()
  }, [])

  if (!isReady) return <div className="flex h-screen items-center justify-center bg-zinc-950"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}