'use strict';
/* ═══════════════════════════════════════════════════
   EURO POLO · journal/html.js
   HTML escaping, typographic entities, and image probing
   for the journal generator. No dependencies.
═══════════════════════════════════════════════════ */

const fs = require('fs');

/* ── Escape text for use in element content or a double-quoted attribute ── */
function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ── Typographic characters → named entities.
      The hand-written pages use &rsquo; / &mdash; rather than raw UTF-8, so
      generated output matches them. Purely cosmetic: both render identically. ── */
const TYPO = {
  '‘': '&lsquo;',  '’': '&rsquo;',
  '“': '&ldquo;',  '”': '&rdquo;',
  '–': '&ndash;',  '—': '&mdash;',
  '…': '&hellip;', '·': '&middot;',
  '→': '&rarr;',   '←': '&larr;',
  '×': '&times;',  '°': '&deg;',
  ' ': '&nbsp;',   'é': '&eacute;',
  '®': '&reg;',    '™': '&trade;'
};
const TYPO_RE = new RegExp('[' + Object.keys(TYPO).join('') + ']', 'g');

function typographic(s) {
  return String(s == null ? '' : s).replace(TYPO_RE, ch => TYPO[ch]);
}

/* ── Straight quotes → typographic quotes.
      An apostrophe or quote that opens (start of string, or after a space or
      an opening bracket / dash) curls left; everything else curls right, which
      is what contractions need. Run before escaping — escapeHtml turns `"`
      into an entity. ── */
function smartQuotes(s) {
  return String(s == null ? '' : s)
    .replace(/(^|[\s([{<—–-])"/g, '$1“')
    .replace(/"/g, '”')
    .replace(/(^|[\s([{<—–])'/g, '$1‘')
    .replace(/'/g, '’');
}

/* Escape + entity-convert in one step — the normal path for any author text
   that lands in markup. Never use on JSON-LD: script content is raw text in
   HTML, so entities there would be published literally. */
function text(s) {
  return typographic(escapeHtml(smartQuotes(s)));
}

/* Strip entities/tags back to plain characters. Used for JSON-LD strings and
   for the URL-encoded share links. */
function plain(s) {
  return String(s == null ? '' : s)
    .replace(/<[^>]+>/g, '')
    .replace(/&mdash;/g, '—').replace(/&ndash;/g, '–')
    .replace(/&lsquo;/g, '‘').replace(/&rsquo;/g, '’')
    .replace(/&ldquo;/g, '“').replace(/&rdquo;/g, '”')
    .replace(/&hellip;/g, '…').replace(/&middot;/g, '·')
    .replace(/&rarr;/g, '→').replace(/&larr;/g, '←')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function slugify(s) {
  return plain(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

/* ── Intrinsic image dimensions, read from the file header.
      Returns { width, height, bytes } or null if the format is unknown. ── */
function imageSize(file) {
  let buf;
  try { buf = fs.readFileSync(file); } catch { return null; }
  const bytes = buf.length;

  // PNG
  if (bytes > 24 && buf.readUInt32BE(0) === 0x89504e47) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20), bytes };
  }
  // GIF
  if (bytes > 10 && buf.slice(0, 3).toString('latin1') === 'GIF') {
    return { width: buf.readUInt16LE(6), height: buf.readUInt16LE(8), bytes };
  }
  // WebP
  if (bytes > 30 && buf.slice(0, 4).toString('latin1') === 'RIFF' &&
      buf.slice(8, 12).toString('latin1') === 'WEBP') {
    const fmt = buf.slice(12, 16).toString('latin1');
    if (fmt === 'VP8X') return { width: (buf.readUIntLE(24, 3) & 0xffffff) + 1, height: (buf.readUIntLE(27, 3) & 0xffffff) + 1, bytes };
    if (fmt === 'VP8 ') return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff, bytes };
    if (fmt === 'VP8L') {
      const b = buf.readUInt32LE(21);
      return { width: (b & 0x3fff) + 1, height: ((b >> 14) & 0x3fff) + 1, bytes };
    }
    return { width: 0, height: 0, bytes };
  }
  // JPEG — walk the segment chain to the frame header
  if (bytes > 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i + 9 < bytes) {
      if (buf[i] !== 0xff) { i++; continue; }
      const marker = buf[i + 1];
      if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { i += 2; continue; }
      const len = buf.readUInt16BE(i + 2);
      // SOF0..SOF15, excluding the non-frame markers that share the range
      const isSOF = marker >= 0xc0 && marker <= 0xcf &&
        marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
      if (isSOF) return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7), bytes };
      if (marker === 0xda) break; // start of scan — no frame header found
      i += 2 + len;
    }
    return { width: 0, height: 0, bytes };
  }
  return null;
}

module.exports = { escapeHtml, typographic, smartQuotes, text, plain, slugify, imageSize };
