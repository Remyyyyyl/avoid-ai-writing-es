# Changelog

## v0.1.0 — 2026-11-11

Primera versión pública de la adaptación al español.

- Catálogo de IA-ismos para español de Colombia, con severidades P0/P1/P2.
- Modos `detect`, `rewrite` y `edit`, con contrato de edición y verificación.
- Perfiles de voz (`casual`, `profesional`, `tecnico`, `calido`, `directo`).
- Perfiles de contexto (`academico`, `tecnico`, `docs`, `blog`, `linkedin`, `casual`).
- Detector propio `detector/patterns-es.js`, sin puntuación de autoría.
- CLI `detector/cli-es.js` para Markdown, texto y LaTeX.
- Validador de preservación `detector/validate-es.js`.
- Comprobación de comillas y mecánica de estilo.
- Perfiles de estilo académico, técnico y blog.
- Protección de citas APA, comandos LaTeX, código, tablas y URLs.
- Pruebas con `node --test` y CI de GitHub Actions.

Adaptación al español de
[avoid-ai-writing](https://github.com/conorbronsdon/avoid-ai-writing) v3.38.0,
de Conor Bronsdon (MIT).
