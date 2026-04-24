'use client'

import { useState } from 'react'
import { Calendar as CalendarIcon, Clock, CheckCircle2, Scissors, User as UserIcon, Loader2, ArrowLeft } from 'lucide-react'
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

  // 🛡️ ID SINCRONIZADO PARA V1 HOMOLOGAÇÃO
  const TEST_CUSTOMER_ID = '68f482f0-04d2-46eb-85e1-dad0e4c16df4'

  const { data: services, isLoading: isLoadingServices } = useQuery({
    queryKey: ['services', BARBERSHOP_ID],
    queryFn: async () => (await api.get(`/services?barbershopId=${BARBERSHOP_ID}`)).data
  })

  const { data: barbers, isLoading: isLoadingBarbers } = useQuery({
    queryKey: ['barbers', BARBERSHOP_ID],
    queryFn: async () => (await api.get(`/barbers?barbershopId=${BARBERSHOP_ID}`)).data
  })

  const { data: availableTimes, isLoading: isLoadingTimes } = useQuery({
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

  const handleBooking = () => {
    if (!date || !selectedTime || !selectedService || !selectedBarber) return
    const [hours, minutes] = selectedTime.split(':')
    const appointmentDate = new Date(date)
    appointmentDate.setHours(Number(hours), Number(minutes), 0, 0)

    mutation.mutate({
      date: appointmentDate.toISOString(),
      serviceId: selectedService.id,
      barberId: selectedBarber.id,
      customerId: TEST_CUSTOMER_ID
    })
  }

  if (isLoadingServices || isLoadingBarbers) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
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

      {step === 1 && (
        <div className="grid grid-cols-1 gap-6 animate-in fade-in duration-500">
          <Card className="bg-zinc-900/50 border-zinc-800 shadow-xl">
            <CardHeader><CardTitle>1. Qual o serviço de hoje?</CardTitle></CardHeader>
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
                  <p className="text-zinc-500 text-xs">{service.duration} minutos</p>
                  <p className="text-amber-500 font-black mt-2">R$ {Number(service.price).toFixed(2)}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800 shadow-xl">
            <CardHeader><CardTitle>2. Com qual profissional?</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              {barbers?.map((barber: any) => (
                <Button
                  key={barber.id}
                  variant={selectedBarber?.id === barber.id ? "default" : "outline"}
                  className={cn(
                    "h-12 px-6",
                    selectedBarber?.id === barber.id ? "bg-amber-500 text-zinc-950 hover:bg-amber-600" : "border-zinc-800 hover:bg-zinc-800"
                  )}
                  onClick={() => setSelectedBarber(barber)}
                >
                  <UserIcon className="w-4 h-4 mr-2" />
                  {barber.name}
                </Button>
              ))}
            </CardContent>
            <CardFooter className="border-t border-zinc-800 pt-6">
              <Button 
                className="w-full h-12 font-black text-md bg-zinc-50 text-zinc-950 hover:bg-zinc-300"
                disabled={!selectedService || !selectedBarber}
                onClick={() => setStep(2)}
              >
                ESCOLHER DATA E HORA
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {step === 2 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start animate-in slide-in-from-right-4 duration-500">
          <Card className="bg-zinc-900/50 border-zinc-800 shadow-2xl">
            <CardHeader><CardTitle>Selecione o Dia</CardTitle></CardHeader>
            <CardContent className="flex justify-center p-2">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => { setDate(d); setSelectedTime(null); }}
                locale={ptBR}
                className="rounded-md border-zinc-800"
                disabled={(date) => date < new Date() || date.getDay() === 0}
              />
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800 shadow-2xl">
            <CardHeader>
              <CardTitle>Horários para {selectedBarber?.name}</CardTitle>
              <CardDescription className="text-amber-500 font-medium">
                {date && format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingTimes ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin text-amber-500" /></div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {availableTimes?.map((t: any) => (
                    <Button
                      key={t.time}
                      variant={selectedTime === t.time ? "default" : "outline"}
                      disabled={!t.isAvailable}
                      className={cn(
                        selectedTime === t.time ? "bg-amber-500 text-zinc-950 font-bold" : "border-zinc-800 opacity-80"
                      )}
                      onClick={() => setSelectedTime(t.time)}
                    >
                      {t.time}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-3 pt-6 border-t border-zinc-800">
              <div className="w-full bg-zinc-950 p-4 rounded-lg border border-zinc-800 mb-2">
                 <div className="flex justify-between text-xs text-zinc-500 mb-1">
                    <span>Resumo</span>
                    <span className="text-amber-500">{selectedService?.name}</span>
                 </div>
                 <div className="flex justify-between font-bold">
                    <span>Total a pagar</span>
                    <span className="text-lg text-zinc-100">R$ {Number(selectedService?.price || 0).toFixed(2)}</span>
                 </div>
              </div>
              <Button 
                className="w-full bg-amber-500 text-zinc-950 hover:bg-amber-600 font-black h-14 text-lg"
                disabled={!selectedTime || mutation.isPending}
                onClick={handleBooking}
              >
                {mutation.isPending ? <Loader2 className="animate-spin" /> : 'CONFIRMAR AGENDAMENTO'}
              </Button>
              <Button variant="ghost" className="text-zinc-500" onClick={() => setStep(1)}>Voltar</Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  )
}
