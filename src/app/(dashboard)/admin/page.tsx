import Link from 'next/link'
import { ActionButton, EmptyState, ListRow, MetricTile, PageIntro, SectionFrame, StatusBadge } from '@/components/ui/rjl-primitives'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from './_lib/admin-auth'

export default async function AdminPage() {
  await requireAdmin()
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  const [
    { count: totalClients },
    { count: totalAsesores },
    { count: openTickets },
    { count: activeSubs },
    { count: totalCases },
    { count: configKeys },
    { data: activeCases },
    { data: profiles },
  ] = await Promise.all([
    sb.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'cliente'),
    sb.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'asesor'),
    sb.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    sb.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    sb.from('cases').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    sb.from('system_config').select('*', { count: 'exact', head: true }),
    sb.from('cases').select('id, client_id, created_at').is('asesor_id', null).eq('status', 'active').limit(6),
    sb.from('profiles').select('id, full_name'),
  ])

  const profileMap = new Map(
    ((profiles ?? []) as Array<{ id: string; full_name: string | null }>).map((profile) => [
      profile.id,
      profile.full_name,
    ]),
  )

  const casesNoAsesor = ((activeCases ?? []) as Array<{ id: string; client_id: string; created_at: string }>).map((caseRow) => ({
    id: caseRow.id,
    clientName: profileMap.get(caseRow.client_id) ?? 'Cliente sin nombre',
    createdAt: caseRow.created_at,
  }))

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Admin"
        title="Backoffice ejecutivo"
        description="Monitorea negocio, cuellos de botella y operaciones sensibles desde una sola vista."
        action={<ActionButton href="/admin/asignar">Resolver asignaciones</ActionButton>}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile label="Ingreso estimado" value={`$${((activeSubs ?? 0) * 200).toLocaleString('es-MX')}`} hint={`${activeSubs ?? 0} suscripciones activas`} tone="gold" />
        <MetricTile label="Tickets abiertos" value={openTickets ?? 0} hint="Carga inmediata de soporte." tone="danger" />
        <MetricTile label="Casos activos" value={totalCases ?? 0} hint={`${casesNoAsesor.length} sin asesor asignado`} tone="info" />
        <MetricTile label="Capacidad" value={totalAsesores ?? 0} hint={`${totalClients ?? 0} clientes y ${configKeys ?? 0} claves de config`} tone="success" />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionFrame
          title="Panel general"
          description="Salud de negocio y operacion del servicio."
          aside={<StatusBadge tone="gold">Negocio + operacion</StatusBadge>}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-white/8 bg-[#0F1B31] p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-[#F2EDE0]/45">Negocio</p>
              <p className="mt-3 text-3xl font-semibold text-[#E5C97A]">
                {activeSubs ?? 0} pagos activos
              </p>
              <p className="mt-2 text-sm text-[#F2EDE0]/56">
                Base actual de clientes que sostienen el ingreso mensual estimado del producto.
              </p>
            </div>
            <div className="rounded-3xl border border-[#E07070]/18 bg-[#0F1B31] p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-[#FFADAD]">Cuello de botella</p>
              <p className="mt-3 text-3xl font-semibold text-[#FFADAD]">
                {casesNoAsesor.length}
              </p>
              <p className="mt-2 text-sm text-[#F2EDE0]/56">
                Casos activos siguen esperando asignacion. Este bloque debe vaciarse primero.
              </p>
            </div>
          </div>
        </SectionFrame>

        <SectionFrame
          title="Alertas operativas"
          description="Acciones que no conviene dejar para despues."
          aside={<ActionButton href="/admin/tickets" variant="secondary">Ver tickets</ActionButton>}
        >
          {casesNoAsesor.length === 0 ? (
            <EmptyState
              title="No hay alertas de asignacion."
              description="Todos los casos activos tienen responsable asignado y la operacion esta balanceada por ahora."
            />
          ) : (
            <div className="space-y-3">
              {casesNoAsesor.map((caseRow) => (
                <ListRow
                  key={caseRow.id}
                  title={caseRow.clientName}
                  description={`Caso creado ${new Date(caseRow.createdAt).toLocaleDateString('es-MX')}`}
                  meta={<StatusBadge tone="danger">Sin asesor</StatusBadge>}
                  trailing={<ActionButton href={`/admin/asignar?case=${caseRow.id}`}>Asignar</ActionButton>}
                />
              ))}
            </div>
          )}
        </SectionFrame>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionFrame
          title="Gestion de usuarios"
          description="Entrada rapida a la consola segmentada por rol."
          aside={<ActionButton href="/admin/usuarios" variant="secondary">Abrir consola</ActionButton>}
        >
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-white/8 bg-[#0F1B31] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[#F2EDE0]/42">Clientes</p>
              <p className="mt-2 text-2xl text-[#7EE488]">{totalClients ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-[#0F1B31] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[#F2EDE0]/42">Asesores</p>
              <p className="mt-2 text-2xl text-[#7BC0FF]">{totalAsesores ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-[#0F1B31] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[#F2EDE0]/42">Configuracion</p>
              <p className="mt-2 text-2xl text-[#E5C97A]">{configKeys ?? 0}</p>
            </div>
          </div>
        </SectionFrame>

        <SectionFrame
          title="Configuracion critica"
          description="Variables de negocio y operacion que impactan el servicio."
          aside={<ActionButton href="/admin/config" variant="secondary">Editar reglas</ActionButton>}
        >
          <div className="space-y-3">
            <ListRow title="Operacion" description="Claves que modifican soporte, turnos y automatizacion interna." />
            <ListRow title="Legal / producto" description="Variables que afectan mensajes, oferta o criterios visibles al cliente." />
            <ListRow title="Facturacion" description="Constantes del plan y control interno del servicio." />
          </div>
        </SectionFrame>
      </div>
    </div>
  )
}
