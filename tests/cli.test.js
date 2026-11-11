'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');

const root = path.join(__dirname, '..');
const cli = path.join(root, 'detector', 'cli-es.js');
const fixture = (name) => path.join(root, 'tests', 'fixtures', name);

function run(args) {
  try {
    const stdout = execFileSync(process.execPath, [cli, ...args], { cwd: root, encoding: 'utf8' });
    return { status: 0, stdout };
  } catch (error) {
    return { status: error.status, stdout: error.stdout || '', stderr: error.stderr || '' };
  }
}

test('el CLI devuelve JSON y código 1 cuando hay hallazgos', () => {
  const result = run(['--json', '--contexto', 'academico', fixture('academico-con-patrones.md')]);
  assert.equal(result.status, 1);
  const payload = JSON.parse(result.stdout);
  assert.ok(payload.counts.P0 >= 2);
  assert.ok(payload.issues.length > 0);
  assert.equal(payload.ok, false);
});

test('el CLI devuelve código 0 en un texto limpio', () => {
  const result = run(['--quick', '--contexto', 'academico', fixture('academico-limpio.md')]);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Sin hallazgos/);
});

test('el CLI lista todas las reglas, incluidas las de estilo', () => {
  const result = run(['--list-rules']);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /em-dash-rate/);
  assert.match(result.stdout, /title-case-heading/);
});
