import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

interface LegalChunk {
  sourceId: string
  law: string
  matter: 'penal' | 'proceso_penal' | 'familiar' | 'civil'
  article: string
  text: string
  keywords: string[]
}

let _chunks: LegalChunk[] | null = null
function getChunks(): LegalChunk[] {
  if (!_chunks) {
    _chunks = JSON.parse(
      readFileSync(resolve(process.cwd(), 'knowledge', 'legal_chunks.json'), 'utf8')
    )
  }
  return _chunks!
}

const MATTER_RULES = [
  { matter: 'proceso_penal' as const, words: ['detencion', 'fiscal', 'audiencia', 'imputado', 'ministerio publico', 'prision preventiva'] },
  { matter: 'penal' as const, words: ['delito', 'robo', 'lesiones', 'fraude', 'violencia', 'denuncia penal'] },
  { matter: 'familiar' as const, words: ['divorcio', 'custodia', 'alimentos', 'pension', 'patria potestad', 'familia'] },
  { matter: 'civil' as const, words: ['contrato', 'arrendamiento', 'incumplimiento', 'propiedad', 'obligacion civil'] },
]

function plain(t: string) {
  return t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()
}

function detectMatter(query: string) {
  const n = plain(query)
  const scores = MATTER_RULES.map(r => ({ matter: r.matter, score: r.words.reduce((s, w) => s + (n.includes(plain(w)) ? 1 : 0), 0) }))
  scores.sort((a, b) => b.score - a.score)
  return scores[0].score > 0 ? scores[0].matter : null
}

function tokenize(q: string): string[] {
  const stop = new Set(['como', 'funciona', 'tengo', 'quiero', 'puedo', 'debo', 'donde', 'cuando', 'para', 'sobre', 'caso', 'duda', 'necesito', 'saber', 'ayuda'])
  return Array.from(new Set(plain(q).split(/\s+/).filter(w => w.length >= 4 && !stop.has(w))))
}

function score(chunk: LegalChunk, terms: string[]): number {
  const hay = plain(`${chunk.article} ${chunk.keywords.join(' ')} ${chunk.text.slice(0, 1200)}`)
  let s = terms.reduce((acc, t) => acc + (hay.includes(t) ? 3 : 0), 0)
  if (terms.some(t => plain(chunk.article).includes(t))) s += 5
  return s
}

export function retrieveLegalContext(query: string, topN = 3): string {
  try {
    const matter = detectMatter(query)
    if (!matter) return ''
    const terms = tokenize(query)
    const pool = getChunks().filter(c => c.matter === matter)
    const hits = pool.map(c => ({ c, s: score(c, terms) })).filter(x => x.s > 0).sort((a, b) => b.s - a.s).slice(0, topN).map(x => x.c)
    if (!hits.length) return ''
    return '\n\nLEGISLACIÓN MORELOS RELEVANTE:\n' + hits.map(h => `${h.article} (${h.law}):\n${h.text.slice(0, 400)}`).join('\n\n')
  } catch {
    return ''
  }
}
