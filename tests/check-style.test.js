'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { check } = require('../scripts/check-style.js');

const config = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'examples', 'es-academico.json'), 'utf8'),
);

test('detecta Title Case en un encabezado español como aviso', () => {
  const result = check('# Análisis De Riesgos De La Plataforma\n\nTexto limpio.\n', config.mechanics);
  assert.ok(result.advisory.some((item) => item.rule === 'heading-may-need-sentence-case'));
});

test('acepta un encabezado en sentence case', () => {
  const result = check('# Análisis de riesgos de la plataforma\n\nTexto limpio.\n', config.mechanics);
  assert.equal(result.hard.length, 0);
  assert.ok(!result.advisory.some((item) => item.rule === 'heading-may-need-sentence-case'));
});

test('detecta comillas rectas cuando el perfil pide curvas', () => {
  const result = check('# Título\n\nUn texto con "comillas rectas".\n', config.mechanics);
  assert.ok(result.hard.some((item) => item.rule === 'double-quote-should-be-curly'));
});

test('acepta comillas curvas', () => {
  const result = check('# Título\n\nUn texto con “comillas curvas”.\n', config.mechanics);
  assert.equal(result.hard.length, 0);
});
