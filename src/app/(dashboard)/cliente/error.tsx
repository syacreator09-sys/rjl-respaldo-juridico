'use client'

import { useEffect } from 'react'

export default function ClienteError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[RJL:cliente]', error)
  }, [error])

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-6 text-center px-4">
      <div className="space-y-2">
        <p className="text-4xl">⚠️</p>
        <h2 className="font-serif text-xl" style={{ color: 'var(--gold-light)' }}>
          Algo salió mal
        </h2>
        <p className="text-sm max-w-sm" style={{ color: 'var(--text-dim)' }}>
          No pudimos cargar tu expediente. Puede ser un problema temporal de conexión.
        </p>
        {error.digest && (
          <p className="text-xs font-mono" style={{ color: 'var(--text-dim)' }}>
            Ref: {error.digest}
          </p>
        )}
      </div>
      <button
        onClick={reset}
        className="px-6 py-2.5 rounded-xl text-sm font-medium"
        style={{ background: 'linear-gradient(135deg,var(--gold),var(--gold-dim))', color: 'var(--navy)' }}
      >
        Reintentar
      </button>
    </div>
  )
}
