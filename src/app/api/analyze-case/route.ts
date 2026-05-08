import { NextRequest, NextResponse } from 'next/server'
import { SYSTEM_PROMPTS } from '@/lib/anthropic'
import { nvidiaChat } from '@/lib/ai/nvidia-nim'
import { createClient } from '@/lib/supabase/server'
import { AnalyzeCaseSchema } from '@/lib/validations/chat'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Only asesores and admins can analyze cases
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single() as unknown as { data: { role: string } | null }
  if (!['asesor', 'admin'].includes(profile?.role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = AnalyzeCaseSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  // Fetch full case data
  type CaseWithData = { id: string; case_data: Record<string, unknown> | null; evidence: Array<{ category: string; server_time: string; gps_lat: number | null; gps_lng: number | null }> }
  const { data: caseRow } = await supabase
    .from('cases')
    .select('*, case_data(*), evidence(category, server_time, gps_lat, gps_lng)')
    .eq('id', parsed.data.caseId)
    .single() as unknown as { data: CaseWithData | null }

  if (!caseRow) return NextResponse.json({ error: 'Case not found' }, { status: 404 })

  const evidenceSummary = caseRow.evidence?.reduce((acc: Record<string, number>, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + 1
    return acc
  }, {})

  const caseContext = `${JSON.stringify({ ...caseRow.case_data, evidence_count: evidenceSummary }, null, 2)}`

  const analysisText = await nvidiaChat(
    SYSTEM_PROMPTS.caseAnalysis,
    [{ role: 'user', content: `Analiza este expediente laboral:\n\n${caseContext}` }],
    2000,
  )

  return NextResponse.json({ analysis: analysisText })
}
