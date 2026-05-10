# START - RJL Respaldo Juridico Laboral

## Contexto

SaaS de asesoria juridico-laboral mexicana.
Modelo freemium:

- gratis: chat publico limitado
- premium: $200 MXN/mes

## Stack

- Next.js 15 App Router + TypeScript
- Supabase Auth + DB + Storage
- Anthropic Claude server-side
- Stripe subscriptions
- Upstash Redis

## Estado actual

Ya implementado:

- auth y perfiles
- dashboard cliente
- expediente laboral
- chat cliente y publico
- evidencias
- tickets
- panel asesor
- panel admin
- checkout premium
- webhook Stripe
- expediente descargable
- bucket/policies de evidencias via migration

Checks actuales:

- `npm run type-check` OK
- `npm run build` OK

## Pasos de arranque

1. Crear `.env.local` desde `.env.local.template`
2. Configurar Supabase, Anthropic, Stripe y Upstash
3. Aplicar migrations en orden:
   - `001_initial.sql`
   - `002_chat_messages.sql`
   - `003_storage_and_subscription_hardening.sql`
   - `004_salario_minimo_2025.sql` — actualiza salario mínimo a $278.80 MXN (reforma DOF 2024)
4. Instalar dependencias:

```bash
npm install
```

5. Verificar:

```bash
npm run type-check
npm run build
```

6. Levantar desarrollo:

```bash
npm run dev
```

## Done tecnico local

El repo queda listo cuando:

- compila
- las rutas principales existen
- las migrations estan aplicadas
- se puede ejecutar el smoke test de [docs/VALIDACION-FINAL.md](/C:/Users/shedy/Desktop/chatbot-juridico-ai/docs/VALIDACION-FINAL.md)

## Pendiente fuera del repo

La validacion final depende de probar:

- login y registro con Supabase real
- checkout y webhook Stripe real
- Storage real para evidencias
- acceso por rol con usuarios reales

## Paquete Lovable

La implementacion del rediseño objetivo para Lovable vive en:

- [docs/lovable/README.md](/C:/Users/shedy/Desktop/chatbot-juridico-ai/docs/lovable/README.md)
- [docs/lovable/RJL-LOVABLE-SPEC.md](/C:/Users/shedy/Desktop/chatbot-juridico-ai/docs/lovable/RJL-LOVABLE-SPEC.md)
- [docs/lovable/21ST-MATRIX.md](/C:/Users/shedy/Desktop/chatbot-juridico-ai/docs/lovable/21ST-MATRIX.md)
- [docs/lovable/COUNCIL-CODEX.md](/C:/Users/shedy/Desktop/chatbot-juridico-ai/docs/lovable/COUNCIL-CODEX.md)
- [docs/lovable/PROMPT-MAESTRO-LOVABLE.md](/C:/Users/shedy/Desktop/chatbot-juridico-ai/docs/lovable/PROMPT-MAESTRO-LOVABLE.md)
- [.claude/skills/codex-llm-council-rjl/SKILL.md](/C:/Users/shedy/Desktop/chatbot-juridico-ai/.claude/skills/codex-llm-council-rjl/SKILL.md)

Comando operativo para consejo interno:

```text
/council --preset lovable "<decision de arquitectura o UX>"
```
