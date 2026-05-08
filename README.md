# RJL - Respaldo Juridico Laboral

Aplicacion web de asesoria juridico-laboral mexicana construida con Next.js 15, Supabase, Anthropic, Stripe y Upstash.

## Estado actual

El proyecto ya corre como plataforma web con:

- landing publica con chat gratis
- registro e inicio de sesion
- dashboard de cliente
- expediente laboral
- boveda de evidencias
- tickets cliente <-> asesor
- panel asesor
- panel admin
- checkout premium con Stripe

Checks tecnicos actuales:

- `npm run type-check` -> OK
- `npm run build` -> OK

## Stack

- Next.js 15 App Router + TypeScript
- Supabase: Auth + Postgres + Storage
- Anthropic Claude server-side
- Stripe subscriptions
- Upstash Redis para rate limit

## Variables de entorno

Copiar `.env.local.template` a `.env.local` y completar:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_ID_MONTHLY`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

## Base de datos

Aplicar en orden:

1. `supabase/migrations/001_initial.sql`
2. `supabase/migrations/002_chat_messages.sql`
3. `supabase/migrations/003_storage_and_subscription_hardening.sql`

La migration `003` deja el bucket `evidence` y sus policies en estado reproducible.

## Scripts

```bash
npm install
npm run type-check
npm run build
npm run dev
```

Scripts adicionales:

- `npm run db:migrate`
- `npm run db:reset`

## Flujos principales

### Cliente

- `/register`
- `/login`
- `/cliente`
- `/cliente/caso`
- `/cliente/chat`
- `/cliente/evidencias`
- `/cliente/tickets`
- `/cliente/tickets/new`
- `/pricing`

### Asesor

- `/asesor`
- `/asesor/tickets`

### Admin

- `/admin`
- `/admin/usuarios`
- `/admin/asignar`
- `/admin/tickets`
- `/admin/config`

## Reglas operativas actuales

- `subscriptions.status` es la unica fuente de verdad del plan premium
- `chat_messages` guarda historial autenticado
- `case_data` usa nombres reales del schema como `salary_daily` y `start_date`
- la app trabaja con un caso activo por cliente

## Validacion recomendada

Consulta [docs/VALIDACION-FINAL.md](/C:/Users/shedy/Desktop/chatbot-juridico-ai/docs/VALIDACION-FINAL.md) para el checklist completo de QA, deploy y smoke test.
