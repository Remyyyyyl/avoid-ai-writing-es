/**
 * Validador de preservación — avoid-ai-writing-es
 *
 * Comprueba que una reescritura no dañe el contenido protegido: código,
 * frontmatter, citas en blockquote, tablas, código en línea, URLs, rutas,
 * encabezados y cifras. También compara el número de hallazgos del detector
 * antes y después; un aumento es una señal para revisar, no una prueba de daño.
 *
 * Uso:
 *   const { validate } = require('./validate-es.js');
 *   const result = validate(textoOriginal, textoReescrito);
 *   if (!result.ok) { console.error(result.errors); }
 *
 * Dos excepciones documentadas:
 *   1. Parámetros de seguimiento de herramientas de IA (`utm_source=chatgpt.com`
 *      y similares): se eliminan de ambos lados antes de comparar URLs.
 *   2. Texto de encabezados: cambiar el texto es un aviso; cambiar el número o
 *      la jerarquía es un error.
 *
 * Sin dependencias. Node >= 18. Adaptado del validador MIT del proyecto
 * avoid-ai-writing de Conor Bronsdon.
 */

const AIDetectorValidate = (() => {
  // ═══ Block extractors ══════════════════════════════════════════════
/**
   * A small line-scanner walked over the text once and remembers the opening
   * fence marker and its run length. A fence closes only on a line whose
   * marker matches the opener, is at least as long, and carries no payload
   * (just a closing fence, whitespace allowed). All fence content is captured
   * as one span. An unclosed fence runs to end of document.
   *
   * Replaces the FENCED_CODE regex (GH-236): it closed on any single ~~~ or
   * ``` line regardless of what opened the block, and it mis-respected
   * markers shorter vs longer run-length. Regex can't express run lengths
   * reliably, so this is a plain scan.
   *
   * El algoritmo replica fenceRanges() de detector/patterns-es.js para que ambos
   * report the same boundaries for the same input.
   */
  function fenceSpans(text) {
    const spans = [];
    const lines = text.split('\n');
    let cursor = 0;
    let open = null; // { marker, len, start }

    for (const line of lines) {
      const markerMatch = line.match(/^[ \t]{0,3}(`{3,}|~{3,})/);
      if (!open) {
        // CommonMark forbids backticks in the info string of a backtick fence.
        // Without this guard a prose line that starts with an inline span such
        // as ```npm test``` opens a fence that never closes, and every later
        // prose edit reports as code-block-modified.
        const isOpen =
          markerMatch &&
          !(markerMatch[1][0] === '`' && line.slice(markerMatch[0].length).includes('`'));
        if (isOpen) {
          open = { marker: markerMatch[1][0], len: markerMatch[1].length, start: cursor };
        }
      } else {
        const isClose =
          markerMatch &&
          markerMatch[1][0] === open.marker &&
          markerMatch[1].length >= open.len &&
          /^[ \t]*\r?$/.test(line.slice(markerMatch[0].length));
        if (isClose) {
          spans.push([open.start, cursor + line.length]);
          open = null;
        }
      }
      cursor += line.length + 1; // +1 for the newline
    }

    if (open) spans.push([open.start, text.length]);
    return spans;
  }

  /** The full text of each fenced code block, in document order. */
  function fenceBlockTexts(text) {
    return fenceSpans(text).map(([start, end]) => text.slice(start, end));
  }
  const INLINE_CODE = /`[^`\n]+`/g;
  const YAML_FRONTMATTER = /^---\n[\s\S]*?\n---(?=\n|$)/;
  const BLOCKQUOTE_BLOCK = /(?:^[ \t]*>[^\n]*(?:\n[ \t]*>[^\n]*)*)/gm;
  const MD_HEADING = /^(#{1,6})[ \t]+(.+?)[ \t]*$/gm;
  const URL = /https?:\/\/[^\s)>\]"'`]+/g;
  const MD_LINK_TARGET = /\[[^\]\n]*\]\(([^)\s]+)[^)]*\)/g;
  const PATH = /(?:^|[\s(])((?:\.{0,2}\/)[A-Za-z0-9._~\-]+(?:\/[A-Za-z0-9._~\-]+)*|[A-Za-z]:\\[A-Za-z0-9._\\~\-]+)/g;
  const NUMBER = /\b\d[\d,]*(?:\.\d+)?%?\b/g;

  // Tracking parameters this skill is documented to strip (SKILL.md,
  // "AI-tool URL parameters"). Kept in sync with the `ai-utm-source`
  // categoría del detector en patterns-es.js.
  const AI_URL_PARAM = /^(?:utm_source=(?:chatgpt\.com|openai(?:\.com)?|copilot\.com|claude\.ai|perplexity\.ai|gemini\.google\.com|grok\.com)|referrer=grok\.com)$/i;

  function extractAll(re, text) {
    const out = [];
    const rx = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
    let m;
    while ((m = rx.exec(text)) !== null) {
      out.push(m[1] !== undefined ? m[1] : m[0]);
      if (m.index === rx.lastIndex) rx.lastIndex++;
    }
    return out;
  }

  /**
   * Blank out fenced code and inline code before scanning prose-level
   * constructs. Without this, a URL inside a code sample counts twice and a
   * `|` in a code block reads as a table row.
   */
  function maskCode(text) {
    const out = text.split('');
    // Blank out everything inside fenced code spans so fenced content reads as
    // empty interior lines (their newlines are kept as line separators).
    for (const [start, end] of fenceSpans(text)) {
      // Fill the opened block inside the fence markers; keep newlines so
      // downstream offsets stay aligned.
      for (let i = start; i < end; i += 1) {
        if (out[i] !== '\n') out[i] = ' ';
      }
    }
    return out.join('').replace(INLINE_CODE, (span) => ' '.repeat(span.length));
  }

  function normalizeUrl(u) {
    const queryStart = u.indexOf('?');
    const fragmentStart = u.indexOf('#');
    if (queryStart === -1 || (fragmentStart !== -1 && fragmentStart < queryStart)) return u;

    const queryEnd = fragmentStart === -1 ? u.length : fragmentStart;
    let query = u.slice(queryStart + 1, queryEnd);
    let suffix = u.slice(queryEnd);

    // A terminal question mark is ambiguous with sentence punctuation because
    // the bare-URL extractor captures it. Preserve it for symmetric comparison.
    if (queryStart === u.length - 1) return u;

    // Bare-URL extraction includes adjacent sentence punctuation. Treat it as
    // prose only when removing it exposes an exact tracker in the final field.
    if (queryEnd === u.length) {
      // The extractor also keeps emphasis markers, and a dash or ellipsis plus
      // prose follows it without a space. Query separators or escapes in that suffix
      // keep it inside the URL, so functional fields cannot become prose.
      const punctuation = query.match(/(?:[–—…][^&=%]*|[.,;:!?*_~|]+)$/)?.[0] || '';
      const withoutPunctuation = query.slice(0, query.length - punctuation.length);
      const finalParam = withoutPunctuation.slice(withoutPunctuation.lastIndexOf('&') + 1);
      if (punctuation && AI_URL_PARAM.test(finalParam)) {
        query = withoutPunctuation;
        suffix = punctuation;
      }
    }

    const params = query.split('&');
    const kept = params.filter((param) => param !== '' && !AI_URL_PARAM.test(param));
    if (kept.length === params.length) return u;

    return kept.length > 0
      ? `${u.slice(0, queryStart)}?${kept.join('&')}${suffix}`
      : `${u.slice(0, queryStart)}${suffix}`;
  }

  // Keep table-row semantics in sync with scripts/self-scan.js. Four-space
  // and tab-indented lines are top-level code, not tables. Escaped pipes stay
  // inside their cells rather than creating separators.
  function tableCells(line) {
    if (/^(?: {4}|\t)/.test(line)) return null;
    const trimmed = line.trim();
    const separators = [];
    for (let i = 0; i < trimmed.length; i += 1) {
      if (trimmed[i] !== '|') continue;
      let slashes = 0;
      for (let j = i - 1; j >= 0 && trimmed[j] === '\\'; j -= 1) slashes++;
      if (slashes % 2 === 0) separators.push(i);
    }
    if (separators.length === 0) return null;

    const cells = [];
    let start = separators[0] === 0 ? 1 : 0;
    for (const separator of separators) {
      if (separator < start) continue;
      cells.push(trimmed.slice(start, separator));
      start = separator + 1;
    }
    if (start < trimmed.length) cells.push(trimmed.slice(start));
    return cells;
  }

  function isTableDelimiter(line) {
    const cells = tableCells(line);
    return cells !== null && cells.length > 0
      && cells.every((cell) => /^:?-+:?$/.test(cell.trim()));
  }

  /**
   * Extract GFM tables with or without outer pipes. A delimiter row is
   * required, so ordinary prose such as `use a | b in the shell` stays prose.
   * Scanning once by line avoids backtracking on long whitespace runs.
   */
  function extractTableBlocks(text) {
    const lines = text.split('\n');
    const blocks = [];
    for (let i = 1; i < lines.length; i++) {
      const headerCells = tableCells(lines[i - 1]);
      const delimiterCells = tableCells(lines[i]);
      if (!headerCells || !isTableDelimiter(lines[i])
        || headerCells.length !== delimiterCells.length) continue;
      let end = i;
      while (end + 1 < lines.length && tableCells(lines[end + 1])) end++;
      blocks.push(lines.slice(i - 1, end + 1).join('\n'));
      i = end;
    }
    return blocks;
  }

  /** Collapse cell padding so a re-aligned table isn't reported as edited. */
  function normalizeTable(block) {
    return block
      .split('\n')
      .map((row, index) => {
        const normalized = row.trim().replace(/\s*\|\s*/g, '|');
        return index === 1 ? normalized.replace(/-{2,}/g, '-') : normalized;
      })
      .join('\n');
  }

  function normalizeQuote(block) {
    return block
      .split('\n')
      .map((line) => line.replace(/^[ \t]*>[ \t]?/, '').trimEnd())
      .join('\n')
      .trimEnd();
  }

  /**
   * Indented code blocks are deliberately warning-level, not error-level.
   * Four-space indentation is also how markdown continues a list item, and a
   * validator that blocks a legitimate rewrite is worse than one that reports
   * a soft signal. Only blocks that follow a blank line and are not inside a
   * list are counted.
   */
  function extractIndentedBlocks(text) {
    // Fenced lines are skipped so their indented content doesn't count. A tab
    // before the marker makes the line indented code, so that span is kept.
    const spans = fenceSpans(text).filter(([start]) => !/^ {0,3}\t/.test(text.slice(start, start + 4)));
    const lines = text.split('\n');
    const blocks = [];
    let current = null;
    let inList = false;
    let listContentIndent = 0;
    let listMarkerIndent = 0;
    let prevBlank = true;
    let lineStart = 0;
    let s = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const start = lineStart;
      lineStart += line.length + 1;
      while (s < spans.length && spans[s][1] < start) s++;
      // A fence ends any open block and, like a blank line, may precede a new one.
      if (s < spans.length && spans[s][0] <= start) {
        // A fence outside the list's content indentation ends that list.
        // Inspect only the opener: code inside a nested fence is not prose.
        if (start === spans[s][0] && line.match(/^ */)[0].length < listContentIndent) {
          inList = false;
          listContentIndent = 0;
        }
        if (current !== null) blocks.push(current.join('\n'));
        current = null;
        prevBlank = true;
        continue;
      }
      const isIndented = /^(?: {4}|\t)\S/.test(line);
      const isBlank = /^\s*$/.test(line);
      const listMarker = line.match(/^([ \t]*(?:[-*+]|\d+[.)]))([ \t]+)/);
      if (listMarker) {
        const columns = (value) => [...value].reduce((col, char) => char === '\t' ? col + 4 - col % 4 : col + 1, 0);
        const markerEnd = columns(listMarker[1]);
        const padding = columns(listMarker[0]) - markerEnd;
        const contentIndent = markerEnd + (padding > 4 ? 1 : padding);
        const markerIndent = columns(line.match(/^[ \t]*/)[0]);
        if (!inList || markerIndent <= listMarkerIndent) {
          listContentIndent = contentIndent;
          listMarkerIndent = markerIndent;
        }
        inList = true;
      } else if (!isBlank && !isIndented) {
        inList = false;
        listContentIndent = 0;
      }
      const wasBlank = prevBlank;
      prevBlank = isBlank;

      if (isIndented && !inList && (current !== null || wasBlank)) {
        if (current === null) current = [];
        current.push(line);
      } else if (!isBlank && current !== null) {
        blocks.push(current.join('\n'));
        current = null;
      }
    }
    if (current !== null) blocks.push(current.join('\n'));
    return blocks;
  }

  function counts(list) {
    const map = new Map();
    for (const item of list) map.set(item, (map.get(item) || 0) + 1);
    return map;
  }

  /** Items present in `a` more often than in `b`. */
  function missingFrom(a, b) {
    const have = counts(b);
    const out = [];
    for (const item of a) {
      const n = have.get(item) || 0;
      if (n === 0) out.push(item);
      else have.set(item, n - 1);
    }
    return out;
  }

  function sample(list, n = 5) {
    const shown = list.slice(0, n);
    return shown.join(', ') + (list.length > n ? ` (+${list.length - n} more)` : '');
  }

  function wordCount(text) {
    const words = maskCode(text).trim().match(/\S+/g);
    return words ? words.length : 0;
  }

  /**
   * @param {string} original   text as the writer supplied it
   * @param {string} rewritten  text the skill produced
   * @param {object} [options]
   * @param {object} [options.detector]   AIDetector instance; defaults to
   *                                      requiring ./patterns-es.js when available
   * @param {boolean} [options.skipResidual]  skip residual pattern analysis
   * @param {"error"|"warn"} [options.residualPolicy]  growth handling (default "error")
   * @param {number} [options.maxShrinkRatio]  warn when the rewrite drops more
   *                                      than this fraction of words (default 0.4)
   * @returns {{ok: boolean, errors: Array, warnings: Array, stats: object, preservation: object, quality: object}}
   */
  function validate(original, rewritten, options = {}) {
    const errors = [];
    const warnings = [];
    const err = (code, message) => errors.push({ code, message });
    const warn = (code, message) => warnings.push({ code, message });

    if (typeof original !== 'string' || typeof rewritten !== 'string') {
      throw new TypeError('validate(original, rewritten): ambos argumentos deben ser cadenas');
    }

    const residualPolicy = options.residualPolicy === undefined ? 'error' : options.residualPolicy;
    if (!['error', 'warn'].includes(residualPolicy)) {
      throw new TypeError('validate: residualPolicy debe ser error o warn');
    }

    // The regex-backed extractors above anchor on a bare \n. A Windows-authored
    // document arrives with CRLF, so protected content can become invisible:
    // frontmatter could be rewritten and validate() still returned ok. See the
    // CRLF must-fire cases in validate.test.js. Normalize once, up front, so
    // extraction sees one line-ending shape. A rewrite that only re-terminates
    // CRLF lines is not a preservation failure, but a lone carriage return can
    // be meaningful code content and must remain visible to exact comparisons.
    original = original.replace(/\r\n/g, '\n');
    rewritten = rewritten.replace(/\r\n/g, '\n');

    // ── Fenced code: exact, in order. Code is never the skill's business. ──
    const origFenced = fenceBlockTexts(original);
    const newFenced = fenceBlockTexts(rewritten);
    if (origFenced.length !== newFenced.length) {
      err('code-block-count', `Cambió el número de bloques de código: ${origFenced.length} → ${newFenced.length}.`);
    } else if (origFenced.some((block, i) => block !== newFenced[i])) {
      const changed = origFenced.findIndex((block, i) => block !== newFenced[i]);
      err('code-block-modified', `Se modificó el bloque de código #${changed + 1}.`);
    }

    // ── YAML frontmatter: exact. ──
    const origYaml = original.match(YAML_FRONTMATTER);
    const newYaml = rewritten.match(YAML_FRONTMATTER);
    if ((origYaml ? origYaml[0] : null) !== (newYaml ? newYaml[0] : null)) {
      err('frontmatter-modified', 'El frontmatter YAML se modificó, añadió o eliminó.');
    }

    const origProse = maskCode(original);
    const newProse = maskCode(rewritten);

    // ── Blockquotes: someone else's words. ──
    const origQuotes = extractAll(BLOCKQUOTE_BLOCK, origProse).map(normalizeQuote);
    const newQuotes = extractAll(BLOCKQUOTE_BLOCK, newProse).map(normalizeQuote);
    const lostQuotes = missingFrom(origQuotes, newQuotes);
    if (lostQuotes.length) {
      err('blockquote-modified', `Se modificó o eliminó contenido de blockquote (${lostQuotes.length} bloque(s)). El material citado pertenece a otra persona.`);
    }

    // ── Tables: reference content, not prose. ──
    const origTables = extractTableBlocks(origProse).map(normalizeTable);
    const newTables = extractTableBlocks(newProse).map(normalizeTable);
    const lostTables = missingFrom(origTables, newTables);
    if (lostTables.length) {
      err('table-modified', `Se modificó o eliminó contenido de una tabla Markdown (${lostTables.length} tabla(s)).`);
    }

    // ── Inline code: identifiers, flags, filenames. ──
    const lostInline = missingFrom(extractAll(INLINE_CODE, original), extractAll(INLINE_CODE, rewritten));
    if (lostInline.length) {
      err('inline-code-missing', `Se eliminó código en línea: ${sample(lostInline)}`);
    }

    // ── URLs, compared with AI tracking parameters stripped from both sides. ──
    const origUrls = [
      ...extractAll(URL, origProse),
      ...extractAll(MD_LINK_TARGET, origProse),
    ].map(normalizeUrl);
    const newUrls = [
      ...extractAll(URL, newProse),
      ...extractAll(MD_LINK_TARGET, newProse),
    ].map(normalizeUrl);
    const lostUrls = missingFrom(origUrls, newUrls);
    if (lostUrls.length) {
      err('url-missing', `Se eliminó o alteró una URL: ${sample(lostUrls)}`);
    }

    // ── Filesystem paths. ──
    const lostPaths = missingFrom(extractAll(PATH, origProse), extractAll(PATH, newProse));
    if (lostPaths.length) {
      err('path-missing', `Se eliminó o alteró una ruta de archivo: ${sample(lostPaths)}`);
    }

    // ── Headings: structure is an error, wording is a warning. ──
    const origHeadings = [];
    const newHeadings = [];
    for (const [, hashes, text] of original.matchAll(MD_HEADING)) origHeadings.push({ level: hashes.length, text });
    for (const [, hashes, text] of rewritten.matchAll(MD_HEADING)) newHeadings.push({ level: hashes.length, text });
    if (origHeadings.length !== newHeadings.length) {
      err('heading-count', `Cambió el número de encabezados: ${origHeadings.length} → ${newHeadings.length}. Reestructurar el documento está fuera del alcance de una reescritura.`);
    } else {
      const levelDrift = origHeadings.findIndex((h, i) => h.level !== newHeadings[i].level);
      if (levelDrift !== -1) {
        err('heading-level', `Cambió la jerarquía en el encabezado #${levelDrift + 1}: h${origHeadings[levelDrift].level} → h${newHeadings[levelDrift].level}.`);
      }
      const reworded = origHeadings.filter((h, i) => h.text !== newHeadings[i].text);
      if (reworded.length) {
        warn('heading-text', `Se reformularon ${reworded.length} encabezado(s). Es esperable al corregir Title Case o quitar emojis; revisa que no haya cambiado nada más.`);
      }
    }

    // ── Numbers: SKILL.md says preserve specific technical details. ──
    const lostNumbers = missingFrom(extractAll(NUMBER, origProse), extractAll(NUMBER, newProse));
    if (lostNumbers.length) {
      warn('number-missing', `Hay cifras del original que no aparecen en la reescritura: ${sample(lostNumbers)}. Es legítimo si se escribió el número con palabras; si no, hay riesgo de pérdida.`);
    }

    const addedNumbers = missingFrom(extractAll(NUMBER, newProse), extractAll(NUMBER, origProse));
    if (addedNumbers.length) {
      warn('number-added', `Hay cifras nuevas en la reescritura: ${sample(addedNumbers)}. Compáralas con la fuente; convertir un número a palabras o a dígitos puede ser legítimo.`);
    }

    // ── Volume: a rewrite that halves the text probably dropped content. ──
    const origWords = wordCount(original);
    const newWords = wordCount(rewritten);
    const maxShrink = options.maxShrinkRatio == null ? 0.4 : options.maxShrinkRatio;
    if (origWords > 0 && newWords / origWords < 1 - maxShrink) {
      warn('large-shrink', `La reescritura redujo ${Math.round((1 - newWords / origWords) * 100)} % de las palabras (${origWords} → ${newWords}). Revisa si se perdió contenido.`);
    }

    // Keep mechanical preservation independent of the residual policy.
    const preservation = { ok: errors.length === 0, errors: errors.slice(), warnings: warnings.slice() };
    const quality = { status: options.skipResidual ? 'skipped' : 'unavailable', policy: residualPolicy, findings: [], residual: null };
    let residual = null;
    if (!options.skipResidual) {
      let detector = options.detector;
      if (!detector && typeof require === 'function') {
        try {
          detector = require('./patterns-es.js');
        } catch (_) {
          detector = null;
        }
      }
      if (detector && typeof detector.analyzeText === 'function') {
        const before = detector.analyzeText(original);
        const after = detector.analyzeText(rewritten);
        residual = {
          issuesBefore: before.issues.length,
          issuesAfter: after.issues.length,
          countsBefore: before.counts,
          countsAfter: after.counts,
        };
        const declined = (r) => r.document_classification === 'UNSCORED' || r.tooShort || r.tooLong || r.unsupportedScript;
        quality.status = declined(before) || declined(after) ? 'unscored' : 'checked';
        quality.residual = residual;
        if (after.issues.length > before.issues.length) {
          const message = `Aumentó el número de hallazgos residuales: de ${before.issues.length} a ${after.issues.length}. Revisa si aplican; esto no demuestra daño al contenido.`;
          quality.findings.push({ code: 'residual-grew', message });
          (residualPolicy === 'warn' ? warn : err)('residual-grew', message);
        }
      }
    }

    return {
      ok: errors.length === 0,
      errors,
      warnings,
      preservation,
      quality,
      stats: {
        wordsBefore: origWords,
        wordsAfter: newWords,
        fencedBlocks: origFenced.length,
        headings: origHeadings.length,
        indentedBlocks: extractIndentedBlocks(original).length,
        residual,
      },
    };
  }

  /** Human-readable one-liner per finding, for CLI and skill output. */
  function formatResult(result) {
    const lines = [];
    const mechanical = result.preservation || result;
    lines.push(!mechanical.ok
      ? `FALLO: ${mechanical.errors.length} error(es) mecánico(s) de preservación`
      : result.ok ? 'OK: no se encontraron errores mecánicos de preservación'
        : 'FALLO: la política residual bloqueó; no hay errores mecánicos de preservación');
    if (result.quality) lines.push(`  análisis residual: ${result.quality.status} (política: ${result.quality.policy})`);
    for (const e of result.errors) lines.push(`  error   [${e.code}] ${e.message}`);
    for (const w of result.warnings) lines.push(`  aviso   [${w.code}] ${w.message}`);
    return lines.join('\n');
  }

  return { validate, formatResult, maskCode, extractIndentedBlocks };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AIDetectorValidate;
}

// CLI: node detector/validate-es.js [--residual-policy error|warn] <original> <reescrito>
// Exits 1 on mechanical errors or residual growth under the default error policy.
if (typeof require !== 'undefined' && typeof module !== 'undefined' && require.main === module) {
  const fs = require('node:fs');
  const args = process.argv.slice(2);
  let residualPolicy = 'error';
  if (args[0] === '--residual-policy') {
    args.shift();
    residualPolicy = args.shift();
  }
  if (args[0] === '--') args.shift();
  const [origPath, newPath] = args;
  if (!origPath || !newPath || args.length !== 2 || !['error', 'warn'].includes(residualPolicy)) {
    console.error('uso: node detector/validate-es.js [--residual-policy error|warn] <archivo-original> <archivo-reescrito>');
    process.exit(2);
  }
  const result = AIDetectorValidate.validate(
    fs.readFileSync(origPath, 'utf8'),
    fs.readFileSync(newPath, 'utf8'),
    { residualPolicy },
  );
  console.log(AIDetectorValidate.formatResult(result));
  process.exit(result.ok ? 0 : 1);
}
