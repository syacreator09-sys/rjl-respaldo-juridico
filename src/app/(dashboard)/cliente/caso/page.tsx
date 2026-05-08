import Link from 'next/link'
import { redirect } from 'next/navigation'
import { CaseForm } from '@/components/cases/CaseForm'
import { createClient } from '@/lib/supabase/server'

export default async function ClienteCasoPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: caseRow } = await supabase
    .from('cases')
    .select('id, case_data(*)')
    .eq('client_id', user.id)
    .eq('status', 'active')
    .maybeSingle() as unknown as {
      data: {
        id: string
        case_data: {
          employer_name: string | null
          position: string | null
          start_date: string | null
          salary_daily: number | null
          work_hours_paper: string | null
          work_hours_real: string | null
          has_imss: boolean
          has_contract: boolean
        } | null
      } | null
    }

  return (
    <div style={{ background: 'var(--navy)', minHeight: '100vh', padding: '1.5rem' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <Link href="/cliente" className="text-xs mb-4 block" style={{ color: 'var(--text-dim)' }}>
          ← Panel cliente
        </Link>
        <h1
          className="text-2xl font-bold mb-6"
          style={{ color: 'var(--gold-light)', fontFamily: 'Cormorant Garamond, serif' }}
        >
          Mi expediente laboral
        </h1>
        <CaseForm
          activeCaseId={caseRow?.id}
          initialValues={caseRow?.case_data ?? null}
          redirectTo="/cliente"
        />
      </div>
    </div>
  )
}
