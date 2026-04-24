'use client'

import { useState } from 'react'
import { Scissors, Plus, Trash2, Loader2, DollarSign, Clock, LayoutGrid } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { StatusView } from '@/components/StatusView'

export default function ServicesPage() {
  const queryClient = useQueryClient()
  const [showAddForm, setShowAddForm] = useState(false)

  // Estados do Form
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [duration, setDuration] = useState('')

  // 1. Listar Serviços
  const { data: services, isLoading, isError, refetch } = useQuery({
    queryKey: ['services-mgmt'],
    queryFn: async () => (await api.get('/services-mgmt')).data
  })

  // 2. Mutação Adicionar
  const addMutation = useMutation({
    mutationFn: async (newData: any) => api.post('/services-mgmt', newData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services-mgmt'] })
      queryClient.invalidateQueries({ queryKey: ['services'] }) // Atualiza o agendamento público também
      setShowAddForm(false)
      setName(''); setPrice(''); setDuration('');
    },
    onError: (error: any) => alert(error.response?.data?.error || 'Erro ao adicionar serviço')
  })

  // 3. Mutação Remover
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/services-mgmt/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services-mgmt'] })
      queryClient.invalidateQueries({ queryKey: ['services'] })
    }
  })

  return (
    <div className="p-8 space-y-8 max-w-6xl">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white">Catálogo de Serviços</h1>
          <p className="text-zinc-500 font-medium">Defina os serviços, preços e tempos de duração da sua barbearia.</p>
        </div>
        <Button 
          className="bg-amber-500 text-zinc-950 font-bold gap-2 hover:bg-amber-600 h-12 px-6 shadow-lg shadow-amber-500/10"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <Plus className="w-5 h-5" /> NOVO SERVIÇO
        </Button>
      </div>

      {showAddForm && (
        <Card className="bg-zinc-900 border-amber-500/50 shadow-2xl animate-in slide-in-from-top-4 duration-300">
           <CardHeader>
              <CardTitle className="text-amber-500">Cadastrar Novo Serviço</CardTitle>
              <CardDescription>O novo serviço aparecerá instantaneamente para seus clientes.</CardDescription>
           </CardHeader>
           <CardContent>
              <form className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end" onSubmit={(e) => {
                e.preventDefault();
                addMutation.mutate({ name, price: Number(price), duration: Number(duration) });
              }}>
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">Nome do Serviço</span>
                  <Input placeholder="Ex: Corte Degradê" className="bg-black/50 border-zinc-800" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">Preço (R$)</span>
                  <Input type="number" placeholder="0.00" className="bg-black/50 border-zinc-800" value={price} onChange={e => setPrice(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">Duração (min)</span>
                  <Input type="number" placeholder="Minutos" className="bg-black/50 border-zinc-800" value={duration} onChange={e => setDuration(e.target.value)} required />
                </div>
                <Button className="bg-zinc-100 text-zinc-950 font-bold h-10" disabled={addMutation.isPending}>
                  {addMutation.isPending ? <Loader2 className="animate-spin" /> : 'CRIAR SERVIÇO'}
                </Button>
              </form>
           </CardContent>
        </Card>
      )}

      <StatusView 
        isLoading={isLoading} 
        isError={isError} 
        isEmpty={services?.length === 0}
        emptyTitle="Sem serviços ativos"
        emptyMessage="Você ainda não configurou seu catálogo de serviços."
        icon={Scissors}
        onRetry={refetch}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services?.map((service: any) => (
            <Card key={service.id} className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-600 transition-all group overflow-hidden">
               <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                     <div className="p-2 bg-amber-500/10 rounded-lg">
                        <Scissors className="w-5 h-5 text-amber-500" />
                     </div>
                     <Button 
                       variant="ghost" 
                       size="sm" 
                       className="text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                       onClick={() => { if(confirm('Excluir serviço?')) deleteMutation.mutate(service.id) }}
                     >
                        <Trash2 className="w-4 h-4" />
                     </Button>
                  </div>
                  <CardTitle className="text-xl mt-4 text-zinc-100">{service.name}</CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                  <div className="flex items-center gap-6">
                     <div className="flex items-center gap-2 text-zinc-400">
                        <Clock className="w-4 h-4 text-zinc-600" />
                        <span className="text-sm">{service.duration} min</span>
                     </div>
                     <div className="flex items-center gap-2 text-amber-500 font-black">
                        <DollarSign className="w-4 h-4" />
                        <span className="text-lg">R$ {Number(service.price).toFixed(2)}</span>
                     </div>
                  </div>
                  <div className="pt-4 border-t border-zinc-800">
                     <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Status</span>
                     <div className="flex items-center gap-2 mt-1">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-xs text-zinc-400 font-medium">Disponível para agendamento</span>
                     </div>
                  </div>
               </CardContent>
            </Card>
          ))}
        </div>
      </StatusView>
    </div>
  )
}
