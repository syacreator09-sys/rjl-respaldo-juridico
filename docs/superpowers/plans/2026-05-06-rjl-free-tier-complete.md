# RJL Respaldo Jurídico Laboral — Plan Completo con Free Tiers

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Completar la plataforma SaaS RJL con routing inteligente de IA — Cloudflare AI + NVIDIA NIM GRATIS para usuarios freemium, Claude solo para suscriptores — reduciendo costos AI ~90% en el tier gratuito.

**Architecture:** Next.js 15 App Router en `chatbot-juridico-rjl`. Capa de IA en dos niveles: Cloudflare Workers AI (Llama 3.3 70B, $0, 10K req/día) para usuarios anónimos + NVIDIA NIM como fallback; Claude Anthropic solo para suscriptores activos ($200/mes). Motor de retrieval local de códigos de Morelos enriquece TODOS los prompts sin costo adicional. Supabase para auth + DB + Storage. Stripe para pagos MXN.

**Tech Stack:** Next.js 15, TypeScript, `@anthropic-ai/sdk` (suscriptores), Cloudflare AI REST (anon free), NVIDIA NIM REST (fallback), `@supabase/ssr`, Stripe, Upstash Redis, Tailwind CSS.

---

## Estado actual del proyecto

**Proyecto canónico:** `C:\Users\shedy\Desktop\chatbot-juridico-rjl`
**Destino final:** `D:\cano-ai-command-center\03-projects\chatbot-juridico-rjl`
**Motor legal (fuente):** `D:\cano-ai-command-center\03-projects\chatbot-juridico-ai\knowledge\processed\legal_chunks.json`

### Ya implementado (NO modificar):
- `src/lib/anthropic.ts` — Claude client + system prompts ✅
- `src/lib/supabase/` — auth server/client/types ✅
- `src/lib/rate-limit.ts` — Upstash rate limiting ✅
- `src/lib/validations/chat.ts` — Zod schemas ✅
- `src/middleware.ts` — Auth + role routing ✅
- `src/app/api/chat/route.ts` — Chat endpoint (modificar en Task 3) ✅
- `src/app/api/analyze-case/route.ts` — Análisis asesor ✅
- `src/app/api/webhooks/stripe/route.ts` — Webhooks ✅
- `supabase/migrations/001_initial.sql` — Schema + RLS completo ✅

### Pendiente (este plan):
- Motor retrieval Morelos
- Routing Cloudflare AI / NVIDIA NIM / Claude
- PublicChatView freemium
- Auth form Supabase
- Dashboard cliente + EvidenceVault GPS
- Panel asesor
- Deploy Vercel

---

## Free Tier AI Map

```
Usuario anónimo (3 preguntas/día gratis)
  ├─ knowledge retrieval local (Morelos JSON)  → $0
  ├─ Cloudflare AI Llama 3.3 70B              → $0  (10K req/day)
  └─ fallback: NVIDIA NIM Llama 3.3 70B       → $0  (API key gratis mayo 2026)

Cliente suscriptor ($200/mes)
  ├─ knowledge retrieval local                 → $0
  └─ Claude claude-sonnet-4-6 (Anthropic)     → calidad premium ✓

Asesor (análisis de caso)
  └─ Claude claude-sonnet-4-6                 → análisis experto ✓
```

**Credentials necesarias:**
```bash
# Cloudflare (ya tienes cuenta syacreator09@gmail.com)
CLOUDFLARE_ACCOUNT_ID=7e8db9a4d239cf90cf3b20b4bdcafcc9
CLOUDFLARE_AI_TOKEN=<desde dashboard CF → My Profile → API Tokens>

# NVIDIA NIM (obtener en build.nvidia.com)
NVIDIA_NIM_API_KEY=nvapi-...

# Ya tienes en D:/cano-ai-command-center/.env:
ANTHROPIC_API_KEY, SUPABASE_*, UPSTASH_*, STRIPE_*
```

---

## Estructura de archivos objetivo

```
chatbot-juridico-rjl/
├── knowledge/
│   └── legal_chunks.json              ← copiar desde motor existente
├── src/
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── router.ts              ← NEW: decide qué modelo usar
│   │   │   ├── cloudflare.ts          ← NEW: Cloudflare AI client
│   │   │   ├── nvidia-nim.ts          ← NEW: NVIDIA NIM client
│   │   │   └── anthropic.ts           ← EXISTING: Claude client
│   │   ├── knowledge/
│   │   │   └── legal-retrieval.ts     ← NEW: motor retrieval Morelos
│   │   ├── supabase/                  ← EXISTING
│   │   ├── rate-limit.ts              ← EXISTING
│   │   └── validations/               ← EXISTING
│   ├── app/
│   │   ├── page.tsx                   ← MODIFY: landing + PublicChatView
│   │   ├── (auth)/login/page.tsx      ← MODIFY: form Supabase
│   │   ├── (dashboard)/
│   │   │   ├── cliente/page.tsx       ← MODIFY: dashboard completo
│   │   │   ├── asesor/page.tsx        ← MODIFY: panel asesor
│   │   │   └── admin/page.tsx         ← MODIFY: panel admin básico
│   │   └── api/
│   │       ├── chat/route.ts          ← MODIFY: AI routing
│   │       ├── evidence/route.ts      ← NEW: upload GPS
│   │       └── stripe/
│   │           └── checkout/route.ts  ← NEW: checkout session
│   └── components/
│       ├── chat/
│       │   ├── PublicChatView.tsx     ← NEW
│       │   └── ClientChatView.tsx     ← NEW
│       ├── evidence/
│       │   ├── EvidenceVault.tsx      ← NEW
│       │   └── EvidenceUpload.tsx     ← NEW
│       └── cases/
│           └── CaseForm.tsx           ← NEW
```

---

## Task 1: Mover proyecto + copiar knowledge base

**Files:**
- Move: `C:\Users\shedy\Desktop\chatbot-juridico-rjl` → `D:\cano-ai-command-center\03-projects\chatbot-juridico-rjl`
- Create: `knowledge/legal_chunks.json`

- [ ] **Step 1: Mover carpeta**

```powershell
Move-Item "C:\Users\shedy\Desktop\chatbot-juridico-rjl" `
  "D:\cano-ai-command-center\03-projects\chatbot-juridico-rjl"
Set-Location "D:\cano-ai-command-center\03-projects\chatbot-juridico-rjl"
```

- [ ] **Step 2: Copiar knowledge base**

```powershell
New-Item -ItemType Directory -Path "knowledge" -Force
Copy-Item `
  "D:\cano-ai-command-center\03-projects\chatbot-juridico-ai\knowledge\processed\legal_chunks.json" `
  "knowledge\legal_chunks.json"
```

- [ ] **Step 3: Verificar**

```powershell
Get-ChildItem knowledge\
# Esperado: legal_chunks.json (~2MB)
npm install
npm run dev
# Esperado: http://localhost:3000 sin errores (aunque landing esté vacía)
```

- [ ] **Step 4: Init git**

```powershell
git init
git add .
git commit -m "chore: init RJL con base de conocimiento legal Morelos"
```

---

## Task 2: Motor de retrieval legal (knowledge layer)

**Files:**
- Create: `src/lib/knowledge/legal-retrieval.ts`

- [ ] **Step 1: Crear `src/lib/knowledge/legal-retrieval.ts`**

```typescript
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

// Cargado una vez en init del módulo (server-side only)
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
  return t.toLowerCase().normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ').trim()
}

function detectMatter(query: string) {
  const n = plain(query)
  const scores = MATTER_RULES.map(r => ({
    matter: r.matter,
    score: r.words.reduce((s, w) => s + (n.includes(plain(w)) ? 1 : 0), 0),
  }))
  scores.sort((a, b) => b.score - a.score)
  return scores[0].score > 0 ? scores[0].matter : null
}

function tokenize(q: string): string[] {
  const stop = new Set(['como', 'funciona', 'tengo', 'quiero', 'puedo', 'debo', 'donde',
    'cuando', 'para', 'sobre', 'caso', 'duda', 'necesito', 'saber', 'ayuda'])
  return Array.from(new Set(
    plain(q).split(/\s+/).filter(w => w.length >= 4 && !stop.has(w))
  ))
}

function score(chunk: LegalChunk, terms: string[]): number {
  const hay = plain(`${chunk.article} ${chunk.keywords.join(' ')} ${chunk.text.slice(0, 1200)}`)
  let s = terms.reduce((acc, t) => acc + (hay.includes(t) ? 3 : 0), 0)
  if (terms.some(t => plain(chunk.article).includes(t))) s += 5
  return s
}

/**
 * Returns legal snippets from Morelos codes relevant to the query.
 * Returns '' if no match — never throws.
 */
export function retrieveLegalContext(query: string, topN = 3): string {
  try {
    const matter = detectMatter(query)
    if (!matter) return ''
    const terms = tokenize(query)
    const pool = getChunks().filter(c => c.matter === matter)
    const hits = pool
      .map(c => ({ c, s: score(c, terms) }))
      .filter(x => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, topN)
      .map(x => x.c)
    if (!hits.length) return ''
    const snippets = hits
      .map(h => `${h.article} (${h.law}):\n${h.text.slice(0, 400)}`)
      .join('\n\n')
    return `\n\nLEGISLACIÓN MORELOS RELEVANTE:\n${snippets}`
  } catch {
    return ''  // Never crash the API route
  }
}
```

- [ ] **Step 2: Smoke test manual**

```bash
npm run dev
```

En un script temporal `scripts/test-retrieval.mjs`:
```javascript
import { readFileSync } from 'node:fs'
const chunks = JSON.parse(readFileSync('knowledge/legal_chunks.json', 'utf8'))
console.log('Chunks cargados:', chunks.length)
console.log('Primer chunk:', chunks[0]?.article)
```
```bash
node scripts/test-retrieval.mjs
# Esperado: "Chunks cargados: 600+" y artículo del primer chunk
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/knowledge/ knowledge/
git commit -m "feat: motor retrieval Morelos — 600+ chunks legales listos"
```

---

## Task 3: Capa de IA con free tier routing

**Files:**
- Create: `src/lib/ai/cloudflare.ts`
- Create: `src/lib/ai/nvidia-nim.ts`
- Create: `src/lib/ai/router.ts`
- Modify: `src/app/api/chat/route.ts`

- [ ] **Step 1: Crear `src/lib/ai/cloudflare.ts`**

```typescript
// Cloudflare Workers AI — FREE 10K req/day
// Docs: https://developers.cloudflare.com/workers-ai/models/
// Model: @cf/meta/llama-3.3-70b-instruct-fp8-fast (best free option)

const CF_ACCOUNT = process.env.CLOUDFLARE_ACCOUNT_ID!
const CF_TOKEN = process.env.CLOUDFLARE_AI_TOKEN!
const CF_MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast'

export interface AiMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export async function cloudflareChat(
  system: string,
  messages: AiMessage[],
  maxTokens = 800
): Promise<string> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT}/ai/run/${CF_MODEL}`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${CF_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: [{ role: 'system', content: system }, ...messages],
      max_tokens: maxTokens,
      stream: false,
    }),
    signal: AbortSignal.timeout(15000),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Cloudflare AI error ${response.status}: ${err}`)
  }

  const data = await response.json() as { result?: { response?: string }; errors?: unknown[] }
  const text = data?.result?.response?.trim()
  if (!text) throw new Error('Cloudflare AI: respuesta vacía')
  return text
}
```

- [ ] **Step 2: Crear `src/lib/ai/nvidia-nim.ts`**

```typescript
// NVIDIA NIM — FREE API key (obtener en build.nvidia.com)
// Model: meta/llama-3.3-70b-instruct (mismo modelo, backup)
// Docs: https://build.nvidia.com/meta/llama-3_3-70b-instruct

const NVIDIA_KEY = process.env.NVIDIA_NIM_API_KEY!

export async function nvidiaChat(
  system: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  maxTokens = 800
): Promise<string> {
  const response = await fetch(
    'https://integrate.api.nvidia.com/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${NVIDIA_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta/llama-3.3-70b-instruct',
        messages: [{ role: 'system', content: system }, ...messages],
        max_tokens: maxTokens,
        temperature: 0.2,
        stream: false,
      }),
      signal: AbortSignal.timeout(20000),
    }
  )

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`NVIDIA NIM error ${response.status}: ${err}`)
  }

  const data = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>
  }
  const text = data?.choices?.[0]?.message?.content?.trim()
  if (!text) throw new Error('NVIDIA NIM: respuesta vacía')
  return text
}
```

- [ ] **Step 3: Crear `src/lib/ai/router.ts`**

```typescript
import Anthropic from '@anthropic-ai/sdk'
import { cloudflareChat, type AiMessage } from './cloudflare'
import { nvidiaChat } from './nvidia-nim'
import { retrieveLegalContext } from '../knowledge/legal-retrieval'
import { SYSTEM_PROMPTS } from '../anthropic'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export type ChatTier = 'free' | 'premium'

interface ChatRequest {
  tier: ChatTier
  userMessage: string
  history: Array<{ role: 'user' | 'assistant'; content: string }>
  caseData?: Record<string, unknown>
  maxTokens?: number
}

/**
 * FREE tier: Cloudflare AI → fallback NVIDIA NIM
 * PREMIUM tier: Claude Sonnet (Anthropic)
 *
 * Both tiers: enriquecidos con retrieval legal Morelos
 */
export async function routeChat(req: ChatRequest): Promise<{ reply: string; model: string }> {
  const legalCtx = retrieveLegalContext(req.userMessage)
  const maxTokens = req.maxTokens ?? (req.tier === 'free' ? 800 : 1200)

  if (req.tier === 'premium') {
    const system = req.caseData
      ? SYSTEM_PROMPTS.clientChat(req.caseData) + legalCtx
      : SYSTEM_PROMPTS.publicChat + legalCtx

    const messages = req.history.map(h => ({
      role: h.role as 'user' | 'assistant',
      content: h.content,
    }))
    messages.push({ role: 'user', content: req.userMessage })

    const resp = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: maxTokens,
      system,
      messages,
    })
    const reply = resp.content[0].type === 'text' ? resp.content[0].text : ''
    return { reply, model: 'claude-sonnet-4-6' }
  }

  // FREE tier
  const system = SYSTEM_PROMPTS.publicChat + legalCtx
  const msgs: AiMessage[] = [
    ...req.history.map(h => ({ role: h.role as 'user' | 'assistant', content: h.content })),
    { role: 'user' as const, content: req.userMessage },
  ]

  // Cloudflare AI primero, NVIDIA NIM como fallback
  try {
    const reply = await cloudflareChat(system, msgs, maxTokens)
    return { reply, model: 'cloudflare/llama-3.3-70b' }
  } catch (cfErr) {
    console.warn('[router] Cloudflare AI failed, fallback to NVIDIA NIM:', cfErr)
    try {
      const reply = await nvidiaChat(
        system,
        req.history.map(h => ({ role: h.role, content: h.content }))
          .concat([{ role: 'user', content: req.userMessage }]),
        maxTokens
      )
      return { reply, model: 'nvidia/llama-3.3-70b' }
    } catch (nvErr) {
      console.error('[router] NVIDIA NIM also failed:', nvErr)
      // Last resort: Claude para no dejar al usuario sin respuesta
      const resp = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',  // Haiku = más barato que Sonnet
        max_tokens: 600,
        system: SYSTEM_PROMPTS.publicChat + legalCtx,
        messages: msgs,
      })
      const reply = resp.content[0].type === 'text' ? resp.content[0].text : 'Error temporal.'
      return { reply, model: 'claude-haiku-fallback' }
    }
  }
}
```

- [ ] **Step 4: Modificar `src/app/api/chat/route.ts`**

Reemplazar la sección `type === 'public'` para usar el router:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { routeChat } from '@/lib/ai/router'
import { checkRateLimit } from '@/lib/rate-limit'
import { SYSTEM_PROMPTS } from '@/lib/anthropic'
import { retrieveLegalContext } from '@/lib/knowledge/legal-retrieval'
import { PublicChatSchema, ClientChatSchema } from '@/lib/validations/chat'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type = 'public' } = body

    // ── Public chat (freemium — usa Cloudflare/NVIDIA gratis) ──
    if (type === 'public') {
      const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown'
      const limit = await checkRateLimit(
        `rjl:public:${ip}`,
        parseInt(process.env.NEXT_PUBLIC_FREE_CHAT_LIMIT ?? '3')
      )

      if (!limit.allowed) {
        return NextResponse.json(
          { error: 'LIMIT_REACHED', remaining: 0, reset: limit.reset },
          { status: 429 }
        )
      }

      const parsed = PublicChatSchema.safeParse(body)
      if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

      const { message, history } = parsed.data

      const { reply, model } = await routeChat({
        tier: 'free',
        userMessage: message,
        history: history as Array<{ role: 'user' | 'assistant'; content: string }>,
      })

      return NextResponse.json({
        reply,
        model,
        remaining: limit.remaining,
      })
    }

    // ── Client chat (suscriptor — usa Claude premium) ──
    if (type === 'client') {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

      const parsed = ClientChatSchema.safeParse(body)
      if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

      const { message, caseId, history } = parsed.data

      const { data: caseRow } = await supabase
        .from('cases')
        .select('id, case_data(*)')
        .eq('id', caseId)
        .eq('client_id', user.id)
        .single()

      if (!caseRow) return NextResponse.json({ error: 'Case not found' }, { status: 404 })

      const { reply, model } = await routeChat({
        tier: 'premium',
        userMessage: message,
        history: history as Array<{ role: 'user' | 'assistant'; content: string }>,
        caseData: (caseRow.case_data as Record<string, unknown>) ?? {},
      })

      await supabase.from('messages').insert([
        { case_id: caseId, role: 'user', content: message, is_public: false },
        { case_id: caseId, role: 'assistant', content: reply, is_public: false },
      ])

      return NextResponse.json({ reply, model })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })

  } catch (error) {
    console.error('[chat/route] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 5: Crear `.env.local` con TODAS las keys**

```bash
# Leer del maestro para los valores:
grep -E "ANTHROPIC|SUPABASE|UPSTASH|STRIPE|CLOUDFLARE|NVIDIA" \
  D:/cano-ai-command-center/.env
```

Crear `.env.local`:
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://XXX.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# AI — Claude (suscriptores)
ANTHROPIC_API_KEY=sk-ant-...

# AI — FREE (usuarios anónimos)
CLOUDFLARE_ACCOUNT_ID=7e8db9a4d239cf90cf3b20b4bdcafcc9
CLOUDFLARE_AI_TOKEN=<CF Dashboard → My Profile → API Tokens → Workers AI>
NVIDIA_NIM_API_KEY=nvapi-<desde build.nvidia.com → Get API Key>

# Rate limiting
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Config
NEXT_PUBLIC_FREE_CHAT_LIMIT=3
```

- [ ] **Step 6: Obtener NVIDIA NIM API Key**

1. Abrir `https://build.nvidia.com/meta/llama-3_3-70b-instruct`
2. Click "Get API Key" → copiar `nvapi-...`
3. Pegar en `.env.local`

- [ ] **Step 7: Probar routing free tier**

```bash
npm run dev
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"type":"public","message":"me deben horas extra, tengo 2 años trabajando","history":[]}'
```
Esperado: `{ "reply": "...", "model": "cloudflare/llama-3.3-70b" }` (o nvidia si CF falla).

- [ ] **Step 8: Commit**

```bash
git add src/lib/ai/ src/app/api/chat/route.ts .env.local.template
git commit -m "feat: AI routing — Cloudflare free para anon, Claude para suscriptores"
```

---

## Task 4: Landing + PublicChatView

**Files:**
- Create: `src/components/chat/PublicChatView.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Crear `src/components/chat/PublicChatView.tsx`**

```typescript
'use client'
import { useState, useRef, useEffect } from 'react'

interface Message { role: 'user' | 'assistant'; content: string }

export function PublicChatView() {
  const [msgs, setMsgs] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [remaining, setRemaining] = useState<number | null>(null)
  const [blocked, setBlocked] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])

  async function send(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || loading || blocked) return
    const msg = input.trim()
    setInput('')
    setMsgs(p => [...p, { role: 'user', content: msg }])
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'public', message: msg, history: msgs }),
      })
      const data = await res.json()
      if (res.status === 429) {
        setBlocked(true)
        setMsgs(p => [...p, {
          role: 'assistant',
          content: '⚠️ Alcanzaste el límite de 3 consultas gratuitas diarias. Suscríbete por $200/mes para acceso ilimitado.',
        }])
        return
      }
      if (!res.ok) throw new Error(data.error)
      setMsgs(p => [...p, { role: 'assistant', content: data.reply }])
      setRemaining(data.remaining ?? null)
    } catch {
      setMsgs(p => [...p, { role: 'assistant', content: 'Error temporal. Intenta de nuevo.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col rounded-2xl overflow-hidden border"
      style={{ background: 'var(--navy-card)', borderColor: 'rgba(200,168,75,0.2)', height: 520 }}>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {msgs.length === 0 && (
          <p className="text-sm text-center pt-10" style={{ color: 'var(--text-dim)' }}>
            Escribe tu consulta: horas extra, liquidación, vacaciones, aguinaldo...
          </p>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-[85%] px-4 py-3 text-sm"
              style={{
                background: m.role === 'user' ? 'var(--navy-light)' : 'var(--navy-mid)',
                color: 'var(--cream)',
                borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                border: m.role === 'assistant' ? '1px solid rgba(200,168,75,0.15)' : 'none',
                whiteSpace: 'pre-wrap',
              }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="px-4 py-3 rounded-2xl text-sm animate-pulse"
              style={{ background: 'var(--navy-mid)', color: 'var(--text-dim)' }}>
              Consultando...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      {remaining !== null && remaining <= 1 && !blocked && (
        <p className="text-center text-xs py-1" style={{ color: 'var(--gold-dim)' }}>
          {remaining} consulta gratuita restante ·{' '}
          <a href="/login?tab=register" style={{ color: 'var(--gold)' }}>
            Suscríbete $200/mes
          </a>
        </p>
      )}
      <form onSubmit={send} className="flex gap-2 p-3 border-t"
        style={{ borderColor: 'rgba(200,168,75,0.15)' }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          disabled={blocked || loading}
          placeholder={blocked ? 'Límite alcanzado — suscríbete' : '¿Cuántas horas extra me deben?'}
          className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none disabled:opacity-40"
          style={{ background: 'var(--navy-light)', color: 'var(--cream)' }} />
        <button type="submit" disabled={loading || blocked || !input.trim()}
          className="px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg,var(--gold),var(--gold-dim))', color: 'var(--navy)' }}>
          Enviar
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: Reemplazar `src/app/page.tsx`**

```typescript
import { PublicChatView } from '@/components/chat/PublicChatView'
import Link from 'next/link'

export default function HomePage() {
  return (
    <main style={{ background: 'var(--navy)', minHeight: '100vh' }}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b sticky top-0 z-10"
        style={{ background: 'var(--navy-mid)', borderColor: 'rgba(200,168,75,0.15)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,var(--gold),var(--gold-dim))', color: 'var(--navy)', fontFamily: 'Cormorant Garamond, serif' }}>
            RJL
          </div>
          <div>
            <h1 className="font-semibold text-base leading-tight" style={{ color: 'var(--gold-light)', fontFamily: 'Cormorant Garamond, serif' }}>
              Respaldo Jurídico Laboral
            </h1>
            <span className="text-xs" style={{ color: 'var(--text-dim)' }}>Morelos · LFT + Derecho civil y penal</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/login" className="px-4 py-2 rounded-xl text-xs font-medium border"
            style={{ borderColor: 'rgba(200,168,75,0.3)', color: 'var(--gold-light)' }}>
            Iniciar sesión
          </Link>
          <Link href="/login?tab=register" className="px-4 py-2 rounded-xl text-xs font-medium"
            style={{ background: 'linear-gradient(135deg,var(--gold),var(--gold-dim))', color: 'var(--navy)' }}>
            $200/mes
          </Link>
        </div>
      </header>

      {/* Hero + Chat */}
      <section className="max-w-2xl mx-auto px-6 pt-14 pb-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-3"
            style={{ color: 'var(--gold-light)', fontFamily: 'Cormorant Garamond, serif' }}>
            Conoce y defiende tus derechos laborales
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-mid)' }}>
            Calcula horas extra, liquidaciones y aguinaldos.<br />
            3 consultas gratis diarias. Sin registro.
          </p>
        </div>
        <PublicChatView />
        <p className="text-center text-xs mt-3" style={{ color: 'var(--text-dim)' }}>
          ⚠️ Orientación informativa · No sustituye asesoría legal profesional
        </p>
      </section>

      {/* Features */}
      <section className="max-w-3xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: '⚖️', title: 'Cálculo LFT exacto', desc: 'Horas extra, liquidación y aguinaldo con tu salario real, citando artículos.' },
          { icon: '📍', title: 'Bóveda de evidencias GPS', desc: 'Guarda entradas y salidas con timestamp oficial y coordenadas GPS.' },
          { icon: '👨‍⚖️', title: 'Asesor jurídico real', desc: 'Conecta con un asesor para análisis completo de tu expediente.' },
        ].map(f => (
          <div key={f.title} className="p-5 rounded-2xl border"
            style={{ background: 'var(--navy-card)', borderColor: 'rgba(200,168,75,0.1)' }}>
            <div className="text-2xl mb-2">{f.icon}</div>
            <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--cream)' }}>{f.title}</h3>
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>{f.desc}</p>
          </div>
        ))}
      </section>
    </main>
  )
}
```

- [ ] **Step 3: Verificar landing**

```bash
npm run dev
# Abrir http://localhost:3000
# Enviar consulta → respuesta con model: "cloudflare/llama-3.3-70b"
# Enviar 3 consultas → mensaje de límite en la 3ra
```

- [ ] **Step 4: Commit**

```bash
git add src/components/chat/ src/app/page.tsx
git commit -m "feat: landing + PublicChatView con Cloudflare AI free tier"
```

---

## Task 5: Autenticación Supabase

**Files:**
- Modify: `src/app/(auth)/login/page.tsx`

- [ ] **Step 1: Reemplazar `src/app/(auth)/login/page.tsx`**

```typescript
'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const params = useSearchParams()
  const [tab, setTab] = useState<'login' | 'register'>(
    params.get('tab') === 'register' ? 'register' : 'login'
  )
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    setLoading(true)
    try {
      if (tab === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/cliente')
      } else {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: name } },
        })
        if (error) throw error
        setMsg({ text: 'Revisa tu correo para confirmar tu cuenta.', ok: true })
      }
    } catch (err) {
      setMsg({ text: err instanceof Error ? err.message : 'Error', ok: false })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--navy)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center font-bold text-xl"
            style={{ background: 'linear-gradient(135deg,var(--gold),var(--gold-dim))', color: 'var(--navy)', fontFamily: 'Cormorant Garamond, serif' }}>
            RJL
          </div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--gold-light)', fontFamily: 'Cormorant Garamond, serif' }}>
            Respaldo Jurídico Laboral
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl mb-6 p-1" style={{ background: 'var(--navy-card)' }}>
          {(['login', 'register'] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); setMsg(null) }}
              className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: tab === t ? 'var(--navy-light)' : 'transparent',
                color: tab === t ? 'var(--gold-light)' : 'var(--text-dim)',
              }}>
              {t === 'login' ? 'Iniciar sesión' : 'Registrarse'}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-3 p-6 rounded-2xl border"
          style={{ background: 'var(--navy-card)', borderColor: 'rgba(200,168,75,0.15)' }}>
          {tab === 'register' && (
            <input type="text" placeholder="Nombre completo" value={name}
              onChange={e => setName(e.target.value)} required
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{ background: 'var(--navy-light)', color: 'var(--cream)' }} />
          )}
          <input type="email" placeholder="Correo electrónico" value={email}
            onChange={e => setEmail(e.target.value)} required
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{ background: 'var(--navy-light)', color: 'var(--cream)' }} />
          <input type="password" placeholder="Contraseña (mín. 8 chars)" value={password}
            onChange={e => setPassword(e.target.value)} required minLength={8}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{ background: 'var(--navy-light)', color: 'var(--cream)' }} />
          {msg && (
            <p className="text-xs" style={{ color: msg.ok ? 'var(--gold)' : '#E07070' }}>
              {msg.text}
            </p>
          )}
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-sm disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,var(--gold),var(--gold-dim))', color: 'var(--navy)' }}>
            {loading ? 'Cargando...' : tab === 'login' ? 'Entrar' : 'Crear cuenta — $200/mes'}
          </button>
        </form>
        <p className="text-center text-xs mt-4">
          <a href="/" style={{ color: 'var(--text-dim)' }}>← Volver al inicio</a>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verificar auth**

```bash
npm run dev
# http://localhost:3000/login → registrar usuario de prueba
# Verificar email → login → redirect a /cliente
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(auth)/login/
git commit -m "feat: auth Supabase login/register con diseño RJL"
```

---

## Task 6: Dashboard Cliente + EvidenceVault GPS

**Files:**
- Create: `src/components/cases/CaseForm.tsx`
- Create: `src/components/evidence/EvidenceUpload.tsx`
- Create: `src/app/api/evidence/route.ts`
- Modify: `src/app/(dashboard)/cliente/page.tsx`

- [ ] **Step 1: Crear `src/app/api/evidence/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const fd = await req.formData()
  const file = fd.get('file') as File | null
  const category = fd.get('category') as string
  const caseId = fd.get('case_id') as string
  const gpsLat = fd.get('gps_lat') ? parseFloat(fd.get('gps_lat') as string) : null
  const gpsLng = fd.get('gps_lng') ? parseFloat(fd.get('gps_lng') as string) : null
  const gpsAccuracy = fd.get('gps_accuracy') ? parseFloat(fd.get('gps_accuracy') as string) : null

  if (!file || !category || !caseId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  // Verify ownership
  const { data: ownedCase } = await supabase.from('cases')
    .select('id').eq('id', caseId).eq('client_id', user.id).single()
  if (!ownedCase) return NextResponse.json({ error: 'Case not found' }, { status: 404 })

  // Upload to Supabase Storage (path: userId/caseId/timestamp-filename)
  const filePath = `${user.id}/${caseId}/${Date.now()}-${file.name}`
  const { error: uploadError } = await supabase.storage
    .from('evidence').upload(filePath, file, { contentType: file.type })
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  // Insert DB record — server_time is set by DEFAULT NOW() in DB (authoritative)
  const { error: dbError } = await supabase.from('evidence').insert({
    case_id: caseId,
    category,
    file_path: filePath,
    file_name: file.name,
    file_size: file.size,
    mime_type: file.type,
    gps_lat: gpsLat,
    gps_lng: gpsLng,
    gps_accuracy: gpsAccuracy,
    device_time: new Date().toISOString(),
  })
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  return NextResponse.json({ success: true, filePath })
}
```

- [ ] **Step 2: Crear `src/components/evidence/EvidenceUpload.tsx`**

```typescript
'use client'
import { useState } from 'react'

const CATS = [
  { value: 'entrada_trabajo', label: '🕘 Entrada al trabajo' },
  { value: 'salida_trabajo', label: '🕕 Salida del trabajo' },
  { value: 'contrato', label: '📄 Contrato / documento' },
  { value: 'recibo_pago', label: '💵 Recibo de pago' },
  { value: 'gastos_medicos', label: '🏥 Gastos médicos' },
  { value: 'otro', label: '📎 Otro' },
]

export function EvidenceUpload({ caseId, onDone }: { caseId: string; onDone: () => void }) {
  const [cat, setCat] = useState('entrada_trabajo')
  const [file, setFile] = useState<File | null>(null)
  const [gps, setGps] = useState<{ lat: number; lng: number; acc: number } | null>(null)
  const [gpsState, setGpsState] = useState<'idle' | 'loading' | 'ok' | 'fail'>('idle')
  const [loading, setLoading] = useState(false)

  function captureGps() {
    setGpsState('loading')
    navigator.geolocation.getCurrentPosition(
      p => { setGps({ lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy }); setGpsState('ok') },
      () => setGpsState('fail'),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setLoading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('category', cat)
    fd.append('case_id', caseId)
    if (gps) {
      fd.append('gps_lat', String(gps.lat))
      fd.append('gps_lng', String(gps.lng))
      fd.append('gps_accuracy', String(gps.acc))
    }
    await fetch('/api/evidence', { method: 'POST', body: fd })
    setLoading(false)
    setFile(null)
    setGps(null)
    setGpsState('idle')
    onDone()
  }

  return (
    <form onSubmit={submit} className="p-4 rounded-2xl border space-y-3"
      style={{ background: 'var(--navy-card)', borderColor: 'rgba(200,168,75,0.15)' }}>
      <h3 className="text-sm font-semibold" style={{ color: 'var(--gold-light)' }}>
        Subir evidencia
      </h3>
      <select value={cat} onChange={e => setCat(e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
        style={{ background: 'var(--navy-light)', color: 'var(--cream)' }}>
        {CATS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
      </select>
      <input type="file" accept="image/*,application/pdf,video/mp4"
        onChange={e => setFile(e.target.files?.[0] ?? null)}
        className="w-full text-xs" style={{ color: 'var(--text-mid)' }} />
      <button type="button" onClick={captureGps}
        className="w-full py-2 rounded-xl text-xs border transition-colors"
        style={{
          borderColor: gpsState === 'ok' ? '#4CAF50' : 'rgba(200,168,75,0.3)',
          color: gpsState === 'ok' ? '#4CAF50' : gpsState === 'fail' ? '#E07070' : 'var(--text-mid)',
        }}>
        {gpsState === 'idle' && '📍 Capturar GPS (recomendado)'}
        {gpsState === 'loading' && 'Obteniendo ubicación...'}
        {gpsState === 'ok' && `✓ GPS: ${gps?.lat.toFixed(5)}, ${gps?.lng.toFixed(5)} (±${gps?.acc.toFixed(0)}m)`}
        {gpsState === 'fail' && '⚠️ GPS no disponible — se subirá sin coordenadas'}
      </button>
      <button type="submit" disabled={!file || loading}
        className="w-full py-2.5 rounded-xl text-sm font-medium disabled:opacity-50"
        style={{ background: 'linear-gradient(135deg,var(--gold),var(--gold-dim))', color: 'var(--navy)' }}>
        {loading ? 'Subiendo...' : 'Guardar evidencia con sello de tiempo'}
      </button>
    </form>
  )
}
```

- [ ] **Step 3: Crear `src/components/cases/CaseForm.tsx`**

```typescript
'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function CaseForm({ onCreated }: { onCreated: () => void }) {
  const supabase = createClient()
  const [d, setD] = useState({
    employer: '', position: '', start_date: '',
    salary: '', hours_paper: '', hours_real: '',
    has_imss: false, has_contract: false,
  })
  const [loading, setLoading] = useState(false)

  function f<K extends keyof typeof d>(k: K, v: (typeof d)[K]) {
    setD(p => ({ ...p, [k]: v }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: c } = await supabase.from('cases')
      .insert({ client_id: user.id }).select().single()
    if (c) {
      await supabase.from('case_data').insert({
        case_id: c.id,
        employer_name: d.employer,
        position: d.position,
        start_date: d.start_date || null,
        salary_daily: d.salary ? parseFloat(d.salary) : null,
        work_hours_paper: d.hours_paper,
        work_hours_real: d.hours_real,
        has_imss: d.has_imss,
        has_contract: d.has_contract,
      })
    }
    setLoading(false)
    onCreated()
  }

  const inp = (label: string, k: keyof typeof d, type = 'text') => (
    <div key={String(k)}>
      <label className="block text-xs mb-1" style={{ color: 'var(--text-mid)' }}>{label}</label>
      <input type={type} value={d[k] as string}
        onChange={e => f(k, e.target.value as (typeof d)[typeof k])}
        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
        style={{ background: 'var(--navy-light)', color: 'var(--cream)' }} />
    </div>
  )

  return (
    <form onSubmit={submit} className="space-y-3 p-5 rounded-2xl border"
      style={{ background: 'var(--navy-card)', borderColor: 'rgba(200,168,75,0.15)' }}>
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
          <input type="checkbox" checked={d.has_imss}
            onChange={e => f('has_imss', e.target.checked)} />
          Tengo IMSS
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={d.has_contract}
            onChange={e => f('has_contract', e.target.checked)} />
          Tengo contrato escrito
        </label>
      </div>
      <button type="submit" disabled={loading}
        className="w-full py-2.5 rounded-xl text-sm font-medium disabled:opacity-50"
        style={{ background: 'linear-gradient(135deg,var(--gold),var(--gold-dim))', color: 'var(--navy)' }}>
        {loading ? 'Guardando...' : 'Crear expediente'}
      </button>
    </form>
  )
}
```

- [ ] **Step 4: Actualizar `src/app/(dashboard)/cliente/page.tsx`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CaseForm } from '@/components/cases/CaseForm'
import { EvidenceUpload } from '@/components/evidence/EvidenceUpload'

export default async function ClientePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: cases } = await supabase
    .from('cases')
    .select('id, status, created_at, case_data(*), evidence(count)')
    .eq('client_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)

  const activeCase = cases?.[0]

  return (
    <div style={{ background: 'var(--navy)', minHeight: '100vh', padding: '1.5rem' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <h1 className="text-2xl font-bold mb-6"
          style={{ color: 'var(--gold-light)', fontFamily: 'Cormorant Garamond, serif' }}>
          Mi expediente
        </h1>

        {!activeCase ? (
          <CaseForm onCreated={() => { if (typeof window !== 'undefined') window.location.reload() }} />
        ) : (
          <div className="space-y-4">
            {/* Resumen del caso */}
            <div className="p-4 rounded-2xl border"
              style={{ background: 'var(--navy-card)', borderColor: 'rgba(200,168,75,0.15)' }}>
              <div className="flex justify-between items-center mb-3">
                <h2 className="font-semibold text-sm" style={{ color: 'var(--gold-light)' }}>
                  Caso #{activeCase.id.slice(0, 8).toUpperCase()}
                </h2>
                <span className="text-xs px-2 py-1 rounded-lg"
                  style={{ background: 'var(--navy-light)', color: '#4CAF50' }}>
                  {activeCase.status}
                </span>
              </div>
              {activeCase.case_data && (
                <div className="grid grid-cols-2 gap-2 text-xs" style={{ color: 'var(--text-mid)' }}>
                  {[
                    ['Empleador', (activeCase.case_data as Record<string, string>)?.employer_name],
                    ['Puesto', (activeCase.case_data as Record<string, string>)?.position],
                    ['Salario/día', `$${(activeCase.case_data as Record<string, number>)?.salary_daily ?? '—'}`],
                    ['Horario real', (activeCase.case_data as Record<string, string>)?.work_hours_real],
                  ].filter(([, v]) => v).map(([k, v]) => (
                    <div key={String(k)}>
                      <span style={{ color: 'var(--text-dim)' }}>{k}: </span>
                      <span style={{ color: 'var(--cream)' }}>{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Subir evidencia */}
            <EvidenceUpload
              caseId={activeCase.id}
              onDone={() => { if (typeof window !== 'undefined') window.location.reload() }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Verificar dashboard completo**

```bash
npm run dev
# Login → /cliente → crear caso → subir evidencia con GPS
# Verificar en Supabase dashboard: tabla evidence con GPS coords
```

- [ ] **Step 6: Commit**

```bash
git add src/components/ src/app/(dashboard)/cliente/ src/app/api/evidence/
git commit -m "feat: dashboard cliente con CaseForm + EvidenceVault GPS"
```

---

## Task 7: Stripe Checkout

**Files:**
- Create: `src/app/api/stripe/checkout/route.ts`

- [ ] **Step 1: Crear `src/app/api/stripe/checkout/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-12-18.acacia' })

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('full_name').eq('id', user.id).single()

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: user.email,
    metadata: { supabase_user_id: user.id },
    line_items: [{
      price_data: {
        currency: 'mxn',
        product_data: {
          name: 'RJL Respaldo Jurídico Laboral',
          description: 'Chat ilimitado con IA + bóveda de evidencias GPS + soporte asesor',
        },
        unit_amount: 20000,  // $200 MXN en centavos
        recurring: { interval: 'month' },
      },
      quantity: 1,
    }],
    success_url: `${req.nextUrl.origin}/cliente?success=1`,
    cancel_url: `${req.nextUrl.origin}/?canceled=1`,
  })

  return NextResponse.json({ url: session.url })
}
```

- [ ] **Step 2: Agregar botón de suscripción en dashboard cliente**

En `src/app/(dashboard)/cliente/page.tsx`, agregar botón cuando no hay suscripción activa. Añadir al inicio del layout:

```typescript
// Verificar suscripción activa
const { data: sub } = await supabase
  .from('subscriptions')
  .select('status')
  .eq('user_id', user.id)
  .single()

const isSubscribed = sub?.status === 'active'
```

Y mostrar CTA si `!isSubscribed`:
```typescript
{!isSubscribed && (
  <SubscribeButton />
)}
```

Crear `src/components/billing/SubscribeButton.tsx`:
```typescript
'use client'
export function SubscribeButton() {
  async function handleClick() {
    const res = await fetch('/api/stripe/checkout', { method: 'POST' })
    const { url } = await res.json()
    if (url) window.location.href = url
  }
  return (
    <button onClick={handleClick}
      className="w-full py-3 rounded-xl font-semibold text-sm"
      style={{ background: 'linear-gradient(135deg,var(--gold),var(--gold-dim))', color: 'var(--navy)' }}>
      Suscribirme — $200/mes · Chat ilimitado con Claude
    </button>
  )
}
```

- [ ] **Step 3: Verificar checkout**

```bash
npm run dev
# Login → /cliente → click "Suscribirme" → redirige a Stripe checkout
# Usar tarjeta de prueba: 4242 4242 4242 4242, CVV: 123, exp: 12/29
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/stripe/ src/components/billing/
git commit -m "feat: Stripe checkout $200/mes MXN con redirección post-pago"
```

---

## Task 8: Deploy Vercel + Supabase Cloud

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Verificar build limpio**

```bash
npm run type-check
npm run build
# Esperado: sin errores TypeScript ni errores de build
```

- [ ] **Step 2: Verificar `.gitignore`**

```
.env.local
.env*.local
node_modules/
.next/
```

- [ ] **Step 3: Configurar Supabase Cloud**

1. Ir a `supabase.com` → crear proyecto nuevo `rjl-production`
2. SQL Editor → pegar y ejecutar `supabase/migrations/001_initial.sql`
3. Storage → crear buckets `evidence` (private) y `avatars` (public)
4. Authentication → Email → habilitar confirmación de email
5. Copiar Project URL y anon key

- [ ] **Step 4: Push a GitHub y deploy Vercel**

```bash
git remote add origin https://github.com/TU_USER/chatbot-juridico-rjl.git
git push -u origin main

# Deploy con Vercel CLI (wrapper EFS):
APPDATA="/c/Users/shedy/.local-appdata" vercel deploy --prod
```

- [ ] **Step 5: Variables de entorno en Vercel dashboard**

En `vercel.com/dashboard` → tu proyecto → Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL          = https://XXX.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY     = eyJ...
SUPABASE_SERVICE_ROLE_KEY         = eyJ...
ANTHROPIC_API_KEY                 = sk-ant-...
CLOUDFLARE_ACCOUNT_ID             = 7e8db9a4d239cf90cf3b20b4bdcafcc9
CLOUDFLARE_AI_TOKEN               = cf-...
NVIDIA_NIM_API_KEY                = nvapi-...
UPSTASH_REDIS_REST_URL            = https://...upstash.io
UPSTASH_REDIS_REST_TOKEN          = ...
STRIPE_SECRET_KEY                 = sk_live_... (o sk_test_ para pruebas)
STRIPE_WEBHOOK_SECRET             = whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = pk_live_...
NEXT_PUBLIC_FREE_CHAT_LIMIT       = 3
```

- [ ] **Step 6: Configurar Stripe webhook en producción**

En `dashboard.stripe.com` → Webhooks → Add endpoint:
- URL: `https://TU-DOMINIO.vercel.app/api/webhooks/stripe`
- Events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`

- [ ] **Step 7: Verificar producción**

1. Abrir URL de Vercel
2. Chat público → enviar 3 preguntas → límite ✓
3. Registro → confirmar email → login ✓
4. Dashboard → crear caso → subir evidencia GPS ✓
5. Checkout → pagar con tarjeta de prueba ✓

- [ ] **Step 8: Commit final**

```bash
git add .gitignore
git commit -m "chore: deploy config producción Vercel + Supabase"
git push
```

---

## Resumen: Ahorro de costos con free tiers

| Tier usuario | Modelo IA | Costo por consulta |
|---|---|---|
| Anónimo (freemium) | Cloudflare AI Llama 3.3 70B | **$0** |
| Anónimo (fallback) | NVIDIA NIM Llama 3.3 70B | **$0** |
| Suscriptor $200/mes | Claude Sonnet 4.6 | ~$0.003 USD |
| Asesor (análisis) | Claude Sonnet 4.6 | ~$0.015 USD |

**Escenario conservador:** 100 usuarios anónimos/día × 3 consultas = 300 req/día CF AI → **$0/mes** para todo el tier gratuito.

**Codex** está listo (`codex 0.128.0`, autenticado) — úsalo para cualquier subtarea de código compleja con `/codex:rescue`.

---

## Tabla de tareas con estimado

| # | Tarea | Tiempo est. | Prioridad |
|---|-------|------------|-----------|
| 1 | Mover proyecto + knowledge | 5 min | 🔴 Primero |
| 2 | Motor retrieval Morelos | 20 min | 🟠 Alta |
| 3 | AI routing Cloudflare/NVIDIA/Claude | 40 min | 🟠 Alta |
| 4 | Landing + PublicChatView | 20 min | 🟠 Alta |
| 5 | Auth Supabase | 15 min | 🟡 Media |
| 6 | Dashboard cliente + GPS vault | 30 min | 🟡 Media |
| 7 | Stripe checkout | 20 min | 🟡 Media |
| 8 | Deploy Vercel + Supabase | 25 min | 🟢 Final |

**Total estimado: ~3 horas para MVP en producción.**
