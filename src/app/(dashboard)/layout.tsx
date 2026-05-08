// Force all dashboard pages to render dynamically
// Prevents prerender errors when NEXT_PUBLIC_SUPABASE_URL is not set at build time
export const dynamic = 'force-dynamic'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
