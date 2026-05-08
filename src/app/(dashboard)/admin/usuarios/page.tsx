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

  const stats = {
    total: users.length,
    clientes: users.filter((entry) => entry.role === 'cliente').length,
    asesores: users.filter((entry) => entry.role === 'asesor').length,
    admins: users.filter((entry) => entry.role === 'admin').length,
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-2">
        <h1
          className="text-3xl font-bold"
          style={{ color: 'var(--gold-light)', fontFamily: 'Cormorant Garamond, serif' }}
        >
          Gestionar usuarios
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
          Cambia rol y estado operativo sin salir del backoffice.
        </p>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'var(--gold)' },
          { label: 'Clientes', value: stats.clientes, color: '#4CAF50' },
          { label: 'Asesores', value: stats.asesores, color: '#2196F3' },
          { label: 'Admins', value: stats.admins, color: '#E07070' },
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
        {users.map((profile) => {
          const isCurrentAdmin = profile.id === user.id

          return (
            <form
              key={profile.id}
              action={updateUserAction}
              className="p-4 rounded-2xl border space-y-4"
              style={{ background: 'var(--navy-card)', borderColor: 'rgba(200,168,75,0.1)' }}
            >
              <input type="hidden" name="userId" value={profile.id} />

              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--cream)' }}>
                    {profile.full_name ?? 'Usuario sin nombre'}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                    ID: {profile.id.slice(0, 8)}... {profile.phone ? `· ${profile.phone}` : ''}
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
                    Suscripción: {profile.subscription_status ?? 'sin registro'}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span
                    className="text-xs px-2 py-1 rounded-lg"
                    style={{
                      background: profile.is_active ? 'rgba(76,175,80,0.15)' : 'rgba(224,112,112,0.15)',
                      color: profile.is_active ? '#4CAF50' : '#E07070',
                    }}
                  >
                    {profile.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                  <span
                    className="text-xs px-2 py-1 rounded-lg"
                    style={{ background: 'rgba(200,168,75,0.15)', color: 'var(--gold-light)' }}
                  >
                    {profile.role}
                  </span>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
                <label className="space-y-1">
                  <span className="text-xs" style={{ color: 'var(--text-dim)' }}>
                    Rol
                  </span>
                  <select
                    name="role"
                    defaultValue={profile.role}
                    disabled={isCurrentAdmin}
                    className="w-full px-3 py-2 rounded-xl text-sm"
                    style={{ background: 'var(--navy-light)', color: 'var(--cream)' }}
                  >
                    <option value="cliente">Cliente</option>
                    <option value="asesor">Asesor</option>
                    <option value="admin">Admin</option>
                  </select>
                </label>

                <label className="space-y-1">
                  <span className="text-xs" style={{ color: 'var(--text-dim)' }}>
                    Estado
                  </span>
                  <select
                    name="isActive"
                    defaultValue={profile.is_active ? 'true' : 'false'}
                    disabled={isCurrentAdmin}
                    className="w-full px-3 py-2 rounded-xl text-sm"
                    style={{ background: 'var(--navy-light)', color: 'var(--cream)' }}
                  >
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
                  </select>
                </label>

                <button
                  type="submit"
                  disabled={isCurrentAdmin}
                  className="px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(135deg,var(--gold),var(--gold-dim,#7A6030))',
                    color: 'var(--navy)',
                  }}
                >
                  Guardar
                </button>
              </div>

              {isCurrentAdmin && (
                <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                  Tu propio acceso admin queda bloqueado aquí para evitar deshabilitar el backoffice.
                </p>
              )}
            </form>
          )
        })}
      </section>
    </div>
  )
}
