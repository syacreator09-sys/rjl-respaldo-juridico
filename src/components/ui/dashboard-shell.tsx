'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'

type RoleKey = 'cliente' | 'asesor' | 'admin'

const roleTabs = [
  { key: 'publico', label: 'Publico', href: '/' },
  { key: 'cliente', label: 'Cliente', href: '/cliente' },
  { key: 'asesor', label: 'Asesor', href: '/asesor' },
  { key: 'admin', label: 'Admin', href: '/admin' },
] as const

const subnavByRole: Record<RoleKey, Array<{ label: string; href: string }>> = {
  cliente: [
    { label: 'Resumen', href: '/cliente' },
    { label: 'Evidencias', href: '/cliente/evidencias' },
    { label: 'Consultas', href: '/cliente/tickets' },
    { label: 'Asesor virtual', href: '/cliente/chat' },
  ],
  asesor: [
    { label: 'Bandeja', href: '/asesor' },
    { label: 'Clientes', href: '/asesor#clientes' },
    { label: 'Proyeccion', href: '/asesor#proyeccion' },
    { label: 'Analisis', href: '/asesor#analisis' },
  ],
  admin: [
    { label: 'Resumen', href: '/admin' },
    { label: 'Usuarios', href: '/admin/usuarios' },
    { label: 'Asignaciones', href: '/admin/asignar' },
    { label: 'Tickets', href: '/admin/tickets' },
    { label: 'Config', href: '/admin/config' },
  ],
}

function getRole(pathname: string): RoleKey {
  if (pathname.startsWith('/admin')) return 'admin'
  if (pathname.startsWith('/asesor')) return 'asesor'
  return 'cliente'
}

function isActive(pathname: string, href: string) {
  if (href.includes('#')) {
    const [base] = href.split('#')
    return pathname === base
  }

  if (href === pathname) return true
  if (href !== '/' && pathname.startsWith(`${href}/`)) return true
  return false
}

export function DashboardShell({
  children,
  fullName,
  email,
  roleLabel,
}: {
  children: ReactNode
  fullName?: string | null
  email?: string | null
  roleLabel?: string | null
}) {
  const pathname = usePathname()
  const currentRole = getRole(pathname)
  const subnav = subnavByRole[currentRole]

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(200,168,75,0.09),_transparent_32%),linear-gradient(180deg,#0A1628_0%,#091221_100%)]">
      <header className="sticky top-0 z-30 border-b border-white/8 bg-[rgba(10,22,40,0.85)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 lg:px-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--gold),var(--gold-dim))] font-serif text-xl font-semibold text-[#0A1628]">
                RJL
              </div>
              <div>
                <p className="font-serif text-xl text-[#E5C97A]">Respaldo Juridico Laboral</p>
                <p className="text-xs text-[#F2EDE0]/52">Expedientes, evidencia y estrategia laboral mexicana</p>
              </div>
            </div>

            <div className="flex flex-col items-start gap-3 md:items-end">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-[#C8A84B]/25 bg-[#C8A84B]/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-[#E5C97A]">
                  {roleLabel ?? currentRole}
                </span>
                <form action="/api/auth/signout" method="post">
                  <button className="rounded-full border border-white/10 px-3 py-1 text-xs text-[#F2EDE0]/62 transition hover:border-white/20 hover:text-[#F2EDE0]">
                    Salir
                  </button>
                </form>
              </div>
              <div className="text-right">
                <p className="text-sm text-[#F2EDE0]">{fullName ?? 'Usuario RJL'}</p>
                <p className="text-xs text-[#F2EDE0]/45">{email ?? 'Sesion activa'}</p>
              </div>
            </div>
          </div>

          <nav className="flex flex-wrap gap-2">
            {roleTabs.map((item) => {
              const active = isActive(pathname, item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-4 py-2 text-sm transition ${
                    active
                      ? 'bg-[#C8A84B] text-[#0A1628]'
                      : 'border border-white/10 bg-white/0 text-[#F2EDE0]/68 hover:border-[#C8A84B]/35 hover:text-[#F2EDE0]'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <nav className="flex flex-wrap gap-2 border-t border-white/8 pt-3">
            {subnav.map((item) => {
              const active = isActive(pathname, item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-3 py-1.5 text-xs transition ${
                    active
                      ? 'bg-[#172240] text-[#F2EDE0]'
                      : 'text-[#F2EDE0]/52 hover:bg-white/5 hover:text-[#F2EDE0]'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-6">{children}</main>
    </div>
  )
}
