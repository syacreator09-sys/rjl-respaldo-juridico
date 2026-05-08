'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

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
  open: { label: 'Abierto', color: '#2196F3' },
  in_progress: { label: 'En proceso', color: '#FF9800' },
  closed: { label: 'Cerrado', color: '#4CAF50' },
}

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
      setTickets((data ?? []).map((t: {
        id: string; question: string; response: string | null;
        status: 'open' | 'in_progress' | 'closed'; priority: 'low' | 'medium' | 'high';
        created_at: string; case_id: string;
        cases?: { profiles?: { full_name?: string | null } | null } | null
      }) => ({
        ...t,
        client_name: (t.cases?.profiles?.full_name) ?? null,
      })))
      setLoading(false)
    }
    load()
  }, [caseFilter])

  async function submitResponse(ticketId: string) {
    if (!response.trim()) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('tickets').update({
      response: response.trim(),
      status: 'closed',
    }).eq('id', ticketId)
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, response: response.trim(), status: 'closed' } : t))
    setResponding(null)
    setResponse('')
  }

  return (
    <div style={{ background: 'var(--navy)', minHeight: '100vh', padding: '1.5rem' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <Link href="/asesor" className="text-xs mb-4 block" style={{ color: 'var(--text-dim)' }}>← Panel asesor</Link>
        <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--gold-light)', fontFamily: 'Cormorant Garamond, serif' }}>
          Tickets asignados
        </h1>
        {loading ? (
          <p className="text-sm animate-pulse text-center" style={{ color: 'var(--text-dim)' }}>Cargando...</p>
        ) : tickets.length === 0 ? (
          <div className="p-8 rounded-2xl border text-center"
            style={{ background: 'var(--navy-card)', borderColor: 'rgba(200,168,75,0.1)' }}>
            <p className="text-sm" style={{ color: 'var(--text-dim)' }}>No hay tickets pendientes</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map(t => (
              <div key={t.id} className="p-4 rounded-2xl border"
                style={{ background: 'var(--navy-card)', borderColor: 'rgba(200,168,75,0.1)' }}>
                <div className="flex justify-between items-start mb-2">
                  <p className="text-xs font-medium" style={{ color: 'var(--gold-dim,#7A6030)' }}>
                    {t.client_name ?? 'Cliente'}
                  </p>
                  <span className="text-xs px-2 py-0.5 rounded-lg"
                    style={{ background: `${STATUS_CONFIG[t.status].color}22`, color: STATUS_CONFIG[t.status].color }}>
                    {STATUS_CONFIG[t.status].label}
                  </span>
                </div>
                <p className="text-sm mb-3" style={{ color: 'var(--cream)' }}>{t.question}</p>
                {t.response ? (
                  <div className="p-3 rounded-lg" style={{ background: 'var(--navy-light)' }}>
                    <p className="text-xs font-medium mb-1" style={{ color: 'var(--gold-dim,#7A6030)' }}>Tu respuesta:</p>
                    <p className="text-xs" style={{ color: 'var(--cream)' }}>{t.response}</p>
                  </div>
                ) : responding === t.id ? (
                  <div className="space-y-2">
                    <textarea value={response} onChange={e => setResponse(e.target.value)} rows={3}
                      placeholder="Escribe tu respuesta al cliente..."
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                      style={{ background: 'var(--navy-light)', color: 'var(--cream)' }} />
                    <div className="flex gap-2">
                      <button onClick={() => submitResponse(t.id)}
                        className="flex-1 py-2 rounded-xl text-xs font-medium"
                        style={{ background: 'linear-gradient(135deg,var(--gold),var(--gold-dim,#7A6030))', color: 'var(--navy)' }}>
                        Enviar respuesta
                      </button>
                      <button onClick={() => { setResponding(null); setResponse('') }}
                        className="py-2 px-4 rounded-xl text-xs border"
                        style={{ borderColor: 'rgba(200,168,75,0.3)', color: 'var(--text-dim)' }}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setResponding(t.id)}
                    className="w-full py-2 rounded-xl text-xs font-medium border"
                    style={{ borderColor: 'rgba(200,168,75,0.3)', color: 'var(--gold-light)' }}>
                    Responder ticket
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function AsesorTicketsPage() {
  return (
    <Suspense fallback={<div style={{ background: 'var(--navy)', minHeight: '100vh' }} />}>
      <AsesorTicketsContent />
    </Suspense>
  )
}
