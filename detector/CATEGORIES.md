# Categorías del detector

Mapa entre las categorías que devuelve `analyzeText` y las reglas que las
alimentan. Sirve para mantener sincronizados el catálogo humano
(`references/patterns-es.md`) y el motor (`patterns-es.js`).

| Categoría | Reglas | Severidad |
|---|---|---|
| `artefactos-chatbot` | `chatbot-artifact`, `placeholder-artifact`, `cutoff-disclaimer` | P0 |
| `muletillas` | `filler` | P1 |
| `inflacion-relevancia` | `relevance-inflation` | P1 |
| `lexico-ornamental` | `robust-inflation`, `integral-inflation`, `lexical-ornamental`, `lexical-repetition`, `real-actual-inflation` | P1 |
| `atribuciones-vagas` | `vague-attribution` | P1 |
| `aperturas-cierres` | `formulaic-opening`, `formulaic-closing`, `generic-conclusion` | P1/P2 |
| `sintaxis-generada` | `empty-contrast`, `decorative-triple`, `hedge-stack`, `copula-avoidance` | P1/P2 |
| `falsa-candidez` | `narrated-candor` | P1 |
| `cierres-redes` | `social-endorsement`, `lingering-attention` | P1 |
| `formato` | `title-case-heading`, `bold-overuse`, `bold-label-list`, `emoji`, `rhetorical-question-chain`, `hashtag-stuffing` | P1/P2 |
| `ritmo` | `em-dash-rate`, `uniform-paragraph-length`, `uniform-sentence-length`, `connector-repetition`, `repeated-openings`, `low-density-paragraph`, `synonym-cycling` | P2 |

## Reglas que quedan a juicio del modelo

El motor no implementa de forma determinista:

- Gerundio de posterioridad encadenado.
- Rangos falsos ("desde… hasta…").
- Reordenabilidad de párrafos.
- Umbral de reescritura frente a parche.
- Ciclo de sinónimos fuera de los grupos cerrados.
- Detección de citas o URLs inventadas (se protegen las citas; la verificación de fuentes es humana).

En la salida de la skill, estos casos se reportan como `model-only` o como
residuales de verificación, nunca como una comprobación determinista.
