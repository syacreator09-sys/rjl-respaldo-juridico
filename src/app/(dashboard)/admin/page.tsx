import Link from 'next/link'
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
    sb.from('cases').select('id, client_id').is('asesor_id', null).eq('status', 'active').limit(5),
    sb.from('profiles').select('id, full_name'),
  ])

  const profileMap = new Map(
    ((profiles ?? []) as Array<{ id: string; full_name: string | null }>).map((profile) => [
      profile.id,
      profile.full_name,
    ])
  )

  const casesNoAsesor = ((activeCases ?? []) as Array<{ id: string; client_id: string }>).map((caseRow) => ({
    id: caseRow.id,
    clientName: profileMap.get(caseRow.client_id) ?? 'Cliente sin nombre',
  }))

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-2">
        <h1
          className="text-3xl font-bold"
          style={{ color: 'var(--gold-light)', fontFamily: 'Cormorant Garamond, serif' }}
        >
          Resumen operativo
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
          Vista rápida del backoffice para distribución de casos, soporte y configuración.
        </p>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Clientes', value: totalClients ?? 0, color: 'var(--gold)' },
          { label: 'Asesores', value: totalAsesores ?? 0, color: '#2196F3' },
          { label: 'Suscripciones', value: activeSubs ?? 0, color: '#4CAF50' },
          { label: 'Tickets abiertos', value: openTickets ?? 0, color: '#E07070' },
          { label: 'Config keys', value: configKeys ?? 0, color: '#9C27B0' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-4 rounded-2xl border text-center"
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

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div
          className="p-4 rounded-2xl border"
          style={{ background: 'var(--navy-card)', borderColor: 'rgba(200,168,75,0.15)' }}
        >
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--gold-light)' }}>
            Ingresos estimados
          </h2>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold" style={{ color: 'var(--gold)' }}>
              ${((activeSubs ?? 0) * 200).toLocaleString('es-MX')}
            </p>
            <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
              MXN/mes
            </p>
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
            {activeSubs ?? 0} suscripciones activas x $200 MXN
          </p>
          <p className="text-xs mt-3" style={{ color: 'var(--text-dim)' }}>
            Casos activos actuales: {totalCases ?? 0}
          </p>
        </div>

        <div
          className="p-4 rounded-2xl border"
          style={{ background: 'var(--navy-card)', borderColor: 'rgba(224,112,112,0.25)' }}
        >
          <h2 className="text-sm font-semibold mb-3" style={{ color: '#E07070' }}>
            Casos sin asesor ({casesNoAsesor.length})
          </h2>
          {casesNoAsesor.length === 0 ? (
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
              Todos los casos activos tienen asesor asignado.
            </p>
          ) : (
            <div className="space-y-2">
              {casesNoAsesor.map((caseRow) => (
                <div
                  key={caseRow.id}
                  className="flex items-center justify-between p-2 rounded-lg"
                  style={{ background: 'var(--navy-light)' }}
                >
                  <p className="text-xs" style={{ color: 'var(--cream)' }}>
                    {caseRow.clientName}
                  </p>
                  <Link
                    href={`/admin/asignar?case=${caseRow.id}`}
                    className="text-xs px-2 py-1 rounded-lg"
                    style={{ background: 'rgba(200,168,75,0.2)', color: 'var(--gold-light)' }}
                  >
                    Asignar
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--gold-light)' }}>
          Gestión
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { href: '/admin/usuarios', label: 'Gestionar usuarios', icon: 'Usuarios' },
            { href: '/admin/asignar', label: 'Asignar asesores', icon: 'Casos' },
            { href: '/admin/tickets', label: 'Todos los tickets', icon: 'Soporte' },
            { href: '/admin/config', label: 'Configuración', icon: 'Config' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 p-4 rounded-2xl border transition-colors hover:border-yellow-500/40"
              style={{ background: 'var(--navy-card)', borderColor: 'rgba(200,168,75,0.1)' }}
            >
              <span
                className="text-xs px-2 py-1 rounded-lg"
                style={{ background: 'rgba(200,168,75,0.15)', color: 'var(--gold-light)' }}
              >
                {item.icon}
              </span>
              <span className="text-sm" style={{ color: 'var(--cream)' }}>
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
