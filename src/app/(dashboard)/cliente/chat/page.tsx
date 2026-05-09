import { ClientChatView } from '@/components/chat/ClientChatView'
import { ActionButton, PageIntro, SectionFrame } from '@/components/ui/rjl-primitives'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

interface ChatMessageRow {
  role: 'user' | 'assistant'
  content: string
}

export default async function ClienteChatPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: caseRow }, { data: history }] = await Promise.all([
    supabase
      .from('cases')
      .select('id')
      .eq('client_id', user.id)
      .eq('status', 'active')
      .maybeSingle() as unknown as Promise<{ data: { id: string } | null }>,
    supabase
      .from('chat_messages')
      .select('role, content')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(20) as unknown as Promise<{ data: ChatMessageRow[] | null }>,
  ])

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Cliente · Asesor virtual"
        title="Chat completo del expediente"
        description="Vista expandida para revisar el historial premium completo."
        action={<ActionButton href="/cliente" variant="secondary">Volver al resumen</ActionButton>}
      />
      <SectionFrame title="Conversacion premium" description="El asistente responde con contexto de tu caso activo.">
        <ClientChatView caseId={caseRow?.id} initialMessages={history ?? []} />
      </SectionFrame>
    </div>
  )
}
