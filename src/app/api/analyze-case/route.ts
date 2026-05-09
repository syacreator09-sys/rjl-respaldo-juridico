import { NextRequest, NextResponse } from 'next/server'
import { anthropic, CLAUDE_MODEL, SYSTEM_PROMPTS } from '@/lib/anthropic'
import { createClient } from '@/lib/supabase/server'
import { AnalyzeCaseSchema } from '@/lib/validations/chat'

export const runtime = 'nodejs'

interface StructuredAnalysis {
  overview: string
  risks: string[]
  missingEvidence: string[]
  nextAction: string
  negotiationStrategy: string
  legalAlerts: string[]
}

function tryParseStructured(text: string): StructuredAnalysis | null {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) return null

  try {
    const parsed = JSON.parse(text.slice(start, end + 1)) as Partial<StructuredAnalysis>
    return {
      overview: parsed.overview ?? 'Sin resumen disponible.',
      risks: parsed.risks ?? [],
      missingEvidence: parsed.missingEvidence ?? [],
      nextAction: parsed.nextAction ?? 'Revisar expediente manualmente.',
      negotiationStrategy: parsed.negotiationStrategy ?? 'Preparar la siguiente iteracion con mas evidencia.',
      legalAlerts: parsed.legalAlerts ?? [],
    }
  } catch {
    return null
  }
}

function fallbackStructured(text: string): StructuredAnalysis {
  return {
    overview: text.trim().split('\n').find(Boolean) ?? 'Sin resumen disponible.',
    risks: [],
    missingEvidence: [],
    nextAction: 'Revisar manualmente el expediente y solicitar evidencia faltante.',
    negotiationStrategy: 'Usar el texto completo como referencia preliminar y validar con asesor.',
    legalAlerts: [],
  }
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'AI provider unavailable' }, { status: 503 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single() as unknown as { data: { role: string } | null }

  if (!['asesor', 'admin'].includes(profile?.role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const parsed = AnalyzeCaseSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  type CaseWithData = {
    id: string
    case_data: Record<string, unknown> | null
    evidence: Array<{ category: string; server_time: string; gps_lat: number | null; gps_lng: number | null }>
  }

  const { data: caseRow } = await supabase
    .from('cases')
    .select('*, case_data(*), evidence(category, server_time, gps_lat, gps_lng)')
    .eq('id', parsed.data.caseId)
    .single() as unknown as { data: CaseWithData | null }

  if (!caseRow) return NextResponse.json({ error: 'Case not found' }, { status: 404 })

  const evidenceSummary = caseRow.evidence?.reduce((acc: Record<string, number>, item) => {
    acc[item.category] = (acc[item.category] ?? 0) + 1
    return acc
  }, {})

  const caseContext = JSON.stringify(
    { ...caseRow.case_data, evidence_count: evidenceSummary, evidence: caseRow.evidence },
    null,
    2,
  )

  const formatInstruction = `
Devuelve exclusivamente JSON valido con esta forma:
{
  "overview": "resumen corto",
  "risks": ["riesgo 1"],
  "missingEvidence": ["faltante 1"],
  "nextAction": "siguiente mejor accion",
  "negotiationStrategy": "estrategia breve",
  "legalAlerts": ["alerta 1"]
}
Sin markdown. Sin texto antes o despues del JSON.`

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1200,
    system: `${SYSTEM_PROMPTS.caseAnalysis}\n${formatInstruction}`,
    messages: [{ role: 'user', content: `Analiza este expediente laboral:\n\n${caseContext}` }],
  })

  const analysisText = response.content[0]?.type === 'text' ? response.content[0].text : ''
  const structured = tryParseStructured(analysisText) ?? fallbackStructured(analysisText)

  return NextResponse.json({ analysis: analysisText, structured })
}
