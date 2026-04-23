'use client'

import { useState } from 'react'
import { ShieldAlert, Loader2, KeyRound } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

export default function SuperAdminLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await api.post('/auth/login', { email, password })
      const { user, token } = response.data

      if (user.role !== 'SUPERADMIN') {
        throw new Error('Acesso negado. Esta área é restrita ao administrador da plataforma.')
      }

      localStorage.setItem('barber_token', token)
      localStorage.setItem('barber_user', JSON.stringify(user))
      
      router.push('/superadmin')
    } catch (error: any) {
      alert(error.message || error.response?.data?.error || 'Erro no acesso mestre')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="inline-flex p-4 bg-amber-500/10 rounded-full border border-amber-500/20 mb-4 animate-pulse">
           <ShieldAlert className="w-12 h-12 text-amber-500" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-[0.3em] text-white uppercase italic">SaaS <span className="text-amber-500">Master</span></h1>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Backoffice Central de Controle</p>
        </div>

        <Card className="bg-zinc-900/50 border-zinc-800 shadow-[0_0_50px_-12px_rgba(245,158,11,0.2)]">
          <CardHeader className="text-left">
            <CardTitle className="text-xl flex items-center gap-2">
               <KeyRound className="w-5 h-5 text-amber-500" /> Identificação Mestre
            </CardTitle>
            <CardDescription>Insira as credenciais de acesso de alto nível.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input 
                type="email" 
                placeholder="E-mail do Dono" 
                className="bg-black/50 border-zinc-800 h-12"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input 
                type="password" 
                placeholder="Senha Secreta" 
                className="bg-black/50 border-zinc-800 h-12"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Button className="w-full bg-amber-500 hover:bg-amber-600 text-black font-black h-12 transition-all" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : 'AUTENTICAR NO NÚCLEO'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-[10px] text-zinc-700 font-bold uppercase tracking-widest">
           Sistema Protegido por Criptografia de Nível Militar
        </p>
      </div>
    </div>
  )
}
