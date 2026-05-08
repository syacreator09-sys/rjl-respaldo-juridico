---
name: juridico-bot-conversation-protocol
description: Protocolo de conversación para chatbot Jurídico AI (LUZYA Tech vertical legal). Cómo responde el bot, escalación a abogado humano, manejo de PII, citas legales, disclaimers. Activar al tocar 03-projects/chatbot-juridico-ai o al editar prompts del bot Jurídico.
---

# juridico-bot-conversation-protocol

## Stack

- Python: `agents-platform/agents/juridico/` (Modal apps)
- RAG: Supabase ORION pgvector (knowledge legal base)
- LLM: Cloudflare Workers AI Llama 3.1 8B (free)
- Embeddings: BGE 768d via Cloudflare AI
- Channels: Chatwoot (WhatsApp), Telegram bot, Retell voice
- PowerShell scripts: `03-projects/chatbot-juridico-ai/scripts/*.ps1`

## Reglas críticas — NUNCA romper

1. **NUNCA dar consejo legal definitivo.** El bot ORIENTA, no DICTAMINA.
2. **SIEMPRE incluir disclaimer** en respuestas legales:
   "Esto es información orientativa, no consejo legal personalizado. Para tu caso específico consulta a un abogado."
3. **SIEMPRE escalar a humano** si keyword urgente:
   - "embargo", "detención", "amparo urgente", "audiencia mañana"
   - "violencia", "agresión", "amenaza"
   - "cárcel", "preso", "fianza"
   - 10 keywords totales en `juridico_agent.py::_should_escalate()`
4. **NUNCA logear PII identificable** (nombre cliente, RFC, número expediente, dirección).
5. **NUNCA citar leyes específicas sin verificar** en RAG (riesgo: ley derogada o incorrecta).

## Estructura de respuesta correcta

```
1. Reconocimiento empático (1 línea)
   "Entiendo tu situación con [tema general sin PII]."

2. Información orientativa (2-4 líneas)
   "En México, [marco legal aplicable]. Lo común en estos casos es [proceso]."

3. Disclaimer obligatorio
   "Esto es info orientativa, no consejo personalizado."

4. Próximo paso accionable
   "Te recomiendo: [agendar consulta abogado / juntar documentos / etc.]"

5. CTA escalación si aplica
   "¿Quieres que te conecte con abogado humano?"
```

## Flujo de escalación

```
Mensaje cliente
   ↓
juridico_agent.answer()
   ├─→ supabase_rag.search() (pgvector cosine similarity)
   ├─→ CF Llama con context legal
   └─→ _should_escalate() check keywords
       │
       ├─→ ESCALAR: respuesta breve + "Conecto con abogado, espera..."
       │            + flag en Chatwoot para asignación humana
       │
       └─→ Bot responde con estructura arriba
```

## Keywords escalación obligatoria (10)

Detectar en mensaje del cliente cualquiera de:
1. "urgente"
2. "audiencia"
3. "embargo"
4. "detención" / "detenido" / "arresto"
5. "amparo"
6. "violencia" / "agresión" / "amenaza"
7. "cárcel" / "preso" / "encarcelado"
8. "fianza"
9. "menor de edad"
10. "víctima"

Cualquier match → escalar inmediatamente, no procesar con LLM.

## Manejo de PII

- ❌ NO loggear nombre completo del cliente.
- ❌ NO loggear RFC, CURP, número de expediente, NSS.
- ❌ NO loggear dirección, teléfono personal, email personal.
- ❌ NO compartir info de un cliente con otro.
- ✅ SÍ loggear timestamp + tipo de consulta (anonimizado).
- ✅ SÉ loggear en Redis con `juridico:{session_id}` (UUID, no PII).

## Áreas legales cubiertas (verificar RAG)

- Derecho civil (contratos, divorcio, herencia)
- Derecho laboral (despidos, finiquitos, IMSS)
- Derecho mercantil (sociedades, comercio)
- Derecho penal básico (querellas, procesos)
- Derecho administrativo (multas, gobierno)

**NO cubierto** (escalar siempre):
- Derecho fiscal complejo (CFF, ISR específicos)
- Inmigración
- Penal grave
- Familiar con menores

## Disclaimers obligatorios por canal

- WhatsApp / Chatwoot: incluir en cada respuesta de tema legal.
- Telegram: footer del bot configurado.
- Retell voice: el agente lo dice al inicio: "Esta llamada da info orientativa, no consejo legal."

## Anti-patrones — NUNCA HACER

- ❌ Dar números específicos sin verificar RAG ("la multa es de $X").
- ❌ Decir "tu caso ganarás" o "perderás" — bot no diagnostica.
- ❌ Recomendar abogado específico sin lista verificada.
- ❌ Compartir "casos similares" con detalles que identifiquen otros clientes.
- ❌ Procesar mensaje con keyword urgente sin escalar primero.
- ❌ Mandar respuesta sin disclaimer.

## Testing del bot

Siempre en inbox de prueba antes de productivo:
- Test consulta general (orientación correcta)
- Test keyword urgente (escalación inmediata)
- Test PII (NO loggear)
- Test fuera de área (escalación correcta)

## Modal apps deployadas

- `agents/juridico/modal_app.py` — webhook Chatwoot/Telegram/direct
- `agents/juridico/voice_modal_app.py` — Retell custom LLM
- `agents/juridico/telegram_modal_app.py` — Telegram dedicado

Activar skill `modal-deploy-checklist` antes de re-deploy.

## Cuándo activar este skill

- Editar `agents-platform/agents/juridico/*.py` o `prompts.py`.
- Trabajar en `03-projects/chatbot-juridico-ai/`.
- Diseñar nueva conversación / nuevo flujo legal.
- Reportar bug de bot Jurídico.
- Onboarding cliente vertical legal.

## Cuándo NO usar

- Bot LUZYA general (no jurídico) → otro flow.
- Otros verticales B2B → industry-adapter-agent.
- Marketing legal → `cano-brand-style` o copy genérico.
