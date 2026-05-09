'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ActionButton, EmptyState, PageIntro, SectionFrame, StatusBadge } from '@/components/ui/rjl-primitives'

interface Ticket {
  id: string
  question: string
  response: string | null
  status: 'open' | 'in_progress' | 'closed'
  priority: 'low' | 'medium' | 'high'
  created_at: string
}

const STATUS_CONFIG = {
  open: { label: 'Abierto', tone: 'info' },
  in_progress: { label: 'En proceso', tone: 'warning' },
  closed: { label: 'Cerrado', tone: 'success' },
} as const

const PRIORITY_CONFIG = {
  low: { label: 'Normal', tone: 'neutral' },
  medium: { label: 'Media', tone: 'warning' },
  high: { label: 'Alta', tone: 'danger' },
} as const

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('tickets')
        .select('id, question, response, status, priority, created_at')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })
      setTickets(data ?? [])
      setLoading(false)
    }
    load()
  }, [supabase])

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Cliente · Consultas"
        title="Historial completo de tickets"
        description="Consulta lo enviado, lo respondido y lo que sigue pendiente con tu asesor."
        action={<ActionButton href="/cliente/tickets/new">Nueva consulta</ActionButton>}
      />

      <SectionFrame
        title="Consultas recientes"
        description="Todas las conversaciones que ya pasaron a seguimiento humano."
        aside={<Link href="/cliente" className="text-sm text-[#E5C97A] transition hover:text-[#F2EDE0]">Volver al expediente</Link>}
      >
        {loading ? (
          <p className="text-sm text-[#F2EDE0]/45">Cargando tickets...</p>
        ) : tickets.length === 0 ? (
          <EmptyState
            title="Sin tickets todavia."
            description="Cuando necesites revision humana, crea aqui una nueva consulta y el asesor la recibira en su bandeja."
            action={<ActionButton href="/cliente/tickets/new">Crear ticket</ActionButton>}
          />
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="rounded-2xl border border-white/8 bg-[#0F1B31] p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge tone={STATUS_CONFIG[ticket.status].tone}>{STATUS_CONFIG[ticket.status].label}</StatusBadge>
                  <StatusBadge tone={PRIORITY_CONFIG[ticket.priority].tone}>{PRIORITY_CONFIG[ticket.priority].label}</StatusBadge>
                  <span className="text-xs text-[#F2EDE0]/42">{new Date(ticket.created_at).toLocaleDateString('es-MX')}</span>
                </div>
                <p className="mt-3 text-sm text-[#F2EDE0]">
                  {ticket.question.length > 170 ? `${ticket.question.slice(0, 170)}...` : ticket.question}
                </p>
                {ticket.response ? (
                  <div className="mt-3 rounded-2xl border border-[#C8A84B]/14 bg-[#172240] p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-[#E5C97A]/80">Respuesta del asesor</p>
                    <p className="mt-2 text-sm leading-6 text-[#F2EDE0]/76">{ticket.response}</p>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </SectionFrame>
    </div>
  )
}
