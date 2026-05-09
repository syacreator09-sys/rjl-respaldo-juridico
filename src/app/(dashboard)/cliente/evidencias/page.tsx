import { EvidenceUpload } from '@/components/evidence/EvidenceUpload'
import { EvidenceVault } from '@/components/evidence/EvidenceVault'
import { ActionButton, EmptyState, PageIntro, SectionFrame } from '@/components/ui/rjl-primitives'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

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
    <div className="space-y-6">
      <PageIntro
        eyebrow="Cliente · Evidencias"
        title="Boveda completa"
        description="Sube nuevos archivos y revisa el historial cronologico de pruebas vinculadas a tu expediente."
        action={<ActionButton href="/cliente" variant="secondary">Volver al resumen</ActionButton>}
      />
      {!caseRow ? (
        <EmptyState
          title="Primero crea tu expediente laboral."
          description="Sin un caso activo no podemos sellar ni ordenar evidencia juridica."
          action={<ActionButton href="/cliente/caso">Crear expediente</ActionButton>}
        />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
          <SectionFrame title="Subir evidencia" description="Fotos, recibos, documentos y capturas con sello de tiempo.">
            <EvidenceUpload caseId={caseRow.id} doneHref="/cliente/evidencias" />
          </SectionFrame>
          <SectionFrame title="Historial cronologico" description="La evidencia es inmutable una vez registrada.">
            <EvidenceVault caseId={caseRow.id} />
          </SectionFrame>
        </div>
      )}
    </div>
  )
}
