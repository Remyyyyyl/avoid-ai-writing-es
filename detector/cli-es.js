#!/usr/bin/env node
'use strict';

/**
 * CLI del detector español.
 *
 * Uso:
 *   node detector/cli-es.js [opciones] <archivo|->
 *
 * Opciones:
 *   --contexto <nombre>   general | academico | tecnico | docs | blog | linkedin | casual
 *   --quick               solo P0 y P1
 *   --severidad <lista>   por ejemplo P0,P1,P2
 *   --json                salida JSON
 *   --incluir-citas       analiza también blockquotes y comillas (por defecto se protegen)
 *   --list-rules          lista las reglas disponibles
 *
 * Sin archivo lee de stdin. Código de salida: 0 sin hallazgos, 1 con hallazgos, 2 error.
 */

const fs = require('node:fs');
const { analyzeText, formatResult, RULES, STYLE_RULES, CONTEXTS } = require('./patterns-es.js');

function usage() {
  console.error('uso: node detector/cli-es.js [--contexto <nombre>] [--quick] [--severidad P0,P1,P2] [--json] [--incluir-citas] [--list-rules] <archivo|->');
}

function parseArgs(argv) {
  const options = { context: 'general', severities: ['P0', 'P1', 'P2'], json: false, includeQuotes: false, file: null, listRules: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--contexto' || arg === '--context') {
      options.context = argv[index + 1] || '';
      index += 1;
    } else if (arg === '--quick') {
      options.severities = ['P0', 'P1'];
    } else if (arg === '--severidad' || arg === '--severity') {
      options.severities = String(argv[index + 1] || '').split(',').map((value) => value.trim().toUpperCase()).filter(Boolean);
      index += 1;
    } else if (arg === '--json') {
      options.json = true;
    } else if (arg === '--incluir-citas' || arg === '--include-quotes') {
      options.includeQuotes = true;
    } else if (arg === '--list-rules') {
      options.listRules = true;
    } else if (arg === '--help' || arg === '-h') {
      usage();
      process.exit(0);
    } else if (arg.startsWith('--')) {
      console.error(`opción desconocida: ${arg}`);
      usage();
      process.exit(2);
    } else if (!options.file) {
      options.file = arg;
    } else {
      console.error(`argumento extra: ${arg}`);
      usage();
      process.exit(2);
    }
  }
  return options;
}

function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.listRules) {
    for (const rule of RULES.concat(STYLE_RULES)) {
      console.log(`${rule.severity}\t${rule.id}\t${rule.category}`);
    }
    return;
  }

  const validContexts = Object.keys(CONTEXTS);
  if (!validContexts.includes(options.context)) {
    console.error(`contexto desconocido: ${options.context}. Usa: ${validContexts.join(', ')}`);
    process.exit(2);
  }
  if (!options.severities.length || options.severities.some((value) => !['P0', 'P1', 'P2'].includes(value))) {
    console.error('severidad inválida. Usa P0, P1 o P2.');
    process.exit(2);
  }

  let text = '';
  try {
    text = options.file && options.file !== '-'
      ? fs.readFileSync(options.file, 'utf8')
      : fs.readFileSync(0, 'utf8');
  } catch (error) {
    console.error(`no se pudo leer la entrada: ${error.message}`);
    process.exit(2);
  }

  const result = analyzeText(text, {
    context: options.context,
    severities: options.severities,
    includeQuotes: options.includeQuotes,
  });

  if (options.json) {
    console.log(JSON.stringify({ ...result, ok: result.issues.length === 0 }, null, 2));
  } else {
    console.log(formatResult(result));
  }

  process.exit(result.issues.length > 0 ? 1 : 0);
}

main();
