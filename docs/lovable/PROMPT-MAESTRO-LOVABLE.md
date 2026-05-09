# Prompt Maestro para Lovable

Construye una aplicacion web llamada `RJL - Respaldo Juridico Laboral` para asesoria juridico-laboral mexicana.

Quiero que la UI siga estas reglas:

- Debe sentirse como un producto juridico serio y sobrio.
- Usa una identidad visual consistente con:
  - navy profundo
  - gold elegante
  - cream para texto principal
- Usa tipografia editorial para encabezados y sans legible para contenido operativo.
- No hagas una landing generica de startup.
- No uses bloques de marketing como testimonials, feature sections, counters exagerados o CTA sections protagonistas.
- Usa componentes estilo app operativa basados en primitives equivalentes a 21st.dev: navbar, tabs, chat, cards, data lists, badges, forms, dialogs y stat cards.

La aplicacion debe tener cuatro experiencias separadas:

1. `Publico`
2. `Cliente`
3. `Asesor`
4. `Admin`

Todas comparten:

- un `Brand Header` sticky con logo RJL, nombre completo, subtitulo y accion de sesion
- una barra de `Role Tabs` con Publico, Cliente, Asesor y Admin

Cada experiencia tiene una anatomia distinta:

## Publico

Pantalla centrada de una sola columna:

- sello o logo RJL
- headline corto orientado a problema laboral
- subtitulo utilitario sobre calculo y evidencias GPS
- disclaimer visible en una pill institucional
- chat grande como bloque protagonista
- CTA secundaria de iniciar sesion o crear cuenta

No usar dos columnas ni stats de marketing arriba del chat.

## Cliente

Home unificada de expediente con estos bloques, en este orden:

1. Mi Perfil
2. Mis Datos Laborales
3. Boveda de Evidencias
4. Mis Consultas al Asesor
5. Asesor Virtual

Reglas:

- una sola columna ancha
- cada bloque muestra estado actual, resumen util y CTA contextual
- evidencias en mosaico por categorias
- consultas con estado y recencia
- chat integrado abajo como modulo persistente

## Asesor

Workspace operativo con estos bloques:

1. Mi Perfil Profesional
2. Bandeja de Tickets
3. Mis Clientes
4. Proyeccion - Cliente seleccionado
5. Analisis de IA - Estrategia del caso
6. Generar PDF

Reglas:

- tickets arriba
- clientes seleccionables
- prioridad visible: Alta, Media, Normal
- seleccionar cliente sincroniza proyeccion, IA y PDF
- UI densa y utilitaria

## Admin

Backoffice ejecutivo y operativo:

Home Admin con:

- Panel General
- Alertas operativas
- Gestion de usuarios resumida
- Asignacion pendiente
- Configuracion critica

Modulos:

- Usuarios
- Asignaciones
- Tickets
- Config

Reglas:

- KPIs agrupados por negocio, operacion y capacidad
- usuarios segmentados por asesores, clientes y admins
- asignacion como mesa de despacho
- configuracion como reglas de negocio legibles

## Responsive

- En desktop, mantener jerarquia clara y aire visual segun rol.
- En movil, usar tabs scrollables, bloques apilados y drawers para detalle.

## Estilo

- elegante
- sobrio
- juridico
- premium sin teatralidad
- operativo, no marketinero

Usa esta arquitectura como contrato. No improvises una estructura distinta.
