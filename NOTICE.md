# Atribución y alcance

Adaptación al español de **avoid-ai-writing** v3.38.0, de Conor Bronsdon,
publicada bajo licencia MIT:

https://github.com/conorbronsdon/avoid-ai-writing

Se conserva la licencia MIT original (ver `LICENSE`) y la atribución al autor.
Esta adaptación no está mantenida ni validada por el autor del proyecto
original, y no forma parte de sus adaptaciones comunitarias.

## Qué se tomó y qué se rehízo

- Se conserva el modelo operativo: modos `detect`/`rewrite`/`edit`, severidades
  P0/P1/P2, contrato de edición, edición mínima, verificación honesta y rechazo
  a reescribir contenido estructurado.
- Se rehízo el catálogo para español de Colombia. No es una traducción de la
  tabla inglesa: se añadieron reglas propias (gerundio de posterioridad,
  calques del inglés, Title Case en encabezados, fórmulas del género académico).
- Se añadieron perfiles de voz y contexto, perfiles de estilo y un detector
  P0/P1/P2 nuevo, calibrado para español y sin puntuación de autoría.
- Se siguieron los modelos de las adaptaciones comunitarias de Jürgen Kraus
  (multilingüe) y Mário Rabelo Neto (portugués europeo): matriz de tolerancia,
  falsos positivos de registro y sección de interferencia del idioma origen.

## Herramientas reutilizadas del proyecto original

Solo las independientes del idioma, conservadas bajo la licencia MIT original:

- `scripts/normalize-quotes.js`
- `scripts/markdown-prose.js`
- `scripts/check-style.js`
- `detector/validate-es.js`, adaptado de `detector/validate.js`

El archivo `detector/patterns-es.js` es nuevo. **No** es una traducción del
motor inglés `detector/patterns.js`: las regexes, listas de palabras y
heurísticas de estilometría del proyecto original están calibradas para inglés
y no se reutilizan aquí.

## Evidencia y límites

- **Juicio editorial, no medición.** Las entradas del catálogo no proceden de un
  corpus medido. No se afirman frecuencias estadísticas, tasas de acierto ni
  capacidad de detectar autoría.
- **Sin puntuación de autoría.** El detector devuelve conteos y hallazgos. No
  emite un `score` ni un veredicto.
- **Dialecto:** español latinoamericano (Colombia). Otros dialectos pueden
  requerir ajustes.
- **Registro principal:** documento académico APA 7 en LaTeX y prosa técnica de
  software. Los falsos positivos de ese registro están en
  `references/apa-y-latex.md`.
- **P2 es heurístico.** Ritmo y densidad producen más falsos positivos; se
  reportan, no se corrigen por defecto.

## Licencia

MIT. Consulta `LICENSE` para el texto completo.
