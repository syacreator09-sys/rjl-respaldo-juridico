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

      const assistant = await res.text()
      setMessages([...optimisticHistory, { role: 'assistant', content: assistant }])
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
    <div className="flex h-[600px] flex-col rounded-xl border bg-background shadow-sm">
      <div className="border-b px-4 py-3">
        <p className="font-semibold text-foreground">Asesor Juridico RJL</p>
        <p className="text-xs text-muted-foreground">
          {remaining > 0
            ? `${remaining} consulta${remaining !== 1 ? 's' : ''} gratuita${remaining !== 1 ? 's' : ''} restante${remaining !== 1 ? 's' : ''} hoy`
            : 'Limite alcanzado - suscribete para continuar'}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t px-4 py-3">
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
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
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-40"
          >
            {loading ? '...' : 'Enviar'}
          </button>
        </div>
      </div>
    </div>
  )
}
