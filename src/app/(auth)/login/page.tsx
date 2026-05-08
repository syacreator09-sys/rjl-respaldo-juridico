'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type LoginRole = 'cliente' | 'asesor' | 'admin'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError('No se pudo recuperar tu sesión. Intenta de nuevo.')
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single() as unknown as { data: { role: LoginRole } | null }

    if (profile?.role === 'admin') router.push('/admin')
    else if (profile?.role === 'asesor') router.push('/asesor')
    else router.push('/cliente')
  }

  return (
    <div className="min-h-screen bg-[#0A1628] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <Link href="/" className="font-serif text-2xl text-[#C8A84B] font-semibold">
            RJL
          </Link>
          <p className="text-[#F2EDE0]/50 text-sm mt-1">Respaldo Juridico Laboral</p>
        </div>

        <div className="bg-[#172240] rounded-2xl p-8 space-y-5">
          <h1 className="font-serif text-xl text-[#F2EDE0]">Iniciar sesion</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs text-[#F2EDE0]/50 mb-1.5">Correo electronico</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#0A1628] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-[#F2EDE0] outline-none focus:border-[#C8A84B]/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-[#F2EDE0]/50 mb-1.5">Contrasena</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[#0A1628] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-[#F2EDE0] outline-none focus:border-[#C8A84B]/50 transition-colors"
              />
            </div>
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#C8A84B] text-[#0A1628] font-semibold py-2.5 rounded-lg text-sm hover:bg-[#E5C97A] transition-colors disabled:opacity-50"
            >
              {loading ? 'Entrando...' : 'Iniciar sesion'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[#F2EDE0]/40">
          Sin cuenta?{' '}
          <Link href="/register" className="text-[#C8A84B] hover:underline">
            Registrate gratis
          </Link>
        </p>
      </div>
    </div>
  )
}
