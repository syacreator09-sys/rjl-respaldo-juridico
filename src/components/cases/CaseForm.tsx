'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface CaseFormValues {
  employer_name?: string | null
  position?: string | null
  start_date?: string | null
  salary_daily?: number | null
  work_hours_paper?: string | null
  work_hours_real?: string | null
  has_imss?: boolean
  has_contract?: boolean
}

interface CaseFormProps {
  activeCaseId?: string | null
  initialValues?: CaseFormValues | null
  redirectTo?: string
}

export function CaseForm({ activeCaseId, initialValues, redirectTo = '/cliente' }: CaseFormProps) {
  const supabase = createClient()
  const router = useRouter()
  const [d, setD] = useState({
    employer: initialValues?.employer_name ?? '',
    position: initialValues?.position ?? '',
    start_date: initialValues?.start_date ?? '',
    salary: initialValues?.salary_daily ? String(initialValues.salary_daily) : '',
    hours_paper: initialValues?.work_hours_paper ?? '',
    hours_real: initialValues?.work_hours_real ?? '',
    has_imss: initialValues?.has_imss ?? false,
    has_contract: initialValues?.has_contract ?? false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError('Tu sesión expiró. Inicia sesión otra vez.')
      setLoading(false)
      return
    }

    // Keep the single active case invariant in the app layer.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any

    try {
      let caseId = activeCaseId ?? null

      if (!caseId) {
        const { data: existingCase } = await sb
          .from('cases')
          .select('id')
          .eq('client_id', user.id)
          .eq('status', 'active')
          .maybeSingle()

        caseId = existingCase?.id ?? null
      }

      if (!caseId) {
        const { data: createdCase, error: caseError } = await sb
          .from('cases')
          .insert({ client_id: user.id })
          .select('id')
          .single()

        if (caseError || !createdCase) throw new Error(caseError?.message ?? 'No se pudo crear el caso.')
        caseId = createdCase.id
      }

      const payload = {
        case_id: caseId,
        employer_name: d.employer || null,
        position: d.position || null,
        start_date: d.start_date || null,
        salary_daily: d.salary ? parseFloat(d.salary) : null,
        work_hours_paper: d.hours_paper || null,
        work_hours_real: d.hours_real || null,
        has_imss: d.has_imss,
        has_contract: d.has_contract,
      }

      const { data: existingCaseData } = await sb
        .from('case_data')
        .select('id')
        .eq('case_id', caseId)
        .maybeSingle()

      const { error: saveError } = existingCaseData
        ? await sb.from('case_data').update(payload).eq('case_id', caseId)
        : await sb.from('case_data').insert(payload)

      if (saveError) throw new Error(saveError.message)

      router.push(redirectTo)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar tu expediente.')
    } finally {
      setLoading(false)
    }
  }

  const inp = (label: string, key: keyof typeof d, type = 'text') => (
    <div key={key}>
      <label className="block text-xs mb-1" style={{ color: 'var(--text-mid)' }}>
        {label}
      </label>
      <input
        type={type}
        value={d[key] as string}
        onChange={(e) => setD((p) => ({ ...p, [key]: e.target.value }))}
        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
        style={{ background: 'var(--navy-light)', color: 'var(--cream)' }}
      />
    </div>
  )

  return (
    <form
      onSubmit={submit}
      className="space-y-3 p-5 rounded-2xl border"
      style={{ background: 'var(--navy-card)', borderColor: 'rgba(200,168,75,0.15)' }}
    >
      <h3 className="font-semibold text-sm" style={{ color: 'var(--gold-light)' }}>
        Datos de tu caso laboral
      </h3>
      {inp('Empleador / empresa', 'employer')}
      {inp('Puesto', 'position')}
      {inp('Fecha de inicio', 'start_date', 'date')}
      {inp('Salario diario (MXN)', 'salary', 'number')}
      {inp('Horario según contrato', 'hours_paper')}
      {inp('Horario real trabajado', 'hours_real')}
      <div className="flex gap-4 text-xs" style={{ color: 'var(--text-mid)' }}>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={d.has_imss}
            onChange={(e) => setD((p) => ({ ...p, has_imss: e.target.checked }))}
          />
          Tengo IMSS
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={d.has_contract}
            onChange={(e) => setD((p) => ({ ...p, has_contract: e.target.checked }))}
          />
          Tengo contrato escrito
        </label>
      </div>
      {error && <p className="text-xs text-[#E07070]">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 rounded-xl text-sm font-medium disabled:opacity-50"
        style={{ background: 'linear-gradient(135deg,var(--gold),var(--gold-dim))', color: 'var(--navy)' }}
      >
        {loading ? 'Guardando...' : activeCaseId ? 'Guardar cambios' : 'Crear expediente'}
      </button>
    </form>
  )
}
