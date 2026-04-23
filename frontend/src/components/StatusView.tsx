'use client'

import { Loader2, Inbox, AlertCircle, LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface StatusViewProps {
  isLoading?: boolean
  isError?: boolean
  isEmpty?: boolean
  emptyMessage?: string
  emptyTitle?: string
  icon?: LucideIcon
  children: React.ReactNode
  onRetry?: () => void
}

export function StatusView({
  isLoading,
  isError,
  isEmpty,
  emptyTitle = "Nenhum registro encontrado",
  emptyMessage = "Não há dados para exibir neste momento.",
  icon: Icon = Inbox,
  children,
  onRetry
}: StatusViewProps) {
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 animate-in fade-in duration-500">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-amber-500/20 rounded-full" />
          <Loader2 className="w-12 h-12 text-amber-500 animate-spin absolute inset-0" />
        </div>
        <p className="text-zinc-500 font-medium animate-pulse">Carregando informações...</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6 text-center animate-in zoom-in-95">
        <div className="p-4 bg-red-500/10 rounded-full">
           <AlertCircle className="w-12 h-12 text-red-500" />
        </div>
        <div className="space-y-1">
           <h3 className="text-xl font-bold text-white">Ops! Algo deu errado</h3>
           <p className="text-zinc-500 max-w-xs mx-auto text-sm">Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.</p>
        </div>
        {onRetry && (
           <Button variant="outline" onClick={onRetry} className="border-zinc-800">
              Tentar novamente
           </Button>
        )}
      </div>
    )
  }

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="p-4 bg-zinc-900 rounded-full border border-zinc-800 shadow-2xl">
           <Icon className="w-12 h-12 text-zinc-700" />
        </div>
        <div className="space-y-1">
           <h3 className="text-xl font-bold text-zinc-200">{emptyTitle}</h3>
           <p className="text-zinc-500 max-w-xs mx-auto text-sm">{emptyMessage}</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
