# Cleanup plan

## Objetivo
Reducir ruido de chunks legales no sustantivos y alinear la propuesta tecnica con el criterio final del proyecto: ejecutar primero en local, sin tocar `n8n`.

## Cambios
- Filtrar o penalizar fragmentos de decreto, publicacion, vigencia, transitorios y notas de reforma.
- Mejorar el scoring del retrieval para privilegiar texto normativo sustantivo.
- Ajustar la documentacion para que la ruta principal sea `codigo local -> pruebas -> Telegram opcional`.

## Verificacion
- Regenerar `legal_chunks.json`.
- Probar consultas CLI en penal, familiar y civil.
- Levantar el servidor local y probar `GET /` y `POST /api/ask`.
