# Base legal revisada

## Fuentes encontradas en Descargas
- `CPENALEM.pdf`
- `CNPP.pdf`
- `CFAMILIAREM.pdf`
- `CODIGO CIVIL DEL ESTADO DE MORELOS_0.pdf`

## Lectura funcional para el agente
### 1. Codigo Penal para el Estado de Morelos
- Ambito: penal sustantivo local.
- Utilidad para el bot:
  - tipicidad basica,
  - delitos del fuero comun,
  - referencias normativas estatales.
- Riesgo:
  - no confundir delito con procedimiento,
  - no usarlo para explicar etapas procesales.

### 2. Codigo Nacional de Procedimientos Penales
- Ambito: proceso penal.
- Utilidad para el bot:
  - derechos en procedimiento,
  - principios,
  - actores procesales,
  - reglas generales de investigacion, audiencia y defensa.
- Riesgo:
  - no mezclar procedimiento con definicion del delito.

### 3. Codigo Familiar de Morelos
- Ambito: relaciones familiares.
- Utilidad para el bot:
  - alimentos,
  - estado civil,
  - relaciones familiares,
  - reglas familiares del estado.
- Riesgo:
  - casos con menores o violencia requieren escalamiento humano.

### 4. Codigo Civil de Morelos
- Ambito: civil local.
- Utilidad para el bot:
  - personas,
  - bienes,
  - actos juridicos,
  - contratos y efectos civiles.
- Riesgo:
  - la version encontrada parece antigua en comparacion con los otros textos.
  - debe marcarse como fuente con posible revision posterior antes de confiar en respuestas sensibles.

## Conclusion de alcance
Con estas fuentes, el agente debe nacer como:
- asistente juridico informativo de Morelos,
- especializado en `penal`, `proceso penal`, `familiar` y `civil`,
- con reconocimiento de limites jurisdiccionales y de vigencia.

No debe presentarse como asesor universal de todo Mexico.
