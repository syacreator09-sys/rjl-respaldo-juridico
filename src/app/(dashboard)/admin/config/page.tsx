import { PageIntro, SectionFrame, StatusBadge } from '@/components/ui/rjl-primitives'
import { createClient } from '@/lib/supabase/server'
import { updateConfigAction } from '../_actions'
import { requireAdmin } from '../_lib/admin-auth'

interface ConfigRow {
  key: string
  value: string
  description: string | null
  updated_at: string
}

function getConfigGroup(key: string) {
  if (key.startsWith('billing_') || key.startsWith('pricing_')) return 'Negocio'
  if (key.startsWith('support_') || key.startsWith('ticket_') || key.startsWith('ops_')) return 'Operacion'
  if (key.startsWith('legal_') || key.startsWith('product_')) return 'Legal / producto'
  return 'Soporte'
}

export default async function AdminConfigPage() {
  await requireAdmin()
  const supabase = await createClient()
  const { data: configRows } = await supabase
    .from('system_config')
    .select('key, value, description, updated_at')
    .order('key', { ascending: true })
  const rows = (configRows ?? []) as ConfigRow[]

  const grouped = rows.reduce<Record<string, ConfigRow[]>>((acc, row) => {
    const group = getConfigGroup(row.key)
    acc[group] = acc[group] ?? []
    acc[group].push(row)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Admin · Config"
        title="Reglas del sistema"
        description="Ordena la configuracion por dominios para que negocio, operacion y producto no compitan en la misma lista."
      />

      {Object.entries(grouped).map(([group, entries]) => (
        <SectionFrame
          key={group}
          title={group}
          description="Cada clave muestra valor actual y contexto suficiente para editar con cuidado."
          aside={<StatusBadge tone="gold">{entries.length} clave(s)</StatusBadge>}
        >
          <div className="space-y-3">
            {entries.map((row) => (
              <form
                key={row.key}
                action={updateConfigAction}
                className="rounded-2xl border border-white/8 bg-[#0F1B31] p-4"
              >
                <input type="hidden" name="key" value={row.key} />
                <div className="mb-4 space-y-1">
                  <p className="text-sm font-medium text-[#F2EDE0]">{row.key}</p>
                  <p className="text-xs text-[#F2EDE0]/45">
                    Ultima actualizacion: {new Date(row.updated_at).toLocaleString('es-MX')}
                  </p>
                </div>

                <div className="grid gap-3 lg:grid-cols-[1fr_1.2fr_auto] lg:items-end">
                  <label className="space-y-1">
                    <span className="text-xs text-[#F2EDE0]/45">Valor actual</span>
                    <input
                      name="value"
                      defaultValue={row.value}
                      className="w-full rounded-2xl border border-white/10 bg-[#172240] px-3 py-2 text-sm text-[#F2EDE0]"
                    />
                  </label>

                  <label className="space-y-1">
                    <span className="text-xs text-[#F2EDE0]/45">Impacto</span>
                    <textarea
                      name="description"
                      defaultValue={row.description ?? ''}
                      rows={2}
                      className="w-full resize-none rounded-2xl border border-white/10 bg-[#172240] px-3 py-2 text-sm text-[#F2EDE0]"
                    />
                  </label>

                  <button
                    type="submit"
                    className="rounded-2xl bg-[linear-gradient(135deg,var(--gold),var(--gold-dim))] px-4 py-2.5 text-sm font-medium text-[#0A1628]"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            ))}
          </div>
        </SectionFrame>
      ))}
    </div>
  )
}
