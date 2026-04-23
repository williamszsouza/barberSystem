'use client'

import { BarChart3, Loader2, TrendingUp, DollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

export default function RelatoriosPage() {
  const start = startOfMonth(new Date()).toISOString()
  const end = endOfMonth(new Date()).toISOString()

  const { data: report, isLoading } = useQuery({
    queryKey: ['report-full', start, end],
    queryFn: async () => (await api.get(`/appointments/reports?startDate=${start}&endDate=${end}`)).data
  })

  if (isLoading) {
    return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="animate-spin text-amber-500 w-8 h-8" /></div>
  }

  return (
    <div className="p-8 space-y-8 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-100">Relatórios de Performance</h1>
          <p className="text-zinc-500 font-medium text-sm">Análise detalhada de faturamento por profissional.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <Card className="bg-zinc-900/50 border-zinc-800 shadow-xl overflow-hidden">
            <CardHeader className="bg-amber-500/5 border-b border-zinc-800">
               <CardTitle className="text-amber-500 flex items-center gap-2 text-base">
                  <TrendingUp className="w-5 h-5" /> Resumo do Mês
               </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
               <div className="flex justify-between items-center">
                  <span className="text-zinc-500 font-medium uppercase text-[10px] tracking-widest">Faturamento Bruto</span>
                  <span className="text-3xl font-black text-zinc-100">R$ {Number(report?.totalRevenue || 0).toFixed(2)}</span>
               </div>
               <div className="flex justify-between items-center">
                  <span className="text-zinc-500 font-medium uppercase text-[10px] tracking-widest">Total de Atendimentos</span>
                  <span className="text-xl font-bold text-zinc-200">{report?.appointmentsCount || 0} cortes</span>
               </div>
               <div className="pt-4 border-t border-zinc-800 flex justify-between items-center text-amber-500/80">
                  <span className="font-bold text-[10px] uppercase tracking-widest">Ticket Médio</span>
                  <span className="text-lg font-black">R$ {report?.appointmentsCount > 0 ? (report.totalRevenue / report.appointmentsCount).toFixed(2) : '0.00'}</span>
               </div>
            </CardContent>
         </Card>

         <div className="bg-zinc-900/20 border border-zinc-800 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center">
               <BarChart3 className="w-6 h-6 text-zinc-500" />
            </div>
            <p className="text-zinc-500 text-sm max-w-[240px]">Análise avançada: Em breve teremos comparativos e metas por período.</p>
         </div>
      </div>

      <Card className="bg-zinc-900/50 border-zinc-800 shadow-2xl overflow-hidden animate-in fade-in duration-500">
        <CardHeader className="bg-zinc-950/30 border-b border-zinc-800">
          <CardTitle className="flex items-center gap-2 text-lg">
             <BarChart3 className="w-5 h-5 text-amber-500" /> Performance Individual
          </CardTitle>
          <CardDescription>Valores acumulados por cada profissional da equipe.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-zinc-950/50">
              <TableRow className="hover:bg-transparent uppercase border-zinc-800">
                <TableHead className="pl-8 text-[10px] font-black tracking-widest">Profissional</TableHead>
                <TableHead className="text-center text-[10px] font-black tracking-widest">Volume</TableHead>
                <TableHead className="text-right text-[10px] font-black tracking-widest pr-8">Faturamento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report?.barbers?.map((b: any) => (
                <TableRow key={b.name} className="border-zinc-800 hover:bg-zinc-800/20 transition-colors">
                  <TableCell className="font-bold py-6 text-zinc-100 pl-8">{b.name}</TableCell>
                  <TableCell className="text-center">
                     <Badge variant="outline" className="bg-zinc-950 border-zinc-700 text-zinc-400 px-3 py-1 font-bold">
                        {b.count} serviços
                     </Badge>
                  </TableCell>
                  <TableCell className="text-right font-black text-amber-500 text-xl pr-8">
                    R$ {b.total.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
