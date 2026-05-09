# Fases para usar `llm-council` como skill de Codex en RJL

## Resumen

En este proyecto, el council no se implementa como feature del producto ni como script que corre dentro de la app. Se usa como skill operativo de Codex para analizar el proyecto, revisar arquitectura, tomar decisiones de UX/UI y congelar la spec para Lovable con mas rigor.

Implementacion objetivo:

- Codex actua como orquestador
- el council se invoca con `/council ...`
- se usa para decisiones de arquitectura, UX y estructura
- sigue el patron `llm-council`:
  - `Stage 1`: opiniones independientes
  - `Stage 2`: review cruzada anonimizada
  - `Stage 3`: chairman / sintesis final
- su salida modifica o confirma la spec del proyecto, no la app en tiempo de ejecucion

## Fase 0. Base del council en RJL

### Estado esperado

El repo debe tener y reconocer como fuente oficial:

- skill local del proyecto para council
- manual de uso del council
- comando de activacion estandar
- relacion explicita con `llm-council` de Karpathy

### Entregables

- skill documental local del repo
- guia de protocolo del council
- comando principal:
  - `/council --preset lovable "<decision de arquitectura o UX>"`

### Criterio de cierre

- cualquier colaborador entiende que el council es una herramienta de analisis de Codex, no una feature de la app
- el proyecto ya tiene una forma estandar de convocarlo

## Fase 1. Encaje del council en el flujo del proyecto

### Objetivo

Definir exactamente en que momentos del proyecto Codex debe usar council.

### Decisiones a fijar

Usar council solo para decisiones con trade-offs reales:

- separacion por rol
- shell compartido
- eleccion de bloques de 21st.dev
- absorcion o permanencia de subrutas
- jerarquia de cada home
- densidad operativa de `Asesor` y `Admin`
- cierre de una fase de spec para Lovable

No usar council para:

- copy menor
- retoques visuales obvios
- decisiones ya cerradas
- tareas de ejecucion sin incertidumbre

### Entregables

- matriz de uso del council dentro del proyecto
- presets definidos:
  - `architecture`
  - `ux`
  - `lovable`
  - `quick`

### Criterio de cierre

- queda claro cuando convocar council y cuando no
- el siguiente implementador no improvisa el uso

## Fase 2. Council para arquitectura madre

### Objetivo

Usar council para cerrar la arquitectura general de RJL antes de tocar detalle visual fino.

### Preguntas que debe resolver

- Es correcto separar `Publico`, `Cliente`, `Asesor` y `Admin` como experiencias distintas?
- Que se comparte realmente entre ellas?
- Que debe vivir en el shell y que no?
- Que primitives deben ser comunes?

### Modo de ejecucion

- `Stage 1`: voces para shell, publico, cliente, asesor, admin, 21st.dev y riesgo
- `Stage 2`: revision cruzada de propuestas
- `Stage 3`: chairman con decision final

### Entregables

- contrato de shell compartido
- lista de primitives compartidas
- limites claros de reutilizacion

### Criterio de cierre

- ya no queda ambiguedad entre dashboard unico y experiencias separadas

## Fase 3. Council para UX/UI por experiencia

### Objetivo

Aplicar council a cada experiencia para congelar su anatomia final.

### Subfases

- `3A. Publico`
- `3B. Cliente`
- `3C. Asesor`
- `3D. Admin`

### Preguntas por experiencia

#### Publico

- como hacer que el chat sea protagonista
- cuanto hero dejar
- donde vive el disclaimer
- como evitar look de landing generica

#### Cliente

- que subrutas se absorben
- como convertir `/cliente` en expediente vivo
- orden y peso de perfil, datos, evidencias, consultas y chat

#### Asesor

- como estructurar bandeja, clientes, proyeccion, IA y PDF
- como se representa prioridad
- que tan unificada debe ser la pantalla

#### Admin

- como jerarquizar negocio, operacion y capacidad
- como evitar que se sienta como CRUD
- como disenar asignaciones y configuracion como backoffice real

### Entregables

- decision cerrada por experiencia
- anatomia de pantalla por rol
- estados y CTAs minimos

### Criterio de cierre

- cada experiencia queda definida con suficiente claridad para llevarla a Lovable sin reinterpretar intencion

## Fase 4. Council para seleccion de 21st.dev

### Objetivo

Usar council para validar que componentes de 21st.dev si sirven y cuales deben excluirse.

### Preguntas que debe resolver

- que categorias usar por rol
- que categorias evitar por exceso de marketing
- que componentes sirven como primitives base
- que componentes solo inspiran pero no se copian

### Entregables

- matriz de seleccion por rol
- reglas de aceptacion y descarte
- restricciones visuales para mantener lenguaje RJL

### Criterio de cierre

- el uso de 21st.dev queda controlado y no contamina el producto con estetica ajena

## Fase 5. Council para congelar la spec de Lovable

### Objetivo

Usar el council como ultima capa de validacion antes de declarar la spec lista para implementar.

### Preguntas que debe resolver

- queda alguna decision abierta?
- la spec deja huecos en navegacion, bloques o estados?
- hay contradicciones entre experiencias?
- el prompt maestro realmente refleja la arquitectura cerrada?

### Entregables

- validacion final tipo chairman
- lista de decisiones confirmadas
- lista de riesgos residuales si los hay
- version final de la spec para Lovable

### Criterio de cierre

- el implementador ya no necesita decidir arquitectura ni UX principal
- la spec se vuelve fuente unica de verdad

## Fase 6. Uso continuo del council durante ejecucion

### Objetivo

Definir como seguira usandose el skill una vez iniciada la implementacion real.

### Reglas operativas

Usar council cuando:

- aparezca una decision nueva con trade-offs reales
- haya contradiccion entre referencia visual y factibilidad
- haya que cambiar estructura de una experiencia
- Lovable produzca una solucion aceptable visualmente pero debil en UX

No usar council cuando:

- solo haga falta corregir detalle menor
- la decision ya fue congelada y no hay nueva evidencia
- el problema sea puramente tecnico de implementacion

### Entregables

- regla de reentrada del council
- criterio de reapertura de decisiones

### Criterio de cierre

- el council queda integrado al proceso del proyecto, no solo a su arranque

## Cambios o interfaces importantes

### Comando operativo

El comando oficial del proyecto para invocar el skill queda asi:

```text
/council --preset lovable "<decision de arquitectura o UX>"
```

### Variantes validas

```text
/council --preset architecture "<decision>"
/council --preset ux "<decision>"
/council --quick "<decision>"
/council --roles publico,cliente,asesor,admin "<decision>"
```

### Salida obligatoria del council

Toda invocacion debe terminar con:

1. `Panel convocado`
2. `Consenso`
3. `Disensos`
4. `Decision final`
5. `Impacto en la spec`

## Test plan

- Probar una invocacion `architecture` sobre shell compartido y verificar que produce las 3 etapas.
- Probar una invocacion `ux` sobre la home de Cliente y verificar que cierra absorcion de subrutas.
- Probar una invocacion `lovable` sobre seleccion de bloques 21st.dev y verificar que la salida ya sirve para actualizar la spec.
- Verificar que el council no se invoque para decisiones triviales en el flujo normal.
- Verificar que una decision cerrada por council no se reabra sin nueva evidencia.

## Supuestos y defaults

- El council se usa como skill de Codex, no como modulo del producto.
- El patron exacto a seguir es el de `llm-council`: opiniones, review cruzada, chairman.
- El foco principal del council en RJL sera analizar proyecto, arquitectura y UX/UI.
- El destino de sus conclusiones es la spec de Lovable y las decisiones de diseno del proyecto.
- La app final no necesita exponer `/council` al usuario final; es una herramienta interna de diseno y planificacion.
