# Detector ES

Motor determinista de patrones de escritura de IA para español de Colombia.
Sin dependencias. Node >= 18.

No es un detector de autoría y no devuelve una puntuación. Devuelve hallazgos,
conteos por severidad y estadísticas descriptivas. Cada hallazgo es una señal
para revisar, no una prueba.

## Uso

### CLI

```bash
node detector/cli-es.js --contexto academico articulo.md
node detector/cli-es.js --quick --contexto tecnico README.md
node detector/cli-es.js --json --contexto blog post.md
node detector/cli-es.js --contexto academico capitulo.tex
cat articulo.md | node detector/cli-es.js --contexto docs -
node detector/cli-es.js --list-rules
```

Opciones:

| Opción | Efecto |
|---|---|
| `--contexto <nombre>` | `general`, `academico`, `tecnico`, `docs`, `blog`, `linkedin`, `casual` |
| `--quick` | Solo P0 y P1 |
| `--severidad P0,P1,P2` | Selecciona severidades |
| `--json` | Salida JSON |
| `--incluir-citas` | Analiza también blockquotes y comillas |
| `--list-rules` | Lista las reglas disponibles |

Códigos de salida: `0` sin hallazgos en las severidades elegidas, `1` con
hallazgos, `2` error de uso o lectura.

### API

```js
const { analyzeText, formatResult } = require('./detector/patterns-es.js');

const result = analyzeText(texto, {
  context: 'academico',
  severities: ['P0', 'P1', 'P2'],
  includeQuotes: false,
});

console.log(result.counts);   // { P0: 0, P1: 2, P2: 1 }
console.log(result.issues);   // hallazgos con línea, columna y sugerencia
console.log(result.stats);    // palabras, párrafos, oraciones, CV, rayas
console.log(formatResult(result));
```

## Qué protege

Antes de buscar patrones, el detector enmascara:

- Frontmatter YAML.
- Bloques y fragmentos de código.
- Comentarios HTML.
- Entornos LaTeX (`equation`, `align`, `figure`, `table`, `tabular`, `tikzpicture`, `lstlisting`, `verbatim`, `thebibliography`, etc.).
- Comandos LaTeX y sus argumentos.
- Matemáticas en línea y en bloque.
- URLs, enlaces Markdown, definiciones de referencia y correos.
- Tablas Markdown.
- Blockquotes y comillas (salvo `--incluir-citas`).
- Citas APA parentéticas y narrativas, y abreviaturas como `et al.` o `s.f.`.
- Rutas de archivo.

El enmascarado conserva la longitud y las líneas del texto, así que las
posiciones reportadas siguen siendo válidas.

## Salida

```json
{
  "counts": { "P0": 0, "P1": 1, "P2": 0 },
  "issues": [
    {
      "rule": "filler",
      "category": "muletillas",
      "severity": "P1",
      "match": "Cabe destacar",
      "index": 42,
      "line": 3,
      "column": 1,
      "message": "Muletilla de relleno: la frase suele funcionar igual sin ella.",
      "suggestion": "Empieza por la afirmación concreta o borra la muletilla.",
      "judgment": true
    }
  ],
  "stats": {
    "words": 842,
    "paragraphs": 12,
    "sentences": 41,
    "paragraphLengthCV": 0.31,
    "sentenceLengthCV": 0.28,
    "emDashesPer1000": 0.0,
    "boldSpans": 2,
    "hashtags": 0
  },
  "context": "academico"
}
```

`judgment: true` indica que el hallazgo es una decisión editorial, no una
detección inequívoca. P2 casi siempre es juicio editorial.

## Reglas

El catálogo completo está en
[`../references/patterns-es.md`](../references/patterns-es.md). El mapa de
categorías está en [`CATEGORIES.md`](CATEGORIES.md).

- **P0:** `chatbot-artifact`, `placeholder-artifact`, `cutoff-disclaimer`.
- **P1:** `filler`, `relevance-inflation`, `robust-inflation`, `integral-inflation`, `lexical-ornamental`, `lexical-repetition`, `vague-attribution`, `formulaic-opening`, `formulaic-closing`, `empty-contrast`, `decorative-triple`, `hedge-stack`, `narrated-candor`, `social-endorsement`, `lingering-attention`, `real-actual-inflation`, `title-case-heading`, `bold-overuse`, `bold-label-list`, `emoji`, `rhetorical-question-chain`.
- **P2:** `em-dash-rate`, `uniform-paragraph-length`, `uniform-sentence-length`, `connector-repetition`, `repeated-openings`, `low-density-paragraph`, `synonym-cycling`, `copula-avoidance`, `generic-conclusion`, `hashtag-stuffing`.

## Límites

- No detecta de forma determinista el gerundio de posterioridad, los rangos falsos, la reordenabilidad de párrafos ni el umbral de reescritura. Esos quedan a juicio del modelo.
- P2 usa heurísticas de ritmo y densidad; puede producir falsos positivos en textos académicos legítimos.
- El español de Colombia es el dialecto de referencia. Otras variantes pueden requerir ajustes.
- No sustituye la revisión humana ni prueba autoría.
