'use client'

import { usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Button } from './ui/button'

export function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  // Rotas que NÃO exibem Sidebar
  const isPublicRoute = 
    pathname === '/' || 
    pathname === '/agendar' || 
    pathname === '/my-appointments' || 
    pathname === '/suspensa' || 
    pathname.startsWith('/superadmin/login')

  if (isPublicRoute) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans">
        {children}
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-50 font-sans">
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 md:hidden animate-in fade-in duration-300">
          <div className="w-64 h-full relative animate-in slide-in-from-left duration-300">
             <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-4 right-[-50px] text-white"
                onClick={() => setIsMobileMenuOpen(false)}
             >
                <X className="w-8 h-8" />
             </Button>
             <Sidebar />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/50">
          <h1 className="text-lg font-bold tracking-tighter text-white">BARBER<span className="text-amber-500">SYSTEM</span></h1>
          <Button variant="outline" size="icon" onClick={() => setIsMobileMenuOpen(true)} className="border-zinc-800">
            <Menu className="w-6 h-6 text-white" />
          </Button>
        </header>

        <main className="flex-1 overflow-y-auto" onClick={() => setIsMobileMenuOpen(false)}>
          {children}
        </main>
      </div>
    </div>
  )
}
