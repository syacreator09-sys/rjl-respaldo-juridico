# RJL — Security Policy

## Principios de seguridad

### Secrets
- `ANTHROPIC_API_KEY` y `SUPABASE_SERVICE_ROLE_KEY` son **exclusivamente server-side**
- Ninguna clave de API se expone al browser ni aparece en el bundle de cliente
- Variables `NEXT_PUBLIC_*` son visibles al cliente — solo datos no sensibles

### Autenticación
- Supabase GoTrue maneja auth; tokens JWT validados server-side en cada request
- `middleware.ts` protege todas las rutas `/asesor/*` y `/admin/*`
- Cada API route valida con `supabase.auth.getUser()` antes de procesar

### Autorización
- Row Level Security (RLS) habilitado en **todas** las tablas
- `get_my_role()` helper function ejecuta en PostgreSQL (no en aplicación)
- `createAdminClient()` (service role) solo en webhooks de Stripe y `GET /api/expediente`

### Datos
- Evidencias son inmutables: `FOR UPDATE USING (false)` en RLS
- `server_time` es timestamp autoritativo (no se confía en el cliente)
- Inputs validados con Zod en todos los endpoints antes de procesamiento

### Rate limiting
- Chat público: 3 preguntas/IP/día via Upstash Redis (sliding window)
- Fallback in-memory si Redis no está disponible
- IP extraída de `x-vercel-forwarded-for` (no manipulable por el cliente en Vercel)

### Pagos
- Stripe webhook valida firma con `constructEvent()` antes de cualquier operación
- `supabase_user_id` viaja en metadata del checkout para correlación segura
- `createAdminClient()` maneja el upsert de suscripciones (bypasa RLS)

### Headers de seguridad (next.config.js)
- `Strict-Transport-Security` con preload
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `Content-Security-Policy` con fuentes explícitas
- `Permissions-Policy` que permite geolocation solo al mismo origen
- CORS restringido al dominio de la app (`NEXT_PUBLIC_APP_URL`)

### Storage
- Bucket `evidence` privado (public: false)
- RLS en `storage.objects` verifica ownership del caso antes de upload/download
- Archivos organizados como `{user_id}/{case_id}/{timestamp}-{filename}`

---

## Vulnerabilidades conocidas / pendientes

| Severidad | Descripción | Estado |
|---|---|---|
| MEDIO | Tipos de Supabase escritos a mano — pueden desincronizarse | PENDIENTE: regenerar con CLI |
| BAJO | Tabla `messages` huérfana (reemplazada por `chat_messages`) | PENDIENTE: migration DROP |
| BAJO | Providers AI inactivos (cloudflare.ts, nvidia-nim.ts) | PENDIENTE: archivar |

---

## Reporte de vulnerabilidades

Si encuentras una vulnerabilidad de seguridad:
1. **NO abrir un issue público**
2. Enviar email a: security@rjl.mx (configurar este alias)
3. Incluir: descripción, pasos para reproducir, impacto potencial
4. Tiempo de respuesta esperado: 48 horas hábiles

---

## Checklist de seguridad para cada deploy

```
□ Sin secretos hardcodeados en el código
□ .env.local en .gitignore (nunca commiteado)
□ Variables de producción usan valores live (sk_live_, pk_live_)
□ STRIPE_WEBHOOK_SECRET actualizado con el endpoint de producción
□ supabase db push ejecutado (migraciones y RLS actualizados)
□ Storage bucket evidence existe con RLS activo
□ Rate limiting funciona (probar con 4+ requests desde misma IP)
```
