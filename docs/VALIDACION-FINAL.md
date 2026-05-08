# Validacion Final RJL

Checklist de cierre operativo para ejecutar sobre entorno real.

## 1. Baseline tecnico

- `npm run type-check`
- `npm run build`
- `npm run dev` arranca sin errores fatales

## 2. Setup de infraestructura

- `.env.local` completo
- migrations aplicadas:
  - `001_initial.sql`
  - `002_chat_messages.sql`
  - `003_storage_and_subscription_hardening.sql`
- bucket `evidence` visible en Supabase
- webhook Stripe configurado

## 3. Cliente nuevo

- entrar a `/register`
- crear cuenta
- confirmar que existe fila en `profiles`
- login en `/login`
- redirect correcto a `/cliente`

## 4. Expediente del cliente

- entrar a `/cliente/caso`
- crear expediente
- volver a `/cliente`
- confirmar que:
  - no se crean multiples casos activos
  - `case_data` se guarda correctamente

## 5. Tickets

- crear ticket en `/cliente/tickets/new`
- verlo listado en `/cliente/tickets`
- responderlo desde `/asesor/tickets`
- confirmar que el cliente ve la respuesta

## 6. Chat

### Publico

- usar chat en `/`
- verificar rate limit gratis

### Cliente autenticado

- usar `/cliente/chat`
- confirmar que guarda historial en `chat_messages`
- confirmar que el contrato del endpoint `/api/chat` responde bien

## 7. Premium y Stripe

- entrar a `/pricing`
- iniciar checkout autenticado
- completar pago de prueba
- confirmar:
  - fila correcta en `subscriptions`
  - `status` correcto
  - gating premium activo en dashboard y chat

## 8. Evidencias

- entrar a `/cliente/evidencias`
- subir archivo valido
- verificar:
  - objeto en bucket `evidence`
  - fila en tabla `evidence`
  - si hay fallo de DB no quedan huérfanos

## 9. Expediente

- descargar desde `/api/expediente/[caseId]`
- confirmar que usa identidad del cliente dueño del caso
- repetir prueba con asesor/admin

## 10. Roles internos

### Asesor

- entra a `/asesor`
- ve casos asignados
- entra a `/asesor/tickets`

### Admin

- entra a `/admin`
- prueba:
  - `/admin/usuarios`
  - `/admin/asignar`
  - `/admin/tickets`
  - `/admin/config`

## 11. Seguridad

- sin sesion no se entra a rutas privadas
- cliente no entra a rutas de admin
- cliente no entra a rutas de asesor
- policies de Storage respetan cliente/asesor/admin

## 12. Criterio de cierre

Se considera listo para validacion de deploy cuando:

- build y type-check pasan
- cliente opera expediente, chat, tickets y evidencias
- Stripe activa premium real
- admin y asesor operan sin rutas muertas
- expediente y permisos son correctos
