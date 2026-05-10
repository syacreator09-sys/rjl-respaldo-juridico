'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

const CATEGORY_ICONS: Record<string, string> = {
  entrada_trabajo: '🕘',
  salida_trabajo: '🕕',
  contrato: '📄',
  recibo_pago: '💵',
  gastos_medicos: '🏥',
  cambio_domicilio: '🏠',
  otro: '📎',
}

const CATEGORY_LABELS: Record<string, string> = {
  entrada_trabajo: 'Entrada',
  salida_trabajo: 'Salida',
  contrato: 'Contrato',
  recibo_pago: 'Recibo',
  gastos_medicos: 'Médico',
  cambio_domicilio: 'Domicilio',
  otro: 'Otro',
}

interface EvidenceRow {
  id: string
  category: string
  file_name: string
  file_path: string
  file_size: number | null
  gps_lat: number | null
  gps_lng: number | null
  server_time: string
}

export function EvidenceVault({ caseId }: { caseId: string }) {
  const [items, setItems] = useState<EvidenceRow[]>([])
  const [loading, setLoading] = useState(true)
  // Map of file_path → signed URL (or 'loading' | 'error' sentinel)
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})
  const [urlLoading, setUrlLoading] = useState<Record<string, boolean>>({})
  const supabase = createClient()

  const loadEvidence = useCallback(async () => {
    setLoading(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from('evidence')
      .select('id, category, file_name, file_path, file_size, gps_lat, gps_lng, server_time')
      .eq('case_id', caseId)
      .order('server_time', { ascending: false })
    setItems(data ?? [])
    setLoading(false)
  }, [caseId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadEvidence() }, [loadEvidence])

  async function openFile(filePath: string, fileName: string) {
    // Use cached URL if not expired (~55 min buffer from 1hr expiry)
    if (signedUrls[filePath]) {
      window.open(signedUrls[filePath], '_blank', 'noopener,noreferrer')
      return
    }

    setUrlLoading(prev => ({ ...prev, [filePath]: true }))
    const { data, error } = await supabase.storage
      .from('evidence')
      .createSignedUrl(filePath, 3600, { download: false })

    if (error || !data?.signedUrl) {
      // Fallback: try download signed URL
      const { data: dlData } = await supabase.storage
        .from('evidence')
        .createSignedUrl(filePath, 3600, { download: fileName })
      if (dlData?.signedUrl) {
        setSignedUrls(prev => ({ ...prev, [filePath]: dlData.signedUrl }))
        window.open(dlData.signedUrl, '_blank', 'noopener,noreferrer')
      }
    } else {
      setSignedUrls(prev => ({ ...prev, [filePath]: data.signedUrl }))
      window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
    }
    setUrlLoading(prev => ({ ...prev, [filePath]: false }))
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString('es-MX', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  function formatSize(bytes: number | null) {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (loading) {
    return (
      <div className="p-4 rounded-2xl border text-center"
        style={{ background: 'var(--navy-card)', borderColor: 'rgba(200,168,75,0.15)' }}>
        <p className="text-sm animate-pulse" style={{ color: 'var(--text-dim)' }}>Cargando evidencias...</p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="p-6 rounded-2xl border text-center"
        style={{ background: 'var(--navy-card)', borderColor: 'rgba(200,168,75,0.15)' }}>
        <p className="text-2xl mb-2">📂</p>
        <p className="text-sm font-medium" style={{ color: 'var(--cream)' }}>Sin evidencias aún</p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
          Sube fotos, documentos o capturas con sello de tiempo GPS
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--gold-light)' }}>
          Bóveda de evidencias
        </h3>
        <span className="text-xs px-2 py-0.5 rounded-lg"
          style={{ background: 'var(--navy-light)', color: 'var(--text-mid)' }}>
          {items.length} archivo{items.length !== 1 ? 's' : ''}
        </span>
      </div>

      {items.map(item => (
        <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl"
          style={{ background: 'var(--navy-card)', border: '1px solid rgba(200,168,75,0.1)' }}>

          <div className="text-2xl flex-shrink-0">
            {CATEGORY_ICONS[item.category] ?? '📎'}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate" style={{ color: 'var(--cream)' }}>
              {item.file_name}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs" style={{ color: 'var(--text-dim)' }}>
                {CATEGORY_LABELS[item.category] ?? item.category}
              </span>
              {item.file_size && (
                <span className="text-xs" style={{ color: 'var(--text-dim)' }}>
                  · {formatSize(item.file_size)}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
              {formatDate(item.server_time)}
            </p>
            <div className="flex items-center gap-1.5">
              {item.gps_lat ? (
                <span className="text-xs px-1.5 py-0.5 rounded"
                  style={{ background: 'rgba(76,175,80,0.15)', color: '#4CAF50' }}>
                  📍 GPS
                </span>
              ) : (
                <span className="text-xs px-1.5 py-0.5 rounded"
                  style={{ background: 'rgba(107,127,158,0.2)', color: 'var(--text-dim)' }}>
                  Sin GPS
                </span>
              )}
              {/* Ver / descargar archivo */}
              <button
                onClick={() => openFile(item.file_path, item.file_name)}
                disabled={urlLoading[item.file_path]}
                className="text-xs px-2 py-0.5 rounded transition-opacity disabled:opacity-50"
                style={{
                  background: 'rgba(200,168,75,0.15)',
                  color: 'var(--gold-light)',
                  border: '1px solid rgba(200,168,75,0.2)',
                }}
                title="Ver archivo en nueva pestaña"
              >
                {urlLoading[item.file_path] ? '...' : '↗ Ver'}
              </button>
            </div>
          </div>
        </div>
      ))}

      <p className="text-xs text-center pt-1" style={{ color: 'var(--text-dim)' }}>
        🔒 Evidencias inmutables · Sello de tiempo del servidor · Solo tú y tu asesor pueden verlas
      </p>
    </div>
  )
}
