'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewTicketPage() {
  const router = useRouter()
  const [question, setQuestion] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!question.trim()) return
    setLoading(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any
      const { data: caseRow } = await sb
        .from('cases')
        .select('id')
        .eq('client_id', user.id)
        .single() as { data: { id: string } | null }

      if (!caseRow) { setError('No tienes un caso activo. Créalo primero.'); setLoading(false); return }

      await sb.from('tickets').insert({
        case_id: caseRow.id,
        client_id: user.id,
        question: question.trim(),
        priority,
        status: 'open',
      })
      router.push('/cliente/tickets')
    } catch {
      setError('Error al crear el ticket. Intenta de nuevo.')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ background: 'var(--navy)', minHeight: '100vh', padding: '1.5rem' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <Link href="/cliente/tickets" className="text-xs mb-4 block" style={{ color: 'var(--text-dim)' }}>
          ← Mis tickets
        </Link>
        <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--gold-light)', fontFamily: 'Cormorant Garamond, serif' }}>
          Nuevo ticket
        </h1>
        <form onSubmit={submit} className="space-y-4 p-5 rounded-2xl border"
          style={{ background: 'var(--navy-card)', borderColor: 'rgba(200,168,75,0.15)' }}>
          <div>
            <label className="block text-xs mb-1.5" style={{ color: 'var(--text-dim)' }}>
              Describe tu situación o pregunta
            </label>
            <textarea value={question} onChange={e => setQuestion(e.target.value)} required rows={5}
              placeholder="Ej: Me despidieron el 15 de mayo después de 3 años de trabajo. Mi salario diario era de $350. ¿Cuánto me corresponde de liquidación?"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
              style={{ background: 'var(--navy-light)', color: 'var(--cream)' }} />
          </div>
          <div>
            <label className="block text-xs mb-1.5" style={{ color: 'var(--text-dim)' }}>
              Prioridad
            </label>
            <select value={priority} onChange={e => setPriority(e.target.value as typeof priority)}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: 'var(--navy-light)', color: 'var(--cream)' }}>
              <option value="low">Baja — consulta general</option>
              <option value="medium">Media — situación activa</option>
              <option value="high">Alta — urgente, plazo próximo</option>
            </select>
          </div>
          {error && <p className="text-xs" style={{ color: '#E07070' }}>{error}</p>}
          <button type="submit" disabled={loading || !question.trim()}
            className="w-full py-3 rounded-xl font-semibold text-sm disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,var(--gold),var(--gold-dim,#7A6030))', color: 'var(--navy)' }}>
            {loading ? 'Enviando...' : 'Enviar ticket al asesor'}
          </button>
        </form>
      </div>
    </div>
  )
}
