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

export default async function AdminAsignarPage({
  searchParams,
}: {
  searchParams?: Promise<{ case?: string }>
}) {
  await requireAdmin()
  const params = searchParams ? await searchParams : undefined
  const highlightedCaseId = params?.case ?? null
  const supabase = await createClient()

  const [{ data: activeCases }, { data: advisors }, { data: clients }] = await Promise.all([
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
  ])

  const advisorsList = (advisors ?? []) as Advisor[]
  const clientRows = (clients ?? []) as ClientLookupRow[]
  const clientMap = new Map(clientRows.map((client) => [client.id, client.full_name]))
  const advisorMap = new Map(advisorsList.map((advisor) => [advisor.id, advisor.full_name]))
  const cases = (activeCases ?? []) as CaseAssignmentRow[]
  const unassignedCount = cases.filter((entry) => !entry.asesor_id).length

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-2">
        <h1
          className="text-3xl font-bold"
          style={{ color: 'var(--gold-light)', fontFamily: 'Cormorant Garamond, serif' }}
        >
          Asignar asesores
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
          Administra qué asesor toma cada caso activo. Los cambios impactan tickets y seguimiento.
        </p>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label: 'Casos activos', value: cases.length, color: 'var(--gold)' },
          { label: 'Sin asignar', value: unassignedCount, color: '#E07070' },
          { label: 'Asesores activos', value: advisorsList.length, color: '#2196F3' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-4 rounded-2xl border"
            style={{ background: 'var(--navy-card)', borderColor: 'rgba(200,168,75,0.1)' }}
          >
            <p className="text-2xl font-bold" style={{ color: stat.color }}>
              {stat.value}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
              {stat.label}
            </p>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        {cases.map((caseRow) => {
          const isHighlighted = highlightedCaseId === caseRow.id

          return (
            <form
              key={caseRow.id}
              action={assignCaseAction}
              className="p-4 rounded-2xl border space-y-4"
              style={{
                background: 'var(--navy-card)',
                borderColor: isHighlighted ? 'rgba(200,168,75,0.45)' : 'rgba(200,168,75,0.1)',
                boxShadow: isHighlighted ? '0 0 0 1px rgba(200,168,75,0.15)' : 'none',
              }}
            >
              <input type="hidden" name="caseId" value={caseRow.id} />

              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--cream)' }}>
                    {clientMap.get(caseRow.client_id) ?? 'Cliente sin nombre'}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                    Caso {caseRow.id.slice(0, 8)}... · Creado {new Date(caseRow.created_at).toLocaleDateString('es-MX')}
                  </p>
                </div>

                <span
                  className="text-xs px-2 py-1 rounded-lg"
                  style={{
                    background: caseRow.asesor_id ? 'rgba(33,150,243,0.15)' : 'rgba(224,112,112,0.15)',
                    color: caseRow.asesor_id ? '#2196F3' : '#E07070',
                  }}
                >
                  {caseRow.asesor_id ? 'Asignado' : 'Sin asesor'}
                </span>
              </div>

              <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
                <label className="space-y-1">
                  <span className="text-xs" style={{ color: 'var(--text-dim)' }}>
                    Asesor responsable
                  </span>
                  <select
                    name="asesorId"
                    defaultValue={caseRow.asesor_id ?? 'unassigned'}
                    className="w-full px-3 py-2 rounded-xl text-sm"
                    style={{ background: 'var(--navy-light)', color: 'var(--cream)' }}
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
                  className="px-4 py-2 rounded-xl text-sm font-medium"
                  style={{
                    background: 'linear-gradient(135deg,var(--gold),var(--gold-dim,#7A6030))',
                    color: 'var(--navy)',
                  }}
                >
                  Guardar asignación
                </button>
              </div>

              <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                Actual: {caseRow.asesor_id ? advisorMap.get(caseRow.asesor_id) ?? 'Asesor no encontrado' : 'Sin asesor'}
              </p>
            </form>
          )
        })}

        {cases.length === 0 && (
          <div
            className="p-8 rounded-2xl border text-center"
            style={{ background: 'var(--navy-card)', borderColor: 'rgba(200,168,75,0.1)' }}
          >
            <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
              No hay casos activos para asignar.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
