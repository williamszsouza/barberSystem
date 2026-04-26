'use client'

import { useState } from 'react'
import { Settings, Clock, Calendar, Ban, Loader2, Save, Trash2, User } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { StatusView } from '@/components/StatusView'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const DAYS_OF_WEEK = [
  'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'
]

export default function ConfigPage() {
  const queryClient = useQueryClient()
  
  // 1. DADOS DE FUNCIONAMENTO
  const { data: businessHours, isLoading: isLoadingHours } = useQuery({
    queryKey: ['config-hours'],
    queryFn: async () => (await api.get('/config/business-hours')).data
  })

  // 2. DADOS DE FOLGAS
  const { data: timeOffs, isLoading: isLoadingOffs } = useQuery({
    queryKey: ['config-time-off'],
    queryFn: async () => (await api.get('/config/time-off')).data
  })

  // 3. LISTA DE BARBEIROS (Para o form de folga)
  const { data: team } = useQuery({
    queryKey: ['team-list'],
    queryFn: async () => (await api.get('/team')).data
  })

  // MUTAÇÕES
  const updateHoursMutation = useMutation({
    mutationFn: async (data: any) => api.put('/config/business-hours', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config-hours'] })
      alert('Horários atualizados com sucesso!')
    }
  })

  const addTimeOffMutation = useMutation({
    mutationFn: async (data: any) => api.post('/config/time-off', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config-time-off'] })
      alert('Bloqueio de agenda criado!')
    }
  })

  const deleteTimeOffMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/config/time-off/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['config-time-off'] })
  })

  const [localHours, setLocalHours] = useState<any[]>([])
  
  // 🛡️ CORREÇÃO: Sincroniza localHours usando useEffect para evitar loop infinito
  useEffect(() => {
    if (businessHours) {
      setLocalHours(businessHours)
    }
  }, [businessHours])

  const handleHourChange = (index: number, field: string, value: any) => {
    const next = [...localHours]
    next[index] = { ...next[index], [field]: value }
    setLocalHours(next)
  }

  return (
    <div className="p-8 space-y-8 max-w-6xl">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
          <Settings className="text-amber-500 w-10 h-10" /> Configurações da Unidade
        </h1>
        <p className="text-zinc-500 font-medium">Defina as regras de funcionamento e bloqueios de agenda.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* HORÁRIOS DE FUNCIONAMENTO */}
        <Card className="bg-zinc-900 border-zinc-800 shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" /> Horário de Funcionamento
            </CardTitle>
            <CardDescription>Defina quando sua barbearia está de portas abertas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {localHours.map((hour, idx) => (
              <div key={hour.dayOfWeek} className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-zinc-800/50">
                <span className="text-xs font-bold text-zinc-300 w-24">{DAYS_OF_WEEK[hour.dayOfWeek]}</span>
                <div className="flex items-center gap-2">
                  <Input 
                    type="time" 
                    className="w-24 bg-zinc-950 border-zinc-800 h-8 text-xs" 
                    value={hour.openTime} 
                    onChange={e => handleHourChange(idx, 'openTime', e.target.value)}
                    disabled={hour.isClosed}
                  />
                  <span className="text-zinc-600">até</span>
                  <Input 
                    type="time" 
                    className="w-24 bg-zinc-950 border-zinc-800 h-8 text-xs" 
                    value={hour.closeTime} 
                    onChange={e => handleHourChange(idx, 'closeTime', e.target.value)}
                    disabled={hour.isClosed}
                  />
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <input 
                    type="checkbox" 
                    checked={hour.isClosed} 
                    onChange={e => handleHourChange(idx, 'isClosed', e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-800 bg-zinc-950 accent-amber-500"
                  />
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">Fechado</span>
                </div>
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full bg-zinc-100 text-zinc-900 font-bold hover:bg-white gap-2"
              onClick={() => updateHoursMutation.mutate(localHours)}
              disabled={updateHoursMutation.isPending}
            >
              {updateHoursMutation.isPending ? <Loader2 className="animate-spin" /> : <Save className="w-4 h-4" />}
              SALVAR HORÁRIOS
            </Button>
          </CardFooter>
        </Card>

        {/* BLOQUEIOS E FOLGAS (TIME OFF) */}
        <div className="space-y-6">
          <Card className="bg-zinc-900 border-zinc-800 shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Ban className="w-4 h-4 text-red-500" /> Bloquear Horários (Folgas/Almoço)
              </CardTitle>
              <CardDescription>Impeça agendamentos em períodos específicos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form className="space-y-3" onSubmit={(e) => {
                e.preventDefault()
                const form = e.target as any
                addTimeOffMutation.mutate({
                  barberId: form.barberId.value,
                  startTime: new Date(form.start.value).toISOString(),
                  endTime: new Date(form.end.value).toISOString(),
                  reason: form.reason.value
                })
              }}>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase">Profissional</span>
                    <select name="barberId" className="w-full h-9 bg-black border border-zinc-800 rounded-md px-3 text-xs text-zinc-300">
                      {team?.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase">Motivo</span>
                    <Input name="reason" placeholder="Ex: Almoço" className="bg-black border-zinc-800 h-9 text-xs" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase">Início</span>
                    <Input name="start" type="datetime-local" className="bg-black border-zinc-800 h-9 text-xs" required />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase">Fim</span>
                    <Input name="end" type="datetime-local" className="bg-black border-zinc-800 h-9 text-xs" required />
                  </div>
                </div>
                <Button type="submit" className="w-full bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 font-bold h-9 text-xs" disabled={addTimeOffMutation.isPending}>
                  CRIAR BLOQUEIO
                </Button>
              </form>
            </CardContent>
          </Card>

          <h3 className="text-sm font-black uppercase text-zinc-500 flex items-center gap-2">
            <History className="w-4 h-4" /> Bloqueios Ativos
          </h3>

          <StatusView 
            isLoading={isLoadingOffs} 
            isEmpty={timeOffs?.length === 0}
            emptyTitle="Sem bloqueios"
            emptyMessage="Folgas e intervalos aparecerão aqui."
            icon={Calendar}
          >
            <div className="space-y-2">
              {timeOffs?.map((off: any) => (
                <div key={off.id} className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-zinc-600" />
                    <div>
                      <p className="text-xs font-bold text-zinc-200">{off.barber.name}</p>
                      <p className="text-[10px] text-zinc-500 uppercase">
                        {format(new Date(off.startTime), "dd/MM HH:mm")} até {format(new Date(off.endTime), "HH:mm")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-[9px] uppercase border-zinc-800">{off.reason || 'Folga'}</Badge>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-zinc-600 hover:text-red-500"
                      onClick={() => deleteTimeOffMutation.mutate(off.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </StatusView>
        </div>
      </div>
    </div>
  )
}
