'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Calendar, BarChart3, Scissors, LogOut, LayoutDashboard, DollarSign, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'

export function Sidebar() {
  const pathname = usePathname()
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    const savedUser = localStorage.getItem('barber_user')
    if (savedUser) {
      setUserRole(JSON.parse(savedUser).role)
    }
  }, [])

  const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'BARBER'] },
    { name: 'Agenda', href: '/agenda', icon: Calendar, roles: ['ADMIN', 'BARBER'] },
    { name: 'Equipe', href: '/equipe', icon: Users, roles: ['ADMIN'] },
    { name: 'Transações', href: '/transacoes', icon: DollarSign, roles: ['ADMIN', 'BARBER'] },
    { name: 'Relatórios', href: '/relatorios', icon: BarChart3, roles: ['ADMIN'] },
    { name: 'Ver como Cliente', href: '/agendar', icon: Scissors, roles: ['ADMIN', 'BARBER'] },
  ]

  return (
    <div className="flex flex-col w-64 bg-zinc-950 border-r border-zinc-800 h-full">
      <div className="p-6">
        <h1 className="text-xl font-bold tracking-tighter text-white">BARBER<span className="text-amber-500">SYSTEM</span></h1>
        <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1">
          {userRole === 'ADMIN' ? 'Painel do Proprietário' : 'Painel do Barbeiro'}
        </p>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {menuItems
          .filter(item => userRole && item.roles.includes(userRole))
          .map((item) => {
            const isActive = pathname === item.href
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all group",
                  isActive 
                    ? "bg-amber-500/10 text-amber-500" 
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900"
                )}
              >
                <item.icon className={cn(
                  "w-5 h-5",
                  isActive ? "text-amber-500" : "text-zinc-500 group-hover:text-zinc-300"
                )} />
                {item.name}
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-500" />}
              </Link>
            )
          })}
      </nav>

      <div className="p-4 mt-auto border-t border-zinc-900">
        <button 
          onClick={() => {
            localStorage.clear();
            window.location.href = '/';
          }}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-sm font-medium text-zinc-500 hover:text-red-400 hover:bg-red-500/5 transition-all group"
        >
          <LogOut className="w-5 h-5 text-zinc-600 group-hover:text-red-400" />
          Sair do Sistema
        </button>
      </div>
    </div>
  )
}
