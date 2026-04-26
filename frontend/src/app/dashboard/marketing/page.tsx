'use client'

import { useState } from 'react'
import { Megaphone, Users, Send, Loader2, Calendar, CheckCircle2, History } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { StatusView } from '@/components/StatusView'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function MarketingPage() {
  const queryClient = useQueryClient()
  const [daysIdle, setDaysIdle] = useState('30')
  const [message, setMessage] = useState('Faz tempo que não te vemos! Que tal dar um trato no visual hoje? Use o cupom VOLTEI10 para 10% de desconto.')

  const { data: campaigns, isLoading, isError, refetch } = useQuery({
    queryKey: ['marketing-campaigns'],
    queryFn: async () => (await api.get('/marketing')).data
  })

  const runMutation = useMutation({
    mutationFn: async (data: any) => api.post('/marketing/run-retention', data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] })
      alert(`Campanha disparada para ${res.data.recipients} clientes!`)
    },
    onError: (error: any) => alert(error.response?.data?.error || 'Erro ao disparar campanha')
  })

  return (
    <div className="p-8 space-y-8 max-w-6xl">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
          <Megaphone className="text-amber-500 w-10 h-10" /> Marketing & Retenção
        </h1>
        <p className="text-zinc-500 font-medium">Recupere clientes ausentes e aumente o faturamento da sua barbearia.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* FORMULÁRIO DE DISPARO */}
        <Card className="lg:col-span-1 bg-zinc-900 border-zinc-800 shadow-xl h-fit">
          <CardHeader>
            <CardTitle className="text-zinc-100 flex items-center gap-2 text-lg">
              <Send className="w-4 h-4 text-amber-500" /> Nova Campanha
            </CardTitle>
            <CardDescription>Envie avisos automáticos via WhatsApp e E-mail.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-zinc-500 uppercase">Clientes ausentes há (dias)</span>
              <Input 
                type="number" 
                className="bg-black/50 border-zinc-800" 
                value={daysIdle} 
                onChange={e => setDaysIdle(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-zinc-500 uppercase">Mensagem Personalizada</span>
              <Textarea 
                className="bg-black/50 border-zinc-800 min-h-[120px]" 
                placeholder="Escreva o convite aqui..."
                value={message}
                onChange={e => setMessage(e.target.value)}
              />
              <p className="text-[10px] text-zinc-600 mt-1">O sistema adicionará "Olá, [Nome do Cliente]!" no início automaticamente.</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full bg-amber-500 text-zinc-950 font-black hover:bg-amber-600"
              disabled={runMutation.isPending || !message}
              onClick={() => runMutation.mutate({ daysIdle: Number(daysIdle), message })}
            >
              {runMutation.isPending ? <Loader2 className="animate-spin" /> : 'DISPARAR AGORA'}
            </Button>
          </CardFooter>
        </Card>

        {/* HISTÓRICO DE CAMPANHAS */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-black uppercase text-zinc-500 flex items-center gap-2">
            <History className="w-4 h-4" /> Histórico de Disparos
          </h3>
          
          <StatusView 
            isLoading={isLoading} 
            isError={isError} 
            isEmpty={campaigns?.length === 0}
            emptyTitle="Nenhuma campanha enviada"
            emptyMessage="Suas campanhas de retenção aparecerão aqui."
            icon={Megaphone}
            onRetry={refetch}
          >
            <div className="space-y-3">
              {campaigns?.map((camp: any) => (
                <Card key={camp.id} className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-all">
                  <CardContent className="p-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-zinc-800 rounded-lg">
                        <Users className="w-5 h-5 text-zinc-400" />
                      </div>
                      <div>
                        <p className="font-bold text-zinc-200">{camp.name}</p>
                        <p className="text-xs text-zinc-500 line-clamp-1 max-w-md">{camp.message}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <Badge variant="outline" className="text-amber-500 border-amber-500/20">{camp.recipients} envios</Badge>
                        {camp.status === 'COMPLETED' ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-600 mt-1 font-mono uppercase">
                        {format(new Date(camp.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </StatusView>
        </div>
      </div>
    </div>
  )
}
