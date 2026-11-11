# Interferencia inglés → español en prosa técnica

Para texto que nace en inglés (documentación, artículos, README) y se redacta en español. La traducción introduce tells nuevos aunque el original esté limpio: por eso se audita el español al final, no solo el inglés.

## Flujo recomendado

1. Si tienes el original inglés, audítalo por separado con la herramienta que uses para inglés; esta skill no lo necesita.
2. Redactar en español con el glosario y el registro fijados (impersonal académico en el documento APA).
3. Auditar el español con `avoid-ai-writing-es`.
4. Verificar que no se perdió ningún dato: cifras, versiones, nombres de endpoints, URLs. En Markdown se puede usar `detector/validate-es.js`; en LaTeX, compilar y revisar el diff.

## Calques frecuentes

| Inglés | Calco a evitar | Español natural |
|---|---|---|
| "marking a milestone" | "marcando un hito" | afirmar el hecho, sin gerundio valorativo |
| "reflecting / showcasing / symbolizing" | "reflejando / mostrando / simbolizando" | "lo que permite…", o borrar |
| "serves as" | "sirve como" | "es" |
| "features / boasts" | "cuenta con / presume de" | "tiene", "incluye" |
| "leverage" | "apalancar" | "usar", "aprovechar" |
| "seamless" | "sin costuras" | "directo", "sin pasos adicionales" |
| "robust" | "robusto" (sin criterio) | describir el control concreto |
| "comprehensive" | "comprehensivo" | "completo", "detallado" |
| "delve into" | "sumergirse en" | "analizar", "detallar" |
| "landscape" | "paisaje" | "contexto", "panorama" |
| "in today's X" | "en el mundo actual de…" | borrar |
| "it's not X, it's Y" | "no es X, es Y" | afirmar Y |
| "moreover / furthermore" | "además / asimismo" en cada párrafo | variar solo si aporta; a menudo sobra |
| "in conclusion, the future looks bright" | "el futuro es prometedor" | borrar o cerrar con trabajo futuro |
| "It's worth noting" | "Cabe destacar" | borrar |
| "the integration of" | "la integración de" repetida | reformular con verbo |
| "allow(s) to" | "permite realizar" | "permite" + infinitivo simple |
| "support" (sustantivo) | "soporte" en prosa académica | "apoyo" (en informática, "soporte" es válido) |
| "actually / currently" | "actualmente" por *actually* | "en realidad" / "en la actualidad" según corresponda |
| "eventually" | "eventualmente" por *in the end* | "finalmente" |
| "sensible" | "sensible" por *sensitive* | "razonable"; *sensitive data* = "datos sensibles" (correcto) |

## Falsos amigos que cambian el sentido

- *actually* ≠ "actualmente" → "en realidad".
- *eventually* ≠ "eventualmente" → "finalmente", "con el tiempo".
- *library* ≠ "librería" en bibliografía → "biblioteca"; en software, "biblioteca" o "librería" según glosario.
- *application* → "aplicación", nunca "aplicación" en el sentido de solicitud formal sin contexto.
- *deployment* → "despliegue" (no "desplegamiento"). Se conserva `deploy` como anglicismo técnico solo si el glosario lo admite en ese contexto.

## Registro al traducir documentación técnica

- El imperativo de las guías ("Run the script") pasa a infinitivo o impersonal en el documento académico ("ejecutar el script", "se ejecuta el script"), no a tuteo ("ejecuta el script").
- La segunda persona inglesa no se conserva: el documento APA usa impersonal.
- Los nombres de componentes, archivos y rutas no se traducen: `api-gateway`, `src/config/`, `registro_triage`.
