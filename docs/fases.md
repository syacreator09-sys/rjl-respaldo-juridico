# Fases de implementacion

## Fase 0 - Base y seguridad
- Crear carpeta aislada de trabajo.
- Extraer los PDF juridicos a texto.
- Definir materias soportadas y limites del agente.
- Separar configuracion sensible de archivos versionables.

Entregable:
- estructura del proyecto,
- textos fuente extraidos,
- arquitectura y criterios de seguridad.

## Fase 1 - MVP operativo local
- Canal: HTTP local.
- Entrada: mensaje del usuario.
- Clasificacion por materia: penal, proceso penal, familiar, civil.
- Retrieval simple y controlado por chunks y palabras clave.
- Respuesta sintetizada con modelo, usando solo snippets recuperados.
- Mensaje final con:
  - advertencia de alcance informativo,
  - materia detectada,
  - respuesta breve,
  - fuentes citadas.

Entregable:
- servidor local reproducible,
- formato de chunks,
- tabla objetivo para conocimiento legal,
- prompt del asistente.

## Fase 2 - Ingestion y calidad de conocimiento
- Chunking por articulo y encabezados.
- Metadatos por fuente:
  - materia,
  - ley,
  - articulo,
  - texto,
  - palabras clave.
- Revision de ruido OCR o encabezados repetidos.
- Criterios de descarte y normalizacion.

Entregable:
- `legal_chunks.json`,
- script reproducible de generacion.

## Fase 3 - Seguridad juridica y escalamiento
- Reglas de no alucinacion.
- Casos que obligan a escalar a humano:
  - urgencia penal,
  - violencia,
  - menores,
  - medidas cautelares,
  - plazos inminentes,
  - documentos para presentar.
- Respuestas prohibidas:
  - estrategia delictiva,
  - evasion de autoridad,
  - dictamen definitivo sin revision.

Entregable:
- politica de respuesta segura,
- mensajes de escalamiento,
- matriz de riesgo por materia.

## Fase 4 - Telegram y automatizacion opcional
- Integrar el motor local a Telegram sin alterar `n8n` productivo.
- Enviar mensajes solo despues de validar el flujo local.
- Mantener secretos fuera de archivos versionados.

Entregable:
- adaptador de Telegram,
- script de aviso de cierre,
- checklist de conexion segura.

## Fase 5 - Version robusta
- Sustituir retrieval basico por vector store persistente.
- Trazabilidad de conversaciones.
- Panel de revisiones humanas.
- Seguimiento de casos y etiquetado.

Entregable:
- backlog de evolucion,
- criterios para migrar a Supabase, PGVector o Pinecone.
