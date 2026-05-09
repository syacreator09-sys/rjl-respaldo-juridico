import { redirect } from 'next/navigation'
import { AsesorWorkspace } from '@/components/asesor/asesor-workspace'
import { PageIntro } from '@/components/ui/rjl-primitives'
import { calcularLiquidacion } from '@/lib/calculadora-lft'
import { createClient } from '@/lib/supabase/server'

interface CaseData {
  employer_name?: string | null
  position?: string | null
  salary_daily?: number | null
  start_date?: string | null
  has_imss?: boolean | null
  has_contract?: boolean | null
}

interface TicketRow {
  id: string
  question: string
  response: string | null
  status: 'open' | 'in_progress' | 'closed'
  priority: 'low' | 'medium' | 'high'
  created_at: string
  case_id: string
}

interface EvidenceRow {
  case_id: string
  gps_lat: number | null
}

function getPriority({
  openTickets,
  hasImss,
  hasContract,
  evidenceCount,
}: {
  openTickets: number
  hasImss: boolean
  hasContract: boolean
  evidenceCount: number
}) {
  let score = 0
  if (openTickets > 0) score += 1
  if (!hasImss) score += 1
  if (!hasContract) score += 1
  if (evidenceCount === 0) score += 1

  if (score >= 3) return 'Alta' as const
  if (score >= 2) return 'Media' as const
  return 'Normal' as const
}

export default async function AsesorPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any
  const { data: profile } = await sb
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single() as { data: { role: string; full_name: string | null } | null }

  if (!profile || !['asesor', 'admin'].includes(profile.role)) redirect('/cliente')

  const { data: rawCases } = await sb
    .from('cases')
    .select(`
      id,
      created_at,
      case_data(*),
      profiles!client_id(full_name, phone)
    `)
    .eq('asesor_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false }) as {
      data: Array<{
        id: string
        created_at: string
        case_data: CaseData | CaseData[] | null
        profiles: { full_name: string | null; phone: string | null } | null
      }> | null
    }

  const caseIds = (rawCases ?? []).map((entry) => entry.id)

  const [ticketsResult, evidenceResult] = caseIds.length > 0
    ? await Promise.all([
        sb
          .from('tickets')
          .select('id, question, response, status, priority, created_at, case_id')
          .eq('asesor_id', user.id)
          .in('case_id', caseIds)
          .order('created_at', { ascending: false }) as Promise<{ data: TicketRow[] | null }>,
        sb
          .from('evidence')
          .select('case_id, gps_lat')
          .in('case_id', caseIds) as Promise<{ data: EvidenceRow[] | null }>,
      ])
    : [{ data: [] as TicketRow[] }, { data: [] as EvidenceRow[] }]

  const ticketsByCase = new Map<string, TicketRow[]>()
  for (const ticket of ticketsResult.data ?? []) {
    const current = ticketsByCase.get(ticket.case_id) ?? []
    current.push(ticket)
    ticketsByCase.set(ticket.case_id, current)
  }

  const evidenceByCase = new Map<string, { count: number; gps: number }>()
  for (const item of evidenceResult.data ?? []) {
    const current = evidenceByCase.get(item.case_id) ?? { count: 0, gps: 0 }
    evidenceByCase.set(item.case_id, {
      count: current.count + 1,
      gps: current.gps + (item.gps_lat ? 1 : 0),
    })
  }

  const cases = (rawCases ?? []).map((entry) => {
    const caseData = Array.isArray(entry.case_data) ? entry.case_data[0] ?? null : entry.case_data
    const tickets = ticketsByCase.get(entry.id) ?? []
    const evidenceSummary = evidenceByCase.get(entry.id) ?? { count: 0, gps: 0 }
    const projection = caseData?.salary_daily && caseData?.start_date
      ? calcularLiquidacion({
          salario_diario: caseData.salary_daily,
          fecha_ingreso: caseData.start_date,
          tipo: 'rescision',
        }).desglose.slice(0, 6)
      : []
    const missingEvidence = [
      evidenceSummary.count === 0 ? 'Subir evidencia base del caso' : null,
      !caseData?.has_imss ? 'Documentar IMSS y semanas cotizadas' : null,
      !caseData?.has_contract ? 'Agregar contrato o pruebas de condiciones' : null,
    ].filter(Boolean) as string[]

    return {
      id: entry.id,
      clientName: entry.profiles?.full_name ?? 'Cliente sin nombre',
      clientPhone: entry.profiles?.phone ?? null,
      employerName: caseData?.employer_name ?? null,
      position: caseData?.position ?? null,
      salaryDaily: caseData?.salary_daily ?? null,
      startDate: caseData?.start_date ?? null,
      hasImss: Boolean(caseData?.has_imss),
      hasContract: Boolean(caseData?.has_contract),
      evidenceCount: evidenceSummary.count,
      gpsEvidenceCount: evidenceSummary.gps,
      createdAt: entry.created_at,
      priority: getPriority({
        openTickets: tickets.filter((ticket) => ticket.status !== 'closed').length,
        hasImss: Boolean(caseData?.has_imss),
        hasContract: Boolean(caseData?.has_contract),
        evidenceCount: evidenceSummary.count,
      }),
      projectionLines: projection,
      missingEvidence,
      tickets,
    }
  })

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Asesor"
        title="Workspace operativo"
        description="Triagea tickets, selecciona clientes, revisa proyecciones y genera estrategia sin salir del mismo flujo."
      />
      <AsesorWorkspace cases={cases} advisorName={profile.full_name ?? user.email ?? 'Asesor RJL'} />
    </div>
  )
}
