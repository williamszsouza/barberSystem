'use client'

import { useState } from 'react'
import { Users, UserPlus, Trash2, Loader2, Mail, Phone, ShieldCheck } from 'lucide-react'
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

export default function TeamPage() {
  const queryClient = useQueryClient()
  const [showAddForm, setShowAddForm] = useState(false)

  // Estados do Form
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // 1. Listar Barbeiros
  const { data: team, isLoading, isError, refetch } = useQuery({
    queryKey: ['team'],
    queryFn: async () => (await api.get('/team')).data
  })

  // 2. Mutação Adicionar
  const addMutation = useMutation({
    mutationFn: async (newData: any) => api.post('/team', newData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] })
      setShowAddForm(false)
      setName(''); setEmail(''); setPassword('');
    },
    onError: (error: any) => alert(error.response?.data?.error || 'Erro ao adicionar')
  })

  // 3. Mutação Remover
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/team/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['team'] })
  })

  return (
    <div className="p-8 space-y-8 max-w-6xl">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white">Minha Equipe</h1>
          <p className="text-zinc-500 font-medium">Gerencie os barbeiros profissionais do seu estabelecimento.</p>
        </div>
        <Button 
          className="bg-amber-500 text-zinc-950 font-bold gap-2 hover:bg-amber-600"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <UserPlus className="w-4 h-4" /> ADICIONAR BARBEIRO
        </Button>
      </div>

      {showAddForm && (
        <Card className="bg-zinc-900 border-amber-500/50 shadow-2xl animate-in slide-in-from-top-4 duration-300">
           <CardHeader>
              <CardTitle className="text-amber-500">Novo Profissional</CardTitle>
              <CardDescription>Crie o acesso para um novo barbeiro da sua equipe.</CardDescription>
           </CardHeader>
           <CardContent>
              <form className="grid grid-cols-1 md:grid-cols-4 gap-4" onSubmit={(e) => {
                e.preventDefault();
                addMutation.mutate({ name, email, password });
              }}>
                <Input placeholder="Nome Completo" className="bg-black/50 border-zinc-800" value={name} onChange={e => setName(e.target.value)} required />
                <Input type="email" placeholder="E-mail" className="bg-black/50 border-zinc-800" value={email} onChange={e => setEmail(e.target.value)} required />
                <Input type="password" placeholder="Senha inicial" className="bg-black/50 border-zinc-800" value={password} onChange={e => setPassword(e.target.value)} required />
                <Button className="bg-zinc-100 text-zinc-950 font-bold" disabled={addMutation.isPending}>
                  {addMutation.isPending ? <Loader2 className="animate-spin" /> : 'CADASTRAR'}
                </Button>
              </form>
           </CardContent>
        </Card>
      )}

      <StatusView 
        isLoading={isLoading} 
        isError={isError} 
        isEmpty={team?.length === 0}
        emptyTitle="Equipe Vazia"
        emptyMessage="Você ainda não cadastrou nenhum barbeiro. Adicione seu primeiro profissional agora!"
        icon={Users}
        onRetry={refetch}
      >
        <Card className="bg-zinc-900/50 border-zinc-800 shadow-2xl overflow-hidden">
          <Table>
            <TableHeader className="bg-zinc-950/50">
              <TableRow className="border-zinc-800 hover:bg-transparent uppercase">
                <TableHead className="pl-6 text-[10px] font-black">Profissional</TableHead>
                <TableHead className="text-[10px] font-black">Contato</TableHead>
                <TableHead className="text-[10px] font-black">Nível</TableHead>
                <TableHead className="text-right pr-6 text-[10px] font-black">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {team?.map((b: any) => (
                <TableRow key={b.id} className="border-zinc-800 hover:bg-zinc-800/30 transition-colors">
                  <TableCell className="pl-6 py-5">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center font-bold text-amber-500 border border-amber-500/20">
                          {b.name.charAt(0)}
                       </div>
                       <p className="font-bold text-zinc-200">{b.name}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                       <div className="flex items-center gap-2 text-xs text-zinc-400"><Mail className="w-3 h-3" /> {b.email}</div>
                       {b.phone && <div className="flex items-center gap-2 text-xs text-zinc-500"><Phone className="w-3 h-3" /> {b.phone}</div>}
                    </div>
                  </TableCell>
                  <TableCell>
                     <div className="flex items-center gap-1.5 text-xs font-bold text-blue-400">
                        <ShieldCheck className="w-3.5 h-3.5" /> Profissional
                     </div>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-zinc-600 hover:text-red-500 hover:bg-red-500/5"
                      onClick={() => {
                        if(confirm('Tem certeza que deseja remover este profissional?')) {
                          deleteMutation.mutate(b.id)
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </StatusView>
    </div>
  )
}
