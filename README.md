# avoid-ai-writing-es

Skill de [Agent Skills](https://agentskills.io) para auditar y reescribir prosa
en español y quitar patrones de escritura de IA ("IA-ismos") sin tocar el
registro académico ni técnico legítimo.

Está pensada para español de Colombia, con foco en documentos APA 7, tesis,
README, documentación técnica y archivos LaTeX. Incluye un detector P0/P1/P2
propio que no emite puntuación de autoría: devuelve conteos y hallazgos para que
una persona decida.

## Qué hace

- **Detecta** artefactos de chatbot, muletillas, inflación de relevancia, léxico ornamental, atribuciones vagas, moldes de apertura y cierre, problemas de formato y ritmo uniforme.
- **Reescribe** solo cuando se lo piden, con edición mínima y fidelidad a la fuente.
- **Edita archivos** Markdown o `.tex` en el lugar, sin tocar código, citas, tablas, URLs ni comandos LaTeX.
- **Protege** citas APA, referencias, comandos LaTeX, matemáticas, bloques de código, tablas y anglicismos técnicos.
- **Aplica perfiles** de voz (`casual`, `profesional`, `tecnico`, `calido`, `directo`) y de contexto (`academico`, `tecnico`, `docs`, `blog`, `linkedin`, `casual`).
- **Verifica** comillas, mecánica de estilo y preservación de cifras, URLs y encabezados.

No es un detector de autoría. Un patrón es una señal, no una prueba.

## Instalación

### Con el CLI de skills (recomendado)

```bash
npx skills add Remyyyyyl/avoid-ai-writing-es
```

Para instalarla en todos los agentes detectados:

```bash
npx skills add Remyyyyyl/avoid-ai-writing-es --all
```

Para elegir agentes:

```bash
npx skills add Remyyyyyl/avoid-ai-writing-es -a claude-code -a opencode
```

Para instalarla globalmente, en vez de solo el proyecto actual:

```bash
npx skills add Remyyyyyl/avoid-ai-writing-es -g
```

El CLI soporta Claude Code, Codex, Cursor, GitHub Copilot, Gemini CLI, OpenCode,
Windsurf, Cline y otros. También puedes copiar la carpeta a mano:

```text
~/.agents/skills/avoid-ai-writing-es/          # convención universal
~/.claude/skills/avoid-ai-writing-es/          # Claude Code
~/.config/opencode/skills/avoid-ai-writing-es/ # OpenCode
.agents/skills/avoid-ai-writing-es/            # solo este proyecto
```

## Uso

El lenguaje natural basta:

```text
Audita este párrafo y dime qué suena a IA, sin reescribirlo.
Quita la cara de IA de este texto, en registro académico.
Reescribe esto con voz directa para LinkedIn.
Edita draft.md en el lugar y deja intactas las citas APA.
```

Opciones explícitas:

```text
--modo rewrite|detect|edit
--voz casual|profesional|tecnico|calido|directo
--contexto academico|tecnico|docs|blog|linkedin|casual
--archivo RUTA
--iterar 1|2
--estilo examples/es-academico.json
```

También acepta los alias en inglés (`--mode`, `--voice`, `--context`,
`--file`, `--iterate`, `--style`).

## Detector

El detector es opcional y requiere Node 18+:

```bash
# Auditoría completa
node detector/cli-es.js --contexto academico articulo.md

# Pasada rápida: solo P0 y P1
node detector/cli-es.js --quick --contexto tecnico README.md

# Salida JSON
node detector/cli-es.js --json --contexto blog post.md

# LaTeX: enmascara comandos, matemáticas y entornos
node detector/cli-es.js --contexto academico capitulo.tex
```

Salida típica:

```text
Contexto: academico
Palabras: 842 | Párrafos: 12 | Oraciones: 41
Hallazgos: P0 0 | P1 3 | P2 1
  P1 [muletillas] L4: Cabe destacar (juicio editorial)
    Muletilla de relleno: la frase suele funcionar igual sin ella.
```

El detector no devuelve un `score`. Devuelve `counts` por severidad, `issues` y
estadísticas descriptivas. Esa decisión es deliberada: un número se lee como
veredicto de autoría y no lo es.

## Verificación mecánica

```bash
# Comillas y apóstrofos
node scripts/normalize-quotes.js prosa.md --reference original.md --write

# Mecánica de un perfil de estilo
node scripts/check-style.js articulo.md --config examples/es-academico.json

# Preservación de cifras, URLs, encabezados y bloques (solo Markdown)
node detector/validate-es.js --residual-policy warn original.md reescrito.md
```

Si una comprobación no puede correr, la skill debe decirlo y aplicar la
convención a mano. No se reporta una verificación que no se ejecutó.

## Perfiles de estilo incluidos

- `examples/es-academico.json`: documento académico APA 7, tesis y capítulos.
- `examples/es-tecnico.json`: README, documentación de API y guías de operación.
- `examples/es-blog.json`: blog, divulgación y newsletter.

El esquema está en [examples/README.md](examples/README.md).

## Estructura

```text
SKILL.md                    Instrucciones de la skill
references/                 Catálogo, protección APA/LaTeX, glosario y calques
examples/                   Perfiles de estilo y su esquema
scripts/                    Comillas, estilo y validación de la skill
detector/                   Motor P0/P1/P2, CLI y validador de preservación
tests/                      Pruebas y fixtures
```

## Requisitos

- Un agente compatible con Agent Skills. No requiere herramientas externas para el modo editorial.
- Node 18+ solo para el detector y las comprobaciones mecánicas.
- `latexmk` solo si quieres compilar y verificar un `.tex` después de editar.

## Límites

- No prueba autoría ni emite un veredicto.
- El catálogo se construyó por juicio editorial, no midiendo un corpus.
- El foco dialectal es español de Colombia; otros dialectos pueden requerir ajustes.
- P2 (ritmo y densidad) es heurístico y produce más falsos positivos.
- El detector no sustituye la revisión humana.

## Licencia y atribución

MIT. Es una adaptación al español de
[avoid-ai-writing](https://github.com/conorbronsdon/avoid-ai-writing) v3.38.0,
de Conor Bronsdon. El catálogo español, el detector y esta documentación son
originales de Oscar Castellanos. Consulta [LICENSE](LICENSE) y
[NOTICE.md](NOTICE.md).
