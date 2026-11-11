#!/usr/bin/env node
'use strict';

/**
 * Validación local de la skill: frontmatter, archivos referenciados y ausencia
 * de dependencias del proyecto original. Sin dependencias.
 */

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const skillPath = path.join(root, 'SKILL.md');
const errors = [];

function fail(message) {
  errors.push(message);
}

if (!fs.existsSync(skillPath)) {
  fail('No existe SKILL.md en la raíz del repo.');
} else {
  const text = fs.readFileSync(skillPath, 'utf8');
  if (!text.startsWith('---\n')) {
    fail('SKILL.md no empieza con frontmatter YAML.');
  } else {
    const end = text.indexOf('\n---', 4);
    if (end === -1) {
      fail('El frontmatter de SKILL.md no cierra con ---.');
    } else {
      const frontmatter = text.slice(4, end);
      const name = (frontmatter.match(/^name:\s*(.+)$/m) || [])[1];
      const description = (frontmatter.match(/^description:\s*(.+)$/m) || [])[1];
      const license = (frontmatter.match(/^license:\s*(.+)$/m) || [])[1];

      if (!name) fail('Falta el campo name en el frontmatter.');
      if (name && name.trim() !== 'avoid-ai-writing-es') {
        fail(`El name debe ser "avoid-ai-writing-es"; es "${name.trim()}".`);
      }
      if (!description) fail('Falta el campo description en el frontmatter.');
      if (description && (description.length < 20 || description.length > 1024)) {
        fail(`La description debe tener entre 20 y 1024 caracteres; tiene ${description.length}.`);
      }
      if (!license) fail('Falta el campo license en el frontmatter.');
      if (license && license.trim() !== 'MIT') fail('La licencia del frontmatter debe ser MIT.');

      const body = text.slice(end + 4);
      const links = [...body.matchAll(/\]\((references\/[^)]+|examples\/[^)]+)\)/g)].map((match) => match[1]);
      for (const link of links) {
        if (!fs.existsSync(path.join(root, link))) fail(`Enlace roto en SKILL.md: ${link}`);
      }
    }
  }
}

const required = [
  'README.md',
  'LICENSE',
  'NOTICE.md',
  'references/patterns-es.md',
  'references/apa-y-latex.md',
  'references/glosario.md',
  'references/calques-en-es.md',
  'examples/es-academico.json',
  'examples/es-tecnico.json',
  'examples/es-blog.json',
  'scripts/normalize-quotes.js',
  'scripts/markdown-prose.js',
  'scripts/check-style.js',
  'detector/patterns-es.js',
  'detector/validate-es.js',
  'detector/cli-es.js',
];
for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) fail(`Falta el archivo requerido: ${file}`);
}

const forbidden = [
  'SOS Clinic',
  'Documento_sos_clinic',
  'Plantilla USB',
  'avoid-ai-writing/',
  '.opencode/skills/',
];
const scanFiles = [
  'SKILL.md',
  'README.md',
  'NOTICE.md',
  'references/patterns-es.md',
  'references/apa-y-latex.md',
  'references/glosario.md',
  'references/calques-en-es.md',
];
for (const file of scanFiles) {
  const filePath = path.join(root, file);
  if (!fs.existsSync(filePath)) continue;
  const content = fs.readFileSync(filePath, 'utf8');
  for (const needle of forbidden) {
    if (content.includes(needle)) fail(`Referencia prohibida "${needle}" en ${file}.`);
  }
}

if (errors.length) {
  console.error(`Validación fallida (${errors.length} problema(s)):`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log('Skill válida: frontmatter, archivos requeridos y referencias internas.');
