# Arquitectura RJL

## Flujo de datos principal

```
[Browser] → [Next.js Middleware] → auth check + role check
    ↓
[Next.js Server Component] → createClient() → Supabase (RLS enforced)
    ↓
[Client Component] → fetch('/api/chat') → Next.js API Route
    ↓ (server-side only)
[API Route] → Zod validate → rate limit check → Anthropic API
    ↓
[Response] → streaming or JSON back to client
```

## Por qué server-side para Claude

El `ANTHROPIC_API_KEY` nunca llega al browser. Si hiciéramos la llamada directo desde el cliente:
- La key estaría visible en DevTools → Network
- Cualquiera podría usar la key en sus propias apps
- Sin control de rate limiting ni autenticación

Con Next.js API Routes: la key vive solo en variables de entorno del servidor.

## RLS — Por qué no solo auth.uid() en el código

Supabase RLS garantiza que incluso si hay un bug en el código que olvidara verificar permisos, la base de datos rechaza la query. Es una segunda capa de seguridad.

Ejemplo: Si un asesor intenta `supabase.from('cases').select('*')` — solo verá los casos que le están asignados, aunque no filtremos en el código.

## Evidencias — Por qué inmutables

La bóveda de evidencias sirve como prueba legal. Una vez subida, no puede modificarse. El timestamp autoritativo es `server_time` (asignado por el servidor), no `device_time` (puede manipularse). GPS provee coordenadas al momento de subir.

## Rate limiting — Freemium model

- Sin sesión: 3 preguntas/IP/24h → luego upsell a $200 MXN/mes
- Cliente suscrito: ilimitado
- Implementación: Upstash Redis sliding window. Fallback: in-memory Map.
