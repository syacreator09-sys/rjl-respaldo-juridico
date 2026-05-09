import Link from 'next/link'
import { ReactNode } from 'react'

function joinClasses(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ')
}

export function PageIntro({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="space-y-2">
        {eyebrow ? (
          <p className="text-[11px] uppercase tracking-[0.3em] text-[#E5C97A]/70">{eyebrow}</p>
        ) : null}
        <div className="space-y-1">
          <h1 className="font-serif text-3xl text-[#F2EDE0] md:text-4xl">{title}</h1>
          {description ? <p className="max-w-3xl text-sm text-[#F2EDE0]/60">{description}</p> : null}
        </div>
      </div>
      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
    </section>
  )
}

export function SectionFrame({
  title,
  description,
  aside,
  children,
  id,
  className,
}: {
  title: string
  description?: string
  aside?: ReactNode
  children: ReactNode
  id?: string
  className?: string
}) {
  return (
    <section
      id={id}
      className={joinClasses(
        'rounded-[28px] border border-[rgba(200,168,75,0.14)] bg-[rgba(17,30,53,0.88)] p-5 shadow-[0_24px_70px_rgba(3,9,20,0.24)] backdrop-blur',
        className,
      )}
    >
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <h2 className="font-serif text-2xl text-[#F2EDE0]">{title}</h2>
          {description ? <p className="max-w-2xl text-sm text-[#F2EDE0]/58">{description}</p> : null}
        </div>
        {aside ? <div className="flex shrink-0 items-center gap-2">{aside}</div> : null}
      </div>
      {children}
    </section>
  )
}

export function StatusBadge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'neutral' | 'gold' | 'success' | 'warning' | 'danger' | 'info'
}) {
  const tones = {
    neutral: 'bg-white/5 text-[#F2EDE0]/70 border-white/10',
    gold: 'bg-[#C8A84B]/15 text-[#E5C97A] border-[#C8A84B]/30',
    success: 'bg-[#4CAF50]/15 text-[#7EE488] border-[#4CAF50]/30',
    warning: 'bg-[#FF9800]/15 text-[#FFBF61] border-[#FF9800]/30',
    danger: 'bg-[#E07070]/15 text-[#FFADAD] border-[#E07070]/30',
    info: 'bg-[#2196F3]/15 text-[#7BC0FF] border-[#2196F3]/30',
  } as const

  return (
    <span className={joinClasses('inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium', tones[tone])}>
      {children}
    </span>
  )
}

export function ActionButton({
  href,
  children,
  variant = 'primary',
}: {
  href: string
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
}) {
  const variants = {
    primary: 'bg-[linear-gradient(135deg,var(--gold),var(--gold-dim))] text-[#0A1628] hover:brightness-110',
    secondary: 'border border-[#C8A84B]/25 bg-[#172240] text-[#E5C97A] hover:border-[#C8A84B]/45 hover:bg-[#1E2E50]',
    ghost: 'border border-white/10 bg-white/0 text-[#F2EDE0]/75 hover:border-white/20 hover:text-[#F2EDE0]',
  } as const

  return (
    <Link href={href} className={joinClasses('inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-medium transition', variants[variant])}>
      {children}
    </Link>
  )
}

export function MetricTile({
  label,
  value,
  hint,
  tone = 'gold',
}: {
  label: string
  value: ReactNode
  hint?: ReactNode
  tone?: 'gold' | 'danger' | 'info' | 'success' | 'neutral'
}) {
  const colors = {
    gold: 'text-[#E5C97A]',
    danger: 'text-[#FFADAD]',
    info: 'text-[#7BC0FF]',
    success: 'text-[#7EE488]',
    neutral: 'text-[#F2EDE0]',
  } as const

  return (
    <div className="rounded-3xl border border-white/8 bg-[#0F1B31] p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-[#F2EDE0]/45">{label}</p>
      <p className={joinClasses('mt-2 text-3xl font-semibold', colors[tone])}>{value}</p>
      {hint ? <p className="mt-2 text-xs text-[#F2EDE0]/48">{hint}</p> : null}
    </div>
  )
}

export function ListRow({
  title,
  description,
  meta,
  trailing,
}: {
  title: string
  description?: string
  meta?: ReactNode
  trailing?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/8 bg-[#0F1B31] px-4 py-3 md:flex-row md:items-center md:justify-between">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-[#F2EDE0]">{title}</p>
          {meta}
        </div>
        {description ? <p className="text-xs text-[#F2EDE0]/55">{description}</p> : null}
      </div>
      {trailing ? <div className="flex shrink-0 items-center gap-2">{trailing}</div> : null}
    </div>
  )
}

export function ProfileChip({
  label,
  value,
}: {
  label: string
  value: ReactNode
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-[#0F1B31] px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.2em] text-[#F2EDE0]/42">{label}</p>
      <p className="mt-1 text-sm text-[#F2EDE0]">{value}</p>
    </div>
  )
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="rounded-3xl border border-dashed border-[#C8A84B]/22 bg-[#0F1B31] px-5 py-8 text-center">
      <p className="font-serif text-2xl text-[#E5C97A]">RJL</p>
      <p className="mt-3 text-sm font-medium text-[#F2EDE0]">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-xs leading-6 text-[#F2EDE0]/52">{description}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  )
}
