'use client'

import { useEffect, useRef, useState } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const INITIAL: Message = {
  role: 'assistant',
  content:
    'Hola. Soy el asistente juridico de RJL. Puedo ayudarte a calcular liquidacion, finiquito, aguinaldo, vacaciones y mas. Cuentame tu situacion laboral.',
}

export function PublicChatView() {
  const [messages, setMessages] = useState<Message[]>([INITIAL])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [remaining, setRemaining] = useState(3)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = async () => {
    const text = input.trim()
    if (!text || loading || remaining === 0) return

    const userMsg: Message = { role: 'user', content: text }
    const optimisticHistory = [...messages, userMsg]
    setMessages([...optimisticHistory, { role: 'assistant', content: '' }])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history: optimisticHistory }),
      })

      if (res.status === 429) {
        setMessages([
          ...optimisticHistory,
          {
            role: 'assistant',
            content: 'Alcanzaste el limite de consultas gratuitas. Suscribete por $200 MXN/mes para acceso ilimitado.',
          },
        ])
        setRemaining(0)
        return
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }

      if (!res.body) {
        const assistant = await res.text()
        setMessages([...optimisticHistory, { role: 'assistant', content: assistant }])
      } else {
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let assistant = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          assistant += decoder.decode(value, { stream: true })
          setMessages([...optimisticHistory, { role: 'assistant', content: assistant }])
        }

        assistant += decoder.decode()
        setMessages([...optimisticHistory, { role: 'assistant', content: assistant }])
      }
      setRemaining((r) => Math.max(0, r - 1))
    } catch {
      setMessages([
        ...optimisticHistory,
        { role: 'assistant', content: 'Error de conexion. Intenta de nuevo.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-[620px] flex-col overflow-hidden rounded-[30px] border border-[#C8A84B]/18 bg-[rgba(17,30,53,0.92)] shadow-[0_26px_80px_rgba(4,10,22,0.34)]">
      <div className="border-b border-[#C8A84B]/12 bg-[rgba(10,22,40,0.72)] px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--gold),var(--gold-dim))] font-serif font-semibold text-[#0A1628]">
            RJL
          </div>
          <div>
            <p className="font-medium text-[#F2EDE0]">Asesor virtual laboral</p>
            <p className="text-xs text-[#F2EDE0]/55">
              {remaining > 0
                ? `${remaining} consulta${remaining !== 1 ? 's' : ''} gratuita${remaining !== 1 ? 's' : ''} restante${remaining !== 1 ? 's' : ''} hoy`
                : 'Limite alcanzado - suscribete para continuar'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        <div className="space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className="max-w-[84%] whitespace-pre-wrap px-4 py-3 text-sm leading-relaxed"
                style={{
                  background: m.role === 'user' ? 'var(--navy-light)' : 'rgba(242,237,224,0.05)',
                  color: 'var(--cream)',
                  borderRadius: m.role === 'user' ? '18px 18px 6px 18px' : '18px 18px 18px 6px',
                  border: m.role === 'assistant' ? '1px solid rgba(200,168,75,0.12)' : 'none',
                }}
              >
                {m.content}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t border-[#C8A84B]/12 bg-[rgba(10,22,40,0.72)] px-4 py-4">
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-2xl border border-white/10 bg-[#0F1B31] px-4 py-3 text-sm text-[#F2EDE0] outline-none transition focus:border-[#C8A84B]/35 disabled:opacity-50"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder={
              remaining > 0
                ? 'Cuanto me corresponde de liquidacion?'
                : 'Suscribete para seguir consultando...'
            }
            disabled={loading || remaining === 0}
          />
          <button
            onClick={send}
            disabled={!input.trim() || loading || remaining === 0}
            className="rounded-2xl bg-[linear-gradient(135deg,var(--gold),var(--gold-dim))] px-5 py-3 text-sm font-medium text-[#0A1628] disabled:opacity-40"
          >
            {loading ? '...' : 'Enviar'}
          </button>
        </div>
      </div>
    </div>
  )
}
