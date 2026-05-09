'use client'
import { useState } from 'react'

const CATS = [
  { value: 'entrada_trabajo', label: '🕘 Entrada al trabajo' },
  { value: 'salida_trabajo', label: '🕕 Salida del trabajo' },
  { value: 'contrato', label: '📄 Contrato / documento' },
  { value: 'recibo_pago', label: '💵 Recibo de pago' },
  { value: 'gastos_medicos', label: '🏥 Gastos médicos' },
  { value: 'cambio_domicilio', label: '🏠 Cambio de domicilio' },
  { value: 'otro', label: '📎 Otro' },
]

export function EvidenceUpload({ caseId, doneHref = '/cliente/evidencias' }: { caseId: string; doneHref?: string }) {
  const [cat, setCat] = useState('entrada_trabajo')
  const [file, setFile] = useState<File | null>(null)
  const [gps, setGps] = useState<{ lat: number; lng: number; acc: number } | null>(null)
  const [gpsState, setGpsState] = useState<'idle' | 'loading' | 'ok' | 'fail'>('idle')
  const [loading, setLoading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploaded, setUploaded] = useState(false)

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
    setUploadError(null)

    const fd = new FormData()
    fd.append('file', file)
    fd.append('category', cat)
    fd.append('case_id', caseId)
    fd.append('device_time', new Date().toISOString())
    if (gps) {
      fd.append('gps_lat', String(gps.lat))
      fd.append('gps_lng', String(gps.lng))
      fd.append('gps_accuracy', String(gps.acc))
    }

    try {
      const res = await fetch('/api/evidence', { method: 'POST', body: fd })
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Error desconocido' }))
        setUploadError(data.error ?? `Error ${res.status} al subir el archivo`)
        setLoading(false)
        return
      }
      setUploaded(true)
      setFile(null)
      setGps(null)
      setGpsState('idle')
      setTimeout(() => window.location.assign(doneHref), 800)
    } catch {
      setUploadError('Error de red. Verifica tu conexión e intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (uploaded) {
    return (
      <div className="p-6 rounded-2xl border text-center space-y-2"
        style={{ background: 'var(--navy-card)', borderColor: 'rgba(76,175,80,0.3)' }}>
        <p className="text-2xl">✅</p>
        <p className="text-sm font-medium" style={{ color: '#4CAF50' }}>Evidencia guardada con sello de tiempo</p>
        <p className="text-xs" style={{ color: 'var(--text-dim)' }}>Redirigiendo...</p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="p-4 rounded-2xl border space-y-3"
      style={{ background: 'var(--navy-card)', borderColor: 'rgba(200,168,75,0.15)' }}>
      <h3 className="text-sm font-semibold" style={{ color: 'var(--gold-light)' }}>Subir evidencia</h3>

      <select value={cat} onChange={e => setCat(e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
        style={{ background: 'var(--navy-light)', color: 'var(--cream)' }}>
        {CATS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
      </select>

      <input type="file" accept="image/*,application/pdf,video/mp4"
        onChange={e => setFile(e.target.files?.[0] ?? null)}
        className="w-full text-xs" style={{ color: 'var(--text-mid)' }} />

      <button type="button" onClick={captureGps}
        className="w-full py-2 rounded-xl text-xs border transition-colors"
        style={{
          borderColor: gpsState === 'ok' ? '#4CAF50' : 'rgba(200,168,75,0.3)',
          color: gpsState === 'ok' ? '#4CAF50' : gpsState === 'fail' ? '#E07070' : 'var(--text-mid)',
        }}>
        {gpsState === 'idle' && '📍 Capturar GPS (opcional)'}
        {gpsState === 'loading' && 'Obteniendo ubicación...'}
        {gpsState === 'ok' && `✓ GPS: ${gps?.lat.toFixed(5)}, ${gps?.lng.toFixed(5)}`}
        {gpsState === 'fail' && '⚠️ GPS no disponible — puedes subir sin él'}
      </button>

      {uploadError && (
        <p className="text-xs px-3 py-2 rounded-xl" style={{ background: 'rgba(224,112,112,0.12)', color: '#E07070' }}>
          {uploadError}
        </p>
      )}

      <button type="submit" disabled={!file || loading}
        className="w-full py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 transition-opacity"
        style={{ background: 'linear-gradient(135deg,var(--gold),var(--gold-dim))', color: 'var(--navy)' }}>
        {loading ? 'Subiendo...' : 'Guardar con sello de tiempo'}
      </button>

      <p className="text-xs text-center" style={{ color: 'var(--text-dim)' }}>
        🔒 Sello de tiempo del servidor · Inmutable · Valor probatorio
      </p>
    </form>
  )
}
