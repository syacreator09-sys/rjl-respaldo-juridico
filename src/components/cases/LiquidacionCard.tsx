'use client'
import { useState } from 'react'
import { calcularLiquidacion } from '@/lib/calculadora-lft'

export function LiquidacionCard({
  salarioInicial,
  fechaIngresoInicial,
}: {
  salarioInicial?: number
  fechaIngresoInicial?: string
}) {
  const [salario, setSalario] = useState(String(salarioInicial ?? ''))
  const [fechaIngreso, setFechaIngreso] = useState(fechaIngresoInicial ?? '')
  const [tipo, setTipo] = useState<'rescision' | 'retiro_voluntario'>('rescision')
  const [resultado, setResultado] = useState<ReturnType<typeof calcularLiquidacion> | null>(null)

  function calcular() {
    if (!salario || !fechaIngreso) return
    const r = calcularLiquidacion({
      salario_diario: parseFloat(salario),
      fecha_ingreso: fechaIngreso,
      tipo,
    })
    setResultado(r)
  }

  return (
    <div className="p-4 rounded-2xl border space-y-4"
      style={{ background: 'var(--navy-card)', borderColor: 'rgba(200,168,75,0.15)' }}>
      <h3 className="font-semibold text-sm" style={{ color: 'var(--gold-light)' }}>
        ⚖️ Calculadora de derechos laborales
      </h3>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs mb-1" style={{ color: 'var(--text-mid)' }}>
            Salario diario (MXN)
          </label>
          <input type="number" value={salario} onChange={e => setSalario(e.target.value)}
            placeholder="248.93" step="0.01"
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: 'var(--navy-light)', color: 'var(--cream)' }} />
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: 'var(--text-mid)' }}>
            Fecha de ingreso
          </label>
          <input type="date" value={fechaIngreso} onChange={e => setFechaIngreso(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: 'var(--navy-light)', color: 'var(--cream)' }} />
        </div>
      </div>

      <div>
        <label className="block text-xs mb-1" style={{ color: 'var(--text-mid)' }}>
          Tipo de terminación
        </label>
        <select value={tipo} onChange={e => setTipo(e.target.value as typeof tipo)}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
          style={{ background: 'var(--navy-light)', color: 'var(--cream)' }}>
          <option value="rescision">Rescisión injustificada (despido)</option>
          <option value="retiro_voluntario">Retiro voluntario (renuncia)</option>
        </select>
      </div>

      <button onClick={calcular}
        className="w-full py-2.5 rounded-xl text-sm font-medium"
        style={{ background: 'linear-gradient(135deg,var(--gold),var(--gold-dim))', color: 'var(--navy)' }}>
        Calcular derechos
      </button>

      {resultado && (
        <div className="space-y-2 pt-2 border-t" style={{ borderColor: 'rgba(200,168,75,0.1)' }}>
          <div className="flex justify-between text-xs py-1"
            style={{ borderBottom: '1px solid rgba(200,168,75,0.08)' }}>
            <span style={{ color: 'var(--text-dim)' }}>Antigüedad</span>
            <span style={{ color: 'var(--cream)' }}>
              {resultado.años_servicio} años, {resultado.meses_fraccion} meses
            </span>
          </div>
          {resultado.desglose.slice(2).map((line, i) => {
            const isTotal = line.startsWith('TOTAL')
            return (
              <div key={i} className="flex justify-between text-xs py-1"
                style={{ borderBottom: '1px solid rgba(200,168,75,0.08)' }}>
                <span style={{ color: isTotal ? 'var(--gold-light)' : 'var(--text-dim)', fontWeight: isTotal ? 600 : 400 }}>
                  {line.split(':')[0]}
                </span>
                <span style={{ color: isTotal ? 'var(--gold)' : 'var(--cream)', fontWeight: isTotal ? 700 : 400 }}>
                  {line.split(':')[1]?.trim()}
                </span>
              </div>
            )
          })}
          <p className="text-xs pt-1" style={{ color: 'var(--text-dim)' }}>
            * Cálculo estimado basado en LFT vigente. Consulta con un asesor RJL para cifras exactas.
          </p>
        </div>
      )}
    </div>
  )
}
