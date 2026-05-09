import { MetricTile, PageIntro, ProfileChip, SectionFrame, StatusBadge } from '@/components/ui/rjl-primitives'
import { createClient } from '@/lib/supabase/server'
import { assignCaseAction } from '../_actions'
import { requireAdmin } from '../_lib/admin-auth'

interface Advisor {
  id: string
  full_name: string | null
}

interface ClientLookupRow {
  id: string
  full_name: string | null
}

interface CaseAssignmentRow {
  id: string
  client_id: string
  asesor_id: string | null
  status: string
  created_at: string
}

interface TicketRow {
  id: string
  case_id: string
  status: 'open' | 'in_progress' | 'closed'
}

export default async function AdminAsignarPage({
  searchParams,
}: {
  searchParams?: Promise<{ case?: string }>
}) {
  await requireAdmin()
  const params = searchParams ? await searchParams : undefined
  const highlightedCaseId = params?.case ?? null
  const supabase = await createClient()

  const [{ data: activeCases }, { data: advisors }, { data: clients }, { data: tickets }] = await Promise.all([
    supabase
      .from('cases')
      .select('id, client_id, asesor_id, status, created_at')
      .eq('status', 'active')
      .order('created_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'asesor')
      .eq('is_active', true)
      .order('full_name', { ascending: true }),
    supabase.from('profiles').select('id, full_name'),
    supabase.from('tickets').select('id, case_id, status'),
  ])

  const advisorsList = (advisors ?? []) as Advisor[]
  const clientRows = (clients ?? []) as ClientLookupRow[]
  const clientMap = new Map(clientRows.map((client) => [client.id, client.full_name]))
  const advisorMap = new Map(advisorsList.map((advisor) => [advisor.id, advisor.full_name]))
  const cases = (activeCases ?? []) as CaseAssignmentRow[]
  const ticketRows = (tickets ?? []) as TicketRow[]
  const unassignedCount = cases.filter((entry) => !entry.asesor_id).length

  const advisorLoad = advisorsList.map((advisor) => {
    const assignedCases = cases.filter((caseRow) => caseRow.asesor_id === advisor.id)
    const openTickets = ticketRows.filter(
      (ticket) => assignedCases.some((caseRow) => caseRow.id === ticket.case_id) && ticket.status !== 'closed',
    ).length

    return {
      ...advisor,
      assignedCases: assignedCases.length,
      openTickets,
    }
  })

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Admin · Asignaciones"
        title="Mesa de despacho"
        description="Balancea carga entre asesores y resuelve rapido los casos que aun no tienen responsable."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <MetricTile label="Casos activos" value={cases.length} tone="gold" />
        <MetricTile label="Sin asignar" value={unassignedCount} tone="danger" />
        <MetricTile label="Asesores activos" value={advisorsList.length} tone="info" />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionFrame
          title="Casos pendientes o prioritarios"
          description="Selecciona el responsable adecuado sin salir del contexto del cliente."
          aside={<StatusBadge tone="danger">{unassignedCount} sin asesor</StatusBadge>}
        >
          <div className="space-y-3">
            {cases.map((caseRow) => {
              const openTickets = ticketRows.filter((ticket) => ticket.case_id === caseRow.id && ticket.status !== 'closed').length
              const isHighlighted = highlightedCaseId === caseRow.id

              return (
                <form
                  key={caseRow.id}
                  action={assignCaseAction}
                  className={`rounded-2xl border p-4 ${isHighlighted ? 'border-[#C8A84B]/38 bg-[#172240]' : 'border-white/8 bg-[#0F1B31]'}`}
                >
                  <input type="hidden" name="caseId" value={caseRow.id} />
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-[#F2EDE0]">
                          {clientMap.get(caseRow.client_id) ?? 'Cliente sin nombre'}
                        </p>
                        <StatusBadge tone={caseRow.asesor_id ? 'info' : 'danger'}>
                          {caseRow.asesor_id ? 'Asignado' : 'Sin asesor'}
                        </StatusBadge>
                        <StatusBadge tone={openTickets > 0 ? 'warning' : 'neutral'}>
                          {openTickets} ticket(s)
                        </StatusBadge>
                      </div>
                      <p className="text-xs text-[#F2EDE0]/45">
                        Caso {caseRow.id.slice(0, 8)} · Creado {new Date(caseRow.created_at).toLocaleDateString('es-MX')}
                      </p>
                      <p className="text-xs text-[#F2EDE0]/45">
                        Actual: {caseRow.asesor_id ? advisorMap.get(caseRow.asesor_id) ?? 'Asesor no encontrado' : 'Sin responsable'}
                      </p>
                    </div>

                    <div className="grid gap-3 md:grid-cols-[220px_auto] md:items-end">
                      <label className="space-y-1">
                        <span className="text-xs text-[#F2EDE0]/45">Asesor responsable</span>
                        <select
                          name="asesorId"
                          defaultValue={caseRow.asesor_id ?? 'unassigned'}
                          className="w-full rounded-2xl border border-white/10 bg-[#172240] px-3 py-2 text-sm text-[#F2EDE0]"
                        >
                          <option value="unassigned">Sin asignar</option>
                          {advisorsList.map((advisor) => (
                            <option key={advisor.id} value={advisor.id}>
                              {advisor.full_name ?? advisor.id.slice(0, 8)}
                            </option>
                          ))}
                        </select>
                      </label>

                      <button
                        type="submit"
                        className="rounded-2xl bg-[linear-gradient(135deg,var(--gold),var(--gold-dim))] px-4 py-2.5 text-sm font-medium text-[#0A1628]"
                      >
                        Guardar asignacion
                      </button>
                    </div>
                  </div>
                </form>
              )
            })}
          </div>
        </SectionFrame>

        <SectionFrame
          title="Carga por asesor"
          description="Referencia rapida para repartir expedientes con mas equilibrio."
        >
          <div className="space-y-3">
            {advisorLoad.map((advisor) => (
              <div key={advisor.id} className="rounded-2xl border border-white/8 bg-[#0F1B31] p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-[#F2EDE0]">{advisor.full_name ?? 'Asesor sin nombre'}</p>
                  <StatusBadge tone="info">{advisor.assignedCases} caso(s)</StatusBadge>
                  <StatusBadge tone={advisor.openTickets > 0 ? 'warning' : 'success'}>
                    {advisor.openTickets} ticket(s) abiertos
                  </StatusBadge>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <ProfileChip label="Carga activa" value={advisor.assignedCases} />
                  <ProfileChip label="Soporte pendiente" value={advisor.openTickets} />
                </div>
              </div>
            ))}
          </div>
        </SectionFrame>
      </div>
    </div>
  )
}
