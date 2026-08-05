#!/usr/bin/env node
/* ═══════════════════════════════════════════════════
   EURO POLO · scripts/purge-test-orders.js
   Deletes test orders (and their order_items) from Neon, restoring any
   stock those orders deducted.

   Usage (from the project root):
     node --env-file=.env scripts/purge-test-orders.js            # dry run
     node --env-file=.env scripts/purge-test-orders.js --apply    # execute

   TARGETS — nothing else is ever touched:
     · every order whose order_ref LIKE 'EP-TEST-%'
     · the explicit sandbox order_refs listed in EXPLICIT_REFS below

   SAFETY / IDEMPOTENCY
   --------------------
   Targets are resolved by order_ref, never by hardcoded id. Stock is
   restored only for rows with stock_deducted_at IS NOT NULL, and the
   restore + delete happen in ONE transaction — so a row can never be
   restored without also being deleted. Because the delete removes the
   row, a re-run finds nothing left to match and is a no-op.

   Local tooling only — scripts/ is excluded by .vercelignore.
═══════════════════════════════════════════════════ */

const { neon } = require('@neondatabase/serverless');

/* Pattern targets. */
const REF_PATTERNS = ['EP-TEST-%'];

/* Explicit sandbox test orders (ids 29-32 at time of writing — matched by
   ref, so a re-numbered row is still caught and an unrelated id is not). */
const EXPLICIT_REFS = [
  'EP-MSE9FCDA-6F73',
  'EP-MSE9JMH8-69FA',
  'EP-MSE9K1L8-78E6',
  'EP-MSE9KZUS-841D',
];

const APPLY = process.argv.includes('--apply');

const url = (process.env.DATABASE_URL || '').trim();
if (!url) {
  console.error('\n✗ DATABASE_URL is not set. Nothing was read or written.');
  console.error('  Run with:  node --env-file=.env scripts/purge-test-orders.js\n');
  process.exit(1);
}

const money = c => 'RM' + (c / 100).toFixed(2);

(async () => {
  const sql = neon(url);

  /* ── 1. Resolve targets ─────────────────────────── */
  const orders = await sql`
    SELECT id, order_ref, status, fulfilment_status, amount_cents,
           created_at, stock_deducted_at
      FROM orders
     WHERE order_ref LIKE ANY(${REF_PATTERNS})
        OR order_ref = ANY(${EXPLICIT_REFS})
     ORDER BY id
  `;

  if (orders.length === 0) {
    console.log('\n✓ No matching test orders found — nothing to do.\n');
    const [{ count }] = await sql`SELECT count(*)::int AS count FROM orders`;
    console.log(`  orders table currently holds ${count} row(s).\n`);
    return;
  }

  const ids = orders.map(o => o.id);
  const items = await sql`
    SELECT order_id, sku, name, qty, unit_price_cents
      FROM order_items
     WHERE order_id = ANY(${ids})
     ORDER BY order_id, sku
  `;

  const itemsByOrder = new Map();
  for (const it of items) {
    if (!itemsByOrder.has(it.order_id)) itemsByOrder.set(it.order_id, []);
    itemsByOrder.get(it.order_id).push(it);
  }

  /* ── 2. Print exactly what will be deleted ──────── */
  console.log('\n══════════════════════════════════════════════════════');
  console.log(APPLY ? '  APPLYING — rows below WILL be deleted'
                    : '  DRY RUN — rows below WOULD be deleted');
  console.log('══════════════════════════════════════════════════════\n');

  for (const o of orders) {
    const lines = itemsByOrder.get(o.id) || [];
    console.log(`  id=${o.id}  ${o.order_ref}`);
    console.log(`     status=${o.status}  fulfilment=${o.fulfilment_status}  amount=${money(o.amount_cents)}`);
    console.log(`     created_at=${o.created_at ? new Date(o.created_at).toISOString() : 'null'}`);
    console.log(`     stockDeductedAt=${o.stock_deducted_at ? new Date(o.stock_deducted_at).toISOString() : 'null'}`
                + (o.stock_deducted_at ? '   → stock WILL be restored' : '   → no stock to restore'));
    if (lines.length === 0) {
      console.log('     items: (none)');
    } else {
      console.log(`     items (${lines.length}):`);
      for (const it of lines) {
        console.log(`       · ${it.sku}  qty=${it.qty}  ${money(it.unit_price_cents)}  ${it.name}`);
      }
    }
    console.log('');
  }

  /* ── 3. Aggregate the stock to restore, per sku ─── */
  const restoreBySku = new Map();
  for (const o of orders) {
    if (!o.stock_deducted_at) continue;
    for (const it of (itemsByOrder.get(o.id) || [])) {
      restoreBySku.set(it.sku, (restoreBySku.get(it.sku) || 0) + it.qty);
    }
  }

  console.log('  ── Stock restore plan ──────────────────────────────');
  if (restoreBySku.size === 0) {
    console.log('     (nothing — no targeted order has stock_deducted_at set)\n');
  } else {
    const skus = [...restoreBySku.keys()];
    const current = await sql`
      SELECT sku, stock FROM products_stock WHERE sku = ANY(${skus})
    `;
    const currentBySku = new Map(current.map(r => [r.sku, r.stock]));
    for (const [sku, qty] of restoreBySku) {
      const now = currentBySku.has(sku) ? currentBySku.get(sku) : null;
      console.log(now === null
        ? `     ${sku}  +${qty}   ⚠ no products_stock row — will be SKIPPED`
        : `     ${sku}  ${now} → ${now + qty}  (+${qty})`);
    }
    console.log('');
  }

  console.log(`  Totals: ${orders.length} order(s), ${items.length} order_item(s), `
            + `${restoreBySku.size} sku(s) to restore.\n`);

  if (!APPLY) {
    console.log('  Dry run only. Nothing was changed.');
    console.log('  Re-run with --apply to execute.\n');
    return;
  }

  /* ── 4. Restore + delete, atomically ────────────── */
  const statements = [];
  const restoreOrder = [];
  for (const [sku, qty] of restoreBySku) {
    restoreOrder.push({ sku, qty });
    statements.push(sql`
      UPDATE products_stock
         SET stock = stock + ${qty}, updated_at = now()
       WHERE sku = ${sku}
      RETURNING sku, stock
    `);
  }
  statements.push(sql`DELETE FROM order_items WHERE order_id = ANY(${ids}) RETURNING id`);
  statements.push(sql`DELETE FROM orders      WHERE id       = ANY(${ids}) RETURNING id, order_ref`);

  const results = await sql.transaction(statements);

  const restoreResults = results.slice(0, restoreOrder.length);
  const deletedItems   = results[results.length - 2];
  const deletedOrders  = results[results.length - 1];

  console.log('  ── Applied ─────────────────────────────────────────\n');
  console.log(`  Deleted ${deletedItems.length} order_item row(s).`);
  console.log(`  Deleted ${deletedOrders.length} order row(s):`);
  for (const o of deletedOrders) console.log(`     id=${o.id}  ${o.order_ref}`);
  console.log('');

  console.log('  Stock restored per sku:');
  if (restoreOrder.length === 0) {
    console.log('     (none)');
  } else {
    restoreOrder.forEach((r, i) => {
      const row = restoreResults[i][0];
      console.log(row
        ? `     ${r.sku}  +${r.qty}  → new stock ${row.stock}`
        : `     ${r.sku}  +${r.qty}  ⚠ SKIPPED (no products_stock row)`);
    });
  }
  console.log('');

  /* ── 5. Verify ──────────────────────────────────── */
  const remaining = await sql`
    SELECT id, order_ref, status FROM orders ORDER BY id
  `;
  const [{ count: itemCount }] = await sql`SELECT count(*)::int AS count FROM order_items`;

  console.log('  ── Verification ────────────────────────────────────\n');
  console.log(`  orders remaining:      ${remaining.length}`);
  console.log(`  order_items remaining: ${itemCount}`);
  if (remaining.length > 0) {
    console.log('  Leftover rows:');
    for (const o of remaining) console.log(`     id=${o.id}  ${o.order_ref}  ${o.status}`);
  }
  console.log('');
})().catch(err => {
  console.error('\n✗ Failed:', err.message);
  console.error('  No partial write is possible — restore + delete run in one transaction.\n');
  process.exit(1);
});
