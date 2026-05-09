# RJL Lovable Spec

## Objetivo

Construir en Lovable una version redisenada de RJL como un producto unico con cuatro experiencias separadas:

- `Publico`
- `Cliente`
- `Asesor`
- `Admin`

La fuente de verdad visual son:

- [rjl_publico.png](/C:/Users/shedy/Desktop/chatbot-juridico-ai/rjl_publico.png)
- [rjl_cliente.png](/C:/Users/shedy/Desktop/chatbot-juridico-ai/rjl_cliente.png)
- [rjl_asesor.png](/C:/Users/shedy/Desktop/chatbot-juridico-ai/rjl_asesor.png)
- [rjl_admin.png](/C:/Users/shedy/Desktop/chatbot-juridico-ai/rjl_admin.png)

La implementacion actual del repo sirve como inventario funcional, no como contrato final de UX.

## Deliberacion obligatoria

Antes de congelar decisiones de arquitectura, UX o cierre de fase, usar el council adaptado del proyecto:

- [COUNCIL-CODEX.md](/C:/Users/shedy/Desktop/chatbot-juridico-ai/docs/lovable/COUNCIL-CODEX.md)
- [COUNCIL-PHASES.md](/C:/Users/shedy/Desktop/chatbot-juridico-ai/docs/lovable/COUNCIL-PHASES.md)
- [.claude/skills/codex-llm-council-rjl/SKILL.md](/C:/Users/shedy/Desktop/chatbot-juridico-ai/.claude/skills/codex-llm-council-rjl/SKILL.md)

Comando recomendado:

```text
/council --preset lovable "<decision de arquitectura o UX>"
```

## Principios de producto

- Producto juridico serio, no landing generica de startup.
- Una sola marca RJL con cuatro experiencias diferenciadas.
- Cliente navega su caso, no modulos.
- Asesor opera desde contexto compartido, no desde cards sueltas.
- Admin ve negocio y cuellos de botella antes de editar registros.
- Publico entra a conversar, no a leer bloques de marketing.

## Shell compartido

### 1. Brand Header

Siempre visible:

- logo circular RJL
- nombre completo `Respaldo Juridico Laboral`
- subtitulo corto
- estado de sesion / accion de cuenta

### 2. Role Tabs

- `Publico`
- `Cliente`
- `Asesor`
- `Admin`

Desktop:

- barra horizontal persistente

Movil:

- segmented control o tabs scrollables

### 3. Experience Subnav

#### Publico

- sin subnav o una minima

#### Cliente

- `Resumen`
- `Evidencias`
- `Consultas`
- `Asesor virtual`

#### Asesor

- `Bandeja`
- `Clientes`
- `Proyeccion`
- `Analisis`

#### Admin

- `Resumen`
- `Usuarios`
- `Asignaciones`
- `Tickets`
- `Config`

## Materiales compartidos

- paleta navy / gold / cream
- serif editorial para encabezados
- sans para contenido operativo
- radios generosos
- borde dorado tenue
- sombras suaves
- CTA primario dorado
- badges y pills consistentes

## Experiencias

### Publico

#### Objetivo

Pasar de landing con chat lateral a producto conversacional juridico centrado.

#### Estructura

1. Brand Header
2. Role Tabs
3. Sello o logo RJL
4. Headline corto
5. Subtitulo utilitario
6. Disclaimer visible en pill
7. Chat protagonista
8. CTA secundaria de acceso

#### Reglas

- No usar dos columnas en el primer viewport.
- No usar stats ni checklist arriba del chat.
- El disclaimer debe ir entre hero y chat.
- El chat debe dominar la pantalla.

#### Datos y copy minimos

- pregunta principal orientada a problema laboral
- subtitulo de calculo + evidencias GPS
- disclaimer institucional breve
- primer mensaje del asesor virtual

### Cliente

#### Objetivo

Convertir `/cliente` en un expediente vivo en una sola pantalla.

#### Estructura

1. `Mi Perfil`
2. `Mis Datos Laborales`
3. `Boveda de Evidencias`
4. `Mis Consultas al Asesor`
5. `Asesor Virtual`

#### Reglas

- Una sola columna ancha.
- Cada bloque muestra estado actual, resumen util y CTA contextual.
- La home responde: `como va mi caso y que me toca hacer ahora`.

#### Bloque Mi Perfil

Mostrar:

- nombre
- antiguedad como cliente
- avatar o foto
- CTA de edicion basica

#### Bloque Mis Datos Laborales

Mostrar:

- fecha de ingreso
- antiguedad
- salario diario
- dias laborados
- horario
- IMSS
- contrato
- domicilio

CTA:

- `Actualizar mis datos`

#### Bloque Boveda de Evidencias

Categorias:

- entrada
- salida
- contrato
- recibos
- gastos medicos
- domicilio
- otro

Cada categoria muestra:

- contador
- subtitulo legal
- estado o ausencia visible

#### Bloque Mis Consultas al Asesor

Mostrar 3 a 5 consultas con:

- titulo breve
- estado
- recencia
- CTA `Nueva consulta`

#### Bloque Asesor Virtual

Mostrar:

- primer mensaje visible
- caja de entrada inmediata
- historial resumido si existe

#### Subrutas absorbidas

Absorber como experiencia principal:

- `/cliente/caso`
- `/cliente/chat`
- `/cliente/evidencias`
- `/cliente/tickets`
- `/cliente/tickets/new`

Mantener solo como detalle:

- edicion profunda laboral
- detalle de evidencia por categoria
- historial completo de tickets
- chat expandido

### Asesor

#### Objetivo

Pasar de lista de casos con acciones sueltas a workspace operativo unificado.

#### Estructura

1. `Mi Perfil Profesional`
2. `Bandeja de Tickets`
3. `Mis Clientes`
4. `Proyeccion - Cliente seleccionado`
5. `Analisis de IA - Estrategia del caso`
6. `Generar PDF`

#### Reglas

- Tickets arriba, clientes despues.
- Seleccionar ticket o cliente sincroniza el resto de la pantalla.
- La prioridad debe verse en tickets y clientes.
- La proyeccion no se esconde detras de botones.

#### Prioridad

Valores:

- `Alta`
- `Media`
- `Normal`

Se calcula visualmente a partir de:

- tickets abiertos
- falta de IMSS o contrato
- recencia
- soporte documental
- urgencia operativa

#### Proyeccion minima

Mostrar:

- indemnizacion
- 20 dias por ano
- vacaciones / prima
- horas extra
- gastos medicos
- total o rango de negociacion

Si faltan datos:

- mostrar `estimacion parcial`
- indicar evidencia faltante

#### IA minima

Mostrar en bloque persistente:

- diagnostico preliminar
- riesgos
- evidencia faltante
- siguiente mejor accion
- estrategia de negociacion
- alertas legales

#### PDF minimo

Debe producir expediente con:

- datos del cliente
- relacion laboral
- hechos
- evidencias con fecha y GPS
- proyeccion economica
- resumen estrategico

### Admin

#### Objetivo

Transformar admin en backoffice ejecutivo y operativo.

#### Estructura

##### Home Admin

- `Panel General`
- `Alertas operativas`
- `Gestion de usuarios resumida`
- `Asignacion pendiente`
- `Configuracion critica`

##### Modulos

- `Usuarios`
- `Asignaciones`
- `Tickets`
- `Config`

#### Reglas de KPIs

Agrupar por:

- negocio
- operacion
- capacidad

Jerarquia:

- una card protagonista de negocio
- una card protagonista de cuello de botella
- cards secundarias para capacidad y actividad

#### Usuarios

Segmentar por:

- asesores
- clientes
- admins

Cada fila o card muestra:

- nombre
- rol
- estado
- suscripcion
- fecha de alta
- asesor asignado o cartera

Edicion:

- modal o drawer

Filtros:

- rol
- estado
- suscripcion
- texto

#### Asignaciones

Mesa de despacho:

- izquierda: casos sin asesor o prioritarios
- derecha: asesores con carga

Caso muestra:

- cliente
- prioridad
- tickets
- antiguedad
- ultimo movimiento

Asesor muestra:

- casos activos
- tickets abiertos
- estado

#### Configuracion

Agrupar por:

- negocio
- operacion
- legal / producto
- soporte

Cada setting muestra:

- nombre legible
- valor
- impacto
- ultima edicion
- autor

## Primitives compartidas para Lovable

- `BrandHeader`
- `RoleTabBar`
- `ExperienceSubnav`
- `PageContainer`
- `SectionFrame`
- `ActionButton`
- `StatusBadge`
- `InfoCard`
- `MetricTile`
- `ListRow`
- `ProfileChip`
- `EmptyState`
- `ChatComposer`
- `ChatBubble`
- `FormField`

## Responsive

### Desktop

- canvas amplio
- max width consistente
- mas aire en Publico y Cliente
- mas densidad en Asesor y Admin

### Mobile

- tabs scrollables
- bloques apilados
- drawers preferidos para detalle
- tablas se vuelven listas o cards compactas

## Estados obligatorios

Cada experiencia debe contemplar:

- vacio
- cargando
- error
- exito

Ejemplos:

- cliente sin expediente
- cliente sin evidencias
- asesor sin tickets
- admin sin casos sin asignar

## Criterios de aceptacion

- cada rol se reconoce en menos de 3 segundos
- cliente, asesor y admin no parecen el mismo dashboard maquillado
- publico conduce al chat sin distraccion
- cliente concentra expediente y ayuda
- asesor puede triagear y actuar desde un solo lugar
- admin entiende que pasa y donde actuar primero
