#!/usr/bin/env node
/* ═══════════════════════════════════════════════════
   EURO POLO · scripts/gen-missing-images.js
   Writes docs/missing-images.md — the worklist of product image
   references still pointing at the Shopee CDN.

   Usage:
     node scripts/migrate-images.js          (refresh the report first)
     node scripts/gen-missing-images.js

   Reads data/image-migration-report.json. Fetches nothing and changes no
   image reference — this is a report only.

   Workflow: drop a supplied file at the "Expected local file" path, then run
   `node scripts/migrate-images.js --apply` and it gets wired up automatically.
═══════════════════════════════════════════════════ */

const fs   = require('fs');
const path = require('path');

const ROOT   = path.resolve(__dirname, '..');
const REPORT = path.join(ROOT, 'data', 'image-migration-report.json');
const OUT    = path.join(ROOT, 'docs', 'missing-images.md');

const CATEGORY_PAGE = {
  bags:    'bags.html',
  wallets: 'wallets.html',
  belts:   'wallets.html',   // belts are listed on the wallets collection page
  luggage: 'luggage.html',
};

function pagesFor(row) {
  const detail = `product.html?id=${row.product}`;
  // A cover is the card image on the collection page as well as the detail page.
  if (row.slot === 'cover') {
    const coll = CATEGORY_PAGE[row.category] || '';
    return coll ? `${coll} + ${detail}` : detail;
  }
  return detail;
}

function main() {
  if (!fs.existsSync(REPORT)) {
    console.error('Missing data/image-migration-report.json — run scripts/migrate-images.js first.');
    process.exit(1);
  }
  const report = JSON.parse(fs.readFileSync(REPORT, 'utf8'));
  const rows = report.remaining || [];

  const byCat = new Map();
  for (const r of rows) {
    if (!byCat.has(r.category)) byCat.set(r.category, []);
    byCat.get(r.category).push(r);
  }

  const order = ['bags', 'wallets', 'belts', 'luggage']
    .filter(c => byCat.has(c))
    .concat([...byCat.keys()].filter(c => !['bags','wallets','belts','luggage'].includes(c)));

  const L = [];
  L.push('# Missing product images — worklist');
  L.push('');
  L.push(`Generated ${report.generated} from \`data/image-migration-report.json\`.`);
  L.push('');
  L.push(`**${rows.length} image references still point at the Shopee CDN** (\`cf.shopee.com.my\`).`);
  L.push(`${report.localTotal} of ${report.totalRefs} references are already served locally.`);
  L.push('');
  L.push('## How to use this list');
  L.push('');
  L.push('1. Save each supplied image at the exact path in **Expected local file**.');
  L.push('2. Run `node scripts/migrate-images.js --apply`.');
  L.push('3. Re-run `node scripts/gen-missing-images.js` to refresh this list.');
  L.push('');
  L.push('The migration script only rewrites a reference when the expected file is');
  L.push('actually present, so a partial drop is safe — anything still missing keeps');
  L.push('working from Shopee.');
  L.push('');
  L.push('> Filenames are lowercase `.jpg`. A variant file is');
  L.push('> `<folder>-<last part of SKU, lowercased>.jpg`, e.g. SKU `EBK 40115 A`');
  L.push('> becomes `ebk-40115-a.jpg`.');
  L.push('');

  L.push('## Summary');
  L.push('');
  L.push('| Category | Missing refs | Products affected |');
  L.push('|---|---:|---:|');
  for (const cat of order) {
    const list = byCat.get(cat);
    L.push(`| ${cat} | ${list.length} | ${new Set(list.map(r => r.product)).size} |`);
  }
  L.push(`| **Total** | **${rows.length}** | **${new Set(rows.map(r => r.product)).size}** |`);
  L.push('');

  for (const cat of order) {
    const list = byCat.get(cat).slice().sort((a, b) =>
      a.product.localeCompare(b.product) || String(a.slot).localeCompare(String(b.slot)));
    L.push(`## ${cat} — ${list.length} missing`);
    L.push('');
    L.push('| Product | SKU | Slot | Page | Expected local file | Current Shopee URL |');
    L.push('|---|---|---|---|---|---|');
    for (const r of list) {
      L.push(`| ${r.product} | ${r.sku || '—'} | ${r.slot} | \`${pagesFor(r)}\` | \`${r.expectedPath}\` | ${r.url} |`);
    }
    L.push('');
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, L.join('\n'), 'utf8');
  console.log(`wrote docs/missing-images.md — ${rows.length} rows across ${order.length} categories`);
}

main();
