'use client'

import { AlertOctagon, Headset, MessageSquare } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function SuspendedPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-zinc-900 border-red-500/50 shadow-[0_0_50px_-12px_rgba(239,68,68,0.2)]">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
            <AlertOctagon className="w-10 h-10 text-red-500" />
          </div>
          <CardTitle className="text-2xl font-black text-white uppercase tracking-tight">Acesso Suspenso</CardTitle>
          <CardDescription className="text-zinc-400">Identificamos uma pendência na sua assinatura da plataforma.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-black/40 border border-zinc-800 p-4 rounded-xl space-y-3">
             <p className="text-sm text-zinc-300 leading-relaxed text-center">
               Para reativar seu acesso, gerenciar sua equipe e voltar a receber agendamentos, entre em contato com nosso time de suporte técnico.
             </p>
          </div>
          
          <div className="grid gap-3">
            <Button 
              className="w-full bg-zinc-100 text-zinc-950 font-bold h-12 gap-2 hover:bg-zinc-200"
              onClick={() => window.open('https://wa.me/SEU_NUMERO_SUPORTE', '_blank')}
            >
              <MessageSquare className="w-4 h-4" /> FALAR COM SUPORTE NO WHATSAPP
            </Button>
            <Button 
              variant="outline" 
              className="w-full border-zinc-800 text-zinc-400 h-12 gap-2"
              onClick={() => window.location.href = '/'}
            >
              <Headset className="w-4 h-4" /> ABRIR CHAMADO VIA E-MAIL
            </Button>
          </div>

          <p className="text-[10px] text-center text-zinc-600 uppercase font-bold tracking-widest pt-4">
            BarberSystem Control Panel
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
