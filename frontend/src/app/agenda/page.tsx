'use client'

import { Calendar as CalendarIcon, CheckCircle, Clock, User, Scissors } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { StatusView } from '@/components/StatusView'

export default function AgendaPage() {
  const queryClient = useQueryClient()

  const { data: appointments, isLoading, isError, refetch } = useQuery({
    queryKey: ['appointments-full'],
    queryFn: async () => (await api.get('/appointments')).data
  })

  const completeMutation = useMutation({
    mutationFn: async (id: string) => api.patch(`/appointments/${id}/complete`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments-full'] })
  })

  return (
    <div className="p-8 space-y-8 max-w-6xl">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white">Agenda Completa</h1>
          <p className="text-zinc-500 font-medium mt-1 text-sm uppercase tracking-widest">Controle de atendimentos diários</p>
        </div>
      </div>

      <StatusView 
        isLoading={isLoading} 
        isError={isError} 
        isEmpty={appointments?.length === 0}
        emptyTitle="Sua agenda está vazia"
        emptyMessage="Nenhum horário foi agendado até o momento. Compartilhe seu link de agendamento!"
        icon={CalendarIcon}
        onRetry={refetch}
      >
        <Card className="bg-zinc-900/50 border-zinc-800 shadow-2xl overflow-hidden animate-in fade-in duration-500">
          <CardHeader className="bg-zinc-950/50 border-b border-zinc-800">
            <CardTitle className="text-base flex items-center gap-2">
               <Clock className="w-4 h-4 text-amber-500" /> Próximos Clientes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-zinc-950/50">
                <TableRow className="hover:bg-transparent border-zinc-800">
                  <TableHead className="pl-6">Data/Hora</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Serviço</TableHead>
                  <TableHead className="text-right pr-6">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments?.map((apt: any) => (
                  <TableRow key={apt.id} className="border-zinc-800 hover:bg-zinc-800/30 transition-colors">
                    <TableCell className="font-bold py-6 pl-6">
                      {format(new Date(apt.date), "dd/MM 'às' HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="font-medium text-zinc-300">
                       <div className="flex items-center gap-2">
                          <User className="w-3 h-3 text-zinc-500" />
                          {apt.customer.name}
                       </div>
                    </TableCell>
                    <TableCell>
                       <Badge variant="outline" className="text-[10px] uppercase font-bold border-zinc-700 bg-zinc-900 text-zinc-400">
                          {apt.service.name}
                       </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      {apt.status === 'SCHEDULED' ? (
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="hover:bg-amber-500 hover:text-zinc-950 font-bold transition-all gap-2 h-8"
                          onClick={() => completeMutation.mutate(apt.id)}
                          disabled={completeMutation.isPending}
                        >
                          {completeMutation.isPending ? '...' : <><CheckCircle className="h-3 w-3" /> Concluir</>}
                        </Button>
                      ) : (
                        <Badge className="bg-green-500/10 text-green-500 border-green-500/20 px-3">Concluído</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </StatusView>
    </div>
  )
}
