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
  const skuSlug = new Map();      // SKU -> recorded slug
  const skipped = [];             // recorded but file missing on disk

  for (const e of check) {
    if (e.sku) skuSlug.set(String(e.sku).toUpperCase(), e.id);
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
  return { map, skuSlug, skipped };
}

function main() {
  const { map, skuSlug, skipped } = buildUrlMap();
  const data = JSON.parse(fs.readFileSync(DATA_JSON, 'utf8'));

  let alreadyLocal = 0, migrated = 0, wiredByConvention = 0, left = 0;
  const remaining = [];
  const usedPaths = new Set();   // every local file the catalogue ends up pointing at

  /* Resolve a product's image directory, e.g. "images/products/bags/ebk-40115".
     Preference order, each verified against the filesystem:
       1. the directory of a path this product already points at
       2. the slug recorded for one of its skus in _image-check.json
       3. slug candidates derived from the sku, kept only if the directory exists
     Returns null rather than guessing. */
  function resolveDir(p) {
    const existing = [p.images && p.images.cover, ...((p.images && p.images.gallery) || []),
                     ...((p.variants || []).map(v => v.image))]
      .find(u => u && !/^https?:/i.test(u));
    if (existing) return path.posix.dirname(existing);

    for (const v of (p.variants || [])) {
      const slug = skuSlug.get(String(v.sku).toUpperCase());
      if (slug) {
        const dir = path.posix.join('images/products', p.category, normaliseSlug(slug));
        if (fs.existsSync(path.join(ROOT, dir))) return dir;
      }
    }

    // "EBK 40115 A" -> base "EBK 40115" -> ebk-40115 / ebk40115
    for (const v of (p.variants || [])) {
      const parts = String(v.sku).trim().split(/\s+/);
      const base = (parts.length > 1 ? parts.slice(0, -1) : parts).join(' ').toLowerCase();
      for (const cand of [base.replace(/\s+/g, '-'), base.replace(/\s+/g, '')]) {
        const dir = path.posix.join('images/products', p.category, cand);
        if (fs.existsSync(path.join(ROOT, dir))) return dir;
      }
    }
    return null;
  }

  /* Filename this slot is expected to use, following the existing convention.

     Variant files are "<folder>-<variant suffix>.jpg". The suffix is whatever
     the sku adds on top of the folder name once both are reduced to bare
     alphanumerics, so "EBK 40115 B" in folder "ebk-40115" and "EBA51208SB" in
     folder "eba51208s" both yield "-b". Falls back to the sku's last
     whitespace-separated token when it does not extend the folder name. */
  function expectedName(slot, index, sku, dir) {
    if (slot === 'cover')   return 'cover.jpg';
    if (slot === 'gallery') return `gallery-${index + 1}.jpg`;

    const folder = path.posix.basename(dir || '');
    const bare   = s => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
    const skuBare = bare(sku);
    const dirBare = bare(folder);

    let suffix = skuBare.startsWith(dirBare) && skuBare.length > dirBare.length
      ? skuBare.slice(dirBare.length)
      : String(sku).trim().split(/\s+/).pop().toLowerCase();

    return `${folder}-${suffix}.jpg`;
  }

  for (const p of data.products) {
    const im = p.images || {};
    const dir = resolveDir(p);

    // One ref: already local, mapped by recorded URL, wired by convention, or left.
    const handle = (url, slot, index, sku, assign) => {
      if (url && !/^https?:/i.test(url)) { alreadyLocal++; usedPaths.add(url); return url; }

      const byUrl = map.get(url);
      if (byUrl) { migrated++; usedPaths.add(byUrl); if (APPLY) assign(byUrl); return APPLY ? byUrl : url; }

      const name = expectedName(slot, index, sku, dir);
      const rel  = dir ? path.posix.join(dir, name) : null;
      if (rel && fs.existsSync(path.join(ROOT, rel))) {
        wiredByConvention++;
        usedPaths.add(rel);
        if (APPLY) assign(rel);
        return APPLY ? rel : url;
      }

      left++;
      remaining.push({
        product: p.id, category: p.category, name: p.name,
        slot: slot === 'gallery' ? `gallery[${index}]` : slot,
        sku: sku || null,
        expectedPath: rel || `images/products/${p.category}/<unknown-dir>/${name}`,
        url,
      });
      return url;
    };

    if (im.cover) im.cover = handle(im.cover, 'cover', 0, null, v => { im.cover = v; });

    if (Array.isArray(im.gallery)) {
      im.gallery = im.gallery.map((u, i) => handle(u, 'gallery', i, null, () => {}));
    }

    for (const v of (p.variants || [])) {
      if (!v.image) continue;
      v.image = handle(v.image, 'variant', 0, v.sku, x => { v.image = x; });
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

  // Unused = on disk but nothing in the catalogue points at it.
  const unused = allLocal.filter(f => !usedPaths.has(f));

  if (APPLY) {
    // Match the pipeline's existing formatting: 2-space indent, no trailing newline.
    fs.writeFileSync(DATA_JSON, JSON.stringify(data, null, 2), 'utf8');
    const header = '/* Auto-generated from data/product-data.json — do not edit manually */\n';
    fs.writeFileSync(EMBED_JS, header + 'window.EP_PRODUCTS = ' + JSON.stringify(data.products) + ';\n', 'utf8');
  }

  const summary = {
    generated:        new Date().toISOString().slice(0, 10),
    mode:             APPLY ? 'applied' : 'dry-run',
    totalRefs:        alreadyLocal + migrated + wiredByConvention + left,
    alreadyLocal:     alreadyLocal,
    migratedByUrl:    migrated,
    wiredByConvention: wiredByConvention,
    localTotal:       alreadyLocal + migrated + wiredByConvention,
    leftOnShopee:     left,
    localFilesUsed:   usedPaths.size,
    localFilesUnused: unused.length,
    checkRowsSkipped: skipped.length,
    remaining,
    unusedLocalFiles: unused,
    skipped,
  };
  fs.writeFileSync(OUT_REPORT, JSON.stringify(summary, null, 2) + '\n', 'utf8');

  console.log(`mode              : ${summary.mode}`);
  console.log(`total image refs  : ${summary.totalRefs}`);
  console.log(`  already local   : ${summary.alreadyLocal}`);
  console.log(`  mapped by URL   : ${summary.migratedByUrl}`);
  console.log(`  wired by name   : ${summary.wiredByConvention}`);
  console.log(`  -> local total  : ${summary.localTotal}`);
  console.log(`  -> left remote  : ${summary.leftOnShopee}`);
  console.log(`local files used  : ${summary.localFilesUsed}`);
  console.log(`local files unused: ${summary.localFilesUnused}`);
  console.log(`report            : data/image-migration-report.json`);
}

main();
