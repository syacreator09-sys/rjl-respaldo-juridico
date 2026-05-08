'use client'
import { useState } from 'react'

const CATS = [
  { value: 'entrada_trabajo', label: '🕘 Entrada al trabajo' },
  { value: 'salida_trabajo', label: '🕕 Salida del trabajo' },
  { value: 'contrato', label: '📄 Contrato / documento' },
  { value: 'recibo_pago', label: '💵 Recibo de pago' },
  { value: 'gastos_medicos', label: '🏥 Gastos médicos' },
  { value: 'otro', label: '📎 Otro' },
]

export function EvidenceUpload({ caseId, doneHref = '/cliente/evidencias' }: { caseId: string; doneHref?: string }) {
  const [cat, setCat] = useState('entrada_trabajo')
  const [file, setFile] = useState<File | null>(null)
  const [gps, setGps] = useState<{ lat: number; lng: number; acc: number } | null>(null)
  const [gpsState, setGpsState] = useState<'idle' | 'loading' | 'ok' | 'fail'>('idle')
  const [loading, setLoading] = useState(false)

  function captureGps() {
    setGpsState('loading')
    navigator.geolocation.getCurrentPosition(
      p => { setGps({ lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy }); setGpsState('ok') },
      () => setGpsState('fail'),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setLoading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('category', cat)
    fd.append('case_id', caseId)
    if (gps) { fd.append('gps_lat', String(gps.lat)); fd.append('gps_lng', String(gps.lng)); fd.append('gps_accuracy', String(gps.acc)) }
    await fetch('/api/evidence', { method: 'POST', body: fd })
    setLoading(false); setFile(null); setGps(null); setGpsState('idle')
    window.location.assign(doneHref)
  }

  return (
    <form onSubmit={submit} className="p-4 rounded-2xl border space-y-3" style={{ background: 'var(--navy-card)', borderColor: 'rgba(200,168,75,0.15)' }}>
      <h3 className="text-sm font-semibold" style={{ color: 'var(--gold-light)' }}>Subir evidencia</h3>
      <select value={cat} onChange={e => setCat(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: 'var(--navy-light)', color: 'var(--cream)' }}>
        {CATS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
      </select>
      <input type="file" accept="image/*,application/pdf,video/mp4" onChange={e => setFile(e.target.files?.[0] ?? null)} className="w-full text-xs" style={{ color: 'var(--text-mid)' }} />
      <button type="button" onClick={captureGps} className="w-full py-2 rounded-xl text-xs border" style={{ borderColor: gpsState === 'ok' ? '#4CAF50' : 'rgba(200,168,75,0.3)', color: gpsState === 'ok' ? '#4CAF50' : gpsState === 'fail' ? '#E07070' : 'var(--text-mid)' }}>
        {gpsState === 'idle' && '📍 Capturar GPS'}{gpsState === 'loading' && 'Obteniendo...'}{gpsState === 'ok' && `✓ GPS: ${gps?.lat.toFixed(5)}, ${gps?.lng.toFixed(5)}`}{gpsState === 'fail' && '⚠️ GPS no disponible'}
      </button>
      <button type="submit" disabled={!file || loading} className="w-full py-2.5 rounded-xl text-sm font-medium disabled:opacity-50" style={{ background: 'linear-gradient(135deg,var(--gold),var(--gold-dim))', color: 'var(--navy)' }}>
        {loading ? 'Subiendo...' : 'Guardar con sello de tiempo'}
      </button>
    </form>
  )
}
