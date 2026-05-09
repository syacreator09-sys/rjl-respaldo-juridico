import Link from 'next/link'
import { PublicChatView } from '@/components/chat/PublicChatView'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(200,168,75,0.09),_transparent_28%),linear-gradient(180deg,#0A1628_0%,#08101F_100%)]">
      <nav className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--gold),var(--gold-dim))] font-serif text-lg font-semibold text-[#0A1628]">
              RJL
            </div>
            <div>
              <p className="font-serif text-xl text-[#E5C97A]">Respaldo Juridico Laboral</p>
              <p className="text-xs text-[#F2EDE0]/45">Orientacion laboral mexicana para trabajadores</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link href="/login" className="rounded-full border border-white/10 px-4 py-2 text-sm text-[#F2EDE0]/70 transition hover:border-white/20 hover:text-[#F2EDE0]">
              Iniciar sesion
            </Link>
            <Link href="/register" className="rounded-full bg-[#C8A84B] px-4 py-2 text-sm font-medium text-[#0A1628] transition hover:bg-[#E5C97A]">
              Crear cuenta
            </Link>
          </div>
        </div>
      </nav>

      <section className="mx-auto flex max-w-4xl flex-col items-center px-6 py-14 text-center">
        <div className="inline-flex items-center rounded-full border border-[#C8A84B]/25 bg-[#C8A84B]/10 px-4 py-1 text-xs uppercase tracking-[0.25em] text-[#E5C97A]">
          Publico · Mexico
        </div>
        <h1 className="mt-6 max-w-3xl font-serif text-4xl leading-tight text-[#F2EDE0] md:text-6xl">
          Haz una pregunta laboral y entiende tus siguientes pasos con claridad.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-8 text-[#F2EDE0]/62 md:text-lg">
          Calcula liquidacion, finiquito, vacaciones y riesgos basicos. Si tu caso escala, RJL guarda
          evidencias con GPS y lo convierte en expediente.
        </p>

        <div className="mt-6 rounded-full border border-[#C8A84B]/25 bg-[rgba(17,30,53,0.85)] px-5 py-3 text-sm text-[#F2EDE0]/72">
          La orientacion es informativa y no sustituye asesoria legal personalizada. Casos urgentes o de alto monto deben revisarse con un asesor.
        </div>

        <div className="mt-10 w-full max-w-3xl">
          <PublicChatView />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm text-[#F2EDE0]/60">
          <span>3 consultas gratis al dia</span>
          <span className="text-[#C8A84B]">•</span>
          <span>Plan completo desde $200 MXN/mes</span>
          <span className="text-[#C8A84B]">•</span>
          <Link href="/register" className="text-[#E5C97A] transition hover:text-[#F2EDE0]">
            Abrir expediente premium
          </Link>
        </div>
      </section>
    </main>
  )
}
