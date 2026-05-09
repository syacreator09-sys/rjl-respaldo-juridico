---
name: codex-llm-council-rjl
description: Adaptacion local del patron de karpathy/llm-council para RJL. Usar cuando una decision de arquitectura, UX o spec para Lovable tenga trade-offs reales y se beneficie de deliberacion multiagente en 3 etapas.
---

# codex-llm-council-rjl

## Referencia

Basado en el patron de `llm-council` de Andrej Karpathy:
- varias opiniones independientes
- revision cruzada anonimizada
- una sintesis final tipo chairman

En este repo no depende de OpenRouter ni del CLI upstream. Se ejecuta como protocolo de Codex usando subagentes y una sintesis final del orquestador.

## Fases oficiales en RJL

La adopcion de este skill dentro del proyecto esta desglosada en:

- [docs/lovable/COUNCIL-PHASES.md](/C:/Users/shedy/Desktop/chatbot-juridico-ai/docs/lovable/COUNCIL-PHASES.md)

Ese documento define:

- cuando entra el council en el flujo
- que preguntas debe resolver por fase
- que entregables produce
- como se decide su reentrada en fases posteriores

## Cuando usar

Usar solo si la decision tiene trade-offs reales:

- separacion de experiencias por rol
- shell compartido vs bloques separados
- eleccion de componentes base de 21st.dev
- absorcion o permanencia de subrutas
- jerarquia visual de Publico, Cliente, Asesor o Admin
- cierre de una fase de la spec para Lovable

No usar para:

- copy fino
- cambios obvios
- microdecisiones
- decisiones cerradas sin evidencia nueva

## Comando de activacion

Comando recomendado:

```text
/council --preset lovable "<decision de arquitectura o UX>"
```

Comandos aceptados por protocolo:

```text
/council "<pregunta>"
/council --quick "<pregunta>"
/council --preset architecture "<pregunta>"
/council --preset ux "<pregunta>"
/council --preset lovable "<pregunta>"
/council --roles publico,cliente,asesor,admin "<pregunta>"
```

## Flujo en 3 etapas

### Stage 1 - Opiniones independientes

Lanzar 3 a 7 voces independientes. Cada una responde sin ver la salida de las otras.

Panel sugerido para RJL:

- shell compartido
- publico
- cliente
- asesor
- admin
- 21st.dev
- riesgo y fases

Salida esperada de cada voz:

- recomendacion
- riesgos
- alternativa descartada

### Stage 2 - Review cruzada anonimizada

El orquestador resume las propuestas del Stage 1 y las vuelve a pasar sin atribucion fuerte para que las voces:

- detecten debilidades
- marquen contradicciones
- refuercen coincidencias
- indiquen que propuesta resistio mejor la critica

Objetivo:

- eliminar ideas debiles por confrontacion
- elevar consenso real

### Stage 3 - Chairman

El orquestador entrega una sintesis final obligatoria con:

1. `Panel convocado`
2. `Consenso`
3. `Disensos`
4. `Decision final`
5. `Impacto en la spec`

Si la decision se adopta, ya no se reabre sin evidencia nueva.

## Presets

### architecture

Usar para:
- shell
- navegacion
- separacion por rol
- reusabilidad de primitives

### ux

Usar para:
- jerarquia
- friccion
- densidad visual
- narrativa del caso

### lovable

Usar para:
- convertir una decision en contrato implementable
- cerrar bloques, estados, CTAs y datos minimos

### quick

Usar para:
- validacion rapida de decisiones medianas
- 3 voces maximo

## Regla de cierre

El council no reemplaza la decision del orquestador. Sirve para fortalecerla.

Si no cambia la conclusion, no repetir.
