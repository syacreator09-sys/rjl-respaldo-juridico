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

function escapePdfText(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

function normalizePdfText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '')
}

export function generateExpedientePdf(data: ExpedienteData): Uint8Array {
  const sourceText = generateExpedienteText(data)
  const lines = sourceText.split('\n').map((line) => escapePdfText(normalizePdfText(line)))
  const linesPerPage = 42
  const pages = []

  for (let index = 0; index < lines.length; index += linesPerPage) {
    pages.push(lines.slice(index, index + linesPerPage))
  }

  let objectIndex = 1
  const catalogId = objectIndex++
  const pagesId = objectIndex++
  const fontId = objectIndex++
  const pageDescriptors: Array<{ pageId: number; contentId: number; content: string }> = []

  for (const pageLines of pages) {
    const pageId = objectIndex++
    const contentId = objectIndex++
    const content = [
      'BT',
      '/F1 11 Tf',
      '50 790 Td',
      '14 TL',
      ...pageLines.map((line) => `(${line}) Tj T*`),
      'ET',
    ].join('\n')
    pageDescriptors.push({ pageId, contentId, content })
  }

  const objects: Array<{ id: number; body: string }> = [
    { id: catalogId, body: `<< /Type /Catalog /Pages ${pagesId} 0 R >>` },
    {
      id: pagesId,
      body: `<< /Type /Pages /Count ${pageDescriptors.length} /Kids [${pageDescriptors.map((page) => `${page.pageId} 0 R`).join(' ')}] >>`,
    },
    { id: fontId, body: '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>' },
  ]

  for (const page of pageDescriptors) {
    objects.push({
      id: page.pageId,
      body: `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${page.contentId} 0 R >>`,
    })
    const contentLength = Buffer.byteLength(page.content, 'utf8')
    objects.push({
      id: page.contentId,
      body: `<< /Length ${contentLength} >>\nstream\n${page.content}\nendstream`,
    })
  }

  let pdf = '%PDF-1.4\n'
  const offsets: number[] = [0]

  for (const object of objects) {
    offsets[object.id] = Buffer.byteLength(pdf, 'utf8')
    pdf += `${object.id} 0 obj\n${object.body}\nendobj\n`
  }

  const xrefOffset = Buffer.byteLength(pdf, 'utf8')
  pdf += `xref\n0 ${objects.length + 1}\n`
  pdf += '0000000000 65535 f \n'

  for (let id = 1; id <= objects.length; id += 1) {
    const offset = offsets[id] ?? 0
    pdf += `${offset.toString().padStart(10, '0')} 00000 n \n`
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
  return Buffer.from(pdf, 'utf8')
}
