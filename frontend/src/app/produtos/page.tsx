'use client'

import { useState } from 'react'
import { Package, Plus, Trash2, Loader2, DollarSign, Box, Image as ImageIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { StatusView } from '@/components/StatusView'
import { cn } from '@/lib/utils'

export default function ProductsPage() {
  const queryClient = useQueryClient()
  const [showAddForm, setShowAddForm] = useState(false)

  // Estados do Form
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('')
  const [description, setDescription] = useState('')

  // 1. Listar Produtos
  const { data: response, isLoading, isError, refetch } = useQuery({
    queryKey: ['products-mgmt'],
    queryFn: async () => (await api.get('/products-mgmt')).data
  })

  const products = response?.data || []

  // 2. Mutação Adicionar
  const addMutation = useMutation({
    mutationFn: async (newData: any) => api.post('/products-mgmt', newData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products-mgmt'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setShowAddForm(false)
      setName(''); setPrice(''); setStock(''); setDescription('');
    },
    onError: (error: any) => alert(error.response?.data?.error || 'Erro ao adicionar produto')
  })

  // 3. Mutação Remover
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/products-mgmt/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products-mgmt'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    }
  })

  return (
    <div className="p-8 space-y-8 max-w-6xl">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white">Vitrine de Produtos</h1>
          <p className="text-zinc-500 font-medium">Gerencie o estoque e preços dos itens que seus clientes podem reservar.</p>
        </div>
        <Button 
          className="bg-amber-500 text-zinc-950 font-bold gap-2 hover:bg-amber-600 h-12 px-6 shadow-lg shadow-amber-500/10"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <Plus className="w-5 h-5" /> NOVO PRODUTO
        </Button>
      </div>

      {showAddForm && (
        <Card className="bg-zinc-900 border-amber-500/50 shadow-2xl animate-in slide-in-from-top-4 duration-300">
           <CardHeader>
              <CardTitle className="text-amber-500">Cadastrar Novo Item</CardTitle>
              <CardDescription>O produto ficará disponível no fluxo de agendamento online.</CardDescription>
           </CardHeader>
           <CardContent>
              <form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end" onSubmit={(e) => {
                e.preventDefault();
                addMutation.mutate({ 
                  name, 
                  price: Number(price), 
                  stock: Number(stock),
                  description 
                });
              }}>
                <div className="space-y-2 lg:col-span-2">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">Nome do Produto</span>
                  <Input placeholder="Ex: Pomada Efeito Matte" className="bg-black/50 border-zinc-800" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">Preço (R$)</span>
                  <Input type="number" placeholder="0.00" className="bg-black/50 border-zinc-800" value={price} onChange={e => setPrice(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">Estoque Inicial</span>
                  <Input type="number" placeholder="Qtd" className="bg-black/50 border-zinc-800" value={stock} onChange={e => setStock(e.target.value)} required />
                </div>
                <Button className="bg-zinc-100 text-zinc-950 font-bold h-10" disabled={addMutation.isPending}>
                  {addMutation.isPending ? <Loader2 className="animate-spin" /> : 'CRIAR PRODUTO'}
                </Button>
              </form>
           </CardContent>
        </Card>
      )}

      <StatusView 
        isLoading={isLoading} 
        isError={isError} 
        isEmpty={products?.length === 0}
        emptyTitle="Estoque Vazio"
        emptyMessage="Você ainda não cadastrou produtos para venda."
        icon={Package}
        onRetry={refetch}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products?.map((product: any) => (
            <Card key={product.id} className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-600 transition-all group overflow-hidden">
               <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                     <div className="p-2 bg-amber-500/10 rounded-lg">
                        <Package className="w-5 h-5 text-amber-500" />
                     </div>
                     <Button 
                       variant="ghost" 
                       size="sm" 
                       className="text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                       onClick={() => { if(confirm('Excluir produto?')) deleteMutation.mutate(product.id) }}
                     >
                        <Trash2 className="w-4 h-4" />
                     </Button>
                  </div>
                  <CardTitle className="text-xl mt-4 text-zinc-100">{product.name}</CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                  <div className="flex items-center gap-6">
                     <div className="flex items-center gap-2 text-zinc-400">
                        <Box className="w-4 h-4 text-zinc-600" />
                        <span className={cn("text-sm font-bold", product.stock <= 5 ? "text-red-500" : "text-green-500")}>
                          {product.stock} em estoque
                        </span>
                     </div>
                     <div className="flex items-center gap-2 text-amber-500 font-black">
                        <DollarSign className="w-4 h-4" />
                        <span className="text-lg">R$ {Number(product.price).toFixed(2)}</span>
                     </div>
                  </div>
                  <div className="pt-4 border-t border-zinc-800 flex justify-between items-center">
                     <div>
                        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Venda Online</span>
                        <div className="flex items-center gap-2 mt-1">
                           <div className={cn("w-2 h-2 rounded-full", product.isActive ? "bg-green-500" : "bg-zinc-700")} />
                           <span className="text-xs text-zinc-400 font-medium">{product.isActive ? 'Ativo na vitrine' : 'Oculto'}</span>
                        </div>
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
