'use strict';
/* ═══════════════════════════════════════════════════
   EURO POLO · journal/markdown.js
   The small Markdown dialect the journal bodies are written in.
   Deliberately limited to the blocks the article layout styles.

     ## Heading            → <h2 id="…">   (### → h3, #### → h4)
     plain lines           → <p>           (blank line separates paragraphs)
     - item / * item       → <ul>
     1. item               → <ol>
     > text                → <div class="article-note">  (the pull-out box)
     ---                   → <hr class="article-divider">
     ::shop:: / ::faq::    → generated components, placed where the marker sits
     **bold**  *italic*  [text](href)

   Anything else is emitted as literal text — there is no raw-HTML escape
   hatch, so a stray "<" in prose can never break the page.
═══════════════════════════════════════════════════ */

const { escapeHtml, typographic, smartQuotes, slugify } = require('./html');

const SITE_HOST = 'europolo.my';

/* ── Inline spans ── */
function inline(src) {
  let s = typographic(escapeHtml(smartQuotes(src)));
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*\w])\*([^*]+)\*/g, '$1<em>$2</em>');
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, label, href) => {
    const external = /^https?:\/\//i.test(href) && !href.includes(SITE_HOST);
    const attrs = external ? ' target="_blank" rel="noopener"' : '';
    return `<a href="${href}"${attrs}>${label}</a>`;
  });
  return s;
}

/* Markdown syntax stripped back to plain words — used for heading ids. */
function stripInline(src) {
  return String(src)
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1');
}

function isBlockStart(line) {
  const t = line.trim();
  return t === '' ||
    /^#{2,4}\s/.test(t) ||
    /^>\s?/.test(t) ||
    /^[-*]\s+/.test(t) ||
    /^\d+[.)]\s+/.test(t) ||
    /^---+$/.test(t) ||
    /^::[a-z][a-z0-9-]*::$/.test(t);
}

/*
  render(markdown, options) → { html, markersUsed }

  options.markers   { '::shop::': '<aside …>' } — marker → ready-made HTML
  options.leadClass class applied to the first paragraph (the standfirst)
*/
function render(markdown, options) {
  const opts = options || {};
  const markers = opts.markers || {};
  const markersUsed = new Set();
  const lines = String(markdown || '').split(/\r?\n/);
  const out = [];
  let i = 0;
  let firstParagraph = true;

  const flushParagraph = buf => {
    if (!buf.length) return;
    const cls = firstParagraph && opts.leadClass ? ` class="${opts.leadClass}"` : '';
    firstParagraph = false;
    out.push(`<p${cls}>${inline(buf.join(' '))}</p>`);
  };

  while (i < lines.length) {
    const line = lines[i];
    const t = line.trim();

    if (t === '') { i++; continue; }

    /* Component marker on its own line */
    if (/^::[a-z][a-z0-9-]*::$/.test(t)) {
      if (!(t in markers)) throw new Error(`unknown component marker ${t}`);
      if (markers[t]) out.push(markers[t]);
      markersUsed.add(t);
      i++;
      continue;
    }

    /* Horizontal rule */
    if (/^---+$/.test(t)) { out.push('<hr class="article-divider" />'); i++; continue; }

    /* Heading */
    const h = /^(#{2,4})\s+(.*)$/.exec(t);
    if (h) {
      const level = h[1].length;
      out.push(`<h${level} id="${slugify(stripInline(h[2]))}">${inline(h[2])}</h${level}>`);
      i++;
      continue;
    }

    /* Pull-out note */
    if (/^>\s?/.test(t)) {
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i].trim())) {
        buf.push(lines[i].trim().replace(/^>\s?/, ''));
        i++;
      }
      const paragraphs = buf.join('\n').split(/\n{2,}/)
        .map(p => '  <p>' + inline(p.replace(/\n/g, ' ').trim()) + '</p>')
        .join('\n');
      out.push('<div class="article-note">\n' + paragraphs + '\n</div>');
      continue;
    }

    /* Unordered list */
    if (/^[-*]\s+/.test(t)) {
      const items = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(`  <li>${inline(lines[i].trim().replace(/^[-*]\s+/, ''))}</li>`);
        i++;
      }
      out.push('<ul>\n' + items.join('\n') + '\n</ul>');
      continue;
    }

    /* Ordered list */
    if (/^\d+[.)]\s+/.test(t)) {
      const items = [];
      while (i < lines.length && /^\d+[.)]\s+/.test(lines[i].trim())) {
        items.push(`  <li>${inline(lines[i].trim().replace(/^\d+[.)]\s+/, ''))}</li>`);
        i++;
      }
      out.push('<ol>\n' + items.join('\n') + '\n</ol>');
      continue;
    }

    /* Paragraph — consecutive lines until the next block starts */
    const buf = [t];
    i++;
    while (i < lines.length && !isBlockStart(lines[i])) { buf.push(lines[i].trim()); i++; }
    flushParagraph(buf);
  }

  return { html: out, markersUsed };
}

/* Word count of the prose only — used for the "N min read" estimate. */
function wordCount(markdown) {
  const prose = String(markdown || '')
    .replace(/^::[a-z][a-z0-9-]*::$/gm, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`-]/g, ' ');
  const words = prose.split(/\s+/).filter(Boolean);
  return words.length;
}

module.exports = { render, inline, stripInline, wordCount };
