'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [sent, setSent]         = useState(false)
  const supabase = createClient()
  const router   = useRouter()

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName } }
    })
    if (error) { setError(error.message); setLoading(false); return }
    setSent(true)
  }

  if (sent) return (
    <div className="min-h-screen bg-[#0A1628] flex items-center justify-center p-6">
      <div className="text-center space-y-4 max-w-sm">
        <div className="text-4xl">✉️</div>
        <h2 className="font-serif text-xl text-[#F2EDE0]">Revisa tu correo</h2>
        <p className="text-[#F2EDE0]/50 text-sm">
          Te enviamos un enlace de confirmación a <strong className="text-[#F2EDE0]">{email}</strong>
        </p>
        <Link href="/login" className="block text-[#C8A84B] text-sm hover:underline">
          Ir al inicio de sesión
        </Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0A1628] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <Link href="/" className="font-serif text-2xl text-[#C8A84B] font-semibold">RJL</Link>
          <p className="text-[#F2EDE0]/50 text-sm mt-1">3 consultas gratis · Sin tarjeta</p>
        </div>

        <div className="bg-[#172240] rounded-2xl p-8 space-y-5">
          <h1 className="font-serif text-xl text-[#F2EDE0]">Crear cuenta</h1>
          <form onSubmit={handleRegister} className="space-y-4">
            {[
              { label: 'Nombre completo', value: fullName, set: setFullName, type: 'text' },
              { label: 'Correo electrónico', value: email, set: setEmail, type: 'email' },
              { label: 'Contraseña', value: password, set: setPassword, type: 'password' },
            ].map(({ label, value, set, type }) => (
              <div key={label}>
                <label className="block text-xs text-[#F2EDE0]/50 mb-1.5">{label}</label>
                <input type={type} value={value} onChange={e => set(e.target.value)} required
                  className="w-full bg-[#0A1628] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-[#F2EDE0] outline-none focus:border-[#C8A84B]/50 transition-colors" />
              </div>
            ))}
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full bg-[#C8A84B] text-[#0A1628] font-semibold py-2.5 rounded-lg text-sm hover:bg-[#E5C97A] transition-colors disabled:opacity-50">
              {loading ? 'Creando cuenta...' : 'Crear cuenta gratis'}
            </button>
          </form>
          <p className="text-xs text-[#F2EDE0]/30 text-center">
            Al registrarte aceptas nuestros términos de servicio
          </p>
        </div>

        <p className="text-center text-sm text-[#F2EDE0]/40">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-[#C8A84B] hover:underline">Iniciar sesión</Link>
        </p>
      </div>
    </div>
  )
}
