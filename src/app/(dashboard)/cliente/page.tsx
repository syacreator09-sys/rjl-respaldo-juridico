import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ClientChatView } from '@/components/chat/ClientChatView'
import { ManageSubscriptionButton } from '@/components/billing/ManageSubscriptionButton'
import { ActionButton, EmptyState, MetricTile, PageIntro, ProfileChip, SectionFrame, StatusBadge } from '@/components/ui/rjl-primitives'
import { calcularLiquidacion } from '@/lib/calculadora-lft'
import { createClient } from '@/lib/supabase/server'

interface DashboardProfile {
  full_name: string | null
  phone: string | null
  created_at?: string | null
}

interface DashboardCaseData {
  employer_name: string | null
  position: string | null
  salary_daily: number | null
  start_date: string | null
  work_hours_paper: string | null
  work_hours_real: string | null
  has_imss: boolean | null
  has_contract: boolean | null
}

interface DashboardCaseRow {
  id: string
  created_at: string
  case_data: DashboardCaseData | null
}

interface DashboardSubscription {
  status: string
}

interface EvidenceRow {
  category: string
  server_time: string
  gps_lat: number | null
}

interface TicketRow {
  id: string
  question: string
  status: 'open' | 'in_progress' | 'closed'
  priority: 'low' | 'medium' | 'high'
  created_at: string
  response: string | null
}

interface ChatMessageRow {
  role: 'user' | 'assistant'
  content: string
}

const evidenceCategories = [
  { key: 'entrada_trabajo', label: 'Entrada', note: 'Prueba asistencia y horario real.' },
  { key: 'salida_trabajo', label: 'Salida', note: 'Refuerza jornada y horas extra.' },
  { key: 'contrato', label: 'Contrato', note: 'Ayuda a probar condiciones pactadas.' },
  { key: 'recibo_pago', label: 'Recibos', note: 'Soporta salario y pagos pendientes.' },
  { key: 'gastos_medicos', label: 'Gastos medicos', note: 'Documenta afectaciones y reembolso.' },
  { key: 'cambio_domicilio', label: 'Domicilio', note: 'Apoya notificaciones y ubicacion.' },
  { key: 'otro', label: 'Otros', note: 'Capturas, audios o documentos complementarios.' },
] as const

const ticketStatusTone = {
  open: 'info',
  in_progress: 'warning',
  closed: 'success',
} as const

const ticketStatusLabel = {
  open: 'Sin leer',
  in_progress: 'En proceso',
  closed: 'Atendido',
} as const

const priorityLabel = {
  low: 'Normal',
  medium: 'Media',
  high: 'Alta',
} as const

function formatCaseAge(iso?: string | null) {
  if (!iso) return 'Expediente reciente'
  const created = new Date(iso)
  const months = Math.max(0, Math.floor((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24 * 30)))
  if (months >= 12) return `${Math.floor(months / 12)} ano(s) con RJL`
  if (months >= 1) return `${months} mes(es) con RJL`
  return 'Expediente abierto este mes'
}

function formatDate(iso?: string | null) {
  if (!iso) return 'Pendiente'
  return new Date(iso).toLocaleDateString('es-MX')
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
    { data: ticketRows },
    { data: historyRows },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, phone, created_at')
      .eq('id', user.id)
      .single() as unknown as Promise<{ data: DashboardProfile | null }>,
    supabase
      .from('cases')
      .select('id, created_at, case_data(*)')
      .eq('client_id', user.id)
      .eq('status', 'active')
      .maybeSingle() as unknown as Promise<{ data: DashboardCaseRow | null }>,
    supabase
      .from('subscriptions')
      .select('status')
      .eq('user_id', user.id)
      .maybeSingle() as unknown as Promise<{ data: DashboardSubscription | null }>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('tickets')
      .select('id, question, status, priority, created_at, response')
      .eq('client_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5) as Promise<{ data: TicketRow[] | null }>,
    supabase
      .from('chat_messages')
      .select('role, content')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(20) as unknown as Promise<{ data: ChatMessageRow[] | null }>,
  ])

  const { data: evidenceRows } = caseRow
    ? await (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any)
          .from('evidence')
          .select('category, server_time, gps_lat')
          .eq('case_id', caseRow.id)
          .order('server_time', { ascending: false }) as Promise<{ data: EvidenceRow[] | null }>
      )
    : { data: [] as EvidenceRow[] }

  // Onboarding: new users with no case and no prior activity go to case creation
  const isNewUser = !caseRow && !(ticketRows?.length) && !(historyRows?.length)
  if (isNewUser) redirect('/cliente/caso?onboarding=1')

  const caseDetails = caseRow?.case_data ?? null
  const hasPremium = subscription?.status === 'active' || subscription?.status === 'trialing'
  const liquidacion = caseDetails?.salary_daily && caseDetails?.start_date
    ? calcularLiquidacion({
        salario_diario: caseDetails.salary_daily,
        fecha_ingreso: caseDetails.start_date,
        tipo: 'rescision',
      })
    : null

  const evidenceByCategory = new Map<string, { count: number; gps: number; last?: string }>()
  for (const item of evidenceRows ?? []) {
    const current = evidenceByCategory.get(item.category) ?? { count: 0, gps: 0 }
    evidenceByCategory.set(item.category, {
      count: current.count + 1,
      gps: current.gps + (item.gps_lat ? 1 : 0),
      last: current.last ?? item.server_time,
    })
  }

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Cliente"
        title={`Hola, ${profile?.full_name?.split(' ')[0] ?? 'bienvenido'}`}
        description="Tu expediente vive aqui: revisa tus datos, fortalece la evidencia y decide tu siguiente movimiento sin salir de una sola pantalla."
        action={
          caseRow ? (
            <>
              <ActionButton href="/cliente/caso" variant="secondary">
                Actualizar datos
              </ActionButton>
              <ActionButton href={`/api/expediente/${caseRow.id}`}>
                Descargar expediente
              </ActionButton>
            </>
          ) : (
            <ActionButton href="/cliente/caso">Crear expediente</ActionButton>
          )
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <MetricTile
          label="Plan"
          value={hasPremium ? 'Premium' : 'Gratuito'}
          hint={
            hasPremium
              ? <ManageSubscriptionButton />
              : 'Te quedan 3 consultas gratis por dia en plan publico.'
          }
          tone={hasPremium ? 'success' : 'gold'}
        />
        <MetricTile
          label="Consultas activas"
          value={(ticketRows ?? []).filter((ticket) => ticket.status !== 'closed').length}
          hint="Tickets recientes que siguen abiertos o en proceso."
          tone="info"
        />
        <MetricTile
          label="Evidencias"
          value={(evidenceRows ?? []).length}
          hint={`${(evidenceRows ?? []).filter((item) => item.gps_lat).length} con GPS verificado`}
          tone="gold"
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <SectionFrame
            title="Mi perfil"
            description="Datos de contacto y contexto general de tu expediente."
            aside={<StatusBadge tone={hasPremium ? 'success' : 'gold'}>{hasPremium ? 'Suscripcion activa' : 'Plan gratuito'}</StatusBadge>}
          >
            <div className="grid gap-3 md:grid-cols-2">
              <ProfileChip label="Nombre" value={profile?.full_name ?? 'Pendiente'} />
              <ProfileChip label="Correo" value={user.email ?? 'Pendiente'} />
              <ProfileChip label="Telefono" value={profile?.phone ?? 'Sin telefono'} />
              <ProfileChip label="Antiguedad" value={formatCaseAge(caseRow?.created_at ?? profile?.created_at)} />
            </div>
          </SectionFrame>

          <SectionFrame
            title="Mis datos laborales"
            description="Resumen legible del caso para detectar rapido lo que falta."
            aside={<ActionButton href="/cliente/caso" variant="secondary">Editar detalle</ActionButton>}
          >
            {!caseDetails ? (
              <EmptyState
                title="Aun no has llenado tus datos laborales."
                description="Sin salario, fecha de ingreso y condiciones basicas no podemos proyectar montos con precision."
                action={<ActionButton href="/cliente/caso">Completar expediente</ActionButton>}
              />
            ) : (
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <ProfileChip label="Empleador" value={caseDetails.employer_name ?? 'Pendiente'} />
                  <ProfileChip label="Puesto" value={caseDetails.position ?? 'Pendiente'} />
                  <ProfileChip label="Salario diario" value={caseDetails.salary_daily ? `$${caseDetails.salary_daily} MXN` : 'Pendiente'} />
                  <ProfileChip label="Fecha de ingreso" value={formatDate(caseDetails.start_date)} />
                  <ProfileChip label="IMSS" value={caseDetails.has_imss ? 'Si registrado' : 'Sin IMSS'} />
                  <ProfileChip label="Contrato" value={caseDetails.has_contract ? 'Tiene contrato' : 'Sin contrato'} />
                </div>

                {liquidacion ? (
                  <div className="rounded-3xl border border-[#C8A84B]/14 bg-[#0F1B31] p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-[#F2EDE0]">Proyeccion inicial de liquidacion</p>
                        <p className="text-xs text-[#F2EDE0]/48">Estimado automatico con la informacion actual.</p>
                      </div>
                      <StatusBadge tone="gold">LFT</StatusBadge>
                    </div>
                    <div className="space-y-1.5">
                      {liquidacion.desglose.slice(0, 6).map((line) => (
                        <p key={line} className={`text-sm ${line.startsWith('TOTAL') ? 'font-semibold text-[#E5C97A]' : 'text-[#F2EDE0]/62'}`}>
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </SectionFrame>

          <SectionFrame
            title="Boveda de evidencias"
            description="Las categorias te dicen que tan defendible es hoy tu expediente."
            aside={<ActionButton href="/cliente/evidencias">Subir evidencia</ActionButton>}
          >
            <div className="grid gap-3 md:grid-cols-2">
              {evidenceCategories.map((category) => {
                const summary = evidenceByCategory.get(category.key)
                return (
                  <div key={category.key} className="rounded-2xl border border-white/8 bg-[#0F1B31] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-[#F2EDE0]">{category.label}</p>
                        <p className="mt-1 text-xs leading-5 text-[#F2EDE0]/52">{category.note}</p>
                      </div>
                      <StatusBadge tone={summary?.count ? 'success' : 'neutral'}>
                        {summary?.count ?? 0} archivo{summary?.count === 1 ? '' : 's'}
                      </StatusBadge>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-[#F2EDE0]/45">
                      <span>{summary?.gps ? `${summary.gps} con GPS` : 'Sin GPS registrado'}</span>
                      <span>{summary?.last ? `Ultima: ${formatDate(summary.last)}` : 'Pendiente'}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </SectionFrame>
        </div>

        <div className="space-y-6">
          <SectionFrame
            title="Mis consultas al asesor"
            description="Tus tickets recientes, con prioridad y respuesta visible sin salir del expediente."
            aside={<ActionButton href="/cliente/tickets/new">Nueva consulta</ActionButton>}
          >
            {(ticketRows ?? []).length === 0 ? (
              <EmptyState
                title="No has enviado consultas todavia."
                description="Crea un ticket si necesitas revision humana sobre tu caso, estrategia o documentacion."
                action={<ActionButton href="/cliente/tickets/new">Crear primer ticket</ActionButton>}
              />
            ) : (
              <div className="space-y-3">
                {(ticketRows ?? []).map((ticket) => (
                  <div key={ticket.id} className="rounded-2xl border border-white/8 bg-[#0F1B31] p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge tone={ticketStatusTone[ticket.status]}>{ticketStatusLabel[ticket.status]}</StatusBadge>
                      <StatusBadge tone={ticket.priority === 'high' ? 'danger' : ticket.priority === 'medium' ? 'warning' : 'neutral'}>
                        Prioridad {priorityLabel[ticket.priority]}
                      </StatusBadge>
                      <span className="text-xs text-[#F2EDE0]/42">{formatDate(ticket.created_at)}</span>
                    </div>
                    <p className="mt-3 text-sm text-[#F2EDE0]">
                      {ticket.question.length > 180 ? `${ticket.question.slice(0, 180)}...` : ticket.question}
                    </p>
                    {ticket.response ? (
                      <div className="mt-3 rounded-2xl border border-[#C8A84B]/14 bg-[#172240] p-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-[#E5C97A]/78">Respuesta reciente</p>
                        <p className="mt-2 text-sm leading-6 text-[#F2EDE0]/78">
                          {ticket.response.length > 220 ? `${ticket.response.slice(0, 220)}...` : ticket.response}
                        </p>
                      </div>
                    ) : null}
                  </div>
                ))}
                <div className="flex justify-end">
                  <ActionButton href="/cliente/tickets" variant="secondary">
                    Ver historial completo
                  </ActionButton>
                </div>
              </div>
            )}
          </SectionFrame>

          <SectionFrame
            title="Asesor virtual"
            description="Chat premium con el contexto de tu expediente. Sirve para preparar preguntas, revisar montos y ordenar el caso."
            aside={<StatusBadge tone={hasPremium ? 'success' : 'gold'}>{hasPremium ? 'Ilimitado' : 'Limitado'}</StatusBadge>}
            id="chat"
          >
            <ClientChatView caseId={caseRow?.id} initialMessages={historyRows ?? []} />
            {!hasPremium ? (
              <div className="mt-4 flex justify-end">
                <ActionButton href="/pricing">Activar plan premium</ActionButton>
              </div>
            ) : null}
          </SectionFrame>
        </div>
      </div>
    </div>
  )
}
