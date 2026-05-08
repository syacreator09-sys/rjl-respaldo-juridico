import { calcularLiquidacion } from './calculadora-lft'

export interface ExpedienteData {
  cliente: { nombre: string; email?: string }
  employer_name?: string
  position?: string
  salary_daily?: number
  start_date?: string
  has_imss?: boolean
  has_contract?: boolean
  work_hours_paper?: string
  work_hours_real?: string
  evidencias?: Array<{
    file_name: string
    category: string
    server_time: string
    gps_lat?: number | null
    gps_lng?: number | null
  }>
}

export function generateExpedienteText(data: ExpedienteData): string {
  const fecha = new Date().toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  let calculo = null
  if (data.salary_daily && data.start_date) {
    calculo = calcularLiquidacion({
      salario_diario: data.salary_daily,
      fecha_ingreso: data.start_date,
      tipo: 'rescision',
    })
  }

  const lines = [
    '====================================================',
    'RESPALDO JURIDICO LABORAL - EXPEDIENTE CONFIDENCIAL',
    '====================================================',
    `Fecha de generacion: ${fecha}`,
    '',
    '--- DATOS DEL TRABAJADOR ---',
    `Nombre: ${data.cliente.nombre}`,
    data.cliente.email ? `Email: ${data.cliente.email}` : '',
    '',
    '--- DATOS LABORALES ---',
    `Empleador: ${data.employer_name ?? 'No especificado'}`,
    `Puesto: ${data.position ?? 'No especificado'}`,
    `Salario diario: $${data.salary_daily ?? 'No especificado'} MXN`,
    `Fecha de ingreso: ${data.start_date ?? 'No especificada'}`,
    `IMSS: ${data.has_imss ? 'Si' : 'No'}`,
    `Contrato escrito: ${data.has_contract ? 'Si' : 'No'}`,
    data.work_hours_paper ? `Horario en contrato: ${data.work_hours_paper}` : '',
    data.work_hours_real ? `Horario real trabajado: ${data.work_hours_real}` : '',
    '',
  ]

  if (calculo) {
    lines.push(
      '--- CALCULO DE DERECHOS LABORALES (ESTIMADO) ---',
      ...calculo.desglose,
      '',
      '* Calculo estimado basado en LFT vigente.',
      '* Consultar con asesor RJL para cifras exactas y estrategia legal.',
      '',
    )
  }

  if (data.evidencias && data.evidencias.length > 0) {
    lines.push('--- BOVEDA DE EVIDENCIAS ---')
    data.evidencias.forEach((e, i) => {
      lines.push(
        `${i + 1}. ${e.file_name}`,
        `   Categoria: ${e.category}`,
        `   Fecha/hora servidor: ${new Date(e.server_time).toLocaleString('es-MX')}`,
        e.gps_lat ? `   GPS: ${e.gps_lat.toFixed(6)}, ${e.gps_lng?.toFixed(6)}` : '   GPS: No disponible',
      )
    })
    lines.push('')
  }

  lines.push(
    '====================================================',
    'Este documento es confidencial y de uso exclusivo para',
    'procedimientos legales del titular del expediente.',
    'RJL Respaldo Juridico Laboral - rjl.mx',
    '====================================================',
  )

  return lines.filter((line) => line !== '').join('\n')
}
