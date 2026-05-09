'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ActionButton, EmptyState, PageIntro, SectionFrame, StatusBadge } from '@/components/ui/rjl-primitives'

interface Ticket {
  id: string
  question: string
  response: string | null
  status: 'open' | 'in_progress' | 'closed'
  priority: 'low' | 'medium' | 'high'
  created_at: string
  case_id: string
  client_name: string | null
}

const STATUS_CONFIG = {
  open: { label: 'Abierto', tone: 'danger' },
  in_progress: { label: 'En proceso', tone: 'warning' },
  closed: { label: 'Cerrado', tone: 'success' },
} as const

function AsesorTicketsContent() {
  const params = useSearchParams()
  const caseFilter = params.get('case')
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [responding, setResponding] = useState<string | null>(null)
  const [response, setResponse] = useState('')
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any
      let query = sb
        .from('tickets')
        .select('id, question, response, status, priority, created_at, case_id, cases(profiles!client_id(full_name))')
        .eq('asesor_id', user.id)
        .order('created_at', { ascending: false })
      if (caseFilter) query = query.eq('case_id', caseFilter)
      const { data } = await query
      setTickets((data ?? []).map((ticket: {
        id: string
        question: string
        response: string | null
        status: 'open' | 'in_progress' | 'closed'
        priority: 'low' | 'medium' | 'high'
        created_at: string
        case_id: string
        cases?: { profiles?: { full_name?: string | null } | null } | null
      }) => ({
        ...ticket,
        client_name: ticket.cases?.profiles?.full_name ?? null,
      })))
      setLoading(false)
    }
    load()
  }, [caseFilter, supabase])

  async function submitResponse(ticketId: string) {
    if (!response.trim()) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('tickets').update({
      response: response.trim(),
      status: 'closed',
    }).eq('id', ticketId)
    setTickets((prev) => prev.map((ticket) => ticket.id === ticketId ? { ...ticket, response: response.trim(), status: 'closed' } : ticket))
    setResponding(null)
    setResponse('')
  }

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Asesor · Tickets"
        title="Bandeja completa"
        description="Responde tickets abiertos y conserva contexto del cliente sin perder seguimiento."
        action={<ActionButton href="/asesor" variant="secondary">Volver al workspace</ActionButton>}
      />

      <SectionFrame
        title={caseFilter ? 'Tickets del caso seleccionado' : 'Todos los tickets asignados'}
        description="Vista expandida para responder, cerrar o revisar pendientes."
        aside={caseFilter ? <Link href="/asesor/tickets" className="text-sm text-[#E5C97A] transition hover:text-[#F2EDE0]">Quitar filtro</Link> : null}
      >
        {loading ? (
          <p className="text-sm text-[#F2EDE0]/45">Cargando...</p>
        ) : tickets.length === 0 ? (
          <EmptyState
            title="No hay tickets pendientes."
            description="Cuando un cliente abra una consulta o filtre un caso con actividad, la bandeja aparecera aqui."
          />
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="rounded-2xl border border-white/8 bg-[#0F1B31] p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge tone={STATUS_CONFIG[ticket.status].tone}>{STATUS_CONFIG[ticket.status].label}</StatusBadge>
                  <StatusBadge tone={ticket.priority === 'high' ? 'danger' : ticket.priority === 'medium' ? 'warning' : 'neutral'}>
                    {ticket.priority === 'high' ? 'Alta' : ticket.priority === 'medium' ? 'Media' : 'Normal'}
                  </StatusBadge>
                  <span className="text-xs text-[#F2EDE0]/42">{ticket.client_name ?? 'Cliente'}</span>
                </div>
                <p className="mt-3 text-sm text-[#F2EDE0]">{ticket.question}</p>
                {ticket.response ? (
                  <div className="mt-3 rounded-2xl border border-[#C8A84B]/14 bg-[#172240] p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-[#E5C97A]/80">Tu respuesta</p>
                    <p className="mt-2 text-sm leading-6 text-[#F2EDE0]/76">{ticket.response}</p>
                  </div>
                ) : responding === ticket.id ? (
                  <div className="mt-3 space-y-2">
                    <textarea
                      value={response}
                      onChange={(event) => setResponse(event.target.value)}
                      rows={3}
                      placeholder="Escribe tu respuesta al cliente..."
                      className="w-full resize-none rounded-2xl border border-white/10 bg-[#172240] px-3 py-2.5 text-sm text-[#F2EDE0] outline-none"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => submitResponse(ticket.id)}
                        className="rounded-2xl bg-[linear-gradient(135deg,var(--gold),var(--gold-dim))] px-4 py-2.5 text-sm font-medium text-[#0A1628]"
                      >
                        Enviar respuesta
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setResponding(null)
                          setResponse('')
                        }}
                        className="rounded-2xl border border-white/10 px-4 py-2.5 text-sm text-[#F2EDE0]/68"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setResponding(ticket.id)}
                    className="mt-3 rounded-2xl border border-[#C8A84B]/25 px-4 py-2.5 text-sm text-[#E5C97A] transition hover:border-[#C8A84B]/45"
                  >
                    Responder ticket
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </SectionFrame>
    </div>
  )
}

export default function AsesorTicketsPage() {
  return (
    <Suspense fallback={<div className="min-h-[240px]" />}>
      <AsesorTicketsContent />
    </Suspense>
  )
}
