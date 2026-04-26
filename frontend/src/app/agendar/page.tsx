'use client'

import { useState, useEffect } from 'react'
import { Calendar as CalendarIcon, Clock, CheckCircle2, Scissors, User as UserIcon, Loader2, ArrowLeft, Package, Plus, Minus, ShoppingCart } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useQuery, useMutation } from '@tanstack/react-query'
import { api, BARBERSHOP_ID } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

export default function BookingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [selectedService, setSelectedService] = useState<any>(null)
  const [selectedBarber, setSelectedBarber] = useState<any>(null)
  const [cart, setCart] = useState<Record<string, number>>({})

  // 🔍 BUSCA DE DADOS
  const { data: services, isLoading: isLoadingServices } = useQuery({
    queryKey: ['services', BARBERSHOP_ID],
    queryFn: async () => (await api.get(`/services?barbershopId=${BARBERSHOP_ID}`)).data
  })

  const { data: products } = useQuery({
    queryKey: ['products-public', BARBERSHOP_ID],
    queryFn: async () => (await api.get(`/products?barbershopId=${BARBERSHOP_ID}`)).data
  })

  const { data: barbers, isLoading: isLoadingBarbers } = useQuery({
    queryKey: ['barbers-available', BARBERSHOP_ID, date],
    queryFn: async () => {
      const response = await api.get(`/barbers?barbershopId=${BARBERSHOP_ID}&date=${date?.toISOString()}`)
      return response.data
    },
    enabled: !!date
  })

  const { data: availableTimes } = useQuery({
    queryKey: ['available-times', selectedBarber?.id, date],
    queryFn: async () => {
      if (!selectedBarber || !date) return []
      const response = await api.get(`/appointments/available-times?barberId=${selectedBarber.id}&date=${date.toISOString()}&barbershopId=${BARBERSHOP_ID}`)
      return response.data
    },
    enabled: !!selectedBarber && !!date
  })

  const mutation = useMutation({
    mutationFn: async (newAppointment: any) => api.post('/appointments', newAppointment),
    onSuccess: (response) => {
      const saved = localStorage.getItem('barber_appointments')
      const appointments = saved ? JSON.parse(saved) : []
      appointments.push(response.data.id)
      localStorage.setItem('barber_appointments', JSON.stringify(appointments))
      router.push('/my-appointments')
    },
    onError: (error: any) => alert(error.response?.data?.error || 'Erro ao agendar')
  })

  const addToCart = (id: string) => {
    setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }))
  }

  const removeFromCart = (id: string) => {
    setCart(prev => {
      const next = { ...prev }
      if (next[id] > 1) next[id]--
      else delete next[id]
      return next
    })
  }

  const handleBooking = async () => {
    if (!date || !selectedTime || !selectedService || !selectedBarber) return
    
    // 🛡️ PEGA O CLIENTE LOGADO REAL
    const userJson = localStorage.getItem('barber_user')
    if (!userJson) {
      alert('Você precisa estar logado para agendar!')
      router.push('/')
      return
    }
    const loggedUser = JSON.parse(userJson)
    const customerId = loggedUser.id

    const [hours, minutes] = selectedTime.split(':')
    const appointmentDate = new Date(date)
    appointmentDate.setHours(Number(hours), Number(minutes), 0, 0)

    // Converter cart para o formato da API
    const productsArray = Object.entries(cart).map(([productId, quantity]) => ({
      productId,
      quantity
    }))

    mutation.mutate({
      date: appointmentDate.toISOString(),
      serviceId: selectedService.id,
      barberId: selectedBarber.id,
      customerId,
      barbershopId: BARBERSHOP_ID,
      products: productsArray
    })
  }

  if (isLoadingServices) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>
  }

  const totalProductsPrice = products?.reduce((acc: number, p: any) => {
    return acc + (Number(p.price) * (cart[p.id] || 0))
  }, 0) || 0

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 pb-20">
      <div className="text-center space-y-2">
        <div className="flex justify-center gap-2 mb-4">
           <Button variant="ghost" size="sm" className="h-8 text-zinc-500 hover:text-amber-500" onClick={() => router.push('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao Início
           </Button>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-white">
          Agende seu <span className="text-amber-500">Estilo</span>
        </h1>
      </div>

      {/* STEP 1: SERVICES */}
      {step === 1 && (
        <Card className="bg-zinc-900/50 border-zinc-800 shadow-xl animate-in fade-in duration-500">
          <CardHeader><CardTitle>1. Escolha o Serviço</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {services?.map((service: any) => (
              <div 
                key={service.id}
                onClick={() => setSelectedService(service)}
                className={cn(
                  "p-4 rounded-xl border cursor-pointer transition-all",
                  selectedService?.id === service.id ? 'border-amber-500 bg-amber-500/10' : 'border-zinc-800 bg-zinc-950/50 hover:border-zinc-600 shadow-lg'
                )}
              >
                <p className="font-bold text-lg">{service.name}</p>
                <p className="text-amber-500 font-black mt-2">R$ {Number(service.price).toFixed(2)}</p>
              </div>
            ))}
          </CardContent>
          <CardFooter>
             <Button className="w-full h-12 font-black bg-zinc-100 text-zinc-950" disabled={!selectedService} onClick={() => setStep(2)}>PRÓXIMO PASSO</Button>
          </CardFooter>
        </Card>
      )}

      {/* STEP 2: CALENDAR & BARBER */}
      {step === 2 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-right-4">
          <Card className="bg-zinc-900/50 border-zinc-800 shadow-2xl">
            <CardHeader><CardTitle>2. Selecione o Dia</CardTitle></CardHeader>
            <CardContent className="flex justify-center">
              <Calendar mode="single" selected={date} onSelect={(d) => { setDate(d); setSelectedBarber(null); }} locale={ptBR} disabled={(date) => date < new Date() || date.getDay() === 0} />
            </CardContent>
          </Card>
          <Card className="bg-zinc-900/50 border-zinc-800 shadow-2xl">
            <CardHeader>
              <CardTitle>3. Profissionais</CardTitle>
              <CardDescription>Para o dia {date && format(date, "dd/MM")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingBarbers ? <Loader2 className="animate-spin mx-auto text-amber-500" /> : (
                <div className="grid gap-2">
                  {barbers?.map((barber: any) => (
                    <Button
                      key={barber.id}
                      variant={selectedBarber?.id === barber.id ? "default" : "outline"}
                      disabled={!barber.hasAvailability}
                      className={cn("h-14 justify-between", selectedBarber?.id === barber.id ? "bg-amber-500 text-zinc-950" : "border-zinc-800")}
                      onClick={() => setSelectedBarber(barber)}
                    >
                      <span className="flex items-center gap-2"><UserIcon className="w-4 h-4" /> {barber.name}</span>
                      {!barber.hasAvailability && <Badge variant="destructive">LOTADO</Badge>}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button className="w-full h-12 font-black" disabled={!selectedBarber} onClick={() => setStep(3)}>VER HORÁRIOS</Button>
              <Button variant="ghost" onClick={() => setStep(1)}>Voltar</Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* STEP 3: TIME */}
      {step === 3 && (
        <Card className="max-w-md mx-auto bg-zinc-900 border-zinc-800 shadow-2xl animate-in slide-in-from-right-4">
          <CardHeader><CardTitle>4. Escolha o Horário</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-3 gap-2">
            {availableTimes?.map((t: any) => (
              <Button key={t.time} variant={selectedTime === t.time ? "default" : "outline"} disabled={!t.isAvailable} className={selectedTime === t.time ? "bg-amber-500 text-zinc-950" : "border-zinc-800"} onClick={() => setSelectedTime(t.time)}>
                {t.time}
              </Button>
            ))}
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button className="w-full h-12 font-black" disabled={!selectedTime} onClick={() => setStep(4)}>ADICIONAR PRODUTOS</Button>
            <Button variant="ghost" onClick={() => setStep(2)}>Voltar</Button>
          </CardFooter>
        </Card>
      )}

      {/* STEP 4: PRODUCTS VITRINE */}
      {step === 4 && (
        <div className="space-y-6 animate-in slide-in-from-right-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold flex items-center gap-2"><Package className="text-amber-500" /> Turbinar meu Agendamento</h2>
            <Badge variant="outline" className="text-amber-500 border-amber-500/20 px-4 py-1">OPCIONAL</Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {products?.map((product: any) => (
              <Card key={product.id} className="bg-zinc-900/80 border-zinc-800 overflow-hidden group hover:border-amber-500/50 transition-all">
                <CardHeader className="p-4">
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                  <CardDescription className="text-xs line-clamp-1">{product.description}</CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-xl font-black text-amber-500">R$ {Number(product.price).toFixed(2)}</p>
                </CardContent>
                <CardFooter className="p-4 bg-black/20 flex justify-between items-center">
                  {!cart[product.id] ? (
                    <Button variant="outline" size="sm" className="w-full gap-2 border-zinc-700 hover:bg-amber-500 hover:text-zinc-950" onClick={() => addToCart(product.id)}>
                      <Plus className="w-3 h-3" /> ADICIONAR
                    </Button>
                  ) : (
                    <div className="flex items-center justify-between w-full bg-zinc-800 rounded-lg p-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeFromCart(product.id)}><Minus className="w-3 h-3" /></Button>
                      <span className="font-bold">{cart[product.id]}</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => addToCart(product.id)}><Plus className="w-3 h-3" /></Button>
                    </div>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>

          <div className="flex flex-col md:flex-row gap-4 pt-8">
            <Button variant="ghost" onClick={() => setStep(3)}>Voltar</Button>
            <Button className="flex-1 bg-amber-500 text-zinc-950 font-black h-14 text-lg gap-3" onClick={() => setStep(5)}>
               REVISAR E CONFIRMAR <ArrowLeft className="rotate-180 w-5 h-5" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 5: FINAL SUMMARY */}
      {step === 5 && (
        <Card className="max-w-md mx-auto bg-zinc-950 border-amber-500/50 shadow-[0_0_50px_-12px_rgba(245,158,11,0.3)] animate-in zoom-in-95 duration-300">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10 text-amber-500" />
            </div>
            <CardTitle className="text-2xl">Resumo do Agendamento</CardTitle>
            <CardDescription>Confira os detalhes antes de confirmar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
             <div className="space-y-3 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                <div className="flex justify-between text-sm"><span className="text-zinc-500">Serviço</span><span className="font-bold">{selectedService?.name}</span></div>
                <div className="flex justify-between text-sm"><span className="text-zinc-500">Profissional</span><span className="font-bold">{selectedBarber?.name}</span></div>
                <div className="flex justify-between text-sm"><span className="text-zinc-500">Data</span><span className="font-bold">{date && format(date, "dd/MM/yyyy")}</span></div>
                <div className="flex justify-between text-sm"><span className="text-zinc-500">Horário</span><span className="font-bold text-amber-500">{selectedTime}</span></div>
             </div>

             {Object.keys(cart).length > 0 && (
               <div className="space-y-2">
                 <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Produtos Reservados</p>
                 {Object.entries(cart).map(([id, qty]) => {
                   const p = products.find((item: any) => item.id === id)
                   return (
                     <div key={id} className="flex justify-between text-sm">
                       <span className="text-zinc-300">{qty}x {p?.name}</span>
                       <span className="text-zinc-500">R$ {(Number(p?.price) * qty).toFixed(2)}</span>
                     </div>
                   )
                 })}
               </div>
             )}

             <div className="pt-4 border-t border-zinc-800 flex justify-between items-end">
                <span className="font-bold text-zinc-400">TOTAL ESTIMADO</span>
                <span className="text-3xl font-black text-amber-500">R$ {(Number(selectedService?.price) + totalProductsPrice).toFixed(2)}</span>
             </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
             <Button className="w-full bg-amber-500 text-zinc-950 font-black h-14 text-lg" disabled={mutation.isPending} onClick={handleBooking}>
                {mutation.isPending ? <Loader2 className="animate-spin" /> : 'FINALIZAR AGENDAMENTO'}
             </Button>
             <Button variant="ghost" onClick={() => setStep(4)}>Alterar Produtos</Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
