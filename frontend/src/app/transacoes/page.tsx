'use client'

import { useState } from 'react'
import { Search, Filter, Loader2, Calendar as CalendarIcon, ChevronLeft, ChevronRight, DollarSign, User, Receipt } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { format, startOfDay, endOfDay, subDays, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { StatusView } from '@/components/StatusView'

export default function TransacoesPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'))

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['transactions', page, search, startDate, endDate],
    queryFn: async () => {
      const response = await api.get(`/finance/transactions`, {
        params: {
          page,
          search,
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
          limit: 10
        }
      })
      return response.data
    }
  })

  return (
    <div className="p-8 space-y-8 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white">Transações</h1>
          <p className="text-zinc-500 font-medium uppercase text-xs tracking-widest mt-1">Fluxo de Caixa Detalhado</p>
        </div>
        <div className="flex gap-2 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
           <div className="flex flex-col px-3 py-1">
              <span className="text-[10px] text-zinc-500 font-bold uppercase">De</span>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent text-sm text-zinc-100 outline-none" />
           </div>
           <div className="w-px bg-zinc-800 my-2" />
           <div className="flex flex-col px-3 py-1">
              <span className="text-[10px] text-zinc-500 font-bold uppercase">Até</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent text-sm text-zinc-100 outline-none" />
           </div>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input 
            placeholder="Pesquisar por nome do cliente..." 
            className="pl-10 bg-zinc-900/50 border-zinc-800 h-12"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Button variant="outline" className="h-12 border-zinc-800 gap-2">
          <Filter className="w-4 h-4" /> Filtros
        </Button>
      </div>

      <StatusView
        isLoading={isLoading}
        isError={isError}
        isEmpty={!data || data.transactions.length === 0}
        emptyTitle="Sem transações no período"
        emptyMessage="Não encontramos nenhum registro financeiro para as datas selecionadas."
        icon={Receipt}
        onRetry={refetch}
      >
        <Card className="bg-zinc-900/50 border-zinc-800 shadow-2xl overflow-hidden animate-in fade-in duration-500">
          <Table>
            <TableHeader className="bg-zinc-950/50">
              <TableRow className="hover:bg-transparent border-zinc-800">
                <TableHead className="pl-6">Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Serviço</TableHead>
                <TableHead className="text-right pr-6">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.transactions.map((t: any) => (
                <TableRow key={t.id} className="border-zinc-800 hover:bg-zinc-800/30 transition-colors">
                  <TableCell className="font-medium text-zinc-400 py-6 pl-6">
                    {format(new Date(t.date), "dd/MM HH:mm")}
                  </TableCell>
                  <TableCell className="font-bold text-zinc-100">
                    {t.appointment?.customer?.name || 'Venda Avulsa'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-zinc-950 border-zinc-800 text-zinc-500 text-[10px] uppercase px-3 py-1 font-bold">
                      {t.appointment?.service?.name || 'Serviço'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-black text-amber-500 text-lg pr-6">
                    R$ {Number(t.amount).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="p-4 border-t border-zinc-800 flex items-center justify-between bg-zinc-950/50">
            <p className="text-xs text-zinc-500 font-medium px-2">
              Mostrando {data?.transactions.length || 0} de {data?.meta.total || 0} registros
            </p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="border-zinc-800 h-8 text-xs font-bold"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-3 h-3 mr-1" /> ANTERIOR
              </Button>
              <div className="flex items-center px-4 text-xs font-black text-amber-500 bg-amber-500/10 rounded-md border border-amber-500/20">
                PÁGINA {page}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="border-zinc-800 h-8 text-xs font-bold"
                onClick={() => setPage(p => p + 1)}
                disabled={page >= (data?.meta.lastPage || 1)}
              >
                PRÓXIMA <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </div>
        </Card>
      </StatusView>
    </div>
  )
}
