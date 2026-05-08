import Link from 'next/link'
import { redirect } from 'next/navigation'
import { EvidenceUpload } from '@/components/evidence/EvidenceUpload'
import { EvidenceVault } from '@/components/evidence/EvidenceVault'
import { createClient } from '@/lib/supabase/server'

export default async function ClienteEvidenciasPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: caseRow } = await supabase
    .from('cases')
    .select('id')
    .eq('client_id', user.id)
    .eq('status', 'active')
    .maybeSingle() as unknown as { data: { id: string } | null }

  return (
    <div style={{ background: 'var(--navy)', minHeight: '100vh', padding: '1.5rem' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <Link href="/cliente" className="text-xs mb-4 block" style={{ color: 'var(--text-dim)' }}>
          ← Panel cliente
        </Link>
        <h1
          className="text-2xl font-bold mb-6"
          style={{ color: 'var(--gold-light)', fontFamily: 'Cormorant Garamond, serif' }}
        >
          Mis evidencias
        </h1>
        {!caseRow ? (
          <div
            className="p-6 rounded-2xl border text-center"
            style={{ background: 'var(--navy-card)', borderColor: 'rgba(200,168,75,0.15)' }}
          >
            <p className="text-sm" style={{ color: 'var(--cream)' }}>
              Primero crea tu expediente laboral para poder guardar evidencias.
            </p>
            <Link
              href="/cliente/caso"
              className="inline-block mt-4 px-4 py-2 rounded-xl text-sm font-medium"
              style={{ background: 'linear-gradient(135deg,var(--gold),var(--gold-dim))', color: 'var(--navy)' }}
            >
              Crear expediente
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[360px_1fr] gap-6">
            <EvidenceUpload caseId={caseRow.id} doneHref="/cliente/evidencias" />
            <EvidenceVault caseId={caseRow.id} />
          </div>
        )}
      </div>
    </div>
  )
}
