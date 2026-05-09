import { ActionButton, MetricTile, PageIntro, SectionFrame, StatusBadge } from '@/components/ui/rjl-primitives'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '../_lib/admin-auth'
import { updateUserAction } from '../_actions'

interface UserRow {
  id: string
  full_name: string | null
  phone: string | null
  role: 'cliente' | 'asesor' | 'admin'
  is_active: boolean
  created_at: string
  subscription_status: string | null
}

interface ProfileListRow {
  id: string
  full_name: string | null
  phone: string | null
  role: 'cliente' | 'asesor' | 'admin'
  is_active: boolean
  created_at: string
}

interface SubscriptionListRow {
  user_id: string
  status: string
}

function groupTitle(role: UserRow['role']) {
  if (role === 'cliente') return 'Clientes'
  if (role === 'asesor') return 'Asesores'
  return 'Admins'
}

export default async function AdminUsuariosPage() {
  const { user } = await requireAdmin()
  const supabase = await createClient()

  const [{ data: profiles }, { data: subscriptions }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, phone, role, is_active, created_at')
      .order('created_at', { ascending: false }),
    supabase.from('subscriptions').select('user_id, status'),
  ])

  const profileRows = (profiles ?? []) as ProfileListRow[]
  const subscriptionRows = (subscriptions ?? []) as SubscriptionListRow[]
  const subscriptionByUser = new Map(subscriptionRows.map((subscription) => [subscription.user_id, subscription.status]))

  const users: UserRow[] = profileRows.map((profile) => ({
    ...profile,
    subscription_status: subscriptionByUser.get(profile.id) ?? null,
  }))

  const grouped = {
    cliente: users.filter((entry) => entry.role === 'cliente'),
    asesor: users.filter((entry) => entry.role === 'asesor'),
    admin: users.filter((entry) => entry.role === 'admin'),
  }

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Admin · Usuarios"
        title="Consola segmentada de usuarios"
        description="Mira por rol quien esta activo, con que plan y que permisos tiene antes de editar."
        action={<ActionButton href="/admin">Volver al resumen</ActionButton>}
      />

      <section className="grid gap-4 md:grid-cols-4">
        <MetricTile label="Total" value={users.length} tone="gold" />
        <MetricTile label="Clientes" value={grouped.cliente.length} tone="success" />
        <MetricTile label="Asesores" value={grouped.asesor.length} tone="info" />
        <MetricTile label="Admins" value={grouped.admin.length} tone="danger" />
      </section>

      {(['asesor', 'cliente', 'admin'] as const).map((role) => (
        <SectionFrame
          key={role}
          title={groupTitle(role)}
          description={`Edicion operativa de ${groupTitle(role).toLowerCase()} con estado, rol y plan visible.`}
          aside={<StatusBadge tone={role === 'admin' ? 'danger' : role === 'asesor' ? 'info' : 'success'}>{grouped[role].length} registro(s)</StatusBadge>}
        >
          <div className="space-y-3">
            {grouped[role].map((profile) => {
              const isCurrentAdmin = profile.id === user.id

              return (
                <form
                  key={profile.id}
                  action={updateUserAction}
                  className="rounded-2xl border border-white/8 bg-[#0F1B31] p-4"
                >
                  <input type="hidden" name="userId" value={profile.id} />
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-[#F2EDE0]">{profile.full_name ?? 'Usuario sin nombre'}</p>
                        <StatusBadge tone={profile.is_active ? 'success' : 'danger'}>
                          {profile.is_active ? 'Activo' : 'Inactivo'}
                        </StatusBadge>
                        <StatusBadge tone="gold">{profile.role}</StatusBadge>
                        {profile.subscription_status ? <StatusBadge tone="info">{profile.subscription_status}</StatusBadge> : null}
                      </div>
                      <p className="text-xs text-[#F2EDE0]/45">
                        {profile.phone ? `${profile.phone} · ` : ''}Alta {new Date(profile.created_at).toLocaleDateString('es-MX')}
                      </p>
                    </div>

                    <div className="grid gap-3 md:grid-cols-[180px_180px_auto] md:items-end">
                      <label className="space-y-1">
                        <span className="text-xs text-[#F2EDE0]/45">Rol</span>
                        <select
                          name="role"
                          defaultValue={profile.role}
                          disabled={isCurrentAdmin}
                          className="w-full rounded-2xl border border-white/10 bg-[#172240] px-3 py-2 text-sm text-[#F2EDE0]"
                        >
                          <option value="cliente">Cliente</option>
                          <option value="asesor">Asesor</option>
                          <option value="admin">Admin</option>
                        </select>
                      </label>

                      <label className="space-y-1">
                        <span className="text-xs text-[#F2EDE0]/45">Estado</span>
                        <select
                          name="isActive"
                          defaultValue={profile.is_active ? 'true' : 'false'}
                          disabled={isCurrentAdmin}
                          className="w-full rounded-2xl border border-white/10 bg-[#172240] px-3 py-2 text-sm text-[#F2EDE0]"
                        >
                          <option value="true">Activo</option>
                          <option value="false">Inactivo</option>
                        </select>
                      </label>

                      <button
                        type="submit"
                        disabled={isCurrentAdmin}
                        className="rounded-2xl bg-[linear-gradient(135deg,var(--gold),var(--gold-dim))] px-4 py-2.5 text-sm font-medium text-[#0A1628] disabled:opacity-50"
                      >
                        Guardar
                      </button>
                    </div>
                  </div>

                  {isCurrentAdmin ? (
                    <p className="mt-3 text-xs text-[#F2EDE0]/42">
                      Tu propio acceso admin queda bloqueado aqui para evitar dejar el backoffice sin control.
                    </p>
                  ) : null}
                </form>
              )
            })}
          </div>
        </SectionFrame>
      ))}
    </div>
  )
}
