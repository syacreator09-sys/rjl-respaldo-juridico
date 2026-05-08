import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ClientChatView } from '@/components/chat/ClientChatView'
import { createClient } from '@/lib/supabase/server'

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
    <div style={{ background: 'var(--navy)', minHeight: '100vh', padding: '1.5rem' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <Link href="/cliente" className="text-xs mb-4 block" style={{ color: 'var(--text-dim)' }}>
          ← Panel cliente
        </Link>
        <h1
          className="text-2xl font-bold mb-6"
          style={{ color: 'var(--gold-light)', fontFamily: 'Cormorant Garamond, serif' }}
        >
          Chat premium
        </h1>
        <ClientChatView caseId={caseRow?.id} initialMessages={history ?? []} />
      </div>
    </div>
  )
}
