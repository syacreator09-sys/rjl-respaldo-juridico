import { createClient } from '@/lib/supabase/server'
import { updateConfigAction } from '../_actions'
import { requireAdmin } from '../_lib/admin-auth'

interface ConfigRow {
  key: string
  value: string
  description: string | null
  updated_at: string
}

export default async function AdminConfigPage() {
  await requireAdmin()
  const supabase = await createClient()
  const { data: configRows } = await supabase
    .from('system_config')
    .select('key, value, description, updated_at')
    .order('key', { ascending: true })
  const rows = (configRows ?? []) as ConfigRow[]

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-2">
        <h1
          className="text-3xl font-bold"
          style={{ color: 'var(--gold-light)', fontFamily: 'Cormorant Garamond, serif' }}
        >
          Configuración del sistema
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
          Ajusta constantes operativas del producto desde Supabase sin tocar código.
        </p>
      </section>

      <section className="space-y-3">
        {rows.map((row) => (
          <form
            key={row.key}
            action={updateConfigAction}
            className="p-4 rounded-2xl border space-y-4"
            style={{ background: 'var(--navy-card)', borderColor: 'rgba(200,168,75,0.1)' }}
          >
            <input type="hidden" name="key" value={row.key} />

            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--cream)' }}>
                {row.key}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                Última actualización: {new Date(row.updated_at).toLocaleString('es-MX')}
              </p>
            </div>

            <label className="space-y-1 block">
              <span className="text-xs" style={{ color: 'var(--text-dim)' }}>
                Valor
              </span>
              <input
                name="value"
                defaultValue={row.value}
                className="w-full px-3 py-2 rounded-xl text-sm"
                style={{ background: 'var(--navy-light)', color: 'var(--cream)' }}
              />
            </label>

            <label className="space-y-1 block">
              <span className="text-xs" style={{ color: 'var(--text-dim)' }}>
                Descripción
              </span>
              <textarea
                name="description"
                defaultValue={row.description ?? ''}
                rows={2}
                className="w-full px-3 py-2 rounded-xl text-sm resize-none"
                style={{ background: 'var(--navy-light)', color: 'var(--cream)' }}
              />
            </label>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-sm font-medium"
                style={{
                  background: 'linear-gradient(135deg,var(--gold),var(--gold-dim,#7A6030))',
                  color: 'var(--navy)',
                }}
              >
                Guardar configuración
              </button>
            </div>
          </form>
        ))}

        {rows.length === 0 && (
          <div
            className="p-8 rounded-2xl border text-center"
            style={{ background: 'var(--navy-card)', borderColor: 'rgba(200,168,75,0.1)' }}
          >
            <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
              No hay claves de configuración registradas.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
