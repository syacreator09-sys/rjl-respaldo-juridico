'use client'

export default function AnalisisIAButton({ caseId }: { caseId: string }) {
  return (
    <button
      className="flex-1 py-2 rounded-xl text-xs font-medium"
      style={{ background: 'linear-gradient(135deg,var(--gold),var(--gold-dim,#7A6030))', color: 'var(--navy)' }}
      onClick={() => {
        fetch('/api/analyze-case', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ caseId }),
        })
          .then(r => r.json())
          .then(d => alert(d.analysis ?? d.error))
          .catch(() => alert('Error al analizar'))
      }}
    >
      ✨ Análisis IA
    </button>
  )
}
