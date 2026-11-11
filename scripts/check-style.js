#!/usr/bin/env node
/*
 * check-style.js — deterministic conformance check for a user-supplied house-style
 * config's MECHANICS. It verifies "did the output apply the config it was given"; it
 * does not judge register (that's the model's job). No bundled guides — the rules come
 * entirely from the config you pass.
 *
 * Usage: node scripts/check-style.js <file.md> --config <config.json|name> [--json]
 * Exit codes: 0 clean, 1 a hard violation, 2 a tool/usage error (missing or unreadable
 * config, no mechanics). Unrecognized config keys/values are surfaced as warnings.
 *
 * Hard-checkable mechanics: quotes, latinAbbrev. Heading case, em-dash rate, and number
 * spelling are ADVISORY (heading case can't be verified deterministically — proper nouns
 * make sentence and title case ambiguous). serialComma is declared but model-applied only.
 * See examples/README.md. Skipped before checking: frontmatter (only when it closes), code
 * (fenced and inline), and markdown link destinations, link titles, and reference-definition
 * tails, since a link title is delimited with straight quotes as SYNTAX.
 * HTML tags, comments, reference labels, escapes, and indented code are protected by
 * the same offset-stable Markdown mask as normalize-quotes.js. Straight feet/inch primes
 * (5'11") after a digit are carved out. The latinAbbrev parenthesis carve-out tracks
 * depth across wrapped lines but resets at a paragraph break, so an unclosed "("
 * disables that rule for the rest of its paragraph.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { markdownProse } = require('./markdown-prose.js');

/**
 * Resolve a --config argument to a file path. The decision is by SHAPE, not by what
 * happens to exist in the working directory: an arg with a path separator or a .json
 * suffix is a path (used as-is if it exists, else null); anything else is a bare name
 * resolved against examples/<name>.json. Deciding by shape stops a file named "technical"
 * sitting in the cwd from shadowing examples/technical.json. Bare names can't traverse
 * out of examples/. Null if nothing matches.
 */
function resolveConfig(arg) {
  if (!arg) return null;
  if (/[\\/]/.test(arg) || /\.json$/i.test(arg)) return fs.existsSync(arg) ? arg : null;
  const q = arg.trim().toLowerCase();
  // No traversal guard needed: a bare name has no separator (anything with one took the
  // path branch above), so it joins as a single segment inside examples/ by construction.
  const direct = path.join(__dirname, '..', 'examples', `${q}.json`);
  return fs.existsSync(direct) ? direct : null;
}

// Known mechanics keys and their allowed values (for config validation).
const KNOWN = {
  quotes: ['straight', 'curly'],
  headings: ['sentence', 'title'],
  latinAbbrev: ['parentheses', 'never', 'any'],
  emDash: ['sparing', 'deliberate'],
  spellNumbersUpTo: 'number',
  serialComma: 'boolean',
};

const SMALL = new Set([
  // Inglés (compatibilidad con configuraciones existentes)
  'a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'in', 'of', 'on', 'or', 'the', 'to', 'with', 'vs', 'nor', 'so', 'yet',
  // Español
  'a', 'al', 'de', 'del', 'el', 'la', 'las', 'lo', 'los', 'un', 'una', 'unos', 'unas',
  'y', 'o', 'u', 'en', 'con', 'por', 'para', 'que', 'se', 'su', 'sus', 'mi', 'mis',
  'tu', 'tus', 'ni', 'sin', 'sobre', 'entre', 'hacia', 'desde', 'hasta', 'como',
]);
const majorWords = (h) => h.replace(/[*_`]/g, '').trim().split(/\s+/).slice(1)
  .map((w) => w.replace(/[^\p{L}\p{N}]/gu, ''))
  .filter((b) => b && b !== b.toUpperCase() && !SMALL.has(b.toLowerCase())); // drop acronyms + minor words
const isTitleCase = (h) => majorWords(h).filter((b) => /^\p{Lu}/u.test(b)).length >= 2;
const looksSentenceCase = (h) => { const w = majorWords(h); return w.length >= 1 && w.every((b) => /^\p{Ll}/u.test(b)); };

/** Returns { hard, advisory, warnings } for the config's mechanics; register is not checked. */
function check(text, mechanics) {
  const m = mechanics || {};
  const warnings = [];
  for (const [k, v] of Object.entries(m)) {
    if (!(k in KNOWN)) { warnings.push({ rule: 'unknown-key', detail: k }); continue; }
    const spec = KNOWN[k];
    if (Array.isArray(spec)) { if (!spec.includes(v)) warnings.push({ rule: 'unknown-value', detail: `${k}: ${JSON.stringify(v)}` }); }
    else if (typeof v !== spec) warnings.push({ rule: 'unknown-value', detail: `${k}: ${JSON.stringify(v)} (expected ${spec})` });
  }

  const { prose, paraBreak } = markdownProse(text);
  const joined = prose.join('\n');
  const words = (joined.match(/[\p{L}\p{N}]+/gu) || []).length;
  const hard = [];
  const advisory = [];
  const heads = prose.map((l, i) => [i + 1, l.match(/^#{1,6}\s+(.*)$/)]).filter(([, h]) => h);

  if (m.quotes === 'straight') {
    prose.forEach((l, i) => { if (/[“”‘’]/.test(l)) hard.push({ line: i + 1, rule: 'quotes-should-be-straight' }); });
  } else if (m.quotes === 'curly') {
    prose.forEach((l, i) => {
      const c = l.replace(/(\d)['"]/g, '$1'); // carve out feet/inch primes (5'11")
      if (/"/.test(c)) hard.push({ line: i + 1, rule: 'double-quote-should-be-curly' });
      if (/[A-Za-z]'[A-Za-z]|[A-Za-z]'(?!\w)|(^|\s)'/.test(c)) hard.push({ line: i + 1, rule: 'apostrophe-should-be-curly' });
    });
  }

  // El caso del encabezado es un AVISO: los nombres propios hacen ambiguo el sentence
  // case frente al title case, así que no se puede verificar sin falsos positivos.
  if (m.headings === 'sentence') {
    heads.forEach(([ln, h]) => { if (isTitleCase(h[1])) advisory.push({ line: ln, rule: 'heading-may-need-sentence-case' }); });
  } else if (m.headings === 'title') {
    heads.forEach(([ln, h]) => { if (looksSentenceCase(h[1])) advisory.push({ line: ln, rule: 'heading-may-need-title-case' }); });
  }

  if (m.latinAbbrev === 'parentheses' || m.latinAbbrev === 'never') {
    // Paren depth carries across lines, so a parenthetical that wraps keeps its carve-out,
    // but RESETS at a blank line: a prose parenthetical can't span a paragraph, and without
    // the reset one stray "(" (a ":(" smiley) would suppress every later finding in the
    // document. That trades an unbounded silent false negative for a paragraph-wide one.
    let depth = 0;
    prose.forEach((l, i) => {
      if (paraBreak[i]) { depth = 0; return; }
      const re = /\b(e\.g\.|i\.e\.)/gi;
      let mm;
      while ((mm = re.exec(l)) !== null) {
        if (m.latinAbbrev === 'never') { hard.push({ line: i + 1, rule: 'latin-abbrev-not-allowed' }); continue; }
        const before = l.slice(0, mm.index);
        const at = depth + (before.match(/\(/g) || []).length - (before.match(/\)/g) || []).length;
        if (at <= 0) hard.push({ line: i + 1, rule: 'latin-abbrev-outside-parens' });
      }
      depth = Math.max(0, depth + (l.match(/\(/g) || []).length - (l.match(/\)/g) || []).length);
    });
  }

  if (m.emDash === 'sparing') {
    const em = (joined.match(/—/g) || []).length;
    if (em > Math.floor(words / 1000)) advisory.push({ rule: 'em-dash-rate', detail: `${em} in ${words} words` });
  }

  if (typeof m.spellNumbersUpTo === 'number') {
    prose.forEach((l, i) => {
      if (/^\s*([-*]|\d+\.)\s/.test(l)) return;
      const nums = (l.match(/(?<![\w.$:])\d{1,3}(?![\w.%:])/g) || []).filter((n) => +n <= m.spellNumbersUpTo);
      if (nums.length) advisory.push({ line: i + 1, rule: 'number-may-need-spelling', detail: nums.join(', ') });
    });
  }

  return { hard, advisory, warnings };
}

module.exports = { check, resolveConfig };

if (require.main === module) {
  // Parse by position, not by value: the old `a !== cfgArg` filter made a file whose name
  // equalled the config value (e.g. a real file `technical` with `--config technical`)
  // unreachable, and silently ignored a second file argument.
  const argv = process.argv.slice(2);
  let cfgArg = null, json = false, file = null;
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--config') {
      const nx = argv[i + 1];
      if (nx !== undefined && !nx.startsWith('--')) { cfgArg = nx; i += 1; } // else: missing value
    } else if (a === '--json') { json = true; }
    else if (a.startsWith('--')) { console.error(`opción desconocida: ${a}`); process.exit(2); }
    else if (file === null) { file = a; }
    else { console.error(`argumento extra: ${a}`); process.exit(2); }
  }
  if (!file || !cfgArg) { console.error('uso: check-style.js <archivo> --config <config.json|nombre> [--json]'); process.exit(2); }
  const cfgPath = resolveConfig(cfgArg);
  if (!cfgPath) {
    console.error(`no se encontró la configuración: "${cfgArg}"\nPasa una ruta a un JSON o un nombre que coincida con examples/<nombre>.json (por ejemplo, --config es-academico). Ver examples/README.md.`);
    process.exit(2);
  }
  let config;
  try { config = JSON.parse(fs.readFileSync(cfgPath, 'utf8')); }
  catch (e) { console.error(`no se pudo leer la configuración "${cfgPath}": ${e.message}`); process.exit(2); }
  if (!config || typeof config !== 'object' || typeof config.mechanics !== 'object'
      || config.mechanics === null || Array.isArray(config.mechanics)) {
    console.error(`la configuración "${cfgPath}" no tiene un objeto "mechanics"`); process.exit(2);
  }
  let text;
  try { text = fs.readFileSync(file, 'utf8'); }
  catch (e) { console.error(`no se pudo leer el archivo "${file}": ${e.message}`); process.exit(2); }
  const r = check(text, config.mechanics);
  if (json) {
    console.log(JSON.stringify(r, null, 2));
  } else {
    const w = r.warnings.length ? `, ${r.warnings.length} aviso(s) de configuración` : '';
    console.log(`${config.name || cfgPath}: ${r.hard.length} grave(s), ${r.advisory.length} aviso(s)${w}`);
    r.warnings.forEach((x) => console.log(`  ! ${x.rule}: ${x.detail}`));
    r.hard.forEach((x) => console.log(`  L${x.line || '-'}  ${x.rule}`));
    r.advisory.forEach((x) => console.log(`  L${x.line || '-'}  ${x.rule} (advisory)${x.detail ? `: ${x.detail}` : ''}`));
  }
  process.exit(r.hard.length > 0 ? 1 : 0);
}
