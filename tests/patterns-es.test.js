'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { analyzeText, maskProtectedText } = require('../detector/patterns-es.js');

const fixture = (name) => fs.readFileSync(path.join(__dirname, 'fixtures', name), 'utf8');

test('detecta P0 y P1 en un texto con patrones', () => {
  const result = analyzeText(fixture('academico-con-patrones.md'), { context: 'academico' });
  assert.ok(result.counts.P0 >= 2, `P0 esperados >= 2, recibidos ${result.counts.P0}`);
  assert.ok(result.counts.P1 >= 5, `P1 esperados >= 5, recibidos ${result.counts.P1}`);
  assert.ok(result.issues.some((issue) => issue.rule === 'chatbot-artifact'));
  assert.ok(result.issues.some((issue) => issue.rule === 'filler'));
  assert.ok(result.issues.some((issue) => issue.rule === 'title-case-heading'));
});

test('el texto académico limpio no tiene P0 ni P1', () => {
  const result = analyzeText(fixture('academico-limpio.md'), { context: 'academico' });
  assert.equal(result.counts.P0, 0);
  assert.equal(result.counts.P1, 0);
  assert.deepEqual(
    result.issues.filter((issue) => issue.severity === 'P0' || issue.severity === 'P1'),
    [],
  );
});

test('el texto técnico limpio no marca anglicismos permitidos', () => {
  const result = analyzeText(fixture('tecnico-limpio.md'), { context: 'tecnico' });
  assert.equal(result.counts.P0, 0);
  assert.equal(result.counts.P1, 0);
  const text = result.issues.map((issue) => issue.match.toLowerCase()).join(' ');
  assert.ok(!text.includes('backend'));
  assert.ok(!text.includes('endpoint'));
  assert.ok(!text.includes('deploy'));
});

test('protege citas APA y comandos LaTeX', () => {
  const result = analyzeText(fixture('latex-con-patrones.tex'), { context: 'academico' });
  assert.equal(result.counts.P0, 0);
  assert.ok(result.issues.some((issue) => issue.rule === 'filler'));
  const text = result.issues.map((issue) => issue.match).join(' ');
  assert.ok(!text.includes('textcite'));
  assert.ok(!text.includes('rodriguez2018'));
  assert.ok(!text.includes('registro_triage'));
});

test('protege bloques de código, URLs y rutas', () => {
  const source = [
    '# Prueba',
    '',
    'El servicio usa `JWT` y consulta https://example.com/api/v1/health.',
    '',
    '```bash',
    'Cabe destacar que este bloque no se analiza',
    '```',
    '',
    'La ruta es infra/config/app.yml y la cifra es 50.000.',
  ].join('\n');
  const result = analyzeText(source, { context: 'tecnico' });
  assert.equal(result.counts.P0, 0);
  assert.equal(result.counts.P1, 0);
  assert.ok(!result.issues.some((issue) => issue.match.includes('Cabe destacar')));
});

test('no confunde un porcentaje de Markdown con un comentario LaTeX', () => {
  const source = 'El 50 % de los casos usa `JWT`. Cabe destacar que el resto se revisa.';
  const result = analyzeText(source, { context: 'tecnico' });
  assert.ok(result.issues.some((issue) => issue.rule === 'filler'));
});

test('protege los comentarios LaTeX pero analiza la prosa visible', () => {
  const source = '\\section{Resultados}\nCabe destacar que el texto visible importa. % Cabe destacar que esto es un comentario\n';
  const result = analyzeText(source, { context: 'academico' });
  const filler = result.issues.filter((issue) => issue.rule === 'filler');
  assert.equal(filler.length, 1);
  assert.match(filler[0].match, /Cabe destacar/);
  assert.doesNotMatch(filler[0].match, /comentario/);
});

test('detecta la frecuencia de rayas como P2', () => {
  const sentence = 'El sistema registra el evento y valida el token en el gateway — con una prueba de carga de 50.000 solicitudes sintéticas.';
  const source = Array.from({ length: 20 }, () => sentence).join(' ');
  const result = analyzeText(source, { context: 'tecnico', severities: ['P2'] });
  assert.ok(result.issues.some((issue) => issue.rule === 'em-dash-rate'));
});

test('maskProtectedText conserva longitud y líneas', () => {
  const source = [
    '---',
    'title: Prueba',
    '---',
    '',
    'Texto con una cita (Rodríguez-Páez et al., 2018) y una URL https://example.com.',
    'Un comando \\textcite{rodriguez2018} y código `JWT`.',
  ].join('\n');
  const masked = maskProtectedText(source);
  assert.equal(masked.length, source.length);
  assert.equal((masked.match(/\n/g) || []).length, (source.match(/\n/g) || []).length);
  assert.ok(!masked.includes('Rodríguez-Páez'));
  assert.ok(!masked.includes('https://example.com'));
  assert.ok(!masked.includes('textcite'));
  assert.ok(masked.includes('Texto con una cita'));
});

test('el contexto académico omite hashtags y el de blog no', () => {
  const source = fixture('blog-con-patrones.md');
  const academico = analyzeText(source, { context: 'academico', severities: ['P1', 'P2'] });
  const blog = analyzeText(source, { context: 'blog', severities: ['P1', 'P2'] });
  assert.ok(!academico.issues.some((issue) => issue.rule === 'hashtag-stuffing'));
  assert.ok(blog.issues.some((issue) => issue.rule === 'hashtag-stuffing'));
});

test('el filtro de severidades devuelve solo lo pedido', () => {
  const result = analyzeText(fixture('academico-con-patrones.md'), {
    context: 'academico',
    severities: ['P0'],
  });
  assert.equal(result.counts.P1, 0);
  assert.equal(result.counts.P2, 0);
  assert.ok(result.issues.every((issue) => issue.severity === 'P0'));
});

test('un texto vacío no falla', () => {
  const result = analyzeText('', { context: 'general' });
  assert.equal(result.counts.P0, 0);
  assert.equal(result.counts.P1, 0);
  assert.equal(result.counts.P2, 0);
  assert.equal(result.stats.words, 0);
});
