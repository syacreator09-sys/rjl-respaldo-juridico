import Link from 'next/link'
import { PublicChatView } from '@/components/chat/PublicChatView'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0A1628]">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <span className="font-serif text-xl text-[#C8A84B] font-semibold tracking-wide">RJL</span>
        <div className="flex gap-3">
          <Link href="/login"
            className="px-4 py-1.5 text-sm text-[#F2EDE0]/70 hover:text-[#F2EDE0] transition-colors">
            Iniciar sesión
          </Link>
          <Link href="/register"
            className="px-4 py-1.5 text-sm bg-[#C8A84B] text-[#0A1628] rounded-lg font-medium hover:bg-[#E5C97A] transition-colors">
            Registrarse
          </Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-16 grid lg:grid-cols-2 gap-16 items-start">
        {/* Hero */}
        <div className="space-y-6">
          <div className="inline-block px-3 py-1 bg-[#C8A84B]/10 border border-[#C8A84B]/30 rounded-full text-[#C8A84B] text-xs font-medium">
            Asesoría Jurídico-Laboral · México
          </div>
          <h1 className="font-serif text-4xl lg:text-5xl text-[#F2EDE0] leading-tight">
            Conoce tus derechos laborales <span className="text-[#C8A84B]">en segundos</span>
          </h1>
          <p className="text-[#F2EDE0]/60 text-lg leading-relaxed">
            Calcula tu liquidación, finiquito, aguinaldo y vacaciones con la Ley Federal del Trabajo.
            Guarda evidencias con GPS. Consulta con un asesor real.
          </p>

          <div className="grid grid-cols-3 gap-4 pt-4">
            {[
              { n: '40M+', l: 'trabajadores en México' },
              { n: '$200', l: 'MXN/mes plan completo' },
              { n: '3', l: 'preguntas gratis al día' },
            ].map(({ n, l }) => (
              <div key={l} className="bg-[#172240] rounded-xl p-4 text-center">
                <div className="font-serif text-2xl text-[#C8A84B]">{n}</div>
                <div className="text-xs text-[#F2EDE0]/50 mt-1">{l}</div>
              </div>
            ))}
          </div>

          <div className="space-y-3 text-sm text-[#F2EDE0]/60">
            {[
              'Liquidación: 3 meses + 20 días por año + proporcionales',
              'Bóveda de evidencias con GPS e inmutabilidad legal',
              'Historial completo de consultas guardado',
              'Asesor humano asignado para casos complejos',
            ].map((f) => (
              <div key={f} className="flex items-center gap-2">
                <span className="text-[#C8A84B]">✓</span> {f}
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <Link href="/register"
              className="px-6 py-3 bg-[#C8A84B] text-[#0A1628] rounded-xl font-semibold hover:bg-[#E5C97A] transition-colors">
              Crear cuenta gratis
            </Link>
            <Link href="/login"
              className="px-6 py-3 border border-white/20 text-[#F2EDE0]/70 rounded-xl hover:border-white/40 hover:text-[#F2EDE0] transition-colors">
              Ya tengo cuenta
            </Link>
          </div>
        </div>

        {/* Chat */}
        <div className="lg:sticky lg:top-8">
          <p className="text-xs text-[#F2EDE0]/40 mb-3 text-center">
            Prueba el asistente — 3 consultas gratis, sin registro
          </p>
          <PublicChatView />
          <p className="text-xs text-[#F2EDE0]/30 mt-3 text-center">
            La orientación proporcionada es informativa. Para casos con montos altos consulta con un asesor.
          </p>
        </div>
      </div>
    </main>
  )
}
