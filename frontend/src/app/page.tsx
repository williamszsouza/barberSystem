'use client'

import { useState } from 'react'
import { LogIn, UserPlus, Scissors, Loader2, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

export default function EntryPage() {
  const router = useRouter()
  const [view, setView] = useState<'options' | 'login' | 'register'>('options')
  const [loading, setLoading] = useState(false)

  // Estados do Form
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Estados do Registro
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regPassword, setRegPassword] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await api.post('/auth/login', { email, password })
      const { user, token } = response.data
      
      // Salvar Token
      localStorage.setItem('barber_token', token)
      localStorage.setItem('barber_user', JSON.stringify(user))

      // REDIRECIONAMENTO BASEADO NO CARGO
      if (user.role === 'SUPERADMIN') {
        router.push('/superadmin')
      } else if (user.role === 'ADMIN' || user.role === 'BARBER') {
        router.push('/dashboard')
      } else {
        router.push('/agendar')
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await api.post('/auth/register', { 
        name: regName, 
        email: regEmail, 
        phone: regPhone, 
        password: regPassword,
        barbershopId: '8ca52926-30b1-4fe9-946b-e833af6eb601' // ID da Unidade Local
      })
      
      const { user, token } = response.data
      
      localStorage.setItem('barber_token', token)
      localStorage.setItem('barber_user', JSON.stringify(user))

      alert('Cadastro realizado com sucesso!')
      router.push('/agendar')
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao realizar cadastro')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-950">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="text-amber-500 border-amber-500/20 bg-amber-500/5 px-4 py-1">
             BARBERSYSTEM v1.0
          </Badge>
          <h1 className="text-5xl font-black tracking-tighter text-white">
            SEJA BEM-<span className="text-amber-500">VINDO</span>
          </h1>
          <p className="text-zinc-500 font-medium">Como você deseja acessar hoje?</p>
        </div>

        {view === 'options' && (
          <div className="grid gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Button 
              className="h-24 flex flex-col items-center justify-center gap-1 bg-zinc-900 border-zinc-800 hover:bg-zinc-800 border text-zinc-100 rounded-2xl group transition-all"
              onClick={() => setView('login')}
            >
              <div className="flex items-center gap-2 font-black text-amber-500 text-lg">
                <LogIn className="w-5 h-5" /> ENTRAR NA MINHA CONTA
              </div>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Para Barbeiros e Clientes cadastrados</span>
            </Button>

            <Button 
              className="h-20 flex flex-col items-center justify-center gap-1 bg-zinc-950 border-zinc-900 hover:bg-zinc-900 border text-zinc-300 rounded-2xl"
              onClick={() => setView('register')}
            >
              <div className="flex items-center gap-2 font-bold">
                <UserPlus className="w-4 h-4 text-zinc-500" /> CRIAR NOVO CADASTRO
              </div>
            </Button>

            <div className="relative py-6">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-zinc-900" /></div>
              <div className="relative flex justify-center text-[10px] uppercase font-black tracking-tighter text-zinc-600"><span className="bg-zinc-950 px-4">Acesso Rápido</span></div>
            </div>

            <Button 
              variant="outline"
              className="h-16 border-zinc-800 bg-zinc-900/50 hover:bg-amber-500 hover:text-zinc-950 transition-all font-black text-md rounded-2xl flex items-center justify-between px-8"
              onClick={() => router.push('/agendar')}
            >
              <span>CONTINUAR SEM CONTA</span>
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        )}

        {view === 'login' && (
          <Card className="bg-zinc-900 border-zinc-800 shadow-2xl animate-in zoom-in-95 duration-300">
            <CardHeader>
              <CardTitle>Entrar no Sistema</CardTitle>
              <CardDescription>Use seu e-mail e senha cadastrados.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Input 
                    type="email" 
                    placeholder="exemplo@email.com" 
                    className="bg-zinc-950 border-zinc-800"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Input 
                    type="password" 
                    placeholder="Sua senha secreta" 
                    className="bg-zinc-950 border-zinc-800"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button className="w-full bg-amber-500 text-zinc-950 font-black h-12 hover:bg-amber-600" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" /> : 'ACESSAR AGORA'}
                </Button>
                <Button variant="ghost" className="w-full text-zinc-500 text-xs" onClick={() => setView('options')}>
                   VOLTAR ÀS OPÇÕES
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {view === 'register' && (
          <Card className="bg-zinc-900 border-zinc-800 shadow-2xl animate-in zoom-in-95 duration-300">
            <CardHeader>
              <CardTitle>Criar Nova Conta</CardTitle>
              <CardDescription>Cadastre-se para gerenciar seus agendamentos.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">Nome Completo</span>
                  <Input 
                    placeholder="Seu nome" 
                    className="bg-zinc-950 border-zinc-800"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">E-mail</span>
                  <Input 
                    type="email" 
                    placeholder="seu@email.com" 
                    className="bg-zinc-950 border-zinc-800"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">WhatsApp (com DDD)</span>
                  <Input 
                    placeholder="41999999999" 
                    className="bg-zinc-950 border-zinc-800"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">Senha</span>
                  <Input 
                    type="password" 
                    placeholder="Mínimo 6 caracteres" 
                    className="bg-zinc-950 border-zinc-800"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                  />
                </div>
                <Button className="w-full bg-amber-500 text-zinc-950 font-black h-12 hover:bg-amber-600" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" /> : 'FINALIZAR CADASTRO'}
                </Button>
                <Button variant="ghost" className="w-full text-zinc-500 text-xs" onClick={() => setView('options')}>
                   VOLTAR ÀS OPÇÕES
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <p className="text-center text-[10px] text-zinc-700 uppercase font-bold tracking-[0.2em]">
          Powered by BarberSystem &copy; 2026
        </p>
      </div>
    </div>
  )
}
