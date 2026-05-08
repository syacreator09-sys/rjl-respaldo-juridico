'use client'

import { useEffect, useRef, useState } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ClientChatViewProps {
  caseId?: string
  initialMessages?: Message[]
}

const EMPTY_STATE: Message = {
  role: 'assistant',
  content:
    'Hola. Soy tu asesor juridico de RJL. Puedo ayudarte a revisar tu caso laboral, calcular montos y orientarte sobre siguientes pasos.',
}

export function ClientChatView({ caseId, initialMessages = [] }: ClientChatViewProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages.length ? initialMessages : [EMPTY_STATE])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(e?: React.FormEvent) {
    e?.preventDefault()
    if (!input.trim() || loading) return

    const userMsg: Message = { role: 'user', content: input.trim() }
    const optimisticHistory = [...messages, userMsg]
    setMessages([...optimisticHistory, { role: 'assistant', content: '' }])
    setInput('')
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: optimisticHistory,
          caseId,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Error desconocido' }))
        const errorMsg =
          res.status === 402
            ? 'Tu suscripcion no esta activa. Activa tu plan para continuar.'
            : data.error ?? 'Error al contactar al asistente. Intenta de nuevo.'
        setMessages([...optimisticHistory, { role: 'assistant', content: errorMsg }])
        return
      }

      const assistant = await res.text()
      setMessages([...optimisticHistory, { role: 'assistant', content: assistant }])
    } catch {
      const errorMsg = 'Error de conexion. Verifica tu internet e intenta de nuevo.'
      setMessages([...optimisticHistory, { role: 'assistant', content: errorMsg }])
      setError(errorMsg)
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div
      className="flex flex-col rounded-2xl overflow-hidden border"
      style={{ background: 'var(--navy-card)', borderColor: 'rgba(200,168,75,0.2)', minHeight: 560 }}
    >
      <div
        className="flex items-center gap-3 px-4 py-3 border-b"
        style={{ background: 'var(--navy-mid)', borderColor: 'rgba(200,168,75,0.15)' }}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,var(--gold),var(--gold-dim))', color: 'var(--navy)' }}
        >
          RJL
        </div>
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--gold-light)' }}>
            Asesor Juridico RJL
          </p>
          <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
            Chat premium con contexto de tu expediente
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && (
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mr-2 mt-1 flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,var(--gold),var(--gold-dim))', color: 'var(--navy)' }}
              >
                R
              </div>
            )}
            <div
              className="max-w-[80%] px-4 py-3 text-sm leading-relaxed"
              style={{
                background: m.role === 'user' ? 'var(--navy-light)' : 'var(--navy-mid)',
                color: 'var(--cream)',
                borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                border: m.role === 'assistant' ? '1px solid rgba(200,168,75,0.15)' : 'none',
                whiteSpace: 'pre-wrap',
              }}
            >
              {m.content || (loading && i === messages.length - 1 ? '...' : '')}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={send}
        className="flex items-end gap-2 p-3 border-t"
        style={{ borderColor: 'rgba(200,168,75,0.15)' }}
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Escribe tu consulta laboral..."
          rows={2}
          disabled={loading}
          className="flex-1 resize-none px-4 py-2.5 rounded-xl text-sm outline-none disabled:opacity-50"
          style={{ background: 'var(--navy-light)', color: 'var(--cream)' }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-40 flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,var(--gold),var(--gold-dim))', color: 'var(--navy)' }}
        >
          {loading ? '...' : 'Enviar'}
        </button>
      </form>

      {error && (
        <p className="px-4 pb-3 text-xs text-[#E07070]">{error}</p>
      )}
    </div>
  )
}
