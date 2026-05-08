# RJL — Respaldo Jurídico Laboral | Blueprint de Construcción
# Generado: 2026-05-06 | The Architect (Claude Sonnet 4.6)
# Estado: Listo para construcción autónoma — CERO preguntas al builder

---

## RESUMEN EJECUTIVO

**Producto:** SaaS de asesoría jurídico-laboral para trabajadores mexicanos.
**Modelo:** Freemium. Anónimo: 3 preguntas/día. Suscrito: $200 MXN/mes, chat ilimitado + bóveda + asesor.
**Estado actual:** ~40% listo. Schema DB completo + RLS. Infraestructura configurada. Faltan todos los componentes UI y features.
**Repo local:** `D:\cano-ai-command-center\03-projects\chatbot-juridico-rjl`
**Deploy target:** Vercel (frontend) + Supabase (DB + Auth + Storage)

---

## STACK — FINAL (no cambiar)

```
FRAMEWORK       Next.js 15 App Router + TypeScript (ya instalado)
DB + AUTH       Supabase PostgreSQL + GoTrue Auth + RLS (migration 001 ya existe)
STORAGE         Supabase Storage (evidencias PDF/fotos — bucket "evidencias")
AI              Anthropic Claude claude-sonnet-4-6 — SERVER-SIDE ONLY en /api/chat
RATE LIMITING   Upstash Redis (3 preguntas gratis/IP/día para anónimos)
PAGOS           Stripe (MXN, $200/mes = 200 MXN, price_id: crear en dashboard)
ESTILOS         Tailwind CSS + Cormorant Garamond (títulos) + Outfit (cuerpo)
DEPLOY          Vercel Hobby (gratis) + Supabase cloud
PDF             @react-pdf/renderer (client) o pdf-lib (server) para expediente
```

---

## LO QUE YA EXISTE (NO tocar)

```
supabase/migrations/001_initial.sql  ← Schema completo (EJECUTAR SI NO SE HA HECHO)
src/lib/supabase/client.ts           ← Browser client
src/lib/supabase/server.ts           ← Server client + admin client
src/lib/rate-limit.ts                ← Upstash rate limiting
src/lib/validations/chat.ts          ← Zod schema
src/app/layout.tsx                   ← Layout base con fonts
src/app/globals.css                  ← Estilos globales
```

---

## VARIABLES DE ENTORNO

`.env.local` (copiar de `.env.local.template` y llenar):

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://XXXXXX.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...        # SOLO server-side, NUNCA en cliente

# Anthropic — NUNCA en cliente
ANTHROPIC_API_KEY=sk-ant-...            # del .env maestro D:/cano-ai-command-center/.env

# Upstash Redis — rate limiting
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_PRICE_ID_MENSUAL=price_...       # Crear en Stripe Dashboard: $200 MXN/mes

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## SCHEMA (ya existe en 001_initial.sql — verificar ejecutado)

Tablas existentes (no recrear):
- `profiles` (extiende auth.users, rol: cliente/asesor/admin)
- `system_config` (salario_minimo=248.93, precio=200, limite_gratis=3)
- `cases` (caso laboral por cliente, asignado a asesor)
- `case_data` (datos laborales: empresa, salario, fecha ingreso, motivo)
- `chat_messages` (historial completo conversación)
- `evidence` (inmutable — RLS FOR UPDATE USING (false))
- `tickets` (solicitudes de atención asesor)
- `subscriptions` (estado Stripe)
- `payments` (historial pagos)
- `audit_logs` (cambios en casos, evidencias)

---

## ORDEN DE CONSTRUCCIÓN — 12 PASOS

### PASO 1 — Ejecutar migration + configurar Supabase
**Executor:** Alfonso (manual en Supabase Dashboard)

```bash
# Si no se ha ejecutado:
# Supabase Dashboard → SQL Editor → pegar 001_initial.sql completo → Run
# Luego:
# Authentication → Providers → Email: habilitar
# Authentication → Email Templates → personalizar con logo RJL
# Storage → Create bucket "evidencias" → private
# Storage → policies: solo el owner puede leer/escribir sus archivos
```

Crear producto en Stripe:
```
Stripe Dashboard → Products → Create:
- Name: "RJL — Asesoría Laboral"
- Price: $200.00 MXN / month (recurring)
- Copiar price_id → .env STRIPE_PRICE_ID_MENSUAL
```

DoD: SQL ejecutado. 10 tablas en Supabase. Bucket "evidencias" creado. Stripe price_id en .env.

---

### PASO 2 — API Route: /api/chat (Proxy seguro Claude)
**Executor:** Codex CLI

Archivo: `src/app/api/chat/route.ts`

```typescript
import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { rateLimit } from '@/lib/rate-limit'
import { createClient } from '@/lib/supabase/server'

const client = new Anthropic() // lee ANTHROPIC_API_KEY automáticamente

const bodySchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().max(2000)
  })).max(20),
  caseContext: z.object({
    empresa: z.string().optional(),
    salario_diario: z.number().optional(),
    fecha_ingreso: z.string().optional(),
    motivo_demanda: z.string().optional(),
  }).optional()
})

const SYSTEM_PROMPT = `Eres un asistente de asesoría jurídico-laboral mexicana de RJL (Respaldo Jurídico Laboral).

Tu conocimiento:
- Ley Federal del Trabajo (LFT) vigente
- IMSS, INFONAVIT, utilidades, vacaciones, aguinaldo, prima vacacional
- Cálculo de liquidaciones: 3 meses + 20 días por año + partes proporcionales
- Procedimientos ante STPS, Juntas de Conciliación, LFCA
- Salario mínimo vigente: $248.93 MXN/día (verificar con usuario si es diferente)

Reglas:
1. Calculas derechos laborales específicos con datos del trabajador
2. Explicas procedimientos en lenguaje simple
3. NO das asesoría médica ni de otros tipos de derecho
4. Siempre recomiendas consultar con un asesor RJL para casos complejos
5. Cuando calculas, muestra el desglose paso a paso
6. Si el usuario menciona urgencia o despido reciente, prioriza los plazos legales (generalmente 2 meses para demandar)`

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown'
  const supabase = createClient()
  
  // Verificar si es usuario autenticado (suscrito = sin rate limit)
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    // Rate limiting para anónimos: 3 preguntas/día/IP
    const { success, remaining } = await rateLimit(ip)
    if (!success) {
      return Response.json(
        { error: 'Límite de preguntas gratuitas alcanzado. Suscríbete por $200 MXN/mes para acceso ilimitado.' },
        { status: 429, headers: { 'X-RateLimit-Remaining': '0' } }
      )
    }
  } else {
    // Verificar suscripción activa
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('status')
      .eq('user_id', user.id)
      .single()
    
    if (sub?.status !== 'active' && sub?.status !== 'trialing') {
      // Cliente sin suscripción: aplicar rate limiting también
      const { success } = await rateLimit(`user:${user.id}`)
      if (!success) {
        return Response.json(
          { error: 'Suscripción no activa. Activa tu plan para continuar.' },
          { status: 402 }
        )
      }
    }
  }

  const body = await req.json()
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 })
  }

  const { messages, caseContext } = parsed.data
  
  const contextStr = caseContext ? `
Datos laborales del trabajador:
- Empresa: ${caseContext.empresa ?? 'no especificada'}
- Salario diario: $${caseContext.salario_diario ?? 'no especificado'} MXN
- Fecha de ingreso: ${caseContext.fecha_ingreso ?? 'no especificada'}
- Motivo de demanda: ${caseContext.motivo_demanda ?? 'no especificado'}
` : ''

  // Streaming response
  const stream = client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: SYSTEM_PROMPT + (contextStr ? `\n\nContexto actual:\n${contextStr}` : ''),
    messages: messages.map(m => ({ role: m.role, content: m.content }))
  })

  // Guardar en DB si usuario autenticado
  if (user && messages.length > 0) {
    const lastUserMsg = messages[messages.length - 1]
    // Guardar el mensaje del usuario (la respuesta se guarda en el cliente al completar)
    await supabase.from('chat_messages').insert({
      user_id: user.id,
      role: 'user',
      content: lastUserMsg.content
    })
  }

  return stream.toReadableStream()
}
```

DoD: `curl -X POST http://localhost:3000/api/chat -H "Content-Type: application/json" -d '{"messages":[{"role":"user","content":"¿Cuánto me corresponde de aguinaldo?"}]}'` → respuesta streaming de Claude.

---

### PASO 3 — PublicChatView (Landing con chatbot gratuito)
**Executor:** Codex CLI

Archivo: `src/components/chat/PublicChatView.tsx`

```tsx
'use client'
import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Message { role: 'user' | 'assistant'; content: string }

export function PublicChatView() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '¡Hola! Soy el asistente jurídico de RJL. Puedo ayudarte a calcular tus derechos laborales — liquidación, finiquito, aguinaldo, vacaciones y más. ¿Cuál es tu situación?' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [remaining, setRemaining] = useState(3)
  const scrollRef = useRef<HTMLDivElement>(null)

  const send = async () => {
    if (!input.trim() || loading || remaining === 0) return
    const userMsg: Message = { role: 'user', content: input }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    const allMessages = [...messages, userMsg]
    
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: allMessages })
      })

      if (res.status === 429) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '⚠️ Has usado tus 3 consultas gratuitas del día. [Suscríbete por $200 MXN/mes](/pricing) para acceso ilimitado.'
        }])
        setRemaining(0)
        return
      }

      // Streaming
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let assistantContent = ''
      setMessages(prev => [...prev, { role: 'assistant', content: '' }])

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break
        assistantContent += decoder.decode(value, { stream: true })
        setMessages(prev => [...prev.slice(0, -1), { role: 'assistant', content: assistantContent }])
      }
      
      setRemaining(prev => Math.max(0, prev - 1))
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error de conexión. Intenta de nuevo.' }])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex flex-col h-[600px] border rounded-lg bg-background">
      {/* Header */}
      <div className="p-4 border-b bg-card">
        <h3 className="font-semibold text-foreground">Asesor Jurídico RJL</h3>
        <p className="text-xs text-muted-foreground">
          {remaining > 0 ? `${remaining} consultas gratuitas restantes hoy` : 'Límite alcanzado — suscríbete'}
        </p>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-lg p-3 text-sm ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg p-3 text-sm text-muted-foreground animate-pulse">
                Calculando...
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder={remaining > 0 ? "¿Cuánto me corresponde de liquidación?" : "Suscríbete para continuar..."}
          disabled={loading || remaining === 0}
        />
        <Button onClick={send} disabled={loading || !input.trim() || remaining === 0}>
          {loading ? '...' : 'Enviar'}
        </Button>
      </div>
    </div>
  )
}
```

DoD: Chat en landing funciona. 3 preguntas gratuitas. Al agotar → mensaje de upsell.

---

### PASO 4 — Auth Forms (Login + Register)
**Executor:** Codex CLI

Archivos:
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/register/page.tsx`

```tsx
// src/app/(auth)/login/page.tsx
'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    
    // Redirigir según rol
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()
    
    if (profile?.role === 'asesor') router.push('/asesor')
    else if (profile?.role === 'admin') router.push('/admin')
    else router.push('/cliente')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold font-serif text-foreground">RJL</h1>
          <p className="text-muted-foreground text-sm">Respaldo Jurídico Laboral</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label htmlFor="email">Correo</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Iniciando...' : 'Iniciar sesión'}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          ¿No tienes cuenta? <Link href="/register" className="underline">Regístrate</Link>
        </p>
      </div>
    </div>
  )
}
```

**Middleware de protección de rutas** (`src/middleware.ts`):
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/', '/login', '/register', '/pricing', '/api/chat', '/api/webhooks']

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (n) => req.cookies.get(n)?.value, set: (n, v, o) => res.cookies.set({ name: n, value: v, ...o }), remove: (n, o) => res.cookies.set({ name: n, value: '', ...o }) } }
  )
  
  const { data: { user } } = await supabase.auth.getUser()
  const path = req.nextUrl.pathname
  
  if (PUBLIC_ROUTES.some(r => path === r || path.startsWith('/api/'))) return res
  if (!user) return NextResponse.redirect(new URL('/login', req.url))
  
  // Role protection
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (path.startsWith('/asesor') && profile?.role !== 'asesor' && profile?.role !== 'admin') {
    return NextResponse.redirect(new URL('/cliente', req.url))
  }
  if (path.startsWith('/admin') && profile?.role !== 'admin') {
    return NextResponse.redirect(new URL('/cliente', req.url))
  }
  return res
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] }
```

DoD: Login funciona. Registro crea cuenta + profile. Middleware redirige según rol.

---

### PASO 5 — Dashboard Cliente (Panel principal)
**Executor:** Codex CLI

Archivo: `src/app/(dashboard)/cliente/page.tsx`

Secciones del dashboard:
```tsx
// Layout: sidebar con nav + main content area
// Sidebar: Inicio | Chat | Mis Evidencias | Mis Tickets | Mi Plan
// 
// Inicio:
//   - Card: "Tu caso" con datos laborales (empresa, salario, antigüedad)
//   - Card: "Tus derechos estimados" → calculadora rápida
//   - Card: "Plan activo" → si free: banner upsell
//
// Chat:
//   - ClientChatView: igual que PublicChatView pero:
//     - Sin rate limiting (o con rate limit de usuario)
//     - Con contexto de datos laborales del caso
//     - Historial persistido en chat_messages
//
// Mis Evidencias:
//   - Lista de evidencias inmutables
//   - Botón "Subir evidencia" → EvidenceUpload
//
// Mis Tickets:
//   - Lista de solicitudes a asesor
//   - Crear nuevo ticket
```

Calculadora de liquidación (server component):
```typescript
// src/lib/calculadora-lft.ts
export function calcularLiquidacion(params: {
  salario_diario: number
  años_servicio: number
  meses_fraccion: number
  dias_fraccion: number
  tipo: '20_dias' | 'rescision' | 'retiro_voluntario'
}) {
  const { salario_diario, años_servicio, meses_fraccion, dias_fraccion, tipo } = params
  const salario_mensual = salario_diario * 30
  
  // Partes proporcionales (si aplica fracción de año)
  const aguinaldo_prop = (salario_diario * 15) * (meses_fraccion / 12)
  const vacaciones_dias = años_servicio >= 1 ? Math.min(6 + (años_servicio - 1) * 2, 24) : 0
  const vacaciones_prop = (salario_diario * vacaciones_dias) * (meses_fraccion / 12) * 1.25
  const prima_prop = vacaciones_prop * 0.25
  
  let indemnizacion = 0
  if (tipo === '20_dias' || tipo === 'rescision') {
    indemnizacion = salario_diario * 20 * años_servicio
  }
  const tres_meses = tipo === 'rescision' ? salario_mensual * 3 : 0
  
  return {
    aguinaldo_proporcional: Math.round(aguinaldo_prop * 100) / 100,
    vacaciones_proporcionales: Math.round(vacaciones_prop * 100) / 100,
    prima_vacacional_prop: Math.round(prima_prop * 100) / 100,
    indemnizacion_20_dias: Math.round(indemnizacion * 100) / 100,
    tres_meses_salario: Math.round(tres_meses * 100) / 100,
    total: Math.round((aguinaldo_prop + vacaciones_prop + prima_prop + indemnizacion + tres_meses) * 100) / 100
  }
}
```

DoD: Dashboard muestra datos del caso + calculadora + historial de chat.

---

### PASO 6 — EvidenceVault (Bóveda de evidencias con GPS)
**Executor:** Codex CLI

Archivo: `src/components/evidence/EvidenceVault.tsx`

```tsx
'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function EvidenceUpload({ caseId }: { caseId: string }) {
  const [uploading, setUploading] = useState(false)
  const supabase = createClient()

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)

    // 1. Obtener GPS (con permiso del usuario)
    let lat: number | null = null, lng: number | null = null
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 10000 })
      )
      lat = pos.coords.latitude
      lng = pos.coords.longitude
    } catch { /* GPS no disponible — continuar sin GPS */ }

    // 2. Upload a Supabase Storage (bucket "evidencias")
    const path = `${caseId}/${Date.now()}-${file.name}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('evidencias')
      .upload(path, file, { cacheControl: '3600', upsert: false })

    if (uploadError) { alert('Error al subir archivo'); setUploading(false); return }

    // 3. Insertar en tabla evidence (inmutable — no se puede modificar después)
    const { error: dbError } = await supabase.from('evidence').insert({
      case_id: caseId,
      storage_path: uploadData.path,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      latitude: lat,
      longitude: lng,
      // server_time se asigna por DEFAULT en la DB — NO enviar desde cliente
    })

    if (dbError) { alert('Error al registrar evidencia'); setUploading(false); return }
    
    alert('Evidencia guardada con éxito y fecha/hora registrada por el servidor')
    setUploading(false)
  }

  return (
    <div className="border-2 border-dashed rounded-lg p-8 text-center">
      <p className="text-muted-foreground mb-4">
        Sube fotos, documentos, capturas de pantalla o cualquier evidencia laboral.
        <br />
        <strong>Fecha, hora y ubicación GPS se registran automáticamente.</strong>
      </p>
      <label className="cursor-pointer">
        <span className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm">
          {uploading ? 'Subiendo...' : 'Seleccionar archivo'}
        </span>
        <input type="file" className="hidden" onChange={handleUpload} disabled={uploading}
          accept="image/*,application/pdf,.doc,.docx,.txt,.xlsx" />
      </label>
      <p className="text-xs text-muted-foreground mt-2">
        ⚠️ Las evidencias son inmutables — no pueden modificarse después de subirse.
      </p>
    </div>
  )
}
```

DoD: Archivo sube a Supabase Storage. Row en `evidence` con `server_time` del servidor. GPS registrado si disponible.

---

### PASO 7 — Panel Asesor
**Executor:** Codex CLI

`src/app/(dashboard)/asesor/page.tsx`:
```
Secciones:
- Lista de clientes asignados (cases donde asesor_id = auth.uid())
- Por cada cliente: datos laborales + historial chat + evidencias + tickets
- "Análisis IA" → POST /api/analyze-case con contexto completo → Claude genera:
  * Probabilidad de éxito estimada
  * Estrategia legal recomendada
  * Montos a reclamar con desglose LFT
  * Plazos importantes
- Generador PDF del expediente
- Gestión de tickets asignados
```

`src/app/api/analyze-case/route.ts`:
```typescript
// Solo accessible para rol 'asesor' o 'admin'
// Input: case_id + datos del caso
// Output: análisis completo en JSON + texto formateado
// Usa Claude con system prompt especializado para asesores (más técnico que el chatbot)
```

DoD: Asesor ve sus clientes. Análisis IA genera estrategia legal. PDF descargable.

---

### PASO 8 — Generador de PDF del Expediente
**Executor:** Codex CLI

```typescript
// src/lib/generate-expediente-pdf.ts
// Usa pdf-lib para generar PDF server-side

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

export async function generateExpedientePDF(caseData: {
  cliente: { nombre: string; rfc?: string }
  empresa: string
  salario_diario: number
  fecha_ingreso: string
  motivo: string
  calculo: ReturnType<typeof calcularLiquidacion>
  evidencias: Array<{ file_name: string; server_time: string; latitude?: number; longitude?: number }>
}): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  const page = pdf.addPage([595, 842]) // A4
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold)
  
  // Logo + header RJL
  page.drawText('RESPALDO JURÍDICO LABORAL', { x: 50, y: 800, size: 16, font: fontBold, color: rgb(0.1, 0.3, 0.6) })
  page.drawText('Expediente Laboral Confidencial', { x: 50, y: 780, size: 10, font, color: rgb(0.5, 0.5, 0.5) })
  
  // Datos del trabajador + empresa
  // Cálculo de liquidación
  // Lista de evidencias con timestamps
  // Firma del asesor (si aplica)
  
  return await pdf.save()
}

// API Route: GET /api/expediente/[caseId] → genera y descarga PDF
```

DoD: PDF del expediente descargable con todos los datos del caso + evidencias + cálculo LFT.

---

### PASO 9 — Stripe Checkout + Webhooks
**Executor:** Codex CLI

`src/app/api/checkout/route.ts`:
```typescript
import Stripe from 'stripe'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: Request) {
  const { userId } = await req.json()
  
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    currency: 'mxn',
    line_items: [{ price: process.env.STRIPE_PRICE_ID_MENSUAL!, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/cliente?subscribed=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    metadata: { userId }
  })
  
  return Response.json({ url: session.url })
}
```

`src/app/api/webhooks/stripe/route.ts`:
```typescript
// Maneja: customer.subscription.created/updated/deleted
// → UPDATE subscriptions table en Supabase
// CRÍTICO: verificar Stripe signature con constructWebhookEvent()
```

DoD: Checkout completo en test mode. Webhook actualiza `subscriptions.status = 'active'`. Cliente con suscripción activa no tiene rate limiting.

---

### PASO 10 — Tickets (Comunicación cliente-asesor)
**Executor:** Codex CLI

Sistema básico de tickets:
- `src/app/(dashboard)/cliente/tickets/page.tsx` → crear ticket + ver estado
- `src/app/(dashboard)/asesor/tickets/page.tsx` → ver todos los asignados, responder
- Notificación por email cuando el asesor responde (Supabase Edge Function → AnyMail)

DoD: Cliente crea ticket → asesor ve en su panel → asesor responde → cliente ve respuesta.

---

### PASO 11 — Admin Panel
**Executor:** Codex CLI

`src/app/(dashboard)/admin/page.tsx`:
- Lista de todos los usuarios (con roles)
- Asignar asesores a clientes
- Cambiar rol de usuario
- Ver métricas: total clientes, suscripciones activas, ingresos, tickets open
- Gestionar `system_config` (salario mínimo, precio, etc.)

DoD: Admin puede asignar asesor a caso. Métricas de negocio visibles.

---

### PASO 12 — Deploy a Vercel + Supabase Producción
**Executor:** Codex CLI + Alfonso (manual Vercel connect)

```bash
npm run build       # 0 errores
npm run type-check  # 0 type errors
```

Deploy:
```bash
APPDATA="/c/Users/shedy/.local-appdata" vercel deploy --prod
# O linkear GitHub repo → auto-deploy en push
```

Variables de entorno en Vercel Dashboard:
- Todas las de `.env.local` como Production environment variables
- `NODE_ENV=production`
- `CORS_ORIGINS=https://rjl.vercel.app` (o dominio real)

DoD: `https://rjl.vercel.app` carga. Chat funciona. Login funciona. Stripe en test mode.

---

## TIMELINE

```
Día 1:  Paso 1 (Supabase config + Stripe) + Paso 2 (API /chat)
Día 2:  Paso 3 (PublicChatView) + Paso 4 (Auth + Middleware)
Día 3:  Paso 5 (Dashboard Cliente) + Paso 6 (EvidenceVault)
Día 4:  Paso 7 (Panel Asesor) + Paso 8 (PDF)
Día 5:  Paso 9 (Stripe) + Paso 10 (Tickets)
Día 6:  Paso 11 (Admin) + Paso 12 (Deploy)
```

---

## CLAUDE.md ACTUALIZADO PARA EL BUILDER

```markdown
# CLAUDE.md — RJL Builder

## Reglas absolutas
1. ANTHROPIC_API_KEY NUNCA en cliente — solo en /api/chat (server-side)
2. SUPABASE_SERVICE_ROLE_KEY NUNCA en cliente — solo en /lib/supabase/server.ts
3. Evidencias son INMUTABLES — no agregar UPDATE policies a evidence table
4. server_time en evidencias = DEFAULT NOW() en DB — no enviar desde cliente
5. Rate limiting: anónimos = 3/día/IP, clientes sin sub = 3/día/user
6. Todos los /api/* validan con Zod ANTES de procesar
7. Stripe webhooks: SIEMPRE verificar signature con constructWebhookEvent()
8. RLS ya está en migration 001 — nunca deshabilitar

## Stack
Next.js 15 App Router | TypeScript | Supabase (DB+Auth+Storage) | Claude claude-sonnet-4-6 | Stripe | Upstash Redis

## Comandos
npm run dev → http://localhost:3000
npm run build && npm run type-check
APPDATA="/c/Users/shedy/.local-appdata" vercel deploy --prod
```

---

*Blueprint generado por The Architect — 2026-05-06*
*RJL = Asesoría jurídico-laboral MX con Claude + Supabase + Stripe*
