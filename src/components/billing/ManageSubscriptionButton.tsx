'use client'
import { useState } from 'react'

export function ManageSubscriptionButton({ className }: { className?: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Error al abrir el portal')
        return
      }
      if (data.url) window.location.href = data.url
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-1">
      <button
        onClick={handleClick}
        disabled={loading}
        className={className ?? 'text-xs underline underline-offset-2 disabled:opacity-50 transition-opacity'}
        style={{ color: 'var(--text-dim)' }}
      >
        {loading ? 'Abriendo portal...' : 'Gestionar suscripción'}
      </button>
      {error && (
        <p className="text-xs" style={{ color: '#E07070' }}>{error}</p>
      )}
    </div>
  )
}
