'use client'
import { useState } from 'react'

interface StructuredAnalysis {
  overview: string
  risks: string[]
  missingEvidence: string[]
  nextAction: string
  negotiationStrategy: string
  legalAlerts: string[]
}

interface AnalysisState {
  loading: boolean
  result: StructuredAnalysis | null
  error: string | null
  open: boolean
}

export default function AnalisisIAButton({ caseId }: { caseId: string }) {
  const [state, setState] = useState<AnalysisState>({
    loading: false, result: null, error: null, open: false,
  })

  async function runAnalysis() {
    setState(prev => ({ ...prev, loading: true, error: null, open: false }))
    try {
      const res = await fetch('/api/analyze-case', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setState(prev => ({ ...prev, loading: false, error: data.error ?? `Error ${res.status}` }))
        return
      }
      setState(prev => ({
        ...prev,
        loading: false,
        result: data.structured ?? null,
        open: true,
        error: null,
      }))
    } catch {
      setState(prev => ({ ...prev, loading: false, error: 'Error de conexión. Intenta de nuevo.' }))
    }
  }

  function toggleOpen() {
    setState(prev => ({ ...prev, open: !prev.open }))
  }

  const { loading, result, error, open } = state

  return (
    <div className="flex-1 space-y-2">
      {/* Trigger button */}
      <button
        onClick={result ? toggleOpen : runAnalysis}
        disabled={loading}
        className="w-full py-2 rounded-xl text-xs font-medium transition-opacity disabled:opacity-50 flex items-center justify-center gap-1.5"
        style={{ background: 'linear-gradient(135deg,var(--gold),var(--gold-dim,#7A6030))', color: 'var(--navy)' }}
      >
        {loading ? (
          <><span className="animate-spin">⏳</span> Analizando con IA...</>
        ) : result ? (
          open ? '▲ Ocultar análisis' : '✨ Ver análisis IA'
        ) : (
          '✨ Análisis IA'
        )}
      </button>

      {/* Error */}
      {error && (
        <p className="text-xs px-3 py-2 rounded-xl"
          style={{ background: 'rgba(224,112,112,0.12)', color: '#E07070' }}>
          {error}
        </p>
      )}

      {/* Results panel */}
      {result && open && (
        <div className="rounded-2xl border p-4 space-y-3 text-xs"
          style={{ background: 'var(--navy-card)', borderColor: 'rgba(200,168,75,0.2)' }}>

          {/* Overview */}
          <div>
            <p className="font-semibold uppercase tracking-wider mb-1"
              style={{ color: 'var(--gold-light)', fontSize: '0.65rem' }}>
              Resumen del caso
            </p>
            <p style={{ color: 'var(--cream)', lineHeight: '1.5' }}>{result.overview}</p>
          </div>

          {/* Next action */}
          <div className="px-3 py-2 rounded-xl"
            style={{ background: 'rgba(200,168,75,0.1)', border: '1px solid rgba(200,168,75,0.2)' }}>
            <p className="font-semibold mb-0.5" style={{ color: 'var(--gold-light)' }}>
              ⚡ Acción recomendada
            </p>
            <p style={{ color: 'var(--cream)' }}>{result.nextAction}</p>
          </div>

          {/* Risks */}
          {result.risks.length > 0 && (
            <div>
              <p className="font-semibold uppercase tracking-wider mb-1"
                style={{ color: '#FFADAD', fontSize: '0.65rem' }}>
                Riesgos / debilidades
              </p>
              <ul className="space-y-1">
                {result.risks.map((r, i) => (
                  <li key={i} style={{ color: 'var(--cream)' }}>• {r}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Missing evidence */}
          {result.missingEvidence.length > 0 && (
            <div>
              <p className="font-semibold uppercase tracking-wider mb-1"
                style={{ color: '#7BC0FF', fontSize: '0.65rem' }}>
                Evidencia faltante
              </p>
              <ul className="space-y-1">
                {result.missingEvidence.map((m, i) => (
                  <li key={i} style={{ color: 'var(--cream)' }}>• {m}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Negotiation strategy */}
          <div>
            <p className="font-semibold uppercase tracking-wider mb-1"
              style={{ color: '#7EE488', fontSize: '0.65rem' }}>
              Estrategia de negociación
            </p>
            <p style={{ color: 'var(--cream)', lineHeight: '1.5' }}>{result.negotiationStrategy}</p>
          </div>

          {/* Legal alerts */}
          {result.legalAlerts.length > 0 && (
            <div className="px-3 py-2 rounded-xl"
              style={{ background: 'rgba(255,173,173,0.08)', border: '1px solid rgba(255,173,173,0.2)' }}>
              <p className="font-semibold mb-1" style={{ color: '#FFADAD', fontSize: '0.65rem' }}>
                ⚠️ ALERTAS LEGALES
              </p>
              <ul className="space-y-1">
                {result.legalAlerts.map((a, i) => (
                  <li key={i} style={{ color: '#FFADAD' }}>• {a}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
