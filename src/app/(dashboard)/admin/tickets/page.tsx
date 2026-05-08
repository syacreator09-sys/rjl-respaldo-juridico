import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '../_lib/admin-auth'
import { updateTicketAction } from '../_actions'

interface TicketRow {
  id: string
  case_id: string
  client_id: string
  asesor_id: string | null
  question: string
  response: string | null
  status: 'open' | 'in_progress' | 'closed'
  priority: 'low' | 'medium' | 'high'
  created_at: string
}

interface AdvisorRow {
  id: string
  full_name: string | null
}

interface ProfileLookupRow {
  id: string
  full_name: string | null
}

const statusLabels: Record<TicketRow['status'], string> = {
  open: 'Abierto',
  in_progress: 'En proceso',
  closed: 'Cerrado',
}

const priorityLabels: Record<TicketRow['priority'], string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
}

export default async function AdminTicketsPage() {
  await requireAdmin()
  const supabase = await createClient()

  const [{ data: ticketsData }, { data: advisors }, { data: profiles }] = await Promise.all([
    supabase.from('tickets').select('*').order('created_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'asesor')
      .eq('is_active', true)
      .order('full_name', { ascending: true }),
    supabase.from('profiles').select('id, full_name'),
  ])

  const tickets = (ticketsData ?? []) as TicketRow[]
  const advisorsList = (advisors ?? []) as AdvisorRow[]
  const profileRows = (profiles ?? []) as ProfileLookupRow[]
  const profileMap = new Map(profileRows.map((profile) => [profile.id, profile.full_name]))

  const stats = {
    total: tickets.length,
    open: tickets.filter((ticket) => ticket.status === 'open').length,
    inProgress: tickets.filter((ticket) => ticket.status === 'in_progress').length,
    closed: tickets.filter((ticket) => ticket.status === 'closed').length,
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-2">
        <h1
          className="text-3xl font-bold"
          style={{ color: 'var(--gold-light)', fontFamily: 'Cormorant Garamond, serif' }}
        >
          Todos los tickets
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
          Visualiza el soporte completo y reasigna o mueve estados sin salir del panel.
        </p>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'var(--gold)' },
          { label: 'Abiertos', value: stats.open, color: '#2196F3' },
          { label: 'En proceso', value: stats.inProgress, color: '#FF9800' },
          { label: 'Cerrados', value: stats.closed, color: '#4CAF50' },
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
        {tickets.map((ticket) => (
          <form
            key={ticket.id}
            action={updateTicketAction}
            className="p-4 rounded-2xl border space-y-4"
            style={{ background: 'var(--navy-card)', borderColor: 'rgba(200,168,75,0.1)' }}
          >
            <input type="hidden" name="ticketId" value={ticket.id} />

            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--cream)' }}>
                  {profileMap.get(ticket.client_id) ?? 'Cliente sin nombre'}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                  Caso {ticket.case_id.slice(0, 8)}... · {new Date(ticket.created_at).toLocaleString('es-MX')}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span
                  className="text-xs px-2 py-1 rounded-lg"
                  style={{ background: 'rgba(200,168,75,0.15)', color: 'var(--gold-light)' }}
                >
                  {statusLabels[ticket.status]}
                </span>
                <span
                  className="text-xs px-2 py-1 rounded-lg"
                  style={{ background: 'rgba(33,150,243,0.15)', color: '#2196F3' }}
                >
                  {priorityLabels[ticket.priority]}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl" style={{ background: 'var(--navy-light)' }}>
              <p className="text-xs mb-1" style={{ color: 'var(--gold-light)' }}>
                Pregunta del cliente
              </p>
              <p className="text-sm" style={{ color: 'var(--cream)' }}>
                {ticket.question}
              </p>
            </div>

            {ticket.response && (
              <div className="p-3 rounded-xl" style={{ background: 'var(--navy-light)' }}>
                <p className="text-xs mb-1" style={{ color: 'var(--gold-light)' }}>
                  Respuesta actual
                </p>
                <p className="text-sm" style={{ color: 'var(--cream)' }}>
                  {ticket.response}
                </p>
              </div>
            )}

            <div className="grid gap-3 md:grid-cols-4 md:items-end">
              <label className="space-y-1 md:col-span-2">
                <span className="text-xs" style={{ color: 'var(--text-dim)' }}>
                  Asesor responsable
                </span>
                <select
                  name="asesorId"
                  defaultValue={ticket.asesor_id ?? 'unassigned'}
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

              <label className="space-y-1">
                <span className="text-xs" style={{ color: 'var(--text-dim)' }}>
                  Estado
                </span>
                <select
                  name="status"
                  defaultValue={ticket.status}
                  className="w-full px-3 py-2 rounded-xl text-sm"
                  style={{ background: 'var(--navy-light)', color: 'var(--cream)' }}
                >
                  <option value="open">Abierto</option>
                  <option value="in_progress">En proceso</option>
                  <option value="closed">Cerrado</option>
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-xs" style={{ color: 'var(--text-dim)' }}>
                  Prioridad
                </span>
                <select
                  name="priority"
                  defaultValue={ticket.priority}
                  className="w-full px-3 py-2 rounded-xl text-sm"
                  style={{ background: 'var(--navy-light)', color: 'var(--cream)' }}
                >
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                </select>
              </label>
            </div>

            <div className="flex items-center justify-between gap-3">
              <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                Asesor actual: {ticket.asesor_id ? profileMap.get(ticket.asesor_id) ?? 'No encontrado' : 'Sin asignar'}
              </p>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-sm font-medium"
                style={{
                  background: 'linear-gradient(135deg,var(--gold),var(--gold-dim,#7A6030))',
                  color: 'var(--navy)',
                }}
              >
                Guardar cambios
              </button>
            </div>
          </form>
        ))}

        {tickets.length === 0 && (
          <div
            className="p-8 rounded-2xl border text-center"
            style={{ background: 'var(--navy-card)', borderColor: 'rgba(200,168,75,0.1)' }}
          >
            <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
              No hay tickets registrados.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
