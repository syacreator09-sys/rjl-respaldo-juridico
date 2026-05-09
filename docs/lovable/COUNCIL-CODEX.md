# Council Adaptado para Codex

## Referencia exacta

Este protocolo ya no se define solo como "varias opiniones". A partir de ahora sigue explicitamente el patron de `llm-council` de Andrej Karpathy:

- `Stage 1`: opiniones independientes
- `Stage 2`: revision cruzada anonimizada
- `Stage 3`: sintesis final tipo chairman

Referencia local consultada:

- `D:\cano-ai-command-center\docs\CLAUDE-LLM-COUNCIL-INTEGRATION.md`
- `D:\cano-ai-command-center\docs\CLAUDE-COUNCIL-CODEX-PROMPT.md`
- `D:\cano-ai-command-center\scripts\council\README.md`

## Proposito

Este proyecto usa un council adaptado para deliberar decisiones de arquitectura visual, UX y estructura de producto antes de congelar una fase o una spec para Lovable.

No es un script externo obligatorio del repo. Es un protocolo operativo que el orquestador de Codex ejecuta usando subagentes y una sintesis final obligatoria, inspirado en la estructura de `llm-council` pero aterrizado a este entorno.

## Rol del council

- Reducir decisiones debiles en arquitectura y UX.
- Comparar alternativas reales sin frenar el avance.
- Dejar una salida auditada y reutilizable para la spec.

## Skill local del repo

El protocolo tambien existe como skill documental local en:

- [.claude/skills/codex-llm-council-rjl/SKILL.md](/C:/Users/shedy/Desktop/chatbot-juridico-ai/.claude/skills/codex-llm-council-rjl/SKILL.md)
- [COUNCIL-PHASES.md](/C:/Users/shedy/Desktop/chatbot-juridico-ai/docs/lovable/COUNCIL-PHASES.md)

## Cuando activarlo

Activarlo solo si hay trade-offs reales:

- separacion de experiencias por rol
- eleccion de bloques de 21st.dev
- absorcion o permanencia de subrutas
- jerarquia visual de una home
- densidad operativa de asesor o admin
- cambios grandes antes de congelar una fase

No activarlo para:

- microdecisiones triviales
- copy fino
- cambios obvios
- decisiones ya cerradas sin evidencia nueva

## Comandos de activacion

Comando principal:

```text
/council --preset lovable "<decision de arquitectura o UX>"
```

Otros comandos soportados por protocolo:

```text
/council "<pregunta o decision>"
/council --quick "<pregunta>"
/council --preset architecture "<pregunta>"
/council --preset ux "<pregunta>"
/council --preset lovable "<pregunta>"
/council --roles publico,cliente,asesor,admin "<pregunta>"
```

## Como interpreta Codex cada preset

- `quick`
  Revision breve con 3 voces y sintesis rapida.
- `architecture`
  Shell, navegacion, separacion de experiencias y reutilizacion de componentes.
- `ux`
  Jerarquia, friccion, narrativa, estados y densidad visual.
- `lovable`
  Decision final orientada a spec implementable en Lovable.
- `roles ...`
  Fuerza perspectivas por experiencia especifica.

## Flujo obligatorio en 3 etapas

### Stage 1 - Opiniones independientes

Lanzar 3 a 7 voces independientes. Ninguna debe ver la respuesta original de las otras.

Cada voz devuelve:

- recomendacion
- riesgos
- alternativa descartada

### Stage 2 - Revision cruzada anonimizada

El orquestador resume las propuestas del Stage 1 y las vuelve a pasar sin atribucion fuerte para que las voces:

- detecten debilidades
- marquen contradicciones
- refuercen coincidencias
- indiquen que propuesta resiste mejor la critica

### Stage 3 - Chairman

El orquestador emite la salida final. Esta etapa es obligatoria y no se salta.

## Formato obligatorio de salida

Todo council debe cerrar con:

1. `Panel convocado`
2. `Consenso`
3. `Disensos`
4. `Decision final`
5. `Impacto en la spec`

## Paneles sugeridos

### Arquitectura

- shell compartido
- publico
- cliente
- asesor
- admin
- 21st.dev
- riesgo / fases

### UX

- narrativa visual
- friccion operativa
- estados y prioridad
- lectura juridica / confianza

### Lovable

- consistencia estructural
- reusabilidad de bloques
- claridad de prompt
- ausencia de decisiones abiertas

## Regla de cierre

Si el council no cambia una decision, no se repite. Solo se vuelve a abrir con nueva evidencia o si cambia el alcance.

## Uso dentro de RJL

La adopcion oficial del council en este proyecto por fases vive en:

- [COUNCIL-PHASES.md](/C:/Users/shedy/Desktop/chatbot-juridico-ai/docs/lovable/COUNCIL-PHASES.md)
