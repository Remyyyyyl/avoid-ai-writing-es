# Catálogo de patrones (ES Colombia)

Cada patrón trae un antes/después y, cuando aplica, su *must-not-fire*. La regla
general: se corrige el patrón, no el registro. Si un fragmento es prosa
académica o técnica legítima, se deja.

Un patrón es una señal, no una prueba de autoría. Varios también aparecen en
textos humanos escritos con prisa, en una segunda lengua o dentro de un género
que comprime el vocabulario a propósito. Por eso el catálogo se aplica con
contexto y con las excepciones de cada entrada.

Severidades:

- **P0**: artefacto inequívoco. Se corrige siempre.
- **P1**: patrón claro de prosa generada. Se corrige en `rewrite`; se propone en `detect`.
- **P2**: juicio editorial. Se reporta; no se corrige por defecto.

## 1. Artefactos de chatbot (P0)

Se eliminan enteros. Nunca pertenecen a un documento académico ni a un README.

| Antes | Después |
|---|---|
| "¡Claro! A continuación se presenta un resumen completo…" | Se borra la muletilla; empieza el contenido. |
| "¡Buena pregunta!" / "Tienes toda la razón." | Se borra. |
| "Espero que esta información te sea útil." | Se borra. |
| "Si tienes alguna pregunta, no dudes en contactarme." | Se borra, salvo que sea una firma real de correo. |
| "Como modelo de lenguaje, no puedo…" | Se borra o se sustituye por la limitación real del documento. |
| "A continuación, desglosaremos este tema paso a paso." | Se afirma directamente lo que corresponda. |

Restos de generación, también P0: `[Tu nombre]`, `[INSERTAR FUENTE]`,
`2026-XX-XX`, `citeturn0search0`, `oai_citation`,
`contentReference[oaicite:0]`, `utm_source=chatgpt.com` en URLs. Se rellenan con
un dato real o se eliminan; nunca se dejan.

Avisos de corte de conocimiento: "A fecha de mi última actualización", "Hasta mi
última actualización", "No tengo acceso a información actualizada". Si el dato
importa, se cita la fuente y la fecha; el aviso no es una fuente.

## 2. Muletillas de relleno (P1)

No aportan contenido; la frase suele quedar igual sin ellas.

| Antes | Después |
|---|---|
| "Cabe destacar que el sistema valida el JWT en cada servicio." | "El sistema valida el JWT en cada servicio." |
| "Es importante señalar que los datos son sintéticos." | "Los datos son sintéticos." |
| "Es importante tener en cuenta que…" | Se borra la muletilla. |
| "En el mundo actual de la tecnología, la seguridad es crucial." | Se sustituye por la afirmación concreta o se borra. |
| "En la era digital actual…" | Se borra. |
| "En el ámbito de la salud, el triage es fundamental." | "El triage define la prioridad de atención en urgencias." |
| "A lo largo de la historia, el ser humano ha…" | Se borra o se sustituye por el antecedente concreto con fuente. |
| "Desde tiempos inmemoriales…" | Se borra. |
| "En el corazón de Bogotá, se erige una institución…" | Se ubica la institución sin adorno. |

*Must-not-fire:* "Teniendo en cuenta", "Dado que" y "En cuanto a" cuando
introducen una condición o un matiz real. Las plantillas académicas APA 7 los
admiten como conectores válidos.

## 3. Inflación de relevancia y lenguaje promocional (P1)

| Antes | Después |
|---|---|
| "Marca un hito en la evolución de los sistemas de triage." | Se afirma qué hace el sistema, sin valoración. |
| "Una plataforma robusta, integral y de vanguardia." | "Una plataforma web con cinco servicios de negocio." |
| "Revoluciona la atención en urgencias." | Se describe el apoyo concreto que presta. |
| "Un cambio de juego para el sector salud." | Se borra. |
| "Sin precedentes en el país." | Requiere fuente; si no la hay, se borra. |
| "Solución innovadora y disruptiva." | Se describe la solución. |
| "Desempeña un papel crucial/fundamental/vital." | Se dice qué hace o se borra el adjetivo. |

*Must-not-fire:* afirmaciones de alcance con dato ("50.000 llegadas sintéticas",
"nueve cuentas del seed") aunque sean enfáticas: el dato manda.

## 4. Léxico de reemplazo (P1)

Sustituir por la palabra llana cuando el sentido es ornamental. Si el término
tiene sentido técnico propio, se conserva.

| Evitar (ornamental) | Preferir |
|---|---|
| aprovechar (como *leverage*) | usar, aprovecharse de (si aplica) |
| robusto/a (sin criterio) | concreto: "con validación en gateway y servicios" |
| fluido/a, sin fricciones (*seamless*) | directo, sin pasos adicionales |
| integral (*comprehensive*) | completo, o enumerar el alcance |
| profundizar, sumergirse (*delve*) | analizar, detallar |
| desvelar, develar | mostrar, describir |
| empoderar | permitir, dar herramientas |
| panorama (*landscape*) | contexto, situación |
| tejido (*tapestry*) | borrar |
| facilitar (repetido) | permitir, hacer posible |
| realizar / llevar a cabo (comodín) | el verbo concreto: registrar, validar, medir |
| implementar (repetido) | construir, incluir, desarrollar |
| en constante evolución | borrar o fechar el cambio |

*Must-not-fire técnico:* "robusto" en *robustness* con criterio medible,
"integral" en "gestión integral" como nombre de un proceso, y cualquier
anglicismo del glosario.

## 5. Sintaxis de prosa generada (P1)

**Gerundio de posterioridad encadenado.** Calco del *-ing* inglés; en español
académico resulta artificioso cuando se repite.

- Antes: "El sistema registra el evento, reflejando la trazabilidad y simbolizando el compromiso con la seguridad."
- Después: "El sistema registra el evento, lo que permite rastrear quién hizo cada cambio."
- *Must-not-fire:* gerundio con función real de simultaneidad ("El servicio escucha en 127.0.0.1, evitando exponer el puerto").

**Contraste vacío.**

- Antes: "No es solo un sistema de turnos, es una herramienta de decisión clínica."
- Después: se afirma qué es, sin el molde.
- Variante: "No solo registra pacientes, sino que también transforma la atención."

**Rangos falsos.**

- Antes: "Cubre desde la recepción del paciente hasta la inteligencia artificial predictiva."
- Después: se enumeran las funciones reales.

**Tripletes decorativos.**

- Antes: "Seguro, escalable y eficiente."
- Después: se conserva el adjetivo que tenga respaldo, o se convierte en dato.
- *Must-not-fire:* "confidencialidad, integridad y disponibilidad": es una tríada conceptual con contenido, no un adorno.

**Ciclo de sinónimos.**

- Antes: "los usuarios… el personal… los funcionarios… los operadores…" para el mismo referente.
- Después: repetir el término claro ("el personal de triage").

**Incertidumbre apilada.**

- Antes: "Podría potencialmente llegar a ser un cambio significativo."
- Después: "Puede reducir la espera si se implementa en las 12 sedes" (con la condición real).
- *Must-not-fire:* el hedging científico necesario ("los resultados sugieren", "podría deberse a").

## 6. Atribuciones vagas y afirmaciones sin fuente (P1)

- Antes: "Los expertos creen que la IA mejorará el triage." / "Estudios demuestran que…"
- Después: se cita la fuente real o se marca **[requiere fuente]**. Nunca se inventa el estudio.
- Antes: "Es bien sabido que…", "Como es ampliamente reconocido…"
- Después: se borra la coletilla y se deja la afirmación si es defendible.

## 7. Aperturas y cierres de molde (P1)

- Antes: "¿Alguna vez te has preguntado cómo funciona el triage?" / "¿Te imaginas un hospital sin filas?"
- Después: se abre con el problema o el dato.
- Antes: "En conclusión, el futuro del sistema es prometedor." / "Solo el tiempo dirá…" / "El camino por recorrer es largo, pero…"
- Después: cierre concreto (limitación, trabajo futuro) o se borra.
- *Must-not-fire:* "En conclusión", "En síntesis", "Para concluir" como conectores de una sección de conclusiones con contenido.

## 8. Formato (P1 salvo excepciones)

- **Title Case en encabezados** ("Análisis De Riesgos De La Plataforma") → sentence case ("Análisis de riesgos de la plataforma"). En español solo la inicial y los nombres propios llevan mayúscula.
- **Negritas decorativas** en cada frase o etiqueta. Se reducen a títulos y datos puntuales.
- **Listas con etiqueta en negrita repetida** ("**Seguridad:** …", "**Rendimiento:** …") cuando el contenido cabe en un párrafo.
- **Emojis en encabezados o listas**: se quitan en documento académico o técnico.
- **Raya larga (—) en lugar de coma o punto** de forma sistemática: en español se prefiere la puntuación simple; la raya se conserva para incisos reales.
- **Preguntas retóricas en cadena**: se reduce a la afirmación.
- **Hashtags acumulados**: en LinkedIn, tres o más seguidos compiten con el contenido; en blog, se rebajan a P2.
- *Must-not-fire:* listas de requisitos, tablas de endpoints, diccionarios de datos y enumeraciones de objetivos: allí la lista es el formato correcto.

## 9. Ritmo y densidad (P2, solo se reporta)

- Párrafos de longitud casi idéntica y oraciones todas del mismo tamaño.
- Párrafos que no añaden información nueva ("efecto cinta transportadora": se puede reordenar sin que nada cambie).
- Conectores distintos en cada párrafo con la misma función ("Asimismo… Por otra parte… Además… De igual manera…").
- Aperturas de oración repetidas ("El sistema… El sistema… El sistema…").
- Densidad baja: muchas nociones abstractas (importancia, relevancia, aspecto, factor, contexto) y pocas cifras, nombres, siglas o consecuencias verificables.

En P2 no se reescribe por defecto: se señala el tramo y la razón. Un texto
académico puede tener párrafos largos y uniformes a propósito; el hallazgo es
una invitación a revisar, no una orden.

## 10. Pruebas de fondo (P1/P2)

Aplican igual que en inglés porque no dependen del idioma:

- **Reordenabilidad de párrafos**: si dos párrafos del cuerpo se pueden intercambiar sin romper nada, falta hilo argumental.
- **Densidad**: si un párrafo no aporta un dato, una decisión o una limitación nueva, sobra.
- **Umbral reescritura vs. parche**: si un texto acumula 5+ flags léxicos y 3+ categorías con ritmo uniforme, conviene reescribir el tramo en lugar de parcharlo. En modo `detect` se recomienda, no se ejecuta.

## 11. Perfiles de voz

La voz se aplica solo a la prosa editable. No autoriza inventar experiencias,
opiniones, cifras ni citas.

### `casual`

- Frases cortas, contracciones y primera persona si el autor ya la usa.
- Nada de "estimo que" ni de "cabe destacar".
- Se permite una digresión, pero no un personaje inventado.

### `profesional`

- Directo, sin jerga innecesaria ni promesas comerciales.
- Primera persona plural solo si el documento ya la usa.
- Cada afirmación importante con un dato, una fuente o una consecuencia.

### `tecnico`

- Precisión sobre elegancia: nombres de componentes, versiones, rutas y comandos intactos.
- Voz activa cuando el actor importa; pasiva cuando no.
- Sin adjetivos de marketing ("robusto", "seamless", "de vanguardia") sin criterio medible.

### `calido`

- Cercano sin tutear si el original no tutea.
- Reconoce la dificultad o el esfuerzo solo cuando el texto ya lo hace.
- No convierte una explicación técnica en una charla motivacional.

### `directo`

- Una idea por oración; el verbo principal al inicio.
- Corta el relleno y las concesiones vacías.
- Conserva la incertidumbre necesaria: "directo" no significa "más seguro de lo que la fuente permite".

## 12. Perfiles de contexto

El contexto decide si un patrón aplica; no cambia el significado de la fuente.

| Contexto | Qué se espera | Qué se relaja |
|---|---|---|
| `academico` | Tercera persona, hedging, citas APA, estructura | Hashtags, cierres de LinkedIn, preguntas retóricas |
| `tecnico` | Precisión, comandos, versiones, pasos | Hashtags, cierres sociales, preguntas retóricas |
| `docs` | Instrucciones, tablas, referencias | Hashtags, cierres sociales |
| `blog` | Voz personal, ritmo variable | Cierres de atención persistente |
| `linkedin` | Hook, tesis, cierre | Nada de forma automática: el molde sigue siendo P1 |
| `casual` | Conversación | Title Case, negritas y emojis |

## 13. Mapa al detector

El detector determinista implementa el subconjunto regex y las heurísticas de
ritmo. Los patrones de juicio quedan marcados como `judgment: true`.

| Regla | Severidad | Qué detecta |
|---|---|---|
| `chatbot-artifact`, `placeholder-artifact`, `cutoff-disclaimer` | P0 | Artefactos y restos de generación |
| `filler` | P1 | Muletillas de relleno |
| `relevance-inflation` | P1 | Promesas y grandilocuencia |
| `robust-inflation`, `integral-inflation`, `lexical-ornamental`, `lexical-repetition` | P1 | Léxico ornamental y comodines |
| `vague-attribution` | P1 | Fuentes vagas |
| `formulaic-opening`, `formulaic-closing` | P1 | Moldes de apertura y cierre |
| `empty-contrast`, `decorative-triple`, `hedge-stack` | P1 | Sintaxis generada |
| `narrated-candor`, `social-endorsement`, `lingering-attention`, `real-actual-inflation` | P1 | Moldes de voz y redes |
| `title-case-heading`, `bold-overuse`, `bold-label-list`, `emoji`, `rhetorical-question-chain`, `hashtag-stuffing` | P1/P2 | Formato |
| `em-dash-rate`, `uniform-paragraph-length`, `uniform-sentence-length`, `connector-repetition`, `repeated-openings`, `low-density-paragraph`, `synonym-cycling` | P2 | Ritmo y densidad |
| `copula-avoidance`, `generic-conclusion` | P2 | Perífrasis y cierres genéricos |

El detector **no** implementa de forma determinista el gerundio de
posterioridad, los rangos falsos, el ciclo de sinónimos fuera de los grupos
cerrados, la reordenabilidad de párrafos ni el umbral de reescritura. Esos
quedan a juicio del modelo y se reportan como `model-only` en la verificación.

## 14. Límites

- Catálogo construido por juicio editorial sobre español de Colombia, no por medición de corpus. No afirmes frecuencias estadísticas ni porcentajes de acierto.
- No hay puntuación de autoría. El detector devuelve conteos y hallazgos; un número no prueba quién escribió el texto.
- El registro académico y técnico no es un IA-ismo. Impersonal, pasiva, "el presente documento", hedging científico y nominalización son norma del género.
- Variantes dialectales fuera de Colombia y registros no académicos pueden exigir ajustar la matriz de tolerancia.
