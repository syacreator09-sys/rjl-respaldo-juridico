'use client'
import { useState } from 'react'

export function SubscribeButton() {
  const [loading, setLoading] = useState(false)
  async function handleClick() {
    setLoading(true)
    const res = await fetch('/api/stripe/checkout', { method: 'POST' })
    const { url } = await res.json()
    if (url) window.location.href = url
    setLoading(false)
  }
  return (
    <button onClick={handleClick} disabled={loading}
      className="w-full py-3 rounded-xl font-semibold text-sm disabled:opacity-50"
      style={{ background: 'linear-gradient(135deg,var(--gold),var(--gold-dim))', color: 'var(--navy)' }}>
      {loading ? 'Redirigiendo...' : 'Suscribirme — $200/mes · Chat ilimitado con Claude'}
    </button>
  )
}
