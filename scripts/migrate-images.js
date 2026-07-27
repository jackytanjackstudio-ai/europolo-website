#!/usr/bin/env node
/* ═══════════════════════════════════════════════════
   EURO POLO · scripts/migrate-images.js
   Repoint product image references from the Shopee CDN to local files.

   Usage:
     node scripts/migrate-images.js --dry-run    (default: report only)
     node scripts/migrate-images.js --apply      (rewrite the data files)

   WHY THIS IS A SCRIPT, NOT A ONE-OFF EDIT
   ─────────────────────────────────────────
   data/product-data.json is regenerated from the spreadsheet by
   data/build_variants.py, which writes Shopee CDN URLs. Re-run this script
   after any pipeline regeneration to re-apply the local paths.

   SAFETY RULES
   ────────────
   1. A reference is rewritten ONLY when data/_image-check.json records that
      exact URL as having been downloaded, AND the resulting file is present
      on disk. Provenance is never inferred from filenames or ordering.
   2. Anything unmatched is left pointing at Shopee. No file is invented and
      no working image is replaced by a guess.
   3. Variant swatch images are separate photographs that were never
      downloaded, so they are expected to stay remote until supplied.
═══════════════════════════════════════════════════ */

const fs   = require('fs');
const path = require('path');

const ROOT       = path.resolve(__dirname, '..');
const CHECK      = path.join(ROOT, 'data', '_image-check.json');
const REPORT     = path.join(ROOT, 'data', 'download-report.json');
const DATA_JSON  = path.join(ROOT, 'data', 'product-data.json');
const EMBED_JS   = path.join(ROOT, 'js', 'product-data-embed.js');
const OUT_REPORT = path.join(ROOT, 'data', 'image-migration-report.json');

const APPLY = process.argv.includes('--apply');

/* Directory names on disk drop characters that are illegal or awkward in a
   path ("&", double separators). Normalise the recorded slug the same way,
   then require the directory to actually exist before trusting the match. */
function normaliseSlug(slug) {
  return String(slug)
    .replace(/&/g, '')
    .replace(/[\/\\]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function buildUrlMap() {
  const check  = JSON.parse(fs.readFileSync(CHECK, 'utf8'));
  const report = JSON.parse(fs.readFileSync(REPORT, 'utf8'));
  const products = JSON.parse(fs.readFileSync(DATA_JSON, 'utf8')).products;

  // slug -> category, from the download report first, then the catalogue.
  const catOf = new Map(report.products.map(p => [p.id, p.category]));

  const map = new Map();          // url -> relative local path
  const skipped = [];             // recorded but file missing on disk

  for (const e of check) {
    if (!e.ok) { skipped.push({ url: e.url, reason: 'download not ok' }); continue; }

    const slug = normaliseSlug(e.id);
    let category = catOf.get(e.id) || catOf.get(slug);

    // Fall back to the catalogue's own category for this sku, then verify.
    if (!category) {
      const owner = products.find(p =>
        (p.variants || []).some(v => String(v.sku).toUpperCase() === String(e.sku).toUpperCase()));
      category = owner && owner.category;
    }
    if (!category) { skipped.push({ url: e.url, reason: 'no category for ' + e.id }); continue; }

    const rel = path.posix.join('images/products', category, slug, e.filename);
    if (fs.existsSync(path.join(ROOT, rel))) {
      map.set(e.url, rel);
    } else {
      skipped.push({ url: e.url, reason: 'file absent: ' + rel });
    }
  }
  return { map, skipped };
}

function main() {
  const { map, skipped } = buildUrlMap();
  const data = JSON.parse(fs.readFileSync(DATA_JSON, 'utf8'));

  let migrated = 0, left = 0;
  const remaining = [];

  for (const p of data.products) {
    const im = p.images || {};

    if (im.cover) {
      const hit = map.get(im.cover);
      if (hit) { if (APPLY) im.cover = hit; migrated++; }
      else { left++; remaining.push({ product: p.id, category: p.category, slot: 'cover', sku: null, url: im.cover }); }
    }

    if (Array.isArray(im.gallery)) {
      im.gallery = im.gallery.map((u, i) => {
        const hit = map.get(u);
        if (hit) { migrated++; return APPLY ? hit : u; }
        left++; remaining.push({ product: p.id, category: p.category, slot: `gallery[${i}]`, sku: null, url: u });
        return u;
      });
    }

    for (const v of (p.variants || [])) {
      if (!v.image) continue;
      const hit = map.get(v.image);
      if (hit) { if (APPLY) v.image = hit; migrated++; }
      else { left++; remaining.push({ product: p.id, category: p.category, slot: 'variant', sku: v.sku, url: v.image }); }
    }
  }

  // Local files that nothing in the catalogue points at.
  const referenced = new Set();
  for (const p of data.products) {
    const im = p.images || {};
    if (im.cover) referenced.add(im.cover);
    (im.gallery || []).forEach(u => referenced.add(u));
    (p.variants || []).forEach(v => v.image && referenced.add(v.image));
  }
  const allLocal = [];
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else allLocal.push(path.relative(ROOT, full).split(path.sep).join('/'));
    }
  })(path.join(ROOT, 'images', 'products'));

  const mappedPaths = new Set(map.values());
  const unused = allLocal.filter(f => !mappedPaths.has(f));

  if (APPLY) {
    // Match the pipeline's existing formatting: 2-space indent, no trailing newline.
    fs.writeFileSync(DATA_JSON, JSON.stringify(data, null, 2), 'utf8');
    const header = '/* Auto-generated from data/product-data.json — do not edit manually */\n';
    fs.writeFileSync(EMBED_JS, header + 'window.EP_PRODUCTS = ' + JSON.stringify(data.products) + ';\n', 'utf8');
  }

  const summary = {
    generated:        new Date().toISOString().slice(0, 10),
    mode:             APPLY ? 'applied' : 'dry-run',
    totalRefs:        migrated + left,
    migratedToLocal:  migrated,
    leftOnShopee:     left,
    localFilesMapped: mappedPaths.size,
    localFilesUnused: unused.length,
    checkRowsSkipped: skipped.length,
    remaining,
    unusedLocalFiles: unused,
    skipped,
  };
  fs.writeFileSync(OUT_REPORT, JSON.stringify(summary, null, 2) + '\n', 'utf8');

  console.log(`mode              : ${summary.mode}`);
  console.log(`total image refs  : ${summary.totalRefs}`);
  console.log(`  -> local        : ${summary.migratedToLocal}`);
  console.log(`  -> left remote  : ${summary.leftOnShopee}`);
  console.log(`local files mapped: ${summary.localFilesMapped}`);
  console.log(`local files unused: ${summary.localFilesUnused}`);
  console.log(`report            : data/image-migration-report.json`);
}

main();
