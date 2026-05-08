import Link from 'next/link'
import { redirect } from 'next/navigation'
import { calcularLiquidacion } from '@/lib/calculadora-lft'
import { createClient } from '@/lib/supabase/server'

interface DashboardProfile {
  full_name: string | null
}

interface DashboardCaseData {
  employer_name: string | null
  position: string | null
  salary_daily: number | null
  start_date: string | null
}

interface DashboardCaseRow {
  id: string
  case_data: DashboardCaseData | null
}

interface DashboardSubscription {
  status: string
}

export default async function ClienteDashboard() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [
    { data: profile },
    { data: caseRow },
    { data: subscription },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single() as unknown as Promise<{ data: DashboardProfile | null }>,
    supabase
      .from('cases')
      .select('id, case_data(*)')
      .eq('client_id', user.id)
      .eq('status', 'active')
      .maybeSingle() as unknown as Promise<{ data: DashboardCaseRow | null }>,
    supabase
      .from('subscriptions')
      .select('status')
      .eq('user_id', user.id)
      .maybeSingle() as unknown as Promise<{ data: DashboardSubscription | null }>,
  ])

  const caseDetails = caseRow?.case_data ?? null
  const hasPremium = subscription?.status === 'active' || subscription?.status === 'trialing'
  const liquidacion = caseDetails?.salary_daily && caseDetails?.start_date
    ? calcularLiquidacion({
        salario_diario: caseDetails.salary_daily,
        fecha_ingreso: caseDetails.start_date,
        tipo: 'rescision',
      })
    : null

  return (
    <div className="min-h-screen bg-[#0A1628]">
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <span className="font-serif text-lg text-[#C8A84B]">RJL</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-[#F2EDE0]/50">{user.email}</span>
          <form action="/api/auth/signout" method="post">
            <button className="text-xs text-[#F2EDE0]/40 hover:text-[#F2EDE0]/70 transition-colors">
              Salir
            </button>
          </form>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        <div>
          <h1 className="font-serif text-2xl text-[#F2EDE0]">
            Hola, {profile?.full_name?.split(' ')[0] ?? 'bienvenido'}
          </h1>
          <p className="text-[#F2EDE0]/50 text-sm mt-1">Panel de tu caso laboral</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-[#172240] rounded-2xl p-6 space-y-4">
            <h2 className="font-semibold text-[#F2EDE0]">Tu liquidacion estimada</h2>
            {liquidacion ? (
              <div className="space-y-2">
                {liquidacion.desglose.map((line, i) => (
                  <p
                    key={i}
                    className={`text-sm ${line.startsWith('TOTAL') ? 'text-[#C8A84B] font-semibold text-base' : 'text-[#F2EDE0]/60'}`}
                  >
                    {line}
                  </p>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-[#F2EDE0]/50">
                  Completa tus datos laborales para calcular tu liquidacion.
                </p>
                <Link
                  href="/cliente/caso"
                  className="block text-center text-sm bg-[#C8A84B] text-[#0A1628] font-semibold py-2.5 rounded-lg hover:bg-[#E5C97A] transition-colors"
                >
                  Agregar datos laborales
                </Link>
              </div>
            )}
          </div>

          <div className="bg-[#172240] rounded-2xl p-6 space-y-4">
            <h2 className="font-semibold text-[#F2EDE0]">Tu plan</h2>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-[#C8A84B]/10 border border-[#C8A84B]/30 rounded-full text-[#C8A84B] text-xs font-medium">
                {hasPremium ? 'Premium' : 'Gratuito'}
              </span>
            </div>
            {!hasPremium && (
              <div className="space-y-3">
                <p className="text-sm text-[#F2EDE0]/50">
                  3 consultas gratis/dia · Chat ilimitado con plan premium
                </p>
                <Link
                  href="/pricing"
                  className="block text-center text-sm border border-[#C8A84B]/50 text-[#C8A84B] py-2.5 rounded-lg hover:bg-[#C8A84B]/10 transition-colors"
                >
                  Ver plan premium - $200 MXN/mes
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { href: '/cliente/chat', label: 'Chat con asesor', icon: 'Chat' },
            { href: '/cliente/evidencias', label: 'Mis evidencias', icon: 'Vault' },
            { href: '/cliente/tickets', label: 'Mis tickets', icon: 'Tickets' },
            { href: '/cliente/caso', label: 'Mi caso', icon: 'Caso' },
          ].map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className="bg-[#172240] hover:bg-[#1E2E50] rounded-xl p-4 text-center transition-colors"
            >
              <div className="text-sm font-semibold text-[#C8A84B] mb-2">{icon}</div>
              <div className="text-xs text-[#F2EDE0]/70">{label}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
