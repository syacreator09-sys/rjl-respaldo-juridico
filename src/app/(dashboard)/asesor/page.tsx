import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AnalisisIAButton from '@/components/asesor/AnalisisIAButton'

interface CaseData {
  employer_name?: string
  position?: string
  salary_daily?: number
  start_date?: string
  work_hours_paper?: string
  work_hours_real?: string
  has_imss?: boolean
  has_contract?: boolean
}

interface CaseRow {
  id: string
  status: string
  created_at: string
  case_data: CaseData | null
  client: { full_name: string | null; phone: string | null } | null
  tickets_count: number
}

export default async function AsesorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
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
      id, status, created_at,
      case_data(*),
      profiles!client_id(full_name, phone)
    `)
    .eq('asesor_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false }) as { data: Array<{
      id: string; status: string; created_at: string;
      case_data: CaseData | null;
      profiles: { full_name: string | null; phone: string | null } | null
    }> | null }

  // Contar tickets abiertos por caso
  const cases: CaseRow[] = await Promise.all(
    (rawCases ?? []).map(async (c) => {
      const { count } = await sb
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('case_id', c.id)
        .eq('status', 'open') as { count: number | null }
      return {
        id: c.id,
        status: c.status,
        created_at: c.created_at,
        case_data: c.case_data,
        client: c.profiles,
        tickets_count: count ?? 0,
      }
    })
  )

  const totalTicketsAbiertos = cases.reduce((s, c) => s + c.tickets_count, 0)

  return (
    <div style={{ background: 'var(--navy)', minHeight: '100vh' }}>
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-3 border-b sticky top-0 z-10"
        style={{ background: 'var(--navy-mid,#111E35)', borderColor: 'rgba(200,168,75,0.15)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold"
            style={{ background: 'linear-gradient(135deg,var(--gold),var(--gold-dim,#7A6030))', color: 'var(--navy)', fontFamily: 'Cormorant Garamond, serif', fontSize: 16 }}>
            RJL
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--gold-light)', fontFamily: 'Cormorant Garamond, serif' }}>
              Panel Asesor
            </p>
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
              {profile.full_name ?? user.email}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-1 rounded-lg"
            style={{ background: 'rgba(33,150,243,0.15)', color: '#2196F3' }}>
            Asesor
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Casos activos', value: cases.length, color: 'var(--gold)' },
            { label: 'Tickets abiertos', value: totalTicketsAbiertos, color: '#E07070' },
            { label: 'Total clientes', value: cases.length, color: '#2196F3' },
          ].map(stat => (
            <div key={stat.label} className="p-4 rounded-2xl border text-center"
              style={{ background: 'var(--navy-card)', borderColor: 'rgba(200,168,75,0.1)' }}>
              <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Casos asignados */}
        <div>
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--gold-light)' }}>
            Casos asignados
          </h2>

          {cases.length === 0 ? (
            <div className="p-8 rounded-2xl border text-center"
              style={{ background: 'var(--navy-card)', borderColor: 'rgba(200,168,75,0.1)' }}>
              <p className="text-2xl mb-2">📂</p>
              <p className="text-sm font-medium" style={{ color: 'var(--cream)' }}>Sin casos asignados</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
                El administrador asignará casos desde el panel admin
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {cases.map(c => (
                <CaseCard key={c.id} caso={c} />
              ))}
            </div>
          )}
        </div>

        {/* Tickets pendientes */}
        {totalTicketsAbiertos > 0 && (
          <div>
            <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--gold-light)' }}>
              Tickets abiertos
            </h2>
            <TicketsBandeja userId={user.id} />
          </div>
        )}
      </main>
    </div>
  )
}

function CaseCard({ caso }: { caso: CaseRow }) {
  const cd = caso.case_data
  const antiguedadMeses = cd?.start_date
    ? Math.floor((Date.now() - new Date(cd.start_date).getTime()) / (1000 * 60 * 60 * 24 * 30))
    : null

  return (
    <div className="p-4 rounded-2xl border"
      style={{ background: 'var(--navy-card)', borderColor: 'rgba(200,168,75,0.1)' }}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--cream)' }}>
            {caso.client?.full_name ?? 'Cliente sin nombre'}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
            {cd?.employer_name ?? 'Empleador no especificado'}
            {cd?.position ? ` · ${cd.position}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {caso.tickets_count > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-lg"
              style={{ background: 'rgba(224,112,112,0.15)', color: '#E07070' }}>
              {caso.tickets_count} ticket{caso.tickets_count !== 1 ? 's' : ''}
            </span>
          )}
          <span className="text-xs px-2 py-0.5 rounded-lg"
            style={{ background: 'rgba(76,175,80,0.15)', color: '#4CAF50' }}>
            Activo
          </span>
        </div>
      </div>

      {/* Datos clave */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {cd?.salary_daily && (
          <div className="p-2 rounded-lg" style={{ background: 'var(--navy-light)' }}>
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>Salario/día</p>
            <p className="text-sm font-semibold" style={{ color: 'var(--cream)' }}>
              ${cd.salary_daily} MXN
            </p>
          </div>
        )}
        {antiguedadMeses !== null && (
          <div className="p-2 rounded-lg" style={{ background: 'var(--navy-light)' }}>
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>Antigüedad</p>
            <p className="text-sm font-semibold" style={{ color: 'var(--cream)' }}>
              {antiguedadMeses >= 12
                ? `${Math.floor(antiguedadMeses / 12)} año${Math.floor(antiguedadMeses / 12) !== 1 ? 's' : ''}`
                : `${antiguedadMeses} meses`}
            </p>
          </div>
        )}
        <div className="p-2 rounded-lg" style={{ background: 'var(--navy-light)' }}>
          <p className="text-xs" style={{ color: 'var(--text-dim)' }}>IMSS</p>
          <p className="text-sm font-semibold" style={{ color: cd?.has_imss ? '#4CAF50' : '#E07070' }}>
            {cd?.has_imss ? 'Sí' : 'No'}
          </p>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex gap-2">
        <AnalisisIAButton caseId={caso.id} />
        <Link href={`/asesor/tickets?case=${caso.id}`}
          className="flex-1 py-2 rounded-xl text-xs font-medium text-center border"
          style={{ borderColor: 'rgba(200,168,75,0.3)', color: 'var(--gold-light)' }}>
          Ver tickets
        </Link>
      </div>
    </div>
  )
}


function TicketsBandeja({ userId }: { userId: string }) {
  return (
    <div className="p-4 rounded-2xl border text-center"
      style={{ background: 'var(--navy-card)', borderColor: 'rgba(200,168,75,0.1)' }}>
      <Link href="/asesor/tickets" className="text-xs" style={{ color: 'var(--gold-dim,#7A6030)' }}>
        Ver todos los tickets asignados →
      </Link>
    </div>
  )
}
