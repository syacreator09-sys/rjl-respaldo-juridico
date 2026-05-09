import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/ui/dashboard-shell'
import { createClient } from '@/lib/supabase/server'

// Force all dashboard pages to render dynamically
// Prevents prerender errors when NEXT_PUBLIC_SUPABASE_URL is not set at build time
export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .maybeSingle() as unknown as { data: { full_name: string | null; role: string | null } | null }

  return (
    <DashboardShell
      fullName={profile?.full_name}
      email={user.email}
      roleLabel={profile?.role}
    >
      {children}
    </DashboardShell>
  )
}
