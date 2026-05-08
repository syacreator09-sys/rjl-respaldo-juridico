import { NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { generateExpedienteText } from '@/lib/generate-expediente-pdf'
import type { Database } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ caseId: string }> }
) {
  const { caseId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sb = supabase as any

  const { data: profile } = await sb
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single() as { data: Pick<Database['public']['Tables']['profiles']['Row'], 'role'> | null }

  const { data: caseRow } = await sb
    .from('cases')
    .select('id, client_id, asesor_id, case_data(*)')
    .eq('id', caseId)
    .single() as {
      data:
        | (Pick<Database['public']['Tables']['cases']['Row'], 'id' | 'client_id' | 'asesor_id'> & {
            case_data: Database['public']['Tables']['case_data']['Row'] | Database['public']['Tables']['case_data']['Row'][] | null
          })
        | null
    }

  if (!caseRow) {
    return NextResponse.json({ error: 'Case not found' }, { status: 404 })
  }

  const canAccess =
    caseRow.client_id === user.id ||
    caseRow.asesor_id === user.id ||
    profile?.role === 'admin'

  if (!canAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: clientProfile } = await sb
    .from('profiles')
    .select('full_name')
    .eq('id', caseRow.client_id)
    .single() as { data: Pick<Database['public']['Tables']['profiles']['Row'], 'full_name'> | null }

  let clientEmail: string | undefined
  if (caseRow.client_id === user.id) {
    clientEmail = user.email ?? undefined
  } else {
    const adminSupabase = createAdminClient()
    const { data: authUserData, error: authUserError } =
      await adminSupabase.auth.admin.getUserById(caseRow.client_id)

    if (!authUserError) {
      clientEmail = authUserData.user.email
    }
  }

  const { data: evidencias } = await sb
    .from('evidence')
    .select('file_name, category, server_time, gps_lat, gps_lng')
    .eq('case_id', caseId)
    .order('server_time', { ascending: true }) as {
      data: Array<
        Pick<
          Database['public']['Tables']['evidence']['Row'],
          'file_name' | 'category' | 'server_time' | 'gps_lat' | 'gps_lng'
        >
      > | null
    }

  const caseData = Array.isArray(caseRow.case_data)
    ? caseRow.case_data[0] ?? null
    : caseRow.case_data

  const text = generateExpedienteText({
    cliente: {
      nombre: clientProfile?.full_name ?? clientEmail ?? 'Cliente',
      email: clientEmail,
    },
    employer_name: caseData?.employer_name ?? undefined,
    position: caseData?.position ?? undefined,
    salary_daily: caseData?.salary_daily ?? undefined,
    start_date: caseData?.start_date ?? undefined,
    has_imss: caseData?.has_imss ?? undefined,
    has_contract: caseData?.has_contract ?? undefined,
    work_hours_paper: caseData?.work_hours_paper ?? undefined,
    work_hours_real: caseData?.work_hours_real ?? undefined,
    evidencias: evidencias ?? [],
  })

  return new Response(text, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename="expediente-rjl-${caseId.slice(0, 8)}.txt"`,
    },
  })
}
