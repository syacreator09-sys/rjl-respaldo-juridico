import Link from 'next/link'
import { SubscribeButton } from '@/components/billing/SubscribeButton'
import { createClient } from '@/lib/supabase/server'

export default async function PricingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <main className="min-h-screen bg-[#0A1628] text-[#F2EDE0]">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <Link href={user ? '/cliente' : '/'} className="text-sm text-[#C8A84B]">
          ← Volver
        </Link>
        <div className="mt-10 grid lg:grid-cols-[1.2fr_0.8fr] gap-8 items-start">
          <section className="space-y-6">
            <div className="inline-block px-3 py-1 bg-[#C8A84B]/10 border border-[#C8A84B]/30 rounded-full text-[#C8A84B] text-xs font-medium">
              Plan Premium RJL
            </div>
            <h1 className="font-serif text-4xl text-[#F2EDE0] leading-tight">
              Chat ilimitado, expediente centralizado y boveda de evidencias por <span className="text-[#C8A84B]">$200 MXN/mes</span>
            </h1>
            <p className="text-[#F2EDE0]/60 text-lg">
              Pensado para trabajadores que necesitan seguimiento constante, respaldo documental y orientación laboral clara.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                'Consultas ilimitadas con IA laboral',
                'Contexto de tu caso activo en el chat',
                'Boveda de evidencias con sello de tiempo',
                'Tickets para seguimiento con asesor',
              ].map((item) => (
                <div key={item} className="rounded-xl bg-[#172240] p-4 text-sm text-[#F2EDE0]/80">
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl bg-[#172240] p-6 border border-white/10 space-y-5">
            <div>
              <p className="text-sm text-[#F2EDE0]/50">Suscripcion mensual</p>
              <p className="font-serif text-4xl text-[#C8A84B]">$200</p>
              <p className="text-sm text-[#F2EDE0]/50">MXN al mes</p>
            </div>
            {user ? (
              <SubscribeButton />
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-[#F2EDE0]/60">
                  Inicia sesion o crea tu cuenta para activar el plan premium.
                </p>
                <Link
                  href="/login"
                  className="block text-center px-4 py-3 rounded-xl bg-[#C8A84B] text-[#0A1628] font-semibold"
                >
                  Iniciar sesion
                </Link>
                <Link
                  href="/register"
                  className="block text-center px-4 py-3 rounded-xl border border-[#C8A84B]/40 text-[#C8A84B]"
                >
                  Crear cuenta
                </Link>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}
