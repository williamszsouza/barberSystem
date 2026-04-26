'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, User, Loader2, ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { BARBERSHOP_ID } from '@/lib/api' // 🚀 IMPORTADO

export default function MyAppointments() {
  const [localIds, setLocalIds] = useState<string[]>([])

  useEffect(() => {
    const saved = localStorage.getItem('barber_appointments')
    if (saved) {
      setLocalIds(JSON.parse(saved))
    }
  }, [])

  // 🛡️ CORREÇÃO: Enviando o barbershopId obrigatório
  const { data: appointments, isLoading } = useQuery({
    queryKey: ['my-appointments', localIds, BARBERSHOP_ID],
    queryFn: async () => {
      if (localIds.length === 0) return []
      const response = await api.get(`/appointments/guest?ids=${localIds.join(',')}&barbershopId=${BARBERSHOP_ID}`)
      return response.data
    },
    enabled: localIds.length > 0
  })

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/">
          <button className="p-2 hover:bg-zinc-900 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-zinc-400" />
          </button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Meus Agendamentos</h1>
          <p className="text-zinc-400">Aqui estão seus horários marcados nesta barbearia.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8 text-amber-500" /></div>
      ) : localIds.length === 0 ? (
        <Card className="bg-zinc-900/50 border-zinc-800 border-dashed text-center p-12">
          <CardDescription>Você ainda não possui agendamentos realizados.</CardDescription>
          <Link href="/agendar">
            <button className="mt-4 text-amber-500 font-medium hover:underline font-bold">Agendar agora</button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4">
          {appointments?.map((apt: any) => (
            <Card key={apt.id} className="bg-zinc-900/50 border-zinc-800 overflow-hidden group">
              <div className="flex flex-col md:flex-row">
                <div className="p-6 flex-1 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <Badge variant="outline" className={
                        apt.status === 'COMPLETED' 
                        ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                        : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      }>
                        {apt.status === 'COMPLETED' ? 'Concluído' : 'Agendado'}
                      </Badge>
                      <h3 className="text-xl font-bold mt-2 text-zinc-100">{apt.service.name}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Valor</p>
                      <p className="text-lg font-black text-amber-500">R$ {Number(apt.service.price).toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="flex items-center gap-2 text-zinc-300">
                      <Calendar className="w-4 h-4 text-amber-500" />
                      <span className="text-sm font-medium">{format(new Date(apt.date), "dd 'de' MMMM", { locale: ptBR })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-300">
                      <Clock className="w-4 h-4 text-amber-500" />
                      <span className="text-sm font-medium">{format(new Date(apt.date), "HH:mm'h'")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-300">
                      <User className="w-4 h-4 text-amber-500" />
                      <span className="text-sm font-medium">Barbeiro: {apt.barber.name}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
