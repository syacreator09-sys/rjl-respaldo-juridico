# RJL Respaldo Jurídico Laboral — Plan de Implementación

> **Para workers agénticos:** REQUIRED SUB-SKILL: Usa `superpowers:subagent-driven-development` (recomendado) o `superpowers:executing-plans` para implementar este plan tarea por tarea. Los pasos usan sintaxis de checkbox (`- [ ]`) para rastreo.

**Goal:** Completar la plataforma SaaS `chatbot-juridico-rjl` — un asistente jurídico-laboral mexicano con chat IA (Claude), bóveda de evidencias con GPS, gestión de casos, y suscripciones Stripe.

**Architecture:** Next.js 15 App Router (ya inicializado). Claude Anthropic SDK server-side únicamente. Supabase para auth + DB + Storage. Motor de retrieval de Morelos (portado de `chatbot-juridico-ai`) enriquece el system prompt de Claude con chunks legales específicos. Upstash Redis para rate limiting freemium.

**Tech Stack:** Next.js 15, TypeScript, `@anthropic-ai/sdk`, `@supabase/ssr`, Stripe, Upstash Redis, Tailwind CSS, Lucide React.

---

## Estado actual (ya implementado — NO tocar)

| Archivo | Estado |
|---------|--------|
| `src/lib/anthropic.ts` | ✅ Claude server-only, system prompts |
| `src/lib/supabase/client.ts` | ✅ Browser client |
| `src/lib/supabase/server.ts` | ✅ Server + admin client |
| `src/lib/supabase/types.ts` | ✅ DB TypeScript types |
| `src/lib/rate-limit.ts` | ✅ Upstash rate limiting |
| `src/lib/validations/chat.ts` | ✅ Zod schemas |
| `src/middleware.ts` | ✅ Auth + role protection |
| `src/app/api/chat/route.ts` | ✅ Chat endpoint (public + client) |
| `src/app/api/analyze-case/route.ts` | ✅ Análisis IA para asesores |
| `src/app/api/webhooks/stripe/route.ts` | ✅ Webhook Stripe |
| `supabase/migrations/001_initial.sql` | ✅ Schema completo + RLS |
| `package.json` | ✅ Todas las deps instaladas |

---

## Dónde trabajar

**Proyecto canonical:** `C:\Users\shedy\Desktop\chatbot-juridico-rjl`

**Después del Task 1 (mover):** `D:\cano-ai-command-center\03-projects\chatbot-juridico-rjl`

**Motor de conocimiento (referencia):** `D:\cano-ai-command-center\03-projects\chatbot-juridico-ai\knowledge\processed\legal_chunks.json`

**Mockup visual (referencia):** `C:\Users\shedy\Desktop\chatbot-juridico-ai\rljdepp.html`

---

## Estructura de archivos objetivo

```
chatbot-juridico-rjl/
├── src/
│   ├── app/
│   │   ├── page.tsx                          ← PENDIENTE: Landing + PublicChatView
│   │   ├── (auth)/
│   │   │   └── login/page.tsx                ← PENDIENTE: Form Supabase auth
│   │   ├── (dashboard)/
│   │   │   ├── cliente/page.tsx              ← PENDIENTE: Dashboard cliente
│   │   │   ├── asesor/page.tsx               ← PENDIENTE: Panel asesor
│   │   │   └── admin/page.tsx                ← PENDIENTE: Panel admin
│   │   ├── api/
│   │   │   ├── chat/route.ts                 ✅ ya existe
│   │   │   ├── analyze-case/route.ts         ✅ ya existe
│   │   │   ├── evidence/route.ts             ← PENDIENTE: Upload evidencias
│   │   │   ├── stripe/checkout/route.ts      ← PENDIENTE: Checkout session
│   │   │   └── webhooks/stripe/route.ts      ✅ ya existe
│   │   └── globals.css                       ✅ ya existe
│   ├── components/
│   │   ├── chat/
│   │   │   ├── PublicChatView.tsx            ← PENDIENTE
│   │   │   └── ClientChatView.tsx            ← PENDIENTE
│   │   ├── evidence/
│   │   │   ├── EvidenceVault.tsx             ← PENDIENTE
│   │   │   └── EvidenceUpload.tsx            ← PENDIENTE
│   │   ├── cases/
│   │   │   └── CaseForm.tsx                  ← PENDIENTE
│   │   └── ui/                               ← shadcn/ui
│   └── lib/
│       ├── anthropic.ts                      ✅ ya existe
│       ├── knowledge/
│       │   └── legal-retrieval.ts            ← PENDIENTE: port motor Morelos
│       ├── supabase/                         ✅ ya existe
│       ├── rate-limit.ts                     ✅ ya existe
│       └── validations/                      ✅ ya existe
├── supabase/
│   └── migrations/001_initial.sql            ✅ ya existe
└── knowledge/
    └── legal_chunks.json                     ← PENDIENTE: copiar desde motor
```

---

## Task 1: Mover proyecto y copiar knowledge base

**Files:**
- Move: `C:\Users\shedy\Desktop\chatbot-juridico-rjl` → `D:\cano-ai-command-center\03-projects\chatbot-juridico-rjl`
- Create: `knowledge/legal_chunks.json` (copia desde motor)

- [ ] **Step 1: Mover la carpeta del proyecto**

```powershell
Move-Item "C:\Users\shedy\Desktop\chatbot-juridico-rjl" "D:\cano-ai-command-center\03-projects\chatbot-juridico-rjl"
cd "D:\cano-ai-command-center\03-projects\chatbot-juridico-rjl"
```

- [ ] **Step 2: Copiar knowledge base desde el motor existente**

```powershell
New-Item -ItemType Directory -Path "knowledge" -Force
Copy-Item "D:\cano-ai-command-center\03-projects\chatbot-juridico-ai\knowledge\processed\legal_chunks.json" "knowledge\legal_chunks.json"
```

- [ ] **Step 3: Instalar dependencias**

```powershell
npm install
```

- [ ] **Step 4: Verificar que Next.js arranca**

```powershell
npm run dev
```
Esperado: servidor en `http://localhost:3000` sin errores.

- [ ] **Step 5: Init git si no existe**

```powershell
git init
git add .
git commit -m "chore: init proyecto RJL con estructura base + knowledge base"
```

---

## Task 2: Motor de retrieval legal (knowledge layer)

El motor de `chatbot-juridico-ai` se porta como módulo TypeScript. Enriquece el system prompt de Claude con artículos relevantes cuando el usuario pregunta sobre Morelos.

**Files:**
- Create: `src/lib/knowledge/legal-retrieval.ts`
- Modify: `src/lib/anthropic.ts` (agregar `buildEnrichedPrompt`)

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

// Loaded once at module init (server-side only)
const chunks: LegalChunk[] = JSON.parse(
  readFileSync(resolve(process.cwd(), 'knowledge', 'legal_chunks.json'), 'utf8')
)

const MATTER_RULES = [
  { matter: 'proceso_penal' as const, words: ['detencion', 'fiscal', 'audiencia', 'imputado', 'ministerio publico', 'prision preventiva'] },
  { matter: 'penal' as const, words: ['delito', 'robo', 'lesiones', 'fraude', 'violencia', 'denuncia penal', 'extorsion'] },
  { matter: 'familiar' as const, words: ['divorcio', 'custodia', 'alimentos', 'pension', 'patria potestad', 'familia'] },
  { matter: 'civil' as const, words: ['contrato', 'arrendamiento', 'incumplimiento', 'propiedad', 'obligacion civil'] },
]

function plain(t: string) {
  return t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()
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

function tokenize(query: string): string[] {
  const stop = new Set(['como', 'funciona', 'tengo', 'quiero', 'puedo', 'debo', 'donde', 'cuando', 'para', 'sobre', 'caso', 'duda', 'necesito'])
  return Array.from(new Set(plain(query).split(/\s+/).filter(w => w.length >= 4 && !stop.has(w))))
}

function scoreChunk(chunk: LegalChunk, terms: string[]): number {
  const hay = plain(`${chunk.article} ${chunk.keywords.join(' ')} ${chunk.text.slice(0, 1200)}`)
  let score = terms.reduce((s, t) => s + (hay.includes(t) ? 3 : 0), 0)
  if (terms.some(t => plain(chunk.article).includes(t))) score += 5
  return score
}

/**
 * Returns relevant legal snippets from Morelos codes to enrich Claude's context.
 * Returns empty string if query doesn't match any legal matter.
 */
export function retrieveLegalContext(query: string, topN = 3): string {
  const matter = detectMatter(query)
  if (!matter) return ''

  const terms = tokenize(query)
  const pool = chunks.filter(c => c.matter === matter)
  const scored = pool
    .map(c => ({ chunk: c, score: scoreChunk(c, terms) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)

  if (scored.length === 0) return ''

  const snippets = scored
    .map(({ chunk }) => `Artículo ${chunk.article} (${chunk.law}):\n${chunk.text.slice(0, 400)}`)
    .join('\n\n')

  return `\n\nLEGISLACIÓN MORELOS RELEVANTE:\n${snippets}`
}
```

- [ ] **Step 2: Agregar `buildEnrichedPrompt` en `src/lib/anthropic.ts`**

Agregar al final del archivo existente (no modificar lo que ya existe):

```typescript
// Import at top of file:
// import { retrieveLegalContext } from './knowledge/legal-retrieval'

export function buildPublicSystemPrompt(userMessage: string): string {
  const legalContext = retrieveLegalContext(userMessage)
  return SYSTEM_PROMPTS.publicChat + legalContext
}
```

- [ ] **Step 3: Actualizar `src/app/api/chat/route.ts`**

En el bloque `public`, cambiar:
```typescript
system: SYSTEM_PROMPTS.publicChat,
```
Por:
```typescript
system: buildPublicSystemPrompt(message),
```

- [ ] **Step 4: Verificar que el chat responde con artículos de Morelos**

```bash
npm run dev
```
Probar en consola:
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"type":"public","message":"me robaron y quiero poner denuncia","history":[]}'
```
Esperado: respuesta que menciona Código Penal de Morelos + LFT.

- [ ] **Step 5: Commit**

```bash
git add src/lib/knowledge/ src/lib/anthropic.ts src/app/api/chat/route.ts knowledge/
git commit -m "feat: motor de retrieval Morelos integrado en system prompt de Claude"
```

---

## Task 3: Landing + PublicChatView

**Files:**
- Create: `src/components/chat/PublicChatView.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Crear `src/components/chat/PublicChatView.tsx`**

```typescript
'use client'
import { useState, useRef, useEffect } from 'react'

interface Message { role: 'user' | 'assistant'; content: string }

export function PublicChatView() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [remaining, setRemaining] = useState<number | null>(null)
  const [limitReached, setLimitReached] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || loading || limitReached) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'public',
          message: userMessage,
          history: messages,
        }),
      })

      const data = await res.json()

      if (res.status === 429) {
        setLimitReached(true)
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '⚠️ Alcanzaste el límite gratuito de 3 consultas diarias. Regístrate para acceso ilimitado por $200/mes.',
        }])
        return
      }

      if (!res.ok) throw new Error(data.error)

      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
      setRemaining(data.remaining)
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Ocurrió un error. Intenta de nuevo.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[600px] rounded-2xl overflow-hidden border"
      style={{ background: 'var(--navy-card)', borderColor: 'rgba(200,168,75,0.2)' }}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-sm text-center pt-8" style={{ color: 'var(--text-mid)' }}>
            Escribe tu consulta jurídico-laboral y te oriento con base en la LFT.
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-[85%] px-4 py-3 rounded-2xl text-sm"
              style={{
                background: m.role === 'user' ? 'var(--navy-light)' : 'var(--navy-mid)',
                color: 'var(--cream)',
                borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                border: m.role === 'assistant' ? '1px solid rgba(200,168,75,0.15)' : 'none',
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

      {/* Input */}
      {remaining !== null && remaining <= 1 && !limitReached && (
        <div className="px-4 py-1 text-xs text-center" style={{ color: 'var(--gold-dim)' }}>
          {remaining} consulta gratuita restante. <a href="/login" style={{ color: 'var(--gold)' }}>Suscríbete</a> para ilimitadas.
        </div>
      )}
      <form onSubmit={send} className="flex gap-2 p-3 border-t"
        style={{ borderColor: 'rgba(200,168,75,0.15)' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={limitReached ? 'Límite alcanzado — regístrate' : '¿Cuántas horas extra me deben?'}
          disabled={limitReached || loading}
          className="flex-1 px-4 py-2 rounded-xl text-sm outline-none disabled:opacity-50"
          style={{ background: 'var(--navy-light)', color: 'var(--cream)' }}
        />
        <button type="submit" disabled={loading || limitReached || !input.trim()}
          className="px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-40 transition-opacity"
          style={{ background: 'linear-gradient(135deg, var(--gold), var(--gold-dim))', color: 'var(--navy)' }}>
          Enviar
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: Actualizar `src/app/page.tsx` (landing)**

```typescript
import { PublicChatView } from '@/components/chat/PublicChatView'
import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen" style={{ background: 'var(--navy)' }}>
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b"
        style={{ borderColor: 'rgba(200,168,75,0.15)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
            style={{ background: 'linear-gradient(135deg,var(--gold),var(--gold-dim))', color: 'var(--navy)', fontFamily: 'Cormorant Garamond, serif', fontSize: 18 }}>
            RJL
          </div>
          <div>
            <h1 className="text-base font-semibold" style={{ color: 'var(--gold-light)', fontFamily: 'Cormorant Garamond, serif' }}>
              Respaldo Jurídico Laboral
            </h1>
            <span className="text-xs" style={{ color: 'var(--text-dim)' }}>Morelos · Derecho laboral mexicano</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/login"
            className="px-4 py-2 rounded-xl text-xs font-medium border"
            style={{ borderColor: 'var(--gold-dim)', color: 'var(--gold-light)' }}>
            Iniciar sesión
          </Link>
          <Link href="/login?tab=register"
            className="px-4 py-2 rounded-xl text-xs font-medium"
            style={{ background: 'linear-gradient(135deg,var(--gold),var(--gold-dim))', color: 'var(--navy)' }}>
            $200/mes
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-2xl mx-auto px-6 pt-16 pb-8 text-center">
        <h2 className="text-3xl font-bold mb-3" style={{ color: 'var(--gold-light)', fontFamily: 'Cormorant Garamond, serif' }}>
          Conoce y defiende tus derechos laborales
        </h2>
        <p className="text-sm mb-8" style={{ color: 'var(--text-mid)' }}>
          Calcula horas extra, liquidaciones y aguinaldos. Guarda evidencias con GPS.
          Todo en un solo lugar — respaldado por la LFT.
        </p>
        <PublicChatView />
        <p className="text-xs mt-4" style={{ color: 'var(--text-dim)' }}>
          ⚠️ Orientación informativa. 3 consultas gratis/día. No sustituye asesoría legal profesional.
        </p>
      </section>

      {/* Features */}
      <section className="max-w-3xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: '⚖️', title: 'Cálculo exacto', desc: 'Horas extra, liquidación, aguinaldo según LFT con tu salario real.' },
          { icon: '📍', title: 'Evidencias GPS', desc: 'Guarda entradas, salidas y documentos con timestamp y coordenadas.' },
          { icon: '👨‍⚖️', title: 'Asesor real', desc: 'Conecta con un asesor jurídico para tu expediente completo.' },
        ].map(f => (
          <div key={f.title} className="p-5 rounded-2xl border" style={{ background: 'var(--navy-card)', borderColor: 'rgba(200,168,75,0.1)' }}>
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

- [ ] **Step 3: Verificar en navegador**

```bash
npm run dev
```
Abrir `http://localhost:3000` → landing visible, chat freemium funcional.
Enviar 3 preguntas → debe mostrar aviso de límite en la 3ra.

- [ ] **Step 4: Commit**

```bash
git add src/components/chat/PublicChatView.tsx src/app/page.tsx
git commit -m "feat: landing con PublicChatView freemium (3 preguntas/día rate limited)"
```

---

## Task 4: Autenticación — Login/Register con Supabase

**Files:**
- Modify: `src/app/(auth)/login/page.tsx` (ya existe el archivo, completar el form)

- [ ] **Step 1: Actualizar `src/app/(auth)/login/page.tsx`**

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
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
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
        setError('Revisa tu correo para confirmar tu cuenta.')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--navy)' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
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
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: tab === t ? 'var(--navy-light)' : 'transparent',
                color: tab === t ? 'var(--gold-light)' : 'var(--text-dim)',
              }}>
              {t === 'login' ? 'Iniciar sesión' : 'Registrarse'}
            </button>
          ))}
        </div>
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3"
          style={{ background: 'var(--navy-card)', padding: 24, borderRadius: 16, border: '1px solid rgba(200,168,75,0.15)' }}>
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
          <input type="password" placeholder="Contraseña" value={password}
            onChange={e => setPassword(e.target.value)} required minLength={8}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{ background: 'var(--navy-light)', color: 'var(--cream)' }} />
          {error && (
            <p className="text-xs px-1" style={{ color: error.includes('correo') ? 'var(--gold)' : '#E07070' }}>
              {error}
            </p>
          )}
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-sm disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,var(--gold),var(--gold-dim))', color: 'var(--navy)' }}>
            {loading ? 'Cargando...' : tab === 'login' ? 'Entrar' : 'Crear cuenta ($200/mes)'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Configurar Supabase en `.env.local`**

```bash
# Leer del maestro:
grep -E "SUPABASE|UPSTASH|ANTHROPIC|STRIPE" D:/cano-ai-command-center/.env
```

Crear `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_FREE_CHAT_LIMIT=3
```

- [ ] **Step 3: Aplicar migración a Supabase**

```bash
# Si usas Supabase Cloud:
npx supabase db push

# O pegar el contenido de supabase/migrations/001_initial.sql en el SQL Editor del dashboard
```

- [ ] **Step 4: Verificar login**

```bash
npm run dev
```
Abrir `http://localhost:3000/login` → registrar usuario → recibir email de confirmación → login.

- [ ] **Step 5: Commit**

```bash
git add src/app/(auth)/login/page.tsx .env.local.template
git commit -m "feat: auth Supabase con login/register + diseño RJL"
```

---

## Task 5: Dashboard Cliente

**Files:**
- Modify: `src/app/(dashboard)/cliente/page.tsx`
- Create: `src/components/cases/CaseForm.tsx`

- [ ] **Step 1: Crear `src/components/cases/CaseForm.tsx`**

```typescript
'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function CaseForm({ onCreated }: { onCreated: () => void }) {
  const supabase = createClient()
  const [data, setData] = useState({
    employer_name: '', position: '', start_date: '', salary_daily: '',
    work_hours_paper: '', work_hours_real: '', has_imss: false, has_contract: false,
  })
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: caseRow } = await supabase.from('cases')
      .insert({ client_id: user.id }).select().single()

    if (caseRow) {
      await supabase.from('case_data').insert({
        case_id: caseRow.id,
        employer_name: data.employer_name,
        position: data.position,
        start_date: data.start_date || null,
        salary_daily: data.salary_daily ? parseFloat(data.salary_daily) : null,
        work_hours_paper: data.work_hours_paper,
        work_hours_real: data.work_hours_real,
        has_imss: data.has_imss,
        has_contract: data.has_contract,
      })
    }
    setLoading(false)
    onCreated()
  }

  const field = (label: string, key: keyof typeof data, type = 'text') => (
    <div key={key}>
      <label className="text-xs mb-1 block" style={{ color: 'var(--text-mid)' }}>{label}</label>
      <input type={type} value={data[key] as string}
        onChange={e => setData(d => ({ ...d, [key]: type === 'checkbox' ? e.target.checked : e.target.value }))}
        className="w-full px-3 py-2 rounded-lg text-sm outline-none"
        style={{ background: 'var(--navy-light)', color: 'var(--cream)' }} />
    </div>
  )

  return (
    <form onSubmit={submit} className="space-y-3 p-4 rounded-2xl border"
      style={{ background: 'var(--navy-card)', borderColor: 'rgba(200,168,75,0.15)' }}>
      <h3 className="font-semibold text-sm mb-3" style={{ color: 'var(--gold-light)' }}>Datos de tu caso</h3>
      {field('Empleador', 'employer_name')}
      {field('Puesto', 'position')}
      {field('Fecha de inicio', 'start_date', 'date')}
      {field('Salario diario (MXN)', 'salary_daily', 'number')}
      {field('Horario en contrato', 'work_hours_paper')}
      {field('Horario real', 'work_hours_real')}
      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-mid)' }}>
          <input type="checkbox" checked={data.has_imss} onChange={e => setData(d => ({ ...d, has_imss: e.target.checked }))} />
          Tengo IMSS
        </label>
        <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-mid)' }}>
          <input type="checkbox" checked={data.has_contract} onChange={e => setData(d => ({ ...d, has_contract: e.target.checked }))} />
          Tengo contrato
        </label>
      </div>
      <button type="submit" disabled={loading}
        className="w-full py-2 rounded-xl text-sm font-medium disabled:opacity-50"
        style={{ background: 'linear-gradient(135deg,var(--gold),var(--gold-dim))', color: 'var(--navy)' }}>
        {loading ? 'Guardando...' : 'Guardar caso'}
      </button>
    </form>
  )
}
```

- [ ] **Step 2: Actualizar `src/app/(dashboard)/cliente/page.tsx`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CaseForm } from '@/components/cases/CaseForm'

export default async function ClienteDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: cases } = await supabase
    .from('cases').select('*, case_data(*)').eq('client_id', user.id)

  const activeCase = cases?.[0]

  return (
    <div className="min-h-screen p-6" style={{ background: 'var(--navy)' }}>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--gold-light)', fontFamily: 'Cormorant Garamond, serif' }}>
          Mi expediente
        </h1>
        {!activeCase ? (
          <CaseForm onCreated={() => window.location.reload()} />
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl border" style={{ background: 'var(--navy-card)', borderColor: 'rgba(200,168,75,0.15)' }}>
              <h2 className="font-semibold text-sm mb-3" style={{ color: 'var(--gold-light)' }}>
                Caso #{activeCase.id.slice(0, 8)}
              </h2>
              <pre className="text-xs" style={{ color: 'var(--text-mid)', whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(activeCase.case_data, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verificar dashboard**

```bash
npm run dev
```
Login → `/cliente` → ver formulario o caso existente.

- [ ] **Step 4: Commit**

```bash
git add src/components/cases/ src/app/(dashboard)/cliente/
git commit -m "feat: dashboard cliente con formulario de caso laboral"
```

---

## Task 6: Bóveda de Evidencias (GPS)

**Files:**
- Create: `src/components/evidence/EvidenceUpload.tsx`
- Create: `src/components/evidence/EvidenceVault.tsx`
- Create: `src/app/api/evidence/route.ts`

- [ ] **Step 1: Crear `src/app/api/evidence/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File
  const category = formData.get('category') as string
  const caseId = formData.get('case_id') as string
  const gpsLat = formData.get('gps_lat') ? parseFloat(formData.get('gps_lat') as string) : null
  const gpsLng = formData.get('gps_lng') ? parseFloat(formData.get('gps_lng') as string) : null
  const gpsAccuracy = formData.get('gps_accuracy') ? parseFloat(formData.get('gps_accuracy') as string) : null

  // Verify ownership
  const { data: caseRow } = await supabase.from('cases')
    .select('id').eq('id', caseId).eq('client_id', user.id).single()
  if (!caseRow) return NextResponse.json({ error: 'Case not found' }, { status: 404 })

  // Upload to Supabase Storage
  const filePath = `${user.id}/${caseId}/${Date.now()}-${file.name}`
  const { error: uploadError } = await supabase.storage
    .from('evidence').upload(filePath, file, { contentType: file.type })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  // Insert record (server_time set by DB DEFAULT)
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

const CATEGORIES = [
  { value: 'entrada_trabajo', label: 'Entrada al trabajo' },
  { value: 'salida_trabajo', label: 'Salida del trabajo' },
  { value: 'contrato', label: 'Contrato / documento' },
  { value: 'recibo_pago', label: 'Recibo de pago' },
  { value: 'gastos_medicos', label: 'Gastos médicos' },
  { value: 'otro', label: 'Otro' },
]

export function EvidenceUpload({ caseId, onUploaded }: { caseId: string; onUploaded: () => void }) {
  const [category, setCategory] = useState('entrada_trabajo')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [coords, setCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null)

  function getGps() {
    setGpsStatus('loading')
    navigator.geolocation.getCurrentPosition(
      pos => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy })
        setGpsStatus('done')
      },
      () => setGpsStatus('error'),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setLoading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('category', category)
    fd.append('case_id', caseId)
    if (coords) {
      fd.append('gps_lat', String(coords.lat))
      fd.append('gps_lng', String(coords.lng))
      fd.append('gps_accuracy', String(coords.accuracy))
    }
    await fetch('/api/evidence', { method: 'POST', body: fd })
    setLoading(false)
    setFile(null)
    onUploaded()
  }

  return (
    <form onSubmit={submit} className="p-4 rounded-2xl border space-y-3"
      style={{ background: 'var(--navy-card)', borderColor: 'rgba(200,168,75,0.15)' }}>
      <h3 className="text-sm font-semibold" style={{ color: 'var(--gold-light)' }}>Subir evidencia</h3>
      <select value={category} onChange={e => setCategory(e.target.value)}
        className="w-full px-3 py-2 rounded-lg text-sm outline-none"
        style={{ background: 'var(--navy-light)', color: 'var(--cream)' }}>
        {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
      </select>
      <input type="file" accept="image/*,application/pdf,video/mp4"
        onChange={e => setFile(e.target.files?.[0] ?? null)}
        className="w-full text-xs" style={{ color: 'var(--text-mid)' }} />
      <button type="button" onClick={getGps}
        className="w-full py-2 rounded-lg text-xs border"
        style={{ borderColor: gpsStatus === 'done' ? 'var(--green)' : 'rgba(200,168,75,0.3)', color: gpsStatus === 'done' ? 'var(--green)' : 'var(--text-mid)' }}>
        {gpsStatus === 'idle' && '📍 Capturar GPS'}
        {gpsStatus === 'loading' && 'Obteniendo ubicación...'}
        {gpsStatus === 'done' && `✓ GPS: ${coords?.lat.toFixed(4)}, ${coords?.lng.toFixed(4)}`}
        {gpsStatus === 'error' && '⚠️ GPS no disponible'}
      </button>
      <button type="submit" disabled={!file || loading}
        className="w-full py-2 rounded-xl text-sm font-medium disabled:opacity-50"
        style={{ background: 'linear-gradient(135deg,var(--gold),var(--gold-dim))', color: 'var(--navy)' }}>
        {loading ? 'Subiendo...' : 'Guardar evidencia'}
      </button>
    </form>
  )
}
```

- [ ] **Step 3: Verificar upload**

```bash
npm run dev
```
Login como cliente → subir imagen con GPS → verificar en Supabase Storage + tabla `evidence`.

- [ ] **Step 4: Commit**

```bash
git add src/components/evidence/ src/app/api/evidence/
git commit -m "feat: EvidenceVault con upload GPS a Supabase Storage"
```

---

## Task 7: Panel Asesor

**Files:**
- Modify: `src/app/(dashboard)/asesor/page.tsx`

- [ ] **Step 1: Actualizar `src/app/(dashboard)/asesor/page.tsx`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AsesorDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles')
    .select('role').eq('id', user.id).single()
  if (profile?.role !== 'asesor' && profile?.role !== 'admin') redirect('/cliente')

  const { data: cases } = await supabase
    .from('cases')
    .select('*, profiles!client_id(full_name, phone), case_data(*), tickets(count)')
    .eq('asesor_id', user.id)
    .eq('status', 'active')

  return (
    <div className="min-h-screen p-6" style={{ background: 'var(--navy)' }}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--gold-light)', fontFamily: 'Cormorant Garamond, serif' }}>
          Mis casos asignados
        </h1>
        {!cases?.length && (
          <p className="text-sm" style={{ color: 'var(--text-dim)' }}>No tienes casos asignados aún.</p>
        )}
        <div className="space-y-3">
          {cases?.map(c => (
            <div key={c.id} className="p-4 rounded-2xl border"
              style={{ background: 'var(--navy-card)', borderColor: 'rgba(200,168,75,0.15)' }}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--cream)' }}>
                    {(c.profiles as { full_name: string | null })?.full_name ?? 'Sin nombre'} · Caso #{c.id.slice(0,8)}
                  </p>
                  {c.case_data && (
                    <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
                      {(c.case_data as { employer_name?: string })?.employer_name} · ${(c.case_data as { salary_daily?: number })?.salary_daily}/día
                    </p>
                  )}
                </div>
                <span className="text-xs px-2 py-1 rounded-lg" style={{ background: 'var(--navy-light)', color: 'var(--gold-dim)' }}>
                  Activo
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(dashboard)/asesor/
git commit -m "feat: panel asesor con casos asignados"
```

---

## Task 8: Deploy Vercel + Supabase

- [ ] **Step 1: Verificar build**

```bash
npm run build
npm run type-check
```
Esperado: sin errores.

- [ ] **Step 2: Configurar Supabase Cloud**

En el dashboard de Supabase:
1. Crear nuevo proyecto
2. Correr `supabase/migrations/001_initial.sql` en SQL Editor
3. Crear buckets `evidence` y `avatars` (ver comentarios al final del SQL)

- [ ] **Step 3: Deploy Vercel**

```bash
APPDATA="/c/Users/shedy/.local-appdata" vercel deploy --prod
```

- [ ] **Step 4: Agregar env vars en Vercel dashboard**

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_FREE_CHAT_LIMIT=3
```

- [ ] **Step 5: Verificar en producción**

Abrir URL de Vercel → landing → chat → login → dashboard cliente.

- [ ] **Step 6: Commit final**

```bash
git add .
git commit -m "chore: deploy config Vercel + env template actualizado"
```

---

## Resumen ejecutivo

| # | Tarea | Dura | Prioridad |
|---|-------|------|-----------|
| 1 | Mover proyecto + copiar knowledge | 5 min | 🔴 Primero |
| 2 | Motor retrieval Morelos integrado | 30 min | 🟠 Alta |
| 3 | Landing + PublicChatView | 20 min | 🟠 Alta |
| 4 | Auth Supabase login/register | 20 min | 🟠 Alta |
| 5 | Dashboard cliente + CaseForm | 30 min | 🟡 Media |
| 6 | EvidenceVault GPS | 30 min | 🟡 Media |
| 7 | Panel asesor | 15 min | 🟡 Media |
| 8 | Deploy Vercel + Supabase | 20 min | 🟢 Final |

**Total estimado:** ~3 horas para MVP completo deployado.

---

## Comandos rápidos

```bash
# Entrar al proyecto (después del Task 1)
cd D:/cano-ai-command-center/03-projects/chatbot-juridico-rjl

# Dev
npm run dev         # → localhost:3000

# Type check
npm run type-check

# Build
npm run build

# DB migrate
npx supabase db push

# Deploy
APPDATA="/c/Users/shedy/.local-appdata" vercel deploy --prod
```
