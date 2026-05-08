import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { rateLimit } from '@/lib/rate-limit'
import { createClient } from '@/lib/supabase/server'
import { routeChat } from '@/lib/ai/router'

const bodySchema = z.object({
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1).max(2000),
      }),
    )
    .min(1)
    .max(20),
  caseId: z.string().uuid().optional(),
})

interface SubscriptionRow {
  status: string
}

interface CaseContextRow {
  id: string
  case_data: {
    employer_name: string | null
    salary_daily: number | null
    start_date: string | null
    position: string | null
    work_hours_paper: string | null
    work_hours_real: string | null
    has_imss: boolean
    has_contract: boolean
    notes: string | null
  } | null
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'

  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos invalidos', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let hasSub = false

  if (!user) {
    const { success } = await rateLimit(ip)
    if (!success) {
      return NextResponse.json(
        { error: 'Limite de preguntas gratuitas alcanzado. Suscribete para acceso ilimitado.' },
        { status: 429 },
      )
    }
  } else {
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('status')
      .eq('user_id', user.id)
      .maybeSingle() as unknown as { data: SubscriptionRow | null }

    hasSub = sub?.status === 'active' || sub?.status === 'trialing'

    if (!hasSub) {
      const { success } = await rateLimit(`user:${user.id}`)
      if (!success) {
        return NextResponse.json(
          { error: 'Tu suscripcion no esta activa. Activa tu plan para continuar.' },
          { status: 402 },
        )
      }
    }
  }

  const { history, caseId } = parsed.data

  let caseRow: CaseContextRow | null = null
  if (user) {
    const query = supabase
      .from('cases')
      .select('id, case_data(*)')
      .eq('client_id', user.id)
      .eq('status', 'active')

    const result = caseId
      ? await query.eq('id', caseId).maybeSingle()
      : await query.maybeSingle()

    caseRow = (result as unknown as { data: CaseContextRow | null }).data
  }

  const userMessage = history.at(-1)?.content ?? ''
  const chatHistory = history.slice(0, -1) as Array<{ role: 'user' | 'assistant'; content: string }>
  const tier = (!!process.env.ANTHROPIC_API_KEY && hasSub) ? 'premium' : 'free'

  const { reply: assistantText } = await routeChat({
    tier,
    userMessage,
    history: chatHistory,
    caseData: caseRow?.case_data ?? undefined,
  })

  if (user) {
    const last = history.at(-1)
    if (last?.role === 'user') {
      // The generated Supabase client types are still conservative around the
      // newly-added chat_messages table, so keep this write explicit here.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('chat_messages').insert([
        { user_id: user.id, role: 'user', content: last.content },
        { user_id: user.id, role: 'assistant', content: assistantText || 'Sin respuesta.' },
      ])
    }
  }

  return new Response(assistantText, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
