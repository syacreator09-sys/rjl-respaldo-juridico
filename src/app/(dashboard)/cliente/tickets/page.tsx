'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Ticket {
  id: string
  question: string
  response: string | null
  status: 'open' | 'in_progress' | 'closed'
  priority: 'low' | 'medium' | 'high'
  created_at: string
}

const STATUS_CONFIG = {
  open: { label: 'Abierto', color: '#2196F3' },
  in_progress: { label: 'En proceso', color: '#FF9800' },
  closed: { label: 'Cerrado', color: '#4CAF50' },
}

const PRIORITY_CONFIG = {
  low: { label: 'Bajo', color: 'var(--text-dim)' },
  medium: { label: 'Medio', color: '#FF9800' },
  high: { label: 'Alto', color: '#E07070' },
}

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
  }, [])

  return (
    <div style={{ background: 'var(--navy)', minHeight: '100vh', padding: '1.5rem' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <Link href="/cliente" className="text-xs mb-1 block" style={{ color: 'var(--text-dim)' }}>
              ← Mi expediente
            </Link>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--gold-light)', fontFamily: 'Cormorant Garamond, serif' }}>
              Mis tickets
            </h1>
          </div>
          <Link href="/cliente/tickets/new"
            className="px-4 py-2 rounded-xl text-sm font-medium"
            style={{ background: 'linear-gradient(135deg,var(--gold),var(--gold-dim,#7A6030))', color: 'var(--navy)' }}>
            + Nuevo
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-sm animate-pulse" style={{ color: 'var(--text-dim)' }}>Cargando tickets...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-8 rounded-2xl border text-center"
            style={{ background: 'var(--navy-card)', borderColor: 'rgba(200,168,75,0.1)' }}>
            <p className="text-2xl mb-2">🎫</p>
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--cream)' }}>Sin tickets aún</p>
            <p className="text-xs mb-4" style={{ color: 'var(--text-dim)' }}>
              Crea un ticket para contactar con tu asesor jurídico
            </p>
            <Link href="/cliente/tickets/new"
              className="inline-block px-4 py-2 rounded-xl text-xs font-medium"
              style={{ background: 'linear-gradient(135deg,var(--gold),var(--gold-dim,#7A6030))', color: 'var(--navy)' }}>
              Crear primer ticket
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map(t => (
              <div key={t.id} className="p-4 rounded-2xl border"
                style={{ background: 'var(--navy-card)', borderColor: 'rgba(200,168,75,0.1)' }}>
                <div className="flex justify-between items-start gap-3 mb-2">
                  <p className="text-sm font-medium leading-snug" style={{ color: 'var(--cream)' }}>
                    {t.question.length > 100 ? t.question.slice(0, 100) + '...' : t.question}
                  </p>
                  <span className="text-xs px-2 py-0.5 rounded-lg flex-shrink-0"
                    style={{ background: `${STATUS_CONFIG[t.status].color}22`, color: STATUS_CONFIG[t.status].color }}>
                    {STATUS_CONFIG[t.status].label}
                  </span>
                </div>
                {t.response && (
                  <div className="mt-2 p-3 rounded-lg" style={{ background: 'var(--navy-light)' }}>
                    <p className="text-xs font-medium mb-1" style={{ color: 'var(--gold-dim,#7A6030)' }}>
                      Respuesta del asesor:
                    </p>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--cream)' }}>
                      {t.response}
                    </p>
                  </div>
                )}
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs" style={{ color: PRIORITY_CONFIG[t.priority].color }}>
                    ● {PRIORITY_CONFIG[t.priority].label} prioridad
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-dim)' }}>
                    {new Date(t.created_at).toLocaleDateString('es-MX')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
