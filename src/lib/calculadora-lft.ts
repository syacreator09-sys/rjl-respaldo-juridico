export interface ParamsLiquidacion {
  salario_diario: number
  fecha_ingreso: string   // ISO: "2020-03-15"
  fecha_baja?: string     // ISO, default: hoy
  tipo: 'rescision' | 'retiro_voluntario' | 'muerte_riesgo_trabajo'
}

export interface ResultadoLiquidacion {
  años_servicio: number
  meses_fraccion: number
  dias_fraccion: number
  // Conceptos
  indemnizacion_constitucional: number  // 3 meses (solo rescisión)
  veinte_dias_por_año: number
  prima_antiguedad: number              // 12 días por año (tope 2 salarios mínimos)
  aguinaldo_proporcional: number        // 15 días × fracción de año
  vacaciones_proporcionales: number
  prima_vacacional_proporcional: number
  // Totales
  total_sin_prima_antiguedad: number
  total_con_prima_antiguedad: number
  // Metadatos
  salario_diario_usado: number
  salario_minimo_dia: number
  desglose: string[]
}

// Salario mínimo general vigente. Actualizar cada enero.
// 2024: 248.93 | 2025: 278.80 (DOF 28-nov-2024)
// Zona frontera norte 2025: 419.88 — usar solo si el caso aplica.
const SALARIO_MINIMO_DIA = Number(process.env.SALARIO_MINIMO_DIA ?? 278.80)
const DIAS_AGUINALDO = 15

// LFT Art. 76 — Tabla vigente desde reforma DOF 27-dic-2022 (efectiva 01-ene-2023)
// Duplica el mínimo: año 1 pasó de 6 a 12 días; +2 días por año adicional
const TABLA_VACACIONES: ReadonlyArray<{ hasta: number; dias: number }> = [
  { hasta: 1,  dias: 12 },
  { hasta: 2,  dias: 14 },
  { hasta: 3,  dias: 16 },
  { hasta: 4,  dias: 18 },
  { hasta: 9,  dias: 20 },
  { hasta: 14, dias: 22 },
  { hasta: 19, dias: 24 },
  { hasta: 24, dias: 26 },
  { hasta: 29, dias: 28 },
  { hasta: 34, dias: 30 },
  { hasta: Infinity, dias: 32 },
]

function calcularVacaciones(anios: number): number {
  if (anios < 1) return 0
  return TABLA_VACACIONES.find(r => anios <= r.hasta)?.dias ?? 12
}

function calcularAntiguedad(fechaIngreso: string, fechaBaja: string): {
  años: number; meses: number; dias: number; totalDias: number
} {
  const ingreso = new Date(fechaIngreso)
  const baja = new Date(fechaBaja)
  const msTotal = baja.getTime() - ingreso.getTime()
  const totalDias = Math.floor(msTotal / (1000 * 60 * 60 * 24))
  const años = Math.floor(totalDias / 365)
  const diasRestantes = totalDias - años * 365
  const meses = Math.floor(diasRestantes / 30)
  const dias = diasRestantes - meses * 30
  return { años, meses, dias, totalDias }
}

export function calcularLiquidacion(params: ParamsLiquidacion): ResultadoLiquidacion {
  const fechaBaja = params.fecha_baja ?? new Date().toISOString().split('T')[0]
  const { años, meses, dias, totalDias } = calcularAntiguedad(params.fecha_ingreso, fechaBaja)
  const sd = params.salario_diario
  const fraccionAño = (meses * 30 + dias) / 365

  // Indemnización constitucional (3 meses) — solo rescisión injustificada
  const indemnizacion = params.tipo === 'rescision' ? sd * 30 * 3 : 0

  // 20 días por año (rescisión o riesgo de trabajo)
  const veinteDias = (params.tipo === 'rescision' || params.tipo === 'muerte_riesgo_trabajo')
    ? sd * 20 * años + sd * 20 * fraccionAño
    : 0

  // Prima de antigüedad (12 días/año, tope 2 salarios mínimos)
  const sdPrimaAntiguedad = Math.min(sd, SALARIO_MINIMO_DIA * 2)
  const primaAntiguedad = sdPrimaAntiguedad * 12 * (años + fraccionAño)

  // Aguinaldo proporcional — días reales trabajados en el año calendario de la baja
  // Art. 87 LFT: 15 días mínimo/año. Proporcional = días en año corriente / 365
  const bajaDt = new Date(fechaBaja)
  const ingresoDt = new Date(params.fecha_ingreso)
  const inicioAño = new Date(bajaDt.getFullYear(), 0, 1)           // 1 enero del año de baja
  const inicioCalculo = ingresoDt > inicioAño ? ingresoDt : inicioAño // fecha más reciente
  const diasEnAñoActual = Math.max(0,
    Math.floor((bajaDt.getTime() - inicioCalculo.getTime()) / (1000 * 60 * 60 * 24))
  )
  const aguinaldo = sd * DIAS_AGUINALDO * (diasEnAñoActual / 365)

  // Vacaciones proporcionales (Art. 76) y prima vacacional (Art. 80 — 25% sobre vacaciones)
  const diasVac = calcularVacaciones(años)
  const vacacionesSinPrima = sd * diasVac * fraccionAño
  const primaVacacional = vacacionesSinPrima * 0.25

  const totalSinPrima = indemnizacion + veinteDias + aguinaldo + vacacionesSinPrima + primaVacacional
  const totalConPrima = totalSinPrima + primaAntiguedad

  const desglose: string[] = [
    `Antigüedad: ${años} años, ${meses} meses, ${dias} días`,
    `Salario diario: $${sd.toFixed(2)} MXN`,
    ...(indemnizacion > 0 ? [`3 meses constitucionales (Art. 49): $${indemnizacion.toFixed(2)}`] : []),
    ...(veinteDias > 0 ? [`20 días × año (Art. 50): $${veinteDias.toFixed(2)}`] : []),
    `Aguinaldo proporcional (Art. 87, ${diasEnAñoActual} días): $${aguinaldo.toFixed(2)}`,
    `Vacaciones proporcionales (Art. 76): $${vacacionesSinPrima.toFixed(2)}`,
    `Prima vacacional 25% (Art. 80): $${primaVacacional.toFixed(2)}`,
    `Prima de antigüedad (Art. 162): $${primaAntiguedad.toFixed(2)}`,
    `TOTAL (sin prima ant.): $${totalSinPrima.toFixed(2)}`,
    `TOTAL (con prima ant.): $${totalConPrima.toFixed(2)}`,
  ]

  return {
    años_servicio: años,
    meses_fraccion: meses,
    dias_fraccion: dias,
    indemnizacion_constitucional: Math.round(indemnizacion * 100) / 100,
    veinte_dias_por_año: Math.round(veinteDias * 100) / 100,
    prima_antiguedad: Math.round(primaAntiguedad * 100) / 100,
    aguinaldo_proporcional: Math.round(aguinaldo * 100) / 100,
    vacaciones_proporcionales: Math.round(vacacionesSinPrima * 100) / 100,
    prima_vacacional_proporcional: Math.round(primaVacacional * 100) / 100,
    total_sin_prima_antiguedad: Math.round(totalSinPrima * 100) / 100,
    total_con_prima_antiguedad: Math.round(totalConPrima * 100) / 100,
    salario_diario_usado: sd,
    salario_minimo_dia: SALARIO_MINIMO_DIA,
    desglose,
  }
}
