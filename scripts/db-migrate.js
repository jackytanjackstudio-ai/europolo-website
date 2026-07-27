#!/usr/bin/env node
/* ═══════════════════════════════════════════════════
   EURO POLO · scripts/db-migrate.js
   Applies migration.sql to Neon, then seeds products_stock
   from data/product-data.json.

   Usage (from the project root):
     node --env-file=.env scripts/db-migrate.js
     node --env-file=.env scripts/db-migrate.js --reseed-stock

   Seeding uses ON CONFLICT DO NOTHING, so re-running never clobbers
   live stock levels. Pass --reseed-stock to deliberately overwrite
   every row from the spreadsheet catalogue.

   Local tooling only — scripts/ is excluded by .vercelignore.
═══════════════════════════════════════════════════ */

const fs   = require('fs');
const path = require('path');
const { neon } = require('@neondatabase/serverless');

const ROOT = path.join(__dirname, '..');

function fail(msg) {
  console.error('\n✗ ' + msg + '\n');
  process.exit(1);
}

const url = (process.env.DATABASE_URL || '').trim();
if (!url) {
  console.error(`
✗ DATABASE_URL is not set. Nothing was written.

  To add it locally
  ─────────────────
  1. Put this line in .env at the project root (.env is gitignored):

       DATABASE_URL=postgresql://USER:PASSWORD@HOST-pooler.REGION.aws.neon.tech/neondb?sslmode=require&channel_binding=require

     Copy the value from the Neon console → your project → Connection
     string → "Pooled connection".

  2. Re-run with Node's env loader:

       node --env-file=.env scripts/db-migrate.js

  To add it on Vercel
  ───────────────────
       vercel env add DATABASE_URL production
       vercel env add DATABASE_URL preview
       vercel env pull            # refresh local .env.local if you use it

     Then redeploy so the functions pick it up:

       vercel --prod
`);
  process.exit(1);
}

/* Split migration.sql into statements. The file contains no $$-quoted
   bodies or embedded semicolons, so a comment-stripped split on ';' is
   safe here — and it keeps us on the HTTP driver with no WebSocket. */
function statements(sqlText) {
  return sqlText
    .split('\n')
    .filter(line => !line.trim().startsWith('--'))
    .join('\n')
    .split(';')
    .map(s => s.trim())
    .filter(Boolean);
}

function readCatalogueStock() {
  const file = path.join(ROOT, 'data', 'product-data.json');
  if (!fs.existsSync(file)) fail('data/product-data.json not found — cannot seed stock.');

  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  const products = Array.isArray(raw) ? raw : (raw.products || []);

  const rows = [];
  const seen = new Set();
  for (const product of products) {
    for (const variant of (product.variants || [])) {
      if (!variant.sku) continue;
      const sku = String(variant.sku);
      if (seen.has(sku)) continue;          // first definition wins
      seen.add(sku);
      rows.push({
        sku,
        product_id: String(product.id || ''),
        name: String(product.name || ''),
        stock: Math.max(0, parseInt(variant.stock, 10) || 0),
      });
    }
  }
  return rows;
}

(async () => {
  const sql = neon(url);

  const host = url.replace(/^.*@/, '').replace(/\/.*$/, '');
  console.log('→ Neon host: ' + host);

  const version = await sql`SELECT current_database() AS db, version() AS v`;
  console.log('→ Connected to "' + version[0].db + '"');

  // ── 1. Schema ──
  const migrationFile = path.join(ROOT, 'migration.sql');
  if (!fs.existsSync(migrationFile)) fail('migration.sql not found.');

  const stmts = statements(fs.readFileSync(migrationFile, 'utf8'));
  console.log('\n→ Applying migration.sql (' + stmts.length + ' statements)');
  for (const stmt of stmts) {
    const label = stmt.replace(/\s+/g, ' ').slice(0, 62);
    await sql.query(stmt);
    console.log('   ✓ ' + label);
  }

  // ── 2. Seed products_stock ──
  const reseed = process.argv.includes('--reseed-stock');
  const rows = readCatalogueStock();
  console.log('\n→ Seeding products_stock from catalogue (' + rows.length + ' skus)'
    + (reseed ? ' — OVERWRITING existing stock' : ' — existing rows preserved'));

  const payload = JSON.stringify(rows);
  const conflict = reseed
    ? `DO UPDATE SET product_id = EXCLUDED.product_id,
                     name       = EXCLUDED.name,
                     stock      = EXCLUDED.stock,
                     updated_at = now()`
    : `DO UPDATE SET product_id = EXCLUDED.product_id,
                     name       = EXCLUDED.name
                WHERE products_stock.product_id <> EXCLUDED.product_id
                   OR products_stock.name       <> EXCLUDED.name`;

  const seeded = await sql.query(
    `INSERT INTO products_stock (sku, product_id, name, stock)
     SELECT x.sku, x.product_id, x.name, x.stock
       FROM jsonb_to_recordset($1::jsonb)
            AS x(sku text, product_id text, name text, stock int)
     ON CONFLICT (sku) ${conflict}
     RETURNING sku`,
    [payload]
  );
  console.log('   ✓ ' + seeded.length + ' rows inserted/updated');

  // ── 3. Confirm ──
  const tables = await sql`
    SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public'
       AND table_name IN ('orders', 'order_items', 'products_stock')
     ORDER BY table_name`;

  console.log('\n→ Tables present: ' + tables.map(t => t.table_name).join(', '));

  const counts = await sql`
    SELECT (SELECT count(*) FROM orders)         AS orders,
           (SELECT count(*) FROM order_items)    AS order_items,
           (SELECT count(*) FROM products_stock) AS products_stock,
           (SELECT COALESCE(sum(stock), 0) FROM products_stock) AS total_stock`;

  const c = counts[0];
  console.log('   orders=' + c.orders
    + '  order_items=' + c.order_items
    + '  products_stock=' + c.products_stock
    + '  total_stock=' + c.total_stock);

  if (tables.length !== 3) fail('Expected 3 tables, found ' + tables.length + '.');
  console.log('\n✓ Migration complete.\n');
})().catch(err => {
  console.error('\n✗ Migration failed: ' + (err && err.message ? err.message : err));
  if (err && err.stack) console.error(err.stack.split('\n').slice(1, 4).join('\n'));
  process.exit(1);
});
