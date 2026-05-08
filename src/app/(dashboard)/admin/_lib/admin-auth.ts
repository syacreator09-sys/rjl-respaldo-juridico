import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export interface AdminSession {
  user: {
    id: string
    email: string | null
  }
  profile: {
    id: string
    role: string
    full_name: string | null
  }
}

export async function requireAdmin(): Promise<AdminSession> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any
  const { data: profile } = (await sb
    .from('profiles')
    .select('id, role, full_name')
    .eq('id', user.id)
    .single()) as { data: { id: string; role: string; full_name: string | null } | null }

  if (!profile || profile.role !== 'admin') {
    redirect('/cliente')
  }

  return {
    user: {
      id: user.id,
      email: user.email ?? null,
    },
    profile,
  }
}
