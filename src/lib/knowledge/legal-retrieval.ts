import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// ─── Types ────────────────────────────────────────────────────────────────────

interface LFTChunk {
  id: string
  matter: string
  subMatter: string
  article: string
  law: string
  title: string
  text: string
  keywords: string[]
}

// ─── Singleton loaders ────────────────────────────────────────────────────────

let _lftChunks: LFTChunk[] | null = null
function getLFTChunks(): LFTChunk[] {
  if (!_lftChunks) {
    _lftChunks = JSON.parse(
      readFileSync(resolve(process.cwd(), 'knowledge', 'lft_chunks.json'), 'utf8')
    ) as LFTChunk[]
  }
  return _lftChunks
}

// ─── Matter detection (LFT labor law) ────────────────────────────────────────

const LABOR_MATTER_RULES: Array<{ matter: string; words: string[] }> = [
  {
    matter: 'terminacion',
    words: [
      'liquidacion', 'finiquito', 'despido', 'correr', 'corrio', 'rescision',
      'indemnizacion', 'indemnizar', '3 meses', 'tres meses', '90 dias', '20 dias',
      'veinte dias', 'terminar contrato', 'me despidieron', 'me corrieron', 'me sacaron',
      'separar', 'cese', 'baja', 'carta de rescision',
    ],
  },
  {
    matter: 'salario',
    words: [
      'salario', 'sueldo', 'pago', 'cobrar', 'no me pagan', 'deber', 'adeudo',
      'salario integrado', 'cuota diaria', 'bono', 'comision', 'descuento', 'retencion',
      'no me pagaron', 'deben', 'retrasado', 'deduccion', 'recibo', 'nomina',
    ],
  },
  {
    matter: 'horas_extra',
    words: [
      'hora extra', 'horas extra', 'tiempo extra', 'overtime', 'extra no pagada',
      'trabajar mas', 'sobretiempo', '100 por ciento', 'doble', 'no pagan extra',
    ],
  },
  {
    matter: 'vacaciones',
    words: [
      'vacaciones', 'dias de descanso', 'descanso anual', 'dias libres', 'prima vacacional',
      'vacaciones proporcionales', 'no me dan vacaciones', 'cuantos dias vacaciones',
    ],
  },
  {
    matter: 'aguinaldo',
    words: [
      'aguinaldo', 'aguinaldo proporcional', 'diciembre', 'navidad', '15 dias',
      'no me pagan aguinaldo', 'cuanto aguinaldo',
    ],
  },
  {
    matter: 'prima_antiguedad',
    words: [
      'prima antiguedad', 'antiguedad', 'años servicio', '12 dias', 'prima de antiguedad',
    ],
  },
  {
    matter: 'ptu',
    words: [
      'ptu', 'utilidades', 'reparto utilidades', 'participacion utilidades', 'ganancias empresa',
      'mayo', '60 dias', 'utilidades pendientes',
    ],
  },
  {
    matter: 'jornada',
    words: [
      'jornada', 'horario', 'turno', 'horas trabajo', '8 horas', '7 horas',
      'dia festivo', 'domingo', 'prima dominical', 'descanso semanal', 'sabado',
    ],
  },
  {
    matter: 'imss',
    words: [
      'imss', 'seguro social', 'afore', 'infonavit', 'sin imss', 'no me dieron imss',
      'semanas cotizadas', 'nss', 'numero seguridad', 'pension', 'retiro',
      'alta imss', 'inscripcion imss', 'cuotas',
    ],
  },
  {
    matter: 'contrato',
    words: [
      'contrato', 'periodo de prueba', 'capacitacion inicial', 'tiempo determinado',
      'tiempo indeterminado', 'temporal', 'obra determinada', 'por proyecto',
      'sin contrato', 'contrato verbal',
    ],
  },
  {
    matter: 'riesgo_trabajo',
    words: [
      'accidente', 'accidente trabajo', 'accidente trayecto', 'enfermedad profesional',
      'riesgo trabajo', 'lesion', 'herida', 'incapacidad', 'indemnizacion accidente',
    ],
  },
  {
    matter: 'maternidad',
    words: [
      'embarazo', 'maternidad', 'lactancia', 'incapacidad maternidad', 'guarderias',
      'despedir embarazada', 'trabajadora embarazada', '6 semanas', 'licencia maternidad',
    ],
  },
  {
    matter: 'procedimiento',
    words: [
      'demandar', 'demanda', 'tribunal', 'junta', 'cfcrl', 'conciliacion',
      'juicio laboral', 'proceso', 'prescripcion', 'plazo', 'como demandar',
      'cuanto tiempo', 'pasos', 'abogado', 'asesor juridico',
    ],
  },
  {
    matter: 'acoso',
    words: [
      'acoso', 'hostigamiento', 'acoso sexual', 'violencia', 'maltrato', 'discriminacion',
      'abuso', 'amenazas', 'ambiente hostil', 'bullying trabajo', 'mobbing',
    ],
  },
  {
    matter: 'home_office',
    words: [
      'home office', 'teletrabajo', 'trabajo remoto', 'desde casa', 'virtual',
      'internet', 'equipo computadora', 'nom 037', 'desconexion digital',
    ],
  },
]

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function detectLaborMatter(query: string): string[] {
  const q = normalize(query)
  const scores = LABOR_MATTER_RULES.map(rule => ({
    matter: rule.matter,
    score: rule.words.reduce((acc, w) => acc + (q.includes(normalize(w)) ? 1 : 0), 0),
  }))
  scores.sort((a, b) => b.score - a.score)

  // Return top-2 matters with score > 0 (queries often span multiple topics)
  return scores.filter(s => s.score > 0).slice(0, 2).map(s => s.matter)
}

function tokenize(query: string): string[] {
  const stopWords = new Set([
    'como', 'que', 'cual', 'cuales', 'cuando', 'donde', 'para', 'sobre',
    'tengo', 'quiero', 'puedo', 'debo', 'necesito', 'saber', 'ayuda',
    'pregunta', 'duda', 'caso', 'favor', 'porfavor', 'hola', 'buenas',
    'esto', 'eso', 'este', 'esta', 'una', 'unos', 'unas', 'los', 'las',
  ])
  return Array.from(new Set(
    normalize(query)
      .split(/\s+/)
      .filter(w => w.length >= 4 && !stopWords.has(w))
  ))
}

function scoreChunk(chunk: LFTChunk, terms: string[], matters: string[]): number {
  let score = 0
  const hay = normalize(`${chunk.article} ${chunk.title} ${chunk.keywords.join(' ')} ${chunk.text.slice(0, 800)}`)

  // Matter match bonus
  if (matters.includes(chunk.matter) || matters.includes(chunk.subMatter)) score += 6
  // Partial matter match (e.g., "terminacion" matches "finiquito")
  for (const m of matters) {
    if (chunk.matter.includes(m) || m.includes(chunk.matter)) score += 2
  }

  // Keyword match (high weight — curated list)
  for (const kw of chunk.keywords) {
    const kwNorm = normalize(kw)
    for (const term of terms) {
      if (kwNorm.includes(term) || term.includes(kwNorm)) score += 4
    }
  }

  // Title match (medium weight)
  for (const term of terms) {
    if (normalize(chunk.title).includes(term)) score += 3
  }

  // Article number match (helps when user cites "artículo 47")
  for (const term of terms) {
    if (normalize(chunk.article).includes(term)) score += 5
  }

  // Body text match (low weight)
  for (const term of terms) {
    if (hay.includes(term)) score += 1
  }

  return score
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Retrieves relevant LFT legal context for a given labor law query.
 * Returns formatted article citations ready to inject into the Claude system prompt.
 */
export function retrieveLegalContext(query: string, topN = 3): string {
  try {
    const matters = detectLaborMatter(query)
    if (matters.length === 0) return ''

    const terms = tokenize(query)
    const chunks = getLFTChunks()

    const scored = chunks
      .map(chunk => ({ chunk, score: scoreChunk(chunk, terms, matters) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topN)
      .map(x => x.chunk)

    if (scored.length === 0) return ''

    const contextLines = scored.map(chunk =>
      `${chunk.article} — ${chunk.title}:\n${chunk.text.slice(0, 450)}`
    )

    return `\n\nLEGISLACIÓN LABORAL APLICABLE (LFT vigente):\n${contextLines.join('\n\n')}`
  } catch (error) {
    console.error('[rjl:legal-retrieval] Error cargando knowledge base:', error instanceof Error ? error.message : String(error))
    return ''
  }
}

/**
 * Returns the detected labor matter types for a query.
 * Useful for analytics and routing.
 */
export function detectQueryMatter(query: string): string[] {
  return detectLaborMatter(query)
}
