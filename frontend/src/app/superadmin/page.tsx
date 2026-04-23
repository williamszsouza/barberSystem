'use client'

import { useState } from 'react'
import { ShieldCheck, activity, Building2, Ban, CheckCircle, ScrollText, Loader2, Crown, Zap, Rocket, LogOut, User, Mail, Lock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useRouter } from 'next/navigation'

export default function SuperAdminPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [tab, setView] = useState<'tenants' | 'logs'>('tenants')
  const [showAddForm, setShowAddForm] = useState(false)
  
  // Estados do Form Expandido
  const [newShopName, setNewShopName] = useState('')
  const [newShopPlan, setNewShopPlan] = useState<'BASIC' | 'PRO' | 'ENTERPRISE'>('BASIC')
  const [ownerName, setOwnerName] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [ownerPassword, setOwnerPassword] = useState('')

  const { data: tenants, isLoading: isLoadingTenants } = useQuery({
    queryKey: ['saas-tenants'],
    queryFn: async () => (await api.get('/saas/barbershops')).data
  })

  const createMutation = useMutation({
    mutationFn: async (data: any) => api.post('/saas/barbershops', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saas-tenants'] })
      setShowAddForm(false)
      setNewShopName(''); setOwnerName(''); setOwnerEmail(''); setOwnerPassword('');
      alert('Barbearia e conta do proprietário criadas com sucesso!')
    },
    onError: (error: any) => alert(error.response?.data?.error || 'Erro ao criar')
  })

  const { data: logs, isLoading: isLoadingLogs } = useQuery({
    queryKey: ['saas-logs'],
    queryFn: async () => (await api.get('/saas/audit-logs')).data
  })

  const toggleMutation = useMutation({
    mutationFn: async (id: string) => api.patch(`/saas/barbershops/${id}/toggle-status`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saas-tenants'] })
      queryClient.invalidateQueries({ queryKey: ['saas-logs'] })
    }
  })

  const handleLogout = () => {
    localStorage.removeItem('barber_user')
    localStorage.removeItem('barber_token')
    router.push('/superadmin/login')
  }

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'ENTERPRISE': return <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20 gap-1"><Crown className="w-3 h-3" /> ENTERPRISE</Badge>
      case 'PRO': return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 gap-1"><Zap className="w-3 h-3" /> PRO</Badge>
      default: return <Badge variant="outline" className="text-zinc-500 gap-1"><Rocket className="w-3 h-3" /> BASIC</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                <ShieldCheck className="w-8 h-8 text-amber-500" />
             </div>
             <div>
                <h1 className="text-2xl font-black tracking-tighter uppercase">Painel <span className="text-amber-500">Mestre</span></h1>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">SaaS Governance & Audit</p>
             </div>
          </div>
          <div className="flex items-center gap-4">
             {tab === 'tenants' && (
                <Button 
                  className="bg-amber-500 text-zinc-950 font-bold hover:bg-amber-600 gap-2 h-9"
                  onClick={() => setShowAddForm(!showAddForm)}
                >
                  <Building2 className="w-4 h-4" /> NOVO ESTABELECIMENTO
                </Button>
             )}
             <div className="flex gap-2 bg-black/40 p-1 rounded-xl border border-zinc-800">
                <Button variant={tab === 'tenants' ? 'secondary' : 'ghost'} onClick={() => setView('tenants')} className="rounded-lg h-9 text-xs font-bold">Barbearias</Button>
                <Button variant={tab === 'logs' ? 'secondary' : 'ghost'} onClick={() => setView('logs')} className="rounded-lg h-9 text-xs font-bold">Logs</Button>
             </div>
             <Button variant="ghost" onClick={handleLogout} className="text-zinc-500 hover:text-red-500">
                <LogOut className="w-5 h-5" />
             </Button>
          </div>
        </div>

        {tab === 'tenants' ? (
          <div className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <Card className="bg-zinc-900 border-zinc-800 shadow-xl">
                  <CardHeader className="pb-2 text-zinc-500 text-[10px] font-black uppercase tracking-widest">Total de Clientes SaaS</CardHeader>
                  <CardContent className="text-4xl font-black">{tenants?.length || 0}</CardContent>
               </Card>
               <Card className="bg-zinc-900 border-zinc-800 shadow-xl">
                  <CardHeader className="pb-2 text-zinc-500 text-[10px] font-black uppercase tracking-widest">Barbearias Ativas</CardHeader>
                  <CardContent className="text-4xl font-black text-green-500">{tenants?.filter((t:any) => t.isActive).length || 0}</CardContent>
               </Card>
               <Card className="bg-zinc-900 border-zinc-800 shadow-xl">
                  <CardHeader className="pb-2 text-zinc-500 text-[10px] font-black uppercase tracking-widest">Em Atraso / Suspensas</CardHeader>
                  <CardContent className="text-4xl font-black text-red-500">{tenants?.filter((t:any) => !t.isActive).length || 0}</CardContent>
               </Card>
            </div>

            {showAddForm && (
              <Card className="bg-zinc-900 border-amber-500/50 shadow-2xl animate-in slide-in-from-top-4 duration-300">
                <CardHeader>
                  <CardTitle className="text-amber-500">Novo Estabelecimento e Proprietário</CardTitle>
                  <CardDescription>Cadastre a barbearia e a conta mestre do dono simultaneamente.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4 border-r border-zinc-800 pr-6">
                      <h4 className="text-xs font-black uppercase text-zinc-500 flex items-center gap-2"><Building2 className="w-3 h-3" /> Dados da Empresa</h4>
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase">Nome da Barbearia</span>
                        <Input placeholder="Ex: Barbearia Elite" className="bg-black border-zinc-800" value={newShopName} onChange={e => setNewShopName(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase">Plano Selecionado</span>
                        <select 
                          className="w-full h-10 bg-black border border-zinc-800 rounded-md px-3 text-sm text-zinc-300"
                          value={newShopPlan}
                          onChange={(e: any) => setNewShopPlan(e.target.value)}
                        >
                          <option value="BASIC">BASIC</option>
                          <option value="PRO">PRO</option>
                          <option value="ENTERPRISE">ENTERPRISE</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-xs font-black uppercase text-zinc-500 flex items-center gap-2"><User className="w-3 h-3" /> Dados do Proprietário</h4>
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase">Nome do Dono</span>
                        <Input placeholder="Nome completo" className="bg-black border-zinc-800" value={ownerName} onChange={e => setOwnerName(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase">E-mail de Acesso</span>
                        <Input type="email" placeholder="email@dono.com" className="bg-black border-zinc-800" value={ownerEmail} onChange={e => setOwnerEmail(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase">Senha Temporária</span>
                        <Input type="password" placeholder="Mínimo 6 caracteres" className="bg-black border-zinc-800" value={ownerPassword} onChange={e => setOwnerPassword(e.target.value)} />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-zinc-800 flex justify-end gap-3">
                    <Button variant="ghost" className="text-zinc-500" onClick={() => setShowAddForm(false)}>Cancelar</Button>
                    <Button 
                      className="bg-amber-500 text-zinc-950 font-black px-12"
                      disabled={createMutation.isPending || !newShopName || !ownerEmail || !ownerPassword}
                      onClick={() => createMutation.mutate({ 
                        name: newShopName, 
                        plan: newShopPlan,
                        ownerName,
                        ownerEmail,
                        ownerPassword
                      })}
                    >
                      {createMutation.isPending ? <Loader2 className="animate-spin" /> : 'CONCLUIR ONBOARDING'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="bg-zinc-900/50 border-zinc-800 shadow-2xl overflow-hidden">
              <Table>
                <TableHeader className="bg-zinc-950/50 border-b border-zinc-800">
                   <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-6">Estabelecimento</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead className="text-center">Uso (Agenda)</TableHead>
                      <TableHead className="text-center">Assinatura</TableHead>
                      <TableHead className="text-right pr-6">Controle de Mestre</TableHead>
                   </TableRow>
                </TableHeader>
                <TableBody>
                   {isLoadingTenants ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-20"><Loader2 className="animate-spin mx-auto text-amber-500" /></TableCell></TableRow>
                   ) : tenants?.map((shop: any) => (
                      <TableRow key={shop.id} className="border-zinc-800 hover:bg-zinc-800/20 transition-colors">
                         <TableCell className="pl-6 py-6">
                            <p className="font-bold text-zinc-100">{shop.name}</p>
                            <p className="text-[10px] text-zinc-500 font-mono">{shop.id}</p>
                         </TableCell>
                         <TableCell>{getPlanBadge(shop.plan)}</TableCell>
                         <TableCell className="text-center">
                            <span className="text-xs font-bold text-zinc-400">{shop._count.appointments} cortes realizados</span>
                         </TableCell>
                         <TableCell className="text-center">
                            {shop.isActive ? (
                               <Badge className="bg-green-500/10 text-green-500 border-green-500/20">EM DIA</Badge>
                            ) : (
                               <Badge className="bg-red-500/10 text-red-500 border-red-500/20">PENDENTE / SUSPENSO</Badge>
                            )}
                         </TableCell>
                         <TableCell className="text-right pr-6">
                            <Button 
                               variant="outline" 
                               size="sm" 
                               className={shop.isActive ? "border-red-900/50 text-red-500 hover:bg-red-500/10" : "border-green-900/50 text-green-500 hover:bg-green-500/10"}
                               onClick={() => toggleMutation.mutate(shop.id)}
                            >
                               {shop.isActive ? 'Bloquear Acesso' : 'Reativar Sistema'}
                            </Button>
                         </TableCell>
                      </TableRow>
                   ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        ) : (
          <Card className="bg-zinc-900/50 border-zinc-800 shadow-2xl overflow-hidden animate-in fade-in duration-500">
             <Table>
                <TableHeader className="bg-zinc-950/50 border-b border-zinc-800">
                   <TableRow className="hover:bg-transparent uppercase">
                      <TableHead className="pl-6 text-[10px] font-black">Ação</TableHead>
                      <TableHead className="text-[10px] font-black">Autor</TableHead>
                      <TableHead className="text-[10px] font-black">Alvo</TableHead>
                      <TableHead className="text-[10px] font-black">Data/Hora</TableHead>
                      <TableHead className="pr-6 text-[10px] font-black">Contexto</TableHead>
                   </TableRow>
                </TableHeader>
                <TableBody>
                   {isLoadingLogs ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-20"><Loader2 className="animate-spin mx-auto text-amber-500" /></TableCell></TableRow>
                   ) : logs?.map((log: any) => (
                      <TableRow key={log.id} className="border-zinc-800 text-xs">
                         <TableCell className="pl-6 py-5">
                            <Badge variant="outline" className="font-mono text-[9px] border-zinc-700 bg-zinc-800">{log.action}</Badge>
                         </TableCell>
                         <TableCell className="text-zinc-300 font-bold">{log.user.name}</TableCell>
                         <TableCell className="text-zinc-500">{log.barbershop?.name || 'Sistema'}</TableCell>
                         <TableCell className="text-zinc-500 font-medium">{format(new Date(log.createdAt), "dd/MM HH:mm:ss", { locale: ptBR })}</TableCell>
                         <TableCell className="pr-6 text-zinc-400 italic">"{log.details}"</TableCell>
                      </TableRow>
                   ))}
                </TableBody>
             </Table>
          </Card>
        )}
      </div>
    </div>
  )
}
