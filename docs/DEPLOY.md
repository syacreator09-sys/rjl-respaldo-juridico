# Deploy RJL

## 1. Variables de entorno

Configurar en local y en hosting:

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

## 2. Supabase

Aplicar migrations en este orden:

1. `001_initial.sql`
2. `002_chat_messages.sql`
3. `003_storage_and_subscription_hardening.sql`

Verificar despues:

- tablas creadas
- enums correctos
- trigger de `profiles`
- bucket `evidence`
- policies de `storage.objects`

## 3. Stripe

1. Crear el precio mensual y guardar el id en `STRIPE_PRICE_ID_MONTHLY`
2. Configurar webhook para:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
3. Guardar el secret en `STRIPE_WEBHOOK_SECRET`

La integracion actual usa `supabase_user_id` como metadata consistente entre checkout y webhook.

## 4. Upstash

Crear la base Redis y guardar:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

## 5. Build de verificacion

Ejecutar antes de desplegar:

```bash
npm install
npm run type-check
npm run build
```

## 6. Admin inicial

1. Crear usuario normal desde la app
2. Elevar su rol en SQL:

```sql
UPDATE profiles
SET role = 'admin'
WHERE id = 'tu-uuid';
```

## 7. Smoke test post deploy

Usar el checklist de [VALIDACION-FINAL.md](/C:/Users/shedy/Desktop/chatbot-juridico-ai/docs/VALIDACION-FINAL.md).
