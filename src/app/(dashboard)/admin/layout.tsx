import Link from 'next/link'
import { requireAdmin } from './_lib/admin-auth'

const navItems = [
  { href: '/admin', label: 'Resumen' },
  { href: '/admin/usuarios', label: 'Usuarios' },
  { href: '/admin/asignar', label: 'Asignar' },
  { href: '/admin/tickets', label: 'Tickets' },
  { href: '/admin/config', label: 'Config' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile, user } = await requireAdmin()

  return (
    <div style={{ background: 'var(--navy)', minHeight: '100vh' }}>
      <header
        className="border-b sticky top-0 z-10"
        style={{ background: 'var(--navy-mid,#111E35)', borderColor: 'rgba(200,168,75,0.15)' }}
      >
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
              style={{
                background: 'linear-gradient(135deg,var(--gold),var(--gold-dim,#7A6030))',
                color: 'var(--navy)',
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: 17,
              }}
            >
              RJL
            </div>
            <div>
              <p
                className="text-base font-semibold"
                style={{ color: 'var(--gold-light)', fontFamily: 'Cormorant Garamond, serif' }}
              >
                Backoffice Admin
              </p>
              <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                {profile.full_name ?? user.email ?? 'Administrador'}
              </p>
            </div>
          </div>

          <nav className="flex flex-wrap gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-xs px-3 py-2 rounded-xl border"
                style={{ color: 'var(--cream)', borderColor: 'rgba(200,168,75,0.18)' }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
