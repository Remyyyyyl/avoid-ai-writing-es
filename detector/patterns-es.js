'use strict';

/**
 * Detector de patrones de escritura de IA para español (ES Colombia).
 *
 * No es un detector de autoría ni devuelve una puntuación. Devuelve hallazgos
 * agrupados por severidad y estadísticas descriptivas. Las reglas son
 * heurísticas y deliberadamente conservadoras: cada hallazgo es una señal para
 * revisar, no una prueba de que un texto lo haya escrito una IA.
 *
 * Sin dependencias. Node >= 18.
 */

const SEVERITY_RANK = { P0: 0, P1: 1, P2: 2 };

const CONTEXTS = {
  general: {
    label: 'General',
    skip: [],
  },
  academico: {
    label: 'Académico APA 7',
    skip: ['hashtag-stuffing', 'social-endorsement', 'lingering-attention', 'rhetorical-question-chain'],
  },
  tecnico: {
    label: 'Técnico y documentación',
    skip: ['hashtag-stuffing', 'social-endorsement', 'lingering-attention', 'rhetorical-question-chain'],
  },
  docs: {
    label: 'Documentación',
    skip: ['hashtag-stuffing', 'social-endorsement', 'lingering-attention', 'rhetorical-question-chain', 'bold-label-list'],
  },
  blog: {
    label: 'Blog',
    skip: ['lingering-attention'],
  },
  linkedin: {
    label: 'LinkedIn',
    skip: [],
  },
  casual: {
    label: 'Casual',
    skip: ['title-case-heading', 'bold-overuse', 'emoji', 'rhetorical-question-chain'],
  },
};

const MINOR_ES = new Set([
  'a', 'al', 'de', 'del', 'el', 'la', 'las', 'lo', 'los', 'un', 'una', 'unos', 'unas',
  'y', 'o', 'u', 'en', 'con', 'por', 'para', 'que', 'se', 'su', 'sus', 'mi', 'mis',
  'tu', 'tus', 'ni', 'sin', 'sobre', 'entre', 'hacia', 'desde', 'hasta', 'como',
]);

const STOPWORDS = new Set([
  'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'del', 'al', 'a',
  'en', 'con', 'por', 'para', 'que', 'se', 'su', 'sus', 'y', 'o', 'u', 'es', 'son',
  'fue', 'fueron', 'este', 'esta', 'estos', 'estas', 'esto', 'como', 'más', 'pero',
  'sino', 'no', 'sí', 'lo', 'le', 'les', 'me', 'te', 'nos', 'os', 'mi', 'tu',
  'nuestro', 'nuestra', 'nuestros', 'nuestras', 'hay', 'ha', 'han', 'ser', 'estar',
  'tiene', 'tienen', 'puede', 'pueden', 'desde', 'hasta', 'entre', 'sobre', 'sin',
  'ni', 'ya', 'muy', 'también', 'así', 'cuando', 'donde', 'mientras', 'porque',
  'pues', 'aunque', 'si', 'cuál', 'cómo', 'qué', 'quién', 'quienes',
]);

const ABSTRACT_WORDS = new Set([
  'importancia', 'relevancia', 'aspecto', 'aspectos', 'elemento', 'elementos',
  'factor', 'factores', 'proceso', 'procesos', 'situación', 'contexto', 'perspectiva',
  'enfoque', 'ámbito', 'nivel', 'desarrollo', 'implementación', 'optimización',
  'solución', 'soluciones', 'experiencia', 'experiencias', 'necesidad', 'necesidades',
  'oportunidad', 'oportunidades', 'desafío', 'desafíos', 'impacto', 'valor', 'calidad',
  'eficiencia', 'efectividad', 'importante', 'fundamental', 'clave',
]);

const CONNECTOR_GROUPS = [
  ['además', 'asimismo', 'por otra parte', 'de igual manera', 'igualmente', 'también'],
  ['sin embargo', 'no obstante', 'por el contrario', 'en cambio', 'ahora bien'],
  ['por consiguiente', 'en consecuencia', 'por lo tanto', 'así pues', 'dado que', 'puesto que'],
  ['en primer lugar', 'en segundo lugar', 'por último', 'finalmente', 'a continuación'],
];

const SYNONYM_GROUPS = [
  ['usuario', 'usuarios', 'personal', 'funcionario', 'funcionarios', 'operador', 'operadores', 'cliente', 'clientes', 'persona', 'personas', 'individuo', 'individuos'],
  ['sistema', 'sistemas', 'plataforma', 'plataformas', 'herramienta', 'herramientas', 'solución', 'soluciones', 'aplicación', 'aplicaciones', 'producto', 'productos', 'servicio', 'servicios'],
];

const TRIAD_ADJ = [
  'seguro', 'segura', 'seguros', 'seguras', 'escalable', 'escalables', 'eficiente',
  'eficientes', 'robusto', 'robusta', 'robustos', 'robustas', 'innovador',
  'innovadora', 'innovadores', 'innovadoras', 'integral', 'integrales', 'moderno',
  'moderna', 'modernos', 'modernas', 'rápido', 'rápida', 'rápidos', 'rápidas',
  'flexible', 'flexibles', 'confiable', 'confiables', 'sostenible', 'sostenibles',
  'inteligente', 'inteligentes', 'optimizado', 'optimizada', 'optimizados',
  'optimizadas', 'dinámico', 'dinámica', 'dinámicos', 'dinámicas',
];

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function phrase(words) {
  const parts = words.map((word) => escapeRegex(word).replace(/\s+/g, '\\s+'));
  return new RegExp(`(?<![\\p{L}\\p{N}])(?:${parts.join('|')})(?![\\p{L}\\p{N}])`, 'giu');
}

const TRIAD = `(?:${TRIAD_ADJ.map(escapeRegex).join('|')})`;

const RULES = [
  // ── P0: artefactos inequívocos ─────────────────────────────────────
  {
    id: 'chatbot-artifact',
    category: 'artefactos-chatbot',
    severity: 'P0',
    pattern: phrase([
      '¡Claro!', 'Claro que sí', '¡Buena pregunta!', '¡Excelente pregunta!',
      'Tienes toda la razón', 'Espero que esta información te sea útil',
      'Espero que la información te sea útil', 'Si tienes alguna pregunta',
      'Si tienes más preguntas', 'No dudes en contactarme', 'Como modelo de lenguaje',
      'Estoy aquí para ayudarte', 'Quedo atento a tus comentarios',
      'A continuación, desglosaremos', 'A continuación, te explicaré',
      'A continuación, te presento', '¿En qué puedo ayudarte?', '¡Con gusto!',
    ]),
    message: 'Artefacto de chatbot: no pertenece a un documento ni a un README.',
    suggestion: 'Borra la muletilla y empieza por el contenido.',
  },
  {
    id: 'placeholder-artifact',
    category: 'artefactos-chatbot',
    severity: 'P0',
    pattern: /\[(?:Tu nombre|INSERTAR[^\]]*|COMPLETAR[^\]]*|TODO[^\]]*|FECHA[^\]]*)\]|\b20\d{2}-XX-XX\b|\bciteturn\d+\b|\boai_citation\b|contentReference\[oaicite:\d+\]|utm_source=chatgpt\.com/giu,
    message: 'Marcador de posición o resto de generación sin rellenar.',
    suggestion: 'Rellena con el dato real o elimina el marcador.',
  },
  {
    id: 'cutoff-disclaimer',
    category: 'artefactos-chatbot',
    severity: 'P0',
    pattern: phrase([
      'A fecha de mi última actualización', 'Hasta mi última actualización',
      'Según mi última actualización', 'Mi conocimiento llega hasta',
      'No tengo acceso a información actualizada',
    ]),
    message: 'Aviso de corte de conocimiento: sobra en un texto entregable.',
    suggestion: 'Elimínalo; si el dato importa, cita la fuente y la fecha.',
  },

  // ── P1: patrones claros de prosa generada ───────────────────────────
  {
    id: 'filler',
    category: 'muletillas',
    severity: 'P1',
    judgment: true,
    pattern: phrase([
      'Cabe destacar', 'Cabe señalar', 'Cabe mencionar', 'Es importante señalar',
      'Es importante destacar', 'Es importante tener en cuenta',
      'Es fundamental comprender', 'Vale la pena destacar', 'Vale la pena señalar',
      'Resulta importante', 'Resulta fundamental', 'En el mundo actual',
      'En la era digital', 'En la actualidad', 'A lo largo de la historia',
      'Desde tiempos inmemoriales', 'En el corazón de', 'En el ámbito de',
      'En el contexto actual', 'Hoy en día', 'Sin lugar a dudas',
      'No cabe duda de que',
    ]),
    message: 'Muletilla de relleno: la frase suele funcionar igual sin ella.',
    suggestion: 'Empieza por la afirmación concreta o borra la muletilla.',
  },
  {
    id: 'relevance-inflation',
    category: 'inflacion-relevancia',
    severity: 'P1',
    pattern: phrase([
      'marca un hito', 'marcó un hito', 'sin precedentes', 'revoluciona',
      'revolucionario', 'revolucionaria', 'de vanguardia', 'disruptivo',
      'disruptiva', 'cambio de juego', 'solución innovadora', 'se erige como',
      'se posiciona como', 'líder indiscutible', 'referente en el sector',
      'desempeña un papel crucial', 'desempeña un papel fundamental',
      'desempeña un papel vital', 'juega un papel clave',
      'juega un papel fundamental',
    ]),
    message: 'Inflación de relevancia o lenguaje promocional.',
    suggestion: 'Di qué hace el objeto, con un dato o una función concreta.',
  },
  {
    id: 'robust-inflation',
    category: 'lexico-ornamental',
    severity: 'P1',
    judgment: true,
    pattern: phrase(['robusto', 'robusta', 'robustos', 'robustas']),
    exceptions: [/\b(?:pruebas? de robustez|robustez|robusto ante|robusta ante|robustos ante|robustas ante|robustez técnica)\b/iu],
    message: '«Robusto» sin criterio medible es un adjetivo ornamental.',
    suggestion: 'Sustitúyelo por el criterio concreto: validación, tolerancia a fallos, etc.',
  },
  {
    id: 'integral-inflation',
    category: 'lexico-ornamental',
    severity: 'P1',
    judgment: true,
    pattern: phrase(['integral', 'integrales']),
    exceptions: [/\bgestión integral\b/iu],
    message: '«Integral» como sinónimo de completo suele ser ornamental.',
    suggestion: 'Enumera el alcance real o usa «completo» si aplica.',
  },
  {
    id: 'lexical-ornamental',
    category: 'lexico-ornamental',
    severity: 'P1',
    judgment: true,
    pattern: phrase([
      'aprovechar', 'profundizar', 'sumergirse', 'desvelar', 'develar',
      'empoderar', 'panorama', 'tejido', 'en constante evolución',
    ]),
    message: 'Léxico ornamental o calco del inglés.',
    suggestion: 'Usa el verbo concreto: analizar, mostrar, permitir, registrar.',
  },
  {
    id: 'lexical-repetition',
    category: 'lexico-ornamental',
    severity: 'P1',
    minOccurrences: 2,
    pattern: phrase([
      'facilitar', 'realizar', 'llevar a cabo', 'implementar',
    ]),
    message: 'Verbo comodín repetido en el mismo párrafo.',
    suggestion: 'Cambia a los verbos concretos que describen la acción.',
  },
  {
    id: 'vague-attribution',
    category: 'atribuciones-vagas',
    severity: 'P1',
    pattern: phrase([
      'Los expertos creen', 'Los expertos consideran', 'Los expertos coinciden',
      'Estudios demuestran', 'Estudios indican', 'Estudios señalan',
      'Investigaciones demuestran', 'Investigaciones sugieren',
      'Es bien sabido que', 'Como es ampliamente reconocido', 'Muchos creen que',
      'Se dice que', 'Fuentes cercanas',
    ]),
    message: 'Atribución vaga o afirmación sin fuente.',
    suggestion: 'Cita la fuente real o marca «[requiere fuente]».',
  },
  {
    id: 'formulaic-opening',
    category: 'aperturas-cierres',
    severity: 'P1',
    pattern: phrase([
      '¿Alguna vez te has preguntado', '¿Te imaginas', 'En el vertiginoso mundo',
      'En el mundo de', 'Todos sabemos que', 'Desde hace mucho tiempo',
    ]),
    message: 'Apertura de molde.',
    suggestion: 'Abre con el problema, el dato o la afirmación.',
  },
  {
    id: 'formulaic-closing',
    category: 'aperturas-cierres',
    severity: 'P1',
    pattern: phrase([
      'En conclusión, el futuro', 'Solo el tiempo dirá', 'El camino por recorrer',
      'El futuro es prometedor', 'El futuro se presenta prometedor',
      'Las posibilidades son infinitas', 'Esto es solo el comienzo',
      'Sin duda, un antes y un después',
    ]),
    message: 'Cierre genérico o promesa final sin contenido.',
    suggestion: 'Cierra con una limitación, un resultado o un trabajo futuro concreto.',
  },
  {
    id: 'empty-contrast',
    category: 'sintaxis-generada',
    severity: 'P1',
    pattern: /(?<![\p{L}\p{N}])(?:No es solo|No solo|Más que)\s+[^.!?\n]{1,120}?(?:,\s*(?:es|sino que también|sino)\s+)[^.!?\n]{1,120}/giu,
    message: 'Contraste vacío o molde «no es solo X, es Y».',
    suggestion: 'Afirma directamente qué es, sin el molde de contraste.',
  },
  {
    id: 'decorative-triple',
    category: 'sintaxis-generada',
    severity: 'P1',
    judgment: true,
    pattern: new RegExp(
      `(?<![\\p{L}\\p{N}])${TRIAD}\\s*,\\s*${TRIAD}\\s+y\\s*${TRIAD}(?![\\p{L}\\p{N}])`,
      'giu',
    ),
    message: 'Triplete decorativo de adjetivos.',
    suggestion: 'Conserva el adjetivo que tenga respaldo o conviértelo en dato.',
  },
  {
    id: 'hedge-stack',
    category: 'sintaxis-generada',
    severity: 'P1',
    pattern: phrase([
      'podría potencialmente', 'podría eventualmente', 'puede llegar a ser',
      'es posible que quizás', 'podría tal vez', 'eventualmente podría',
    ]),
    message: 'Predicción con incertidumbre apilada.',
    suggestion: 'Deja una sola marca de duda y precisa la condición.',
  },
  {
    id: 'narrated-candor',
    category: 'falsa-candidez',
    severity: 'P1',
    pattern: phrase([
      'En aras de la transparencia', 'Para ser honesto', 'Para ser honesta',
      'Siendo franco', 'Siendo franca', 'Debo admitir', 'Voy a ser claro',
      'Voy a ser clara', 'Permíteme ser honesto', 'Permíteme ser honesta',
    ]),
    message: 'Candidez narrada: anuncia una confesión en vez de hacerla.',
    suggestion: 'Haz la aclaración directamente o elimínala.',
  },
  {
    id: 'social-endorsement',
    category: 'cierres-redes',
    severity: 'P1',
    pattern: phrase([
      'Te lo recomiendo', 'No te arrepentirás', 'Vale la pena leerlo',
      'Gracias a mí', 'Te ahorrará tiempo', 'No te lo pierdas',
    ]),
    message: 'Cierre de recomendación social.',
    suggestion: 'Cierra con el contenido, no con la recomendación.',
  },
  {
    id: 'lingering-attention',
    category: 'cierres-redes',
    severity: 'P1',
    pattern: phrase([
      'No puedo dejar de pensar en', 'La frase que no me suelto',
      'Me quedé pensando en', 'Hay una idea que me ronda',
      'No me lo quito de la cabeza',
    ]),
    message: 'Afirmación de atención persistente; suele ser un molde de LinkedIn.',
    suggestion: 'Explica la idea directamente, sin narrar cuánto te ronda.',
  },
  {
    id: 'real-actual-inflation',
    category: 'lexico-ornamental',
    severity: 'P1',
    pattern: phrase([
      'verdadero cambio', 'verdadera revolución', 'auténtica revolución',
      'real impacto', 'verdadero impacto', 'auténtico impacto',
    ]),
    message: 'Inflación con «verdadero», «real» o «auténtico».',
    suggestion: 'Muestra el cambio con un dato o una consecuencia.',
  },
  {
    id: 'copula-avoidance',
    category: 'sintaxis-generada',
    severity: 'P2',
    pattern: phrase([
      'se erige como', 'se constituye en', 'constituye un', 'constituye una',
      'representa un', 'representa una', 'desempeña un papel', 'juega un rol',
      'actúa como',
    ]),
    message: 'Perífrasis para evitar el verbo directo.',
    suggestion: 'Usa «es», «tiene» o el verbo concreto que corresponda.',
  },
  {
    id: 'generic-conclusion',
    category: 'aperturas-cierres',
    severity: 'P2',
    pattern: phrase([
      'El futuro es prometedor', 'El futuro se presenta prometedor',
      'Las posibilidades son infinitas', 'Solo el tiempo dirá',
      'El camino por recorrer', 'Esto es solo el comienzo',
    ]),
    message: 'Conclusión genérica.',
    suggestion: 'Sustitúyela por un resultado, una limitación o una pregunta concreta.',
  },
];

const STYLE_RULES = [
  { id: 'em-dash-rate', category: 'ritmo', severity: 'P2' },
  { id: 'uniform-paragraph-length', category: 'ritmo', severity: 'P2' },
  { id: 'uniform-sentence-length', category: 'ritmo', severity: 'P2' },
  { id: 'connector-repetition', category: 'ritmo', severity: 'P2' },
  { id: 'repeated-openings', category: 'ritmo', severity: 'P2' },
  { id: 'low-density-paragraph', category: 'ritmo', severity: 'P2' },
  { id: 'synonym-cycling', category: 'ritmo', severity: 'P2' },
  { id: 'title-case-heading', category: 'formato', severity: 'P1' },
  { id: 'bold-overuse', category: 'formato', severity: 'P1' },
  { id: 'bold-label-list', category: 'formato', severity: 'P1' },
  { id: 'emoji', category: 'formato', severity: 'P1' },
  { id: 'rhetorical-question-chain', category: 'formato', severity: 'P1' },
  { id: 'hashtag-stuffing', category: 'formato', severity: 'P2', severityByContext: { linkedin: 'P1' } },
];
const STYLE_RULE = Object.fromEntries(STYLE_RULES.map((rule) => [rule.id, rule]));

// ── Utilidades ────────────────────────────────────────────────────────

function cloneRegex(re) {
  const flags = re.flags.includes('g') ? re.flags : `${re.flags}g`;
  return new RegExp(re.source, flags);
}

function wordCount(text) {
  return (text.match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu) || []).length;
}

function lineColumn(text, index) {
  const before = text.slice(0, index);
  const lastNewline = before.lastIndexOf('\n');
  return {
    line: before.split('\n').length,
    column: index - lastNewline,
  };
}

function splitParagraphsWithOffsets(text) {
  const parts = [];
  let start = 0;
  const re = /\n\s*\n/g;
  let match;
  while ((match = re.exec(text)) !== null) {
    parts.push({ start, end: match.index, text: text.slice(start, match.index) });
    start = match.index + match[0].length;
  }
  parts.push({ start, end: text.length, text: text.slice(start) });
  return parts.filter((part) => part.text.trim() !== '');
}

function splitSentences(text) {
  return text
    .replace(/\b(?:Dr|Dra|Sr|Sra|Ing|Lic|etc|p|pp|núm|fig|tab|cap)\./giu, (value) => value.replace('.', '·'))
    .split(/(?<=[.!?…])\s+|\n{2,}/u)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function findParagraph(paragraphs, index) {
  return paragraphs.find((part) => index >= part.start && index <= part.end)
    || paragraphs[0]
    || { start: 0, end: 0, text: '' };
}

function sentenceAround(text, index) {
  const before = Math.max(
    text.lastIndexOf('.', index),
    text.lastIndexOf('?', index),
    text.lastIndexOf('!', index),
    text.lastIndexOf('\n', index),
  );
  const afterCandidates = [
    text.indexOf('.', index),
    text.indexOf('?', index),
    text.indexOf('!', index),
    text.indexOf('\n', index),
  ].filter((candidate) => candidate !== -1);
  const after = afterCandidates.length ? Math.min(...afterCandidates) : text.length;
  return text.slice(Math.max(0, before + 1), after + 1);
}

function normalizeContext(context) {
  const normalized = String(context || 'general')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
  return CONTEXTS[normalized] ? normalized : 'general';
}

function resolveSeverity(rule, context) {
  return (rule.severityByContext && rule.severityByContext[context]) || rule.severity;
}

function countTerm(text, term) {
  const pattern = escapeRegex(term).replace(/\s+/g, '\\s+');
  const re = new RegExp(`(?<![\\p{L}\\p{N}])${pattern}(?![\\p{L}\\p{N}])`, 'giu');
  return (text.match(re) || []).length;
}

function countRule(rule, text) {
  const re = cloneRegex(rule.pattern);
  let count = 0;
  let match;
  while ((match = re.exec(text)) !== null) {
    count += 1;
    if (match.index === re.lastIndex) re.lastIndex += 1;
  }
  return count;
}

function fenceSpans(text) {
  const spans = [];
  const lines = text.split('\n');
  let cursor = 0;
  let open = null;

  for (const line of lines) {
    const marker = line.match(/^[ \t]{0,3}(`{3,}|~{3,})/);
    if (!open) {
      const isOpen = marker
        && !(marker[1][0] === '`' && line.slice(marker[0].length).includes('`'));
      if (isOpen) open = { marker: marker[1][0], length: marker[1].length, start: cursor };
    } else {
      const isClose = marker
        && marker[1][0] === open.marker
        && marker[1].length >= open.length
        && /^[ \t]*\r?$/.test(line.slice(marker[0].length));
      if (isClose) {
        spans.push([open.start, cursor + line.length]);
        open = null;
      }
    }
    cursor += line.length + 1;
  }

  if (open) spans.push([open.start, text.length]);
  return spans;
}

function maskProtectedText(text, options = {}) {
  const ranges = [];
  const add = (start, end) => {
    if (end > start) ranges.push([start, end]);
  };
  const addRegex = (re) => {
    const rx = cloneRegex(re);
    let match;
    while ((match = rx.exec(text)) !== null) {
      add(match.index, match.index + match[0].length);
      if (match.index === rx.lastIndex) rx.lastIndex += 1;
    }
  };

  const frontmatter = text.match(/^---\n[\s\S]*?\n---(?=\n|$)/);
  if (frontmatter) add(0, frontmatter[0].length);

  const looksLatex = /\\[a-zA-Z@]+(?:\{|\[)|\\(?:begin|end)\{/.test(text);

  for (const [start, end] of fenceSpans(text)) add(start, end);
  addRegex(/`[^`\n]+`/g);
  addRegex(/<!--[\s\S]*?-->/g);

  const environments = [
    'equation', 'equation*', 'align', 'align*', 'figure', 'figure*', 'table', 'table*',
    'tabular', 'tabularx', 'tikzpicture', 'lstlisting', 'verbatim', 'thebibliography',
    'displaymath', 'math',
  ];
  if (looksLatex) {
    for (const environment of environments) {
      const name = escapeRegex(environment);
      addRegex(new RegExp(`\\\\begin\\{${name}\\}[\\s\\S]*?\\\\end\\{${name}\\}`, 'g'));
    }
    addRegex(/(?<!\\)%.*$/gm);
    addRegex(/\\[a-zA-Z@]+\*?(?:\[[^\]]*\])?(?:\{[^{}]*\})*/g);
    addRegex(/\$\$[\s\S]*?\$\$/g);
    addRegex(/\$[^$\n]+\$/g);
    addRegex(/\\\[[\s\S]*?\\\]/g);
    addRegex(/\\\([\s\S]*?\\\)/g);
  } else if (/\$[^$\n]*[\\^_=][^$\n]*\$/.test(text)) {
    addRegex(/\$[^$\n]+\$/g);
  }

  addRegex(/https?:\/\/[^\s)>\]"'`]+/g);
  addRegex(/\[[^\]\n]*\]\([^)\n]*\)/g);
  addRegex(/^\[[^\]]+\]:\s+\S+.*$/gm);
  addRegex(/^[ \t]*\|.*$/gm);

  if (!options.includeQuotes) {
    addRegex(/^[ \t]*>.*$/gm);
    addRegex(/“[^”]{0,1000}”/g);
    addRegex(/"[^"]{0,1000}"/g);
    addRegex(/‘[^’]{0,1000}’/g);
    addRegex(/«[^»]{0,1000}»/g);
  }

  addRegex(/\([^()\n]{0,200}\b(?:19|20)\d{2}[a-z]?\b[^()\n]*\)/g);
  addRegex(/\b[\p{Lu}][\p{L}'-]+(?:\s+(?:et\s+al\.|y\s+[\p{Lu}][\p{L}'-]+))?\s+\((?:19|20)\d{2}[a-z]?\)/gu);
  addRegex(/\b(?:et\s+al\.|s\.\s*f\.|p\.\s*p?\.|párr\.)/giu);

  addRegex(/(?:^|[\s(])((?:\.{0,2}\/)[A-Za-z0-9._~\-]+(?:\/[A-Za-z0-9._~\-]+)*|[A-Za-z]:\\[A-Za-z0-9._\\~\-]+)/g);
  addRegex(/\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b/g);

  const characters = text.split('');
  for (const [start, end] of ranges) {
    for (let index = start; index < end; index += 1) {
      if (characters[index] !== '\n' && characters[index] !== '\r') characters[index] = ' ';
    }
  }
  return characters.join('');
}

function computeStats(text, masked, paragraphs) {
  const words = wordCount(masked);
  const sentenceTexts = splitSentences(masked);
  const sentenceWordCounts = sentenceTexts.map(wordCount).filter((count) => count > 0);
  const paragraphWordCounts = paragraphs.map((part) => wordCount(part.text)).filter((count) => count > 0);
  const mean = (values) => (values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0);
  const cv = (values) => {
    if (values.length < 2) return 0;
    const average = mean(values);
    if (average === 0) return 0;
    const variance = values.reduce((sum, value) => sum + ((value - average) ** 2), 0) / values.length;
    return Math.sqrt(variance) / average;
  };
  const emDashes = (masked.match(/—/g) || []).length;
  const boldSpans = (text.match(/\*\*[^*\n]+\*\*/g) || []).length;
  const headings = [...text.matchAll(/^(#{1,6})[ \t]+(.+?)[ \t]*$/gm)]
    .map((match) => ({ level: match[1].length, text: match[2], index: match.index }));
  const questions = (masked.match(/\?/g) || []).length;
  const hashtags = (text.match(/(?:^|\s)#[\p{L}\p{N}_]+/gu) || []).length;

  return {
    words,
    paragraphs: paragraphWordCounts.length,
    sentences: sentenceWordCounts.length,
    paragraphWordCounts,
    sentenceWordCounts,
    paragraphLengthCV: cv(paragraphWordCounts),
    sentenceLengthCV: cv(sentenceWordCounts),
    meanParagraphWords: mean(paragraphWordCounts),
    meanSentenceWords: mean(sentenceWordCounts),
    emDashes,
    emDashesPer1000: words ? (emDashes / words) * 1000 : 0,
    boldSpans,
    headings,
    questions,
    hashtags,
  };
}

function hasProperNoun(sentence) {
  const words = sentence.split(/\s+/).filter(Boolean);
  return words.some((word, index) => {
    if (index === 0) return false;
    const clean = word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
    return clean.length > 1
      && /^\p{Lu}/u.test(clean)
      && !/^\p{Lu}{2,}$/u.test(clean);
  });
}

function isTitleCaseHeading(heading) {
  const cleaned = heading
    .replace(/\([^)]*\)/g, ' ')
    .replace(/^\s*(?:\d+(?:\.\d+)*\.?|[IVXLC]+\.)\s*/u, '')
    .replace(/[*_`#]/g, ' ')
    .trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length < 3) return false;

  let major = 0;
  for (let index = 1; index < words.length; index += 1) {
    const word = words[index].replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
    if (!/^\p{Lu}\p{Ll}+$/u.test(word)) continue;
    if (MINOR_ES.has(word.toLowerCase())) continue;
    major += 1;
  }
  return major >= 2;
}

function makeIssue(text, rule, match, index, message, suggestion, judgment) {
  const location = lineColumn(text, index);
  return {
    rule: rule.id,
    category: rule.category,
    severity: rule.severity,
    match: String(match || '').trim().slice(0, 200),
    index,
    line: location.line,
    column: location.column,
    message,
    suggestion: suggestion || null,
    judgment: Boolean(judgment),
  };
}

function stylometryIssues(text, masked, paragraphs, stats, context) {
  const issues = [];
  const add = (rule, match, index, message, suggestion, judgment = false, severity = null) => {
    const issue = makeIssue(text, rule, match, index, message, suggestion, judgment);
    if (severity) issue.severity = severity;
    issues.push(issue);
  };

  if (stats.words >= 150 && stats.emDashesPer1000 > 1) {
    add(
      STYLE_RULE['em-dash-rate'],
      '—',
      Math.max(0, text.indexOf('—')),
      `Frecuencia alta de rayas: ${stats.emDashes} en ${stats.words} palabras (${stats.emDashesPer1000.toFixed(1)} por 1000).`,
      'Sustituye algunas por coma, punto o paréntesis; conserva solo los incisos reales.',
      false,
    );
  }

  if (stats.paragraphWordCounts.length >= 4 && stats.meanParagraphWords >= 20 && stats.paragraphLengthCV < 0.25) {
    const within = stats.paragraphWordCounts.filter((count) => {
      const ratio = count / stats.meanParagraphWords;
      return ratio >= 0.8 && ratio <= 1.2;
    }).length;
    if (within / stats.paragraphWordCounts.length >= 0.7) {
      add(
        STYLE_RULE['uniform-paragraph-length'],
        paragraphs[0].text.slice(0, 80),
        paragraphs[0].start,
        `Párrafos de longitud uniforme: ${stats.paragraphWordCounts.length} párrafos con media de ${stats.meanParagraphWords.toFixed(0)} palabras y variación ${(stats.paragraphLengthCV * 100).toFixed(0)} %.`,
        'Deja que la longitud siga el contenido: un párrafo puede ser una frase o cinco.',
        true,
      );
    }
  }

  if (stats.sentenceWordCounts.length >= 10 && stats.meanSentenceWords >= 8 && stats.sentenceLengthCV < 0.22) {
    add(
      STYLE_RULE['uniform-sentence-length'],
      splitSentences(masked)[0] || '',
      0,
      `Oraciones de longitud uniforme: ${stats.sentenceWordCounts.length} oraciones con media de ${stats.meanSentenceWords.toFixed(0)} palabras y variación ${(stats.sentenceLengthCV * 100).toFixed(0)} %.`,
      'Varía la longitud agrupando o cortando oraciones; no partas frases solo para simular ritmo.',
      true,
    );
  }

  for (const paragraph of paragraphs) {
    const paragraphWords = wordCount(paragraph.text);
    if (paragraphWords < 25) continue;

    const connectorHits = [];
    for (const group of CONNECTOR_GROUPS) {
      for (const connector of group) {
        if (countTerm(paragraph.text, connector) > 0) connectorHits.push(connector);
      }
    }
    const distinctConnectors = [...new Set(connectorHits)];
    if (distinctConnectors.length >= 3 && paragraphWords < 200) {
      add(
        STYLE_RULE['connector-repetition'],
        distinctConnectors.join(', '),
        paragraph.start,
        `Acumulación de conectores en un párrafo de ${paragraphWords} palabras: ${distinctConnectors.join(', ')}.`,
        'Deja que el contenido marque la transición; elimina los conectores que no cambien el sentido.',
        true,
      );
    }

    const sentences = splitSentences(paragraph.text).filter((sentence) => wordCount(sentence) >= 3);
    if (sentences.length >= 4) {
      const openings = new Map();
      for (const sentence of sentences) {
        const first = (sentence.match(/^[\p{L}\p{N}]+/u) || [''])[0].toLowerCase();
        if (!first || STOPWORDS.has(first)) continue;
        openings.set(first, (openings.get(first) || 0) + 1);
      }
      for (const [word, count] of openings.entries()) {
        if (count >= 3) {
          add(
            STYLE_RULE['repeated-openings'],
            word,
            paragraph.start,
            `Aperturas repetidas: ${count} oraciones del párrafo empiezan por «${word}».`,
            'Cambia el orden o el sujeto de algunas oraciones; no fuerces sinónimos.',
            true,
          );
        }
      }
    }

    if (paragraphWords >= 60) {
      const abstractCount = (paragraph.text.match(/[\p{L}\p{N}]+/gu) || [])
        .map((word) => word.toLowerCase())
        .filter((word) => ABSTRACT_WORDS.has(word)).length;
      const abstractRatio = abstractCount / paragraphWords;
      const hasDigit = /\d/.test(paragraph.text);
      const hasAcronym = /\b[A-ZÁÉÍÓÚÑ]{2,}\b/u.test(paragraph.text);
      const hasProper = hasProperNoun(paragraph.text);
      if (!hasDigit && !hasAcronym && !hasProper && abstractRatio >= 0.06) {
        add(
          STYLE_RULE['low-density-paragraph'],
          paragraph.text.slice(0, 80),
          paragraph.start,
          'Párrafo con muchas nociones abstractas y pocos anclajes concretos (cifras, nombres, siglas).',
          'Añade un dato, un ejemplo o una consecuencia verificable; si no existe, señala el vacío.',
          true,
        );
      }
    }

    for (const group of SYNONYM_GROUPS) {
      const found = group.filter((term) => countTerm(paragraph.text, term) > 0);
      if (found.length >= 3) {
        add(
          STYLE_RULE['synonym-cycling'],
          found.join(', '),
          paragraph.start,
          `Ciclo de sinónimos para el mismo referente: ${found.join(', ')}.`,
          'Elige el término más claro y repítelo; la variación no es un valor en sí.',
          true,
        );
      }
    }
  }

  for (const heading of stats.headings) {
    if (isTitleCaseHeading(heading.text)) {
      add(
        STYLE_RULE['title-case-heading'],
        heading.text,
        heading.index,
        'Encabezado en Title Case; en español solo la inicial y los nombres propios llevan mayúscula.',
        'Pásalo a sentence case: «Análisis de riesgos de la plataforma».',
        true,
      );
    }
  }

  if (stats.boldSpans >= 8 && (stats.boldSpans / Math.max(stats.words, 1)) * 1000 > 30) {
    add(
      STYLE_RULE['bold-overuse'],
      `${stats.boldSpans} negritas`,
      Math.max(0, text.indexOf('**')),
      `Uso excesivo de negritas: ${stats.boldSpans} en ${stats.words} palabras.`,
      'Deja en negrita solo los datos o términos que el lector necesita localizar.',
      true,
    );
  }

  const boldLabels = [...text.matchAll(/^[ \t]*[-*]\s+\*\*[^*\n]+\*\*\s*:/gm)];
  if (boldLabels.length >= 3) {
    add(
      STYLE_RULE['bold-label-list'],
      boldLabels[0][0].trim(),
      boldLabels[0].index,
      `Lista con ${boldLabels.length} etiquetas en negrita seguidas.`,
      'Si el contenido cabe en un párrafo, quita las etiquetas; si no, deja solo las imprescindibles.',
      true,
    );
  }

  if (!['casual', 'blog'].includes(context)) {
    const emoji = text.match(/\p{Extended_Pictographic}/u);
    if (emoji) {
      add(
        STYLE_RULE['emoji'],
        emoji[0],
        emoji.index,
        'Emoji en un texto académico o técnico.',
        'Quítalo del encabezado o de la lista.',
        false,
      );
    }
  }

  if (!['academico', 'docs'].includes(context)) {
    let longestChain = 0;
    for (const paragraph of paragraphs) {
      const sentences = splitSentences(paragraph.text);
      let chain = 0;
      for (const sentence of sentences) {
        if (/\?\s*$/.test(sentence)) {
          chain += 1;
          longestChain = Math.max(longestChain, chain);
        } else {
          chain = 0;
        }
      }
    }
    if (longestChain >= 2) {
      add(
        STYLE_RULE['rhetorical-question-chain'],
        'Preguntas retóricas encadenadas',
        0,
        `Cadena de ${longestChain} preguntas retóricas seguidas.`,
        'Reduce la cadena a la pregunta que realmente abre el problema.',
        true,
      );
    }
  }

  if (!['academico', 'tecnico', 'docs'].includes(context) && stats.hashtags >= 3) {
    add(
      { ...STYLE_RULE['hashtag-stuffing'], severity: resolveSeverity(STYLE_RULE['hashtag-stuffing'], context) },
      `${stats.hashtags} hashtags`,
      0,
      `Acumulación de hashtags: ${stats.hashtags}.`,
      'Conserva solo los que ayuden a encontrar el contenido.',
      true,
    );
  }

  return issues;
}

function dedupeIssues(issues) {
  const kept = [];
  for (const issue of issues) {
    const issueEnd = issue.index + Math.max(issue.match.length, 1);
    const overlapIndex = kept.findIndex((existing) => {
      const existingEnd = existing.index + Math.max(existing.match.length, 1);
      return issue.index < existingEnd && issueEnd > existing.index;
    });
    if (overlapIndex === -1) {
      kept.push(issue);
      continue;
    }
    const existing = kept[overlapIndex];
    const issueRank = SEVERITY_RANK[issue.severity] ?? 9;
    const existingRank = SEVERITY_RANK[existing.severity] ?? 9;
    if (issueRank < existingRank || (issueRank === existingRank && issue.index < existing.index)) {
      kept[overlapIndex] = issue;
    }
  }
  return kept.sort((a, b) => a.index - b.index || (SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]) || a.rule.localeCompare(b.rule));
}

function analyzeText(input, options = {}) {
  const text = String(input == null ? '' : input).replace(/\r\n?/g, '\n').normalize('NFC');
  const context = normalizeContext(options.context);
  const includeQuotes = Boolean(options.includeQuotes);
  const severities = Array.isArray(options.severities) && options.severities.length
    ? new Set(options.severities)
    : new Set(['P0', 'P1', 'P2']);
  const masked = maskProtectedText(text, { includeQuotes });
  const paragraphs = splitParagraphsWithOffsets(masked);
  const stats = computeStats(text, masked, paragraphs);
  const patternIssues = [];

  for (const rule of RULES) {
    if (CONTEXTS[context].skip.includes(rule.id)) continue;
    const severity = resolveSeverity(rule, context);
    if (!severities.has(severity)) continue;

    const re = cloneRegex(rule.pattern);
    let match;
    while ((match = re.exec(masked)) !== null) {
      if (!match[0].trim()) {
        if (match.index === re.lastIndex) re.lastIndex += 1;
        continue;
      }

      const paragraph = findParagraph(paragraphs, match.index);
      if (rule.minOccurrences && countRule(rule, paragraph.text) < rule.minOccurrences) {
        if (match.index === re.lastIndex) re.lastIndex += 1;
        continue;
      }
      if (rule.exceptions && rule.exceptions.some((exception) => exception.test(sentenceAround(masked, match.index)))) {
        if (match.index === re.lastIndex) re.lastIndex += 1;
        continue;
      }

      const originalMatch = text.slice(match.index, match.index + match[0].length);
      patternIssues.push(makeIssue(
        text,
        { ...rule, severity },
        originalMatch,
        match.index,
        rule.message,
        rule.suggestion,
        rule.judgment,
      ));
      if (match.index === re.lastIndex) re.lastIndex += 1;
    }
  }

  const styleIssues = stylometryIssues(text, masked, paragraphs, stats, context)
    .filter((issue) => severities.has(issue.severity) && !CONTEXTS[context].skip.includes(issue.rule));

  const deduped = dedupeIssues(patternIssues)
    .concat(styleIssues)
    .sort((a, b) => a.index - b.index
      || (SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity])
      || a.rule.localeCompare(b.rule));
  const counts = { P0: 0, P1: 0, P2: 0 };
  for (const issue of deduped) counts[issue.severity] += 1;

  return {
    issues: deduped,
    counts,
    stats,
    context,
    document_classification: 'SCORED',
    tooShort: stats.words < 10,
    tooLong: false,
    unsupportedScript: false,
  };
}

function formatResult(result) {
  const lines = [];
  lines.push(`Contexto: ${result.context}`);
  lines.push(`Palabras: ${result.stats.words} | Párrafos: ${result.stats.paragraphs} | Oraciones: ${result.stats.sentences}`);
  lines.push(`Hallazgos: P0 ${result.counts.P0} | P1 ${result.counts.P1} | P2 ${result.counts.P2}`);
  if (!result.issues.length) {
    lines.push('Sin hallazgos en las severidades seleccionadas.');
  } else {
    for (const issue of result.issues) {
      const judgment = issue.judgment ? ' (juicio editorial)' : '';
      lines.push(`  ${issue.severity} [${issue.category}] L${issue.line}: ${issue.match}${judgment}`);
      lines.push(`    ${issue.message}`);
    }
  }
  return lines.join('\n');
}

module.exports = {
  analyzeText,
  formatResult,
  maskProtectedText,
  RULES,
  STYLE_RULES,
  CONTEXTS,
};
