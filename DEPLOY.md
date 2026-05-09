# RJL — Guía de Deploy en Producción

## Infraestructura recomendada

| Capa | Servicio | Justificación |
|---|---|---|
| Frontend + API | **Vercel** (Hobby/Pro) | Next.js 15 App Router optimizado; edge network; preview deployments |
| Base de datos | **Supabase** (Pro plan) | PostgreSQL + RLS + Auth + Storage ya configurados |
| Rate limiting | **Upstash Redis** | Serverless Redis; pay-per-request; compatible con Vercel Edge |
| Pagos | **Stripe** | MXN support; checkout hosted; webhooks robustos |
| AI | **Anthropic Claude API** | Server-side only; no expuesto al cliente |

> **Alternativa VPS/Coolify:** Si prefieres deploy en VPS con Docker, ver sección Docker al final.

---

## Requisitos previos

- Node.js 22+
- Cuenta Supabase con proyecto creado
- Cuenta Stripe con producto y precio configurados
- Cuenta Upstash con base Redis creada
- API key de Anthropic Claude

---

## 1. Variables de entorno

Copia `.env.local.template` y completa **todos** los valores:

```bash
cp .env.local.template .env.local
```

### Variables obligatorias para producción

```bash
NEXT_PUBLIC_APP_URL=https://tu-dominio.com        # Sin slash final
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...                  # NUNCA exponer al cliente
ANTHROPIC_API_KEY=sk-ant-...
STRIPE_SECRET_KEY=sk_live_...                     # sk_live_ en producción
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_PRICE_ID_MONTHLY=price_...
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=...
SALARIO_MINIMO_DIA=278.80                         # Actualizar cada enero
```

---

## 2. Base de datos — Supabase

### Primera vez (setup completo)

```bash
# Instalar Supabase CLI
npm i -g supabase

# Autenticarse
supabase login

# Vincular proyecto
supabase link --project-ref TU_PROJECT_REF

# Aplicar todas las migraciones
supabase db push
```

### Migraciones incluidas

| Migración | Descripción |
|---|---|
| `001_initial.sql` | Schema completo + RLS + trigger auto-profile |
| `002_chat_messages.sql` | Historial de chat por usuario |
| `003_storage_and_subscription_hardening.sql` | Bucket evidence + storage RLS |
| `004_salario_minimo_2025.sql` | Actualización salario mínimo 2025 (DOF) |

### Crear usuario admin (post-migración)

```sql
-- Ejecutar en Supabase SQL Editor después de crear el usuario vía auth
UPDATE profiles SET role = 'admin' WHERE id = 'UUID-DEL-USUARIO-ADMIN';
```

### Stripe Customer Portal (configuración requerida)

Antes de usar el portal de gestión de suscripciones, actívalo en Stripe Dashboard:
1. Ir a **Stripe Dashboard → Billing → Customer Portal**
2. Activar "Allow customers to cancel subscriptions"
3. Activar "Allow customers to update payment methods"
4. Guardar la configuración

---

## 3. Deploy en Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy inicial (primera vez)
vercel

# Deploy a producción
vercel --prod
```

### Configurar variables en Vercel

```bash
# Opción 1: Dashboard Vercel → Settings → Environment Variables
# Opción 2: CLI
vercel env add ANTHROPIC_API_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
# ... (agregar todas las variables del .env.local.template)
```

### Webhook de Stripe en producción

1. Ir a **Stripe Dashboard → Developers → Webhooks → Add endpoint**
2. URL: `https://tu-dominio.com/api/webhooks/stripe`
3. Eventos a escuchar:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copiar el `Signing secret` → `STRIPE_WEBHOOK_SECRET`

---

## 4. Deploy alternativo con Docker (VPS/Coolify)

```dockerfile
# Dockerfile incluido en el repo (node:22-alpine)
docker build -t rjl-app .
docker run -p 3000:3000 --env-file .env.local rjl-app
```

### Con Coolify

1. Conectar repositorio Git en Coolify
2. Seleccionar **Docker** como build pack
3. Configurar variables de entorno en el panel
4. Puerto: `3000`
5. Health check: `GET /api/health`

---

## 5. Comandos de operación

```bash
npm run dev          # Desarrollo local (Turbopack)
npm run build        # Build de producción
npm run start        # Servidor producción local
npm run type-check   # TypeScript sin emitir
npm run lint         # ESLint
npm run db:migrate   # Aplicar migraciones a Supabase remoto
npm run db:reset     # Reset local (¡NO usar en prod!)
```

---

## 6. Health check

Verificar estado del sistema en producción:

```bash
curl https://tu-dominio.com/api/health
# Respuesta esperada: { "status": "ok", "env": { "supabase": true, ... } }
```

---

## 7. Checklist pre-lanzamiento

```
□ Todas las variables de entorno configuradas en prod
□ supabase db push ejecutado (4 migraciones aplicadas)
□ Usuario admin creado en Supabase Auth + role actualizado
□ Stripe Customer Portal activado en dashboard
□ Webhook de Stripe registrado con URL de producción
□ STRIPE_WEBHOOK_SECRET actualizado con el nuevo signing secret
□ NEXT_PUBLIC_APP_URL apunta al dominio real (sin trailing slash)
□ SSL activo en el dominio
□ SALARIO_MINIMO_DIA = 278.80 (o valor vigente del año)
□ Health check /api/health devuelve 200
□ Flujo completo probado: registro → caso → evidencia → chat → PDF → pago
□ Stripe test checkout probado con tarjeta 4242 4242 4242 4242
□ Panel asesor y admin probados con usuarios de sus roles
```

---

## 8. Actualización anual (cada enero)

```sql
-- Actualizar salario mínimo en system_config
UPDATE system_config SET value = 'NUEVO_VALOR', updated_at = NOW()
WHERE key = 'salario_minimo_diario';
```

Y actualizar `SALARIO_MINIMO_DIA` en las variables de entorno de Vercel.
