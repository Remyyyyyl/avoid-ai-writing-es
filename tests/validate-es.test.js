'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { validate, formatResult } = require('../detector/validate-es.js');

const original = [
  '# Resultados',
  '',
  'El sistema registra 50.000 eventos en https://example.com/api y usa `JWT`.',
  '',
  'La ruta de configuración es `infra/config/app.yml`.',
].join('\n');

test('una reescritura que solo cambia prosa pasa la preservación', () => {
  const rewritten = original.replace('registra', 'guarda');
  const result = validate(original, rewritten);
  assert.equal(result.ok, true);
  assert.equal(result.errors.length, 0);
  assert.match(formatResult(result), /OK: no se encontraron errores mecánicos/);
});

test('detecta una cifra eliminada como aviso', () => {
  const rewritten = original.replace('50.000', 'muchos');
  const result = validate(original, rewritten);
  assert.ok(result.warnings.some((warning) => warning.code === 'number-missing'));
});

test('detecta una URL eliminada como error', () => {
  const rewritten = original.replace('https://example.com/api', '');
  const result = validate(original, rewritten);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.code === 'url-missing'));
});

test('detecta un bloque de código modificado', () => {
  const withCode = `${original}\n\n\`\`\`bash\nnpm test\n\`\`\`\n`;
  const rewritten = withCode.replace('npm test', 'npm run test');
  const result = validate(withCode, rewritten);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.code === 'code-block-modified'));
});

test('detecta frontmatter modificado', () => {
  const withFrontmatter = `---\ntitle: Prueba\n---\n\n${original}\n`;
  const rewritten = withFrontmatter.replace('title: Prueba', 'title: Otro');
  const result = validate(withFrontmatter, rewritten);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.code === 'frontmatter-modified'));
});

test('detecta una tabla modificada', () => {
  const withTable = `${original}\n\n| Columna | Valor |\n|---|---|\n| A | 1 |\n`;
  const rewritten = withTable.replace('| A | 1 |', '| A | 2 |');
  const result = validate(withTable, rewritten);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.code === 'table-modified'));
});
