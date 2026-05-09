# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Proyecto

**RJL — Respaldo Jurídico Laboral** — SaaS de asesoría jurídico-laboral mexicana. Trabajadores calculan sus derechos, guardan evidencias con GPS y consultan con un asesor real.

## Comandos

```bash
npm run dev          # Next.js 15 + Turbopack → http://localhost:3000
npm run build        # Build de producción
npm run type-check   # TypeScript sin emitir (tsconfig.typecheck.json)
npm run lint         # ESLint
npm run db:migrate   # supabase db push — aplica migraciones al proyecto remoto
npm run db:reset     # supabase db reset — solo para entorno local
```

## Stack

- **Next.js 15** App Router + TypeScript + Tailwind CSS
- **Supabase** — PostgreSQL con RLS + GoTrue (auth) + Storage
- **Anthropic Claude** (`claude-sonnet-4-5-20251022`) — únicamente server-side
- **Stripe** — suscripción $200 MXN/mes; webhook en `/api/webhooks/stripe`
- **Upstash Redis** — rate limiting: 3 preguntas gratis/IP/día para usuarios `anon`

## Arquitectura

### Roles y middleware

`src/middleware.ts` pasa todas las rutas `/api/*` sin auth. La protección por rol ocurre dentro de cada route handler. Las rutas `/asesor/*` y `/admin/*` requieren sesión y consultan `profiles.role` en Supabase.

| Rol | Rutas |
|-----|-------|
| `anon` | `/`, `/login`, `/register`, `/pricing` |
| `cliente` | `/cliente/**` |
| `asesor` | `/asesor/**` |
| `admin` | `/admin/**` (todo) |

### Clientes Supabase

Hay dos clientes — nunca mezclarlos:

- `createClient()` (`src/lib/supabase/server.ts`) — SSR con cookies, respeta RLS, usa `ANON_KEY`
- `createAdminClient()` — usa `SERVICE_ROLE_KEY`, bypasea RLS; solo para webhooks de Stripe y operaciones de admin

### AI routing y tiers (`src/lib/ai/router.ts`)

`routeChat()` determina el tier según `ANTHROPIC_API_KEY` válida **y** suscripción activa:

- `free` — 800 tokens, system prompt genérico
- `premium` — 1200 tokens, system prompt con datos del caso del cliente

Los archivos `cloudflare.ts` y `nvidia-nim.ts` en `src/lib/ai/` son adaptadores alternativos no activos en producción.

### Legal knowledge retrieval (`src/lib/knowledge/legal-retrieval.ts`)

Carga `knowledge/legal_chunks.json` en memoria (singleton lazy) y hace retrieval por keywords para 4 materias: `penal`, `proceso_penal`, `familiar`, `civil`. El resultado se inyecta al system prompt en cada llamada a Claude. Si la materia no se detecta, retorna string vacío silenciosamente.

### Flujo de evidencias

`POST /api/evidence` valida con `EvidenceUploadSchema` (Zod), verifica ownership del caso via RLS, sube el archivo a Supabase Storage (`evidence/{userId}/{caseId}/{timestamp}-{filename}`) y registra en DB. `server_time` es el timestamp autoritativo — no confiar en `device_time`. La tabla `evidence` tiene RLS `FOR UPDATE USING (false)` — es inmutable.

### Generación de PDF

`src/lib/generate-expediente-pdf.ts` genera PDFs con PDF 1.4 puro (sin librerías externas). Toma `ExpedienteData` → calcula liquidación con `calculadora-lft.ts` → produce `Uint8Array`. Servido en `GET /api/expediente/[caseId]`.

### Tipos de base de datos

`src/lib/supabase/types.ts` contiene los tipos TypeScript escritos a mano (no generados por Supabase CLI). Cuando se añaden tablas o columnas, actualizar este archivo manualmente.

## Variables de entorno requeridas

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY      # solo server — admin client
ANTHROPIC_API_KEY              # solo server — si empieza con "PENDIENTE" se ignora
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_ID_MONTHLY
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
```

## Reglas de seguridad críticas

1. `ANTHROPIC_API_KEY` y `SUPABASE_SERVICE_ROLE_KEY` — nunca en Client Components
2. `src/lib/anthropic.ts` y `src/lib/supabase/server.ts` — server-only
3. Todo endpoint `/api/*` valida con Zod antes de procesar
4. El webhook de Stripe (`/api/webhooks/stripe`) verifica firma con `stripe.webhooks.constructEvent` antes de cualquier operación
5. El checkout de Stripe pasa `supabase_user_id` en `metadata` para que el webhook pueda hacer el upsert de suscripción

## Migraciones

Las migraciones están en `supabase/migrations/`. La migración `001_initial.sql` define todas las tablas y políticas RLS. Usar `npm run db:migrate` para aplicar al proyecto remoto Supabase.
