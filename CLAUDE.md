# ⚡ INSTRUCCIÓN DE ARRANQUE
**Lee `RJL-BLUEPRINT-CONSTRUCCION.md` en esta misma carpeta.**
Ejecuta cada PASO en orden. Cierra el DoD de cada paso antes de avanzar. No hagas todo de golpe.

---

# CLAUDE.md — chatbot-juridico-rjl

## Proyecto
**RJL — Respaldo Jurídico Laboral**
SaaS de asesoría jurídico-laboral mexicana. Trabajadores pueden calcular sus derechos, guardar evidencias con GPS, y consultar con un asesor real.

## Stack
- **Frontend + Backend:** Next.js 15 App Router + TypeScript
- **DB + Auth + Storage:** Supabase (PostgreSQL + RLS + GoTrue + Storage)
- **AI:** Anthropic Claude (`claude-sonnet-4-5-20251022`) — SERVER-SIDE ONLY
- **Payments:** Stripe (MXN support, $200/mes suscripción)
- **Rate limiting:** Upstash Redis (freemium: 3 preguntas gratis/IP/día)
- **Styles:** Tailwind CSS + Google Fonts (Cormorant Garamond + Outfit)

## Roles y permisos
| Rol | Acceso |
|-----|--------|
| `anon` | Chatbot público (3 preguntas), landing |
| `cliente` | Perfil, datos laborales, bóveda evidencias, tickets, chat ilimitado |
| `asesor` | Panel clientes asignados, tickets, proyección, análisis IA, PDF |
| `admin` | Todo + gestión usuarios, configuración sistema |

## Reglas críticas de seguridad
1. `ANTHROPIC_API_KEY` **NUNCA** en cliente — solo en `src/lib/anthropic.ts` (server-only)
2. `SUPABASE_SERVICE_ROLE_KEY` **NUNCA** en cliente — solo en `src/lib/supabase/server.ts` (createAdminClient)
3. Todos los endpoints `/api/*` validan con Zod antes de procesar
4. Rate limiting via Upstash Redis en `/api/chat` para usuarios anónimos
5. Evidence es **inmutable** — RLS policy `FOR UPDATE USING (false)`
6. `server_time` en evidencias es el timestamp autoritativo (no confiar en el cliente)

## Estructura de carpetas
```
src/
├── app/
│   ├── api/chat/route.ts          ← Proxy seguro a Claude
│   ├── api/analyze-case/route.ts  ← Análisis IA para asesores
│   ├── api/webhooks/stripe/       ← Webhooks de pago
│   ├── (auth)/login/              ← Login/Register
│   ├── (dashboard)/cliente/       ← Panel cliente
│   ├── (dashboard)/asesor/        ← Panel asesor
│   ├── (dashboard)/admin/         ← Panel admin
│   └── page.tsx                   ← Landing + chatbot público
├── components/
│   ├── chat/                      ← PublicChatView, ClientChatView
│   ├── evidence/                  ← EvidenceVault, EvidenceUpload
│   ├── tickets/                   ← TicketList, TicketDetail
│   └── ui/                        ← Shared UI components
├── lib/
│   ├── anthropic.ts               ← Claude client (server-only)
│   ├── supabase/client.ts         ← Browser Supabase client
│   ├── supabase/server.ts         ← Server Supabase + admin client
│   ├── supabase/types.ts          ← Database TypeScript types
│   ├── rate-limit.ts              ← Upstash rate limiting
│   └── validations/               ← Zod schemas
├── middleware.ts                  ← Auth + role protection
supabase/
└── migrations/001_initial.sql    ← All tables + RLS policies
```

## Cómo iniciar
```bash
cd C:/Users/shedy/Desktop/chatbot-juridico-rjl
cp .env.local.template .env.local
# Llenar .env.local con credenciales reales

npm install
npm run dev         # → http://localhost:3000
```

## Comandos útiles
```bash
npm run dev              # Desarrollo local
npm run build            # Build producción
npm run type-check       # TypeScript check
supabase start           # Local Supabase (requiere Docker)
supabase db push         # Aplicar migraciones
```

## Pendientes para completar MVP
- [ ] Componente `PublicChatView` con streaming
- [ ] Formulario de auth (Supabase)
- [ ] Componente `EvidenceVault` con upload + GPS
- [ ] Dashboard cliente completo
- [ ] Panel asesor con proyección LFT
- [ ] Generador PDF del expediente
- [ ] Integración Stripe checkout
- [ ] Deploy a Vercel + Supabase
