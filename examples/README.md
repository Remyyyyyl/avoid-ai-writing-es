# Perfiles de estilo

Cada archivo JSON es un perfil de estilo de casa para `scripts/check-style.js`.
No son guías de estilo completas: describen el registro que el modelo debe
aplicar y las convenciones mecánicas que el script puede comprobar.

## Esquema

```json
{
  "name": "Nombre visible",
  "genre": "Género o superficie de publicación",
  "register": [
    "Directriz de voz que el modelo aplica tal cual."
  ],
  "mechanics": {
    "quotes": "curly",
    "headings": "sentence",
    "emDash": "sparing",
    "latinAbbrev": "never",
    "serialComma": false,
    "spellNumbersUpTo": 9
  }
}
```

### `register`

Lista de instrucciones de voz y registro. El script no las comprueba; las aplica
el modelo. Escríbelas como órdenes concretas, no como adjetivos.

### `mechanics`

| Clave | Valores | Comprobación |
|---|---|---|
| `quotes` | `straight`, `curly` | Grave |
| `latinAbbrev` | `parentheses`, `never`, `any` | Grave |
| `headings` | `sentence`, `title` | Aviso |
| `emDash` | `sparing`, `deliberate` | Aviso |
| `spellNumbersUpTo` | número | Aviso |
| `serialComma` | booleano | Solo modelo |

`headings` es un aviso porque los nombres propios hacen ambiguo el sentence case.
`serialComma` se declara pero no se comprueba de forma determinista.

## Uso

Desde la raíz de la skill:

```bash
node scripts/check-style.js articulo.md --config es-academico
node scripts/check-style.js README.md --config examples/es-tecnico.json
node scripts/check-style.js post.md --config es-blog --json
```

También puedes pasar la ruta completa a tu propio JSON. Un nombre sin ruta se
resuelve contra `examples/<nombre>.json`.

## Perfiles incluidos

- `es-academico.json`: documento académico APA 7, tesis y capítulos.
- `es-tecnico.json`: README, documentación de API y guías de operación.
- `es-blog.json`: blog, divulgación y newsletter.
