'use client'

import { TrendingUp, Users, Calendar as CalendarIcon, DollarSign, Loader2, BarChart3, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function AdminDashboard() {
  const start = startOfMonth(new Date()).toISOString()
  const end = endOfMonth(new Date()).toISOString()

  // Buscar Relatório Detalhado (BI)
  const { data: report, isLoading } = useQuery({
    queryKey: ['report-summary', start, end],
    queryFn: async () => {
      const response = await api.get(`/appointments/reports?startDate=${start}&endDate=${end}`)
      return response.data
    }
  })

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8 max-w-6xl">
      <div className="space-y-2">
        <h1 className="text-4xl font-extrabold tracking-tight">Dashboard Geral</h1>
        <p className="text-zinc-500 font-medium uppercase text-xs tracking-widest">
          Performance de {format(new Date(), "MMMM", { locale: ptBR })}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-zinc-900/50 border-zinc-800 shadow-xl border-t-2 border-t-amber-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-zinc-100">R$ {Number(report?.totalRevenue || 0).toFixed(2)}</div>
            <p className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1">
               <TrendingUp className="w-3 h-3 text-green-500" /> +12% vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Atendimentos</CardTitle>
            <CheckCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-zinc-100">{report?.appointmentsCount || 0}</div>
            <p className="text-[10px] text-zinc-500 mt-1 uppercase font-bold">Serviços realizados</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Ticket Médio</CardTitle>
            <BarChart3 className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-zinc-100">
              R$ {report?.appointmentsCount > 0 ? (report.totalRevenue / report.appointmentsCount).toFixed(2) : '0.00'}
            </div>
            <p className="text-[10px] text-zinc-500 mt-1 uppercase font-bold">Por cliente</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Equipe</CardTitle>
            <Users className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-zinc-100">{report?.barbers?.length || 0}</div>
            <p className="text-[10px] text-zinc-500 mt-1 uppercase font-bold">Barbeiros ativos</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
         <div className="bg-zinc-900/30 border border-zinc-800 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center">
               <CalendarIcon className="w-8 h-8 text-amber-500" />
            </div>
            <h3 className="text-xl font-bold">Gestão de Agenda</h3>
            <p className="text-zinc-500 text-sm max-w-xs">Acesse a aba de agenda para visualizar os próximos cortes e confirmar pagamentos.</p>
         </div>

         <div className="bg-zinc-900/30 border border-zinc-800 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center">
               <BarChart3 className="w-8 h-8 text-amber-500" />
            </div>
            <h3 className="text-xl font-bold">Relatórios de Performance</h3>
            <p className="text-zinc-500 text-sm max-w-xs">Veja quanto cada barbeiro está gerando e exporte os dados para sua contabilidade.</p>
         </div>
      </div>
    </div>
  )
}

import { CheckCircle } from 'lucide-react'
