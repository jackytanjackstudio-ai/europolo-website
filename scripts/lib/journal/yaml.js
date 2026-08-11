'use strict';
/* ═══════════════════════════════════════════════════
   EURO POLO · journal/yaml.js
   A deliberately small, STRICT YAML subset for article front matter.
   No dependencies — the site has no build step and no dev toolchain,
   so the generator must run on a bare `node`.

   Supported
     key: value                    scalars (string / number / true / false / null)
     key: "quoted: value"          double or single quotes
     key: [a, b, c]                inline arrays of scalars
     key:                          nested map (indent by 2 spaces)
       sub: value
     key:                          sequence of scalars
       - one
       - two
     key:                          sequence of maps
       - q: question
         a: answer
     key: |                        literal block (newlines kept)
     key: >                        folded block (newlines → spaces)
     # whole-line comments

   NOT supported — and rejected loudly rather than mis-parsed
     tabs, anchors, aliases, multi-document files, inline maps ({a: 1}),
     trailing comments after a value, nested sequences-in-sequences.

   Anything the parser does not understand throws with file:line, so a
   typo fails the build instead of silently publishing a broken page.
═══════════════════════════════════════════════════ */

class YamlError extends Error {}

function fail(file, line, msg) {
  throw new YamlError(`${file}:${line} — ${msg}`);
}

function tokenize(text, file, startLine) {
  const out = [];
  const raw = text.split(/\r?\n/);
  for (let i = 0; i < raw.length; i++) {
    const line = raw[i];
    const lineNo = startLine + i;
    if (line.includes('\t')) fail(file, lineNo, 'tabs are not allowed — indent with spaces');
    if (/^\s*$/.test(line)) { out.push({ blank: true, indent: 0, content: '', lineNo, raw: line }); continue; }
    if (/^\s*#/.test(line)) continue;
    const indent = line.length - line.replace(/^ +/, '').length;
    if (indent % 2 !== 0) fail(file, lineNo, `indent must be a multiple of 2 spaces (found ${indent})`);
    out.push({ blank: false, indent, content: line.slice(indent).replace(/\s+$/, ''), lineNo, raw: line });
  }
  return out;
}

function nextContent(lines, i) {
  while (i < lines.length && lines[i].blank) i++;
  return i;
}

/* Split an inline array body on commas that are not inside quotes. */
function splitFlow(s) {
  const parts = [];
  let cur = '', quote = null;
  for (const ch of s) {
    if (quote) { cur += ch; if (ch === quote) quote = null; continue; }
    if (ch === '"' || ch === "'") { quote = ch; cur += ch; continue; }
    if (ch === ',') { parts.push(cur); cur = ''; continue; }
    cur += ch;
  }
  parts.push(cur);
  return parts;
}

function parseScalar(s, file, lineNo) {
  if (s.length >= 2 && s[0] === '"' && s[s.length - 1] === '"') {
    return s.slice(1, -1).replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  }
  if (s.length >= 2 && s[0] === "'" && s[s.length - 1] === "'") {
    return s.slice(1, -1).replace(/''/g, "'");
  }
  if (s[0] === '[' && s[s.length - 1] === ']') {
    const inner = s.slice(1, -1).trim();
    if (!inner) return [];
    return splitFlow(inner).map(x => {
      const v = x.trim();
      if (!v) fail(file, lineNo, 'empty item in inline array');
      return parseScalar(v, file, lineNo);
    });
  }
  if (s[0] === '{') fail(file, lineNo, 'inline maps are not supported — use an indented block');
  if (s === 'true') return true;
  if (s === 'false') return false;
  if (s === 'null' || s === '~') return null;
  if (/^-?\d+$/.test(s)) return parseInt(s, 10);
  if (/^-?\d+\.\d+$/.test(s)) return parseFloat(s);
  return s;
}

function parseBlockScalar(lines, i, indent, kind) {
  const buf = [];
  let base = null;
  let j = i;
  for (; j < lines.length; j++) {
    const ln = lines[j];
    if (ln.blank) { buf.push(''); continue; }
    if (ln.indent <= indent) break;
    if (base === null) base = ln.indent;
    buf.push(ln.raw.slice(Math.min(base, ln.indent)).replace(/\s+$/, ''));
  }
  while (buf.length && buf[buf.length - 1] === '') buf.pop();
  const value = kind === '|'
    ? buf.join('\n')
    : buf.join(' ').replace(/\s+/g, ' ').trim();
  return [value, j];
}

function parseNode(lines, i, indent, file) {
  i = nextContent(lines, i);
  if (i >= lines.length) return ['', i];
  const first = lines[i];
  if (first.content === '-' || first.content.startsWith('- ')) return parseSeq(lines, i, indent, file);
  return parseMap(lines, i, indent, file);
}

const KEY_RE = /^([A-Za-z_][A-Za-z0-9_-]*):(?:[ ]+(.*))?$/;

function parseMap(lines, i, indent, file) {
  const obj = {};
  for (;;) {
    i = nextContent(lines, i);
    if (i >= lines.length) break;
    const ln = lines[i];
    if (ln.indent < indent) break;
    if (ln.indent > indent) fail(file, ln.lineNo, `unexpected indentation — expected ${indent} spaces, found ${ln.indent}`);
    if (ln.content.startsWith('- ')) break;

    const m = KEY_RE.exec(ln.content);
    if (!m) fail(file, ln.lineNo, `expected "key: value", found ${JSON.stringify(ln.content)}`);
    const key = m[1];
    const rest = m[2] === undefined ? '' : m[2].trim();
    if (Object.prototype.hasOwnProperty.call(obj, key)) fail(file, ln.lineNo, `duplicate key "${key}"`);
    i++;

    if (rest === '|' || rest === '>') {
      const [value, next] = parseBlockScalar(lines, i, indent, rest);
      obj[key] = value;
      i = next;
    } else if (rest === '') {
      const j = nextContent(lines, i);
      if (j < lines.length && lines[j].indent > indent) {
        const [value, next] = parseNode(lines, j, lines[j].indent, file);
        obj[key] = value;
        i = next;
      } else {
        obj[key] = '';
      }
    } else {
      obj[key] = parseScalar(rest, file, ln.lineNo);
    }
  }
  return [obj, i];
}

function parseSeq(lines, i, indent, file) {
  const arr = [];
  for (;;) {
    i = nextContent(lines, i);
    if (i >= lines.length) break;
    const ln = lines[i];
    if (ln.indent < indent) break;
    if (ln.indent > indent) fail(file, ln.lineNo, `unexpected indentation — expected ${indent} spaces, found ${ln.indent}`);
    if (ln.content !== '-' && !ln.content.startsWith('- ')) break;

    const item = ln.content === '-' ? '' : ln.content.slice(2).trim();

    if (item === '') {
      const j = nextContent(lines, i + 1);
      if (j < lines.length && lines[j].indent > indent) {
        const [value, next] = parseNode(lines, j, lines[j].indent, file);
        arr.push(value);
        i = next;
      } else {
        fail(file, ln.lineNo, 'sequence item has no value');
      }
    } else if (KEY_RE.test(item)) {
      /* "- key: value" starts a map whose remaining keys are indented by the
         two columns the dash occupies. Re-label the line at that column and
         let parseMap consume it together with its continuation lines. */
      lines[i] = { blank: false, indent: indent + 2, content: item, lineNo: ln.lineNo, raw: ln.raw };
      const [value, next] = parseMap(lines, i, indent + 2, file);
      arr.push(value);
      i = next;
    } else {
      arr.push(parseScalar(item, file, ln.lineNo));
      i++;
    }
  }
  return [arr, i];
}

function parseYaml(text, file, startLine) {
  const lines = tokenize(text, file, startLine || 1);
  const j = nextContent(lines, 0);
  if (j >= lines.length) return {};
  const [value] = parseNode(lines, j, lines[j].indent, file);
  return value;
}

/* ── Split "---\n<yaml>\n---\n<body>" ── */
function parseFrontMatter(raw, file) {
  const src = raw.replace(/^﻿/, '');
  const m = /^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/.exec(src);
  if (!m) {
    throw new YamlError(`${file}:1 — missing front matter; the file must open with a "---" line`);
  }
  const yamlText = m[1];
  const body = src.slice(m[0].length);
  const bodyLine = src.slice(0, m[0].length).split(/\r?\n/).length;
  const data = parseYaml(yamlText, file, 2);
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new YamlError(`${file}:2 — front matter must be a set of "key: value" pairs`);
  }
  return { data, body, bodyLine };
}

module.exports = { parseYaml, parseFrontMatter, YamlError };
