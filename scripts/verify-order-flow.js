#!/usr/bin/env node
/* ═══════════════════════════════════════════════════
   EURO POLO · scripts/verify-order-flow.js
   Proves the order-persistence layer against the real Neon database.

   Usage (from the project root):
     node --env-file=.env scripts/verify-order-flow.js
     node --env-file=.env scripts/verify-order-flow.js --keep

   Checks
     1. createPendingOrder writes exactly one order + its items.
     2. Replaying createPendingOrder writes nothing more.
     3. A verified callback marks the order paid and drops stock once.
     4. Firing the SAME callback twice leaves one row and one deduction.
     5. An amount that disagrees with the bill is refused.
     6. getOrders returns the order; the admin endpoint 401s without a session.

   Steps 3-4 drive the real api/payment-response.js handler. The only thing
   stubbed is the outbound call to toyyibPay's getBillTransactions — this
   project has no sandbox merchant keys, so the gateway itself cannot be
   reached from here. Everything below that line is the production path.

   Test rows are deleted and stock restored on the way out (--keep leaves
   one paid order behind so it can be eyeballed in admin/orders.html).

   Local tooling only — scripts/ is excluded by .vercelignore.
═══════════════════════════════════════════════════ */

const path = require('path');
const { neon } = require('@neondatabase/serverless');

const ROOT = path.join(__dirname, '..');
const orders  = require(path.join(ROOT, 'api', '_lib', 'orders'));
const catalog = require(path.join(ROOT, 'api', '_lib', 'catalog'));

const KEEP = process.argv.includes('--keep');

if (!process.env.DATABASE_URL) {
  console.error('\n✗ DATABASE_URL is not set. Run: node --env-file=.env scripts/verify-order-flow.js\n');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

let pass = 0, fail = 0;
function check(label, actual, expected) {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a === e) { pass++; console.log('   ✓ ' + label + '  →  ' + a); }
  else { fail++; console.log('   ✗ ' + label + '\n       expected ' + e + '\n       actual   ' + a); }
}

/* ── Minimal req/res doubles for the real serverless handler ── */
function fakeRes() {
  const r = {
    statusCode: null, bodySent: null, headers: {},
    setHeader(k, v) { this.headers[k] = v; return this; },
    status(c) { this.statusCode = c; return this; },
    send(b) { this.bodySent = b; return this; },
    json(b) { this.bodySent = b; return this; },
    redirect(...a) { this.statusCode = 302; this.bodySent = a[a.length - 1]; return this; },
    end() { return this; },
  };
  return r;
}

/* Stub the ONE external dependency: toyyibPay's transaction lookup.
   Everything else — notably Neon's own HTTP driver, which also uses
   fetch — passes straight through to the real implementation. */
const realFetch = global.fetch.bind(global);

function stubGateway(amountMyr, { paid = true } = {}) {
  global.fetch = async (url, init) => {
    if (!String(url).includes('getBillTransactions')) {
      return realFetch(url, init);
    }
    return {
      ok: true,
      json: async () => (paid
        ? [{
            billpaymentStatus: '1',
            billpaymentAmount: amountMyr.toFixed(2),
            billpaymentInvoiceNo: 'TEST-INV-001',
            billPaymentDate: '01-01-2026 12:00:00',
          }]
        : [{ msg: 'NOT FOUND' }]),
    };
  };
}

(async () => {
  const handler = require(path.join(ROOT, 'api', 'payment-response.js'));

  /* ── Pick a real, well-stocked variant ── */
  const [seed] = await sql`
    SELECT sku, stock FROM products_stock WHERE stock >= 3 ORDER BY stock DESC LIMIT 1`;
  if (!seed) { console.error('✗ No sku with stock >= 3 — run scripts/db-migrate.js first.'); process.exit(1); }

  const variant = catalog.lookupSku(seed.sku);
  if (!variant) { console.error('✗ ' + seed.sku + ' is in the DB but not in the catalogue.'); process.exit(1); }

  const QTY = 2;
  const stamp = Date.now().toString(36).toUpperCase();
  const refA = 'EP-TEST-' + stamp + 'A';
  const refB = 'EP-TEST-' + stamp + 'B';
  const stockBefore = Number(seed.stock);

  const lines = [{ ...variant, qty: QTY }];
  const totalMyr = Math.round(variant.price * QTY * 100) / 100;
  const totalSen = Math.round(totalMyr * 100);

  console.log('\n══ Fixture ══');
  console.log('   sku=' + variant.sku + '  price=RM' + variant.price + '  qty=' + QTY +
              '  total=RM' + totalMyr.toFixed(2) + ' (' + totalSen + ' sen)');
  console.log('   stock before = ' + stockBefore);
  console.log('   refs: ' + refA + ' (happy path), ' + refB + ' (amount mismatch)');

  const customer = {
    name: 'Verify Bot', email: 'verify@example.com', phone: '012-0000000',
    address: '1 Test Road', city: 'Kuala Lumpur', postcode: '50000', state: 'Selangor',
  };

  try {
    /* ── 1. createPendingOrder ── */
    console.log('\n══ 1. createPendingOrder ══');
    const c1 = await orders.createPendingOrder({
      orderRef: refA, lines, customer,
      totalMyr, subtotalMyr: totalMyr, discountMyr: 0, promoCode: '',
    });
    check('created', c1.created, true);
    check('items inserted', c1.itemCount, 1);

    let rows = await sql`SELECT count(*)::int AS n FROM orders WHERE order_ref = ${refA}`;
    check('orders rows', rows[0].n, 1);
    let items = await sql`
      SELECT count(*)::int AS n FROM order_items oi
       JOIN orders o ON o.id = oi.order_id WHERE o.order_ref = ${refA}`;
    check('order_items rows', items[0].n, 1);
    let amt = await sql`SELECT amount_cents, status FROM orders WHERE order_ref = ${refA}`;
    check('amount_cents stored', Number(amt[0].amount_cents), totalSen);
    check('status', amt[0].status, 'pending');

    /* ── 2. replay createPendingOrder ── */
    console.log('\n══ 2. createPendingOrder replayed (same order_ref) ══');
    const c2 = await orders.createPendingOrder({
      orderRef: refA, lines, customer,
      totalMyr, subtotalMyr: totalMyr, discountMyr: 0, promoCode: '',
    });
    check('created', c2.created, false);
    check('same order id', c2.id, c1.id);
    check('no extra items', c2.itemCount, 0);
    rows = await sql`SELECT count(*)::int AS n FROM orders WHERE order_ref = ${refA}`;
    check('orders rows still', rows[0].n, 1);
    items = await sql`
      SELECT count(*)::int AS n FROM order_items oi
       JOIN orders o ON o.id = oi.order_id WHERE o.order_ref = ${refA}`;
    check('order_items rows still', items[0].n, 1);

    /* ── 3. first callback ── */
    console.log('\n══ 3. Callback #1 (verified, correct amount) ══');
    await orders.attachGatewayRef(refA, 'TESTBILL' + stamp);
    stubGateway(totalMyr);

    const res1 = fakeRes();
    await handler({
      method: 'POST',
      body: { billcode: 'TESTBILL' + stamp, order_id: refA, status: '1', amount: totalMyr.toFixed(2) },
    }, res1);
    check('HTTP status', res1.statusCode, 200);

    let o = await sql`SELECT status, paid_at, stock_deducted_at FROM orders WHERE order_ref = ${refA}`;
    check('order status', o[0].status, 'paid');
    check('paid_at set', o[0].paid_at !== null, true);
    check('stock_deducted_at set', o[0].stock_deducted_at !== null, true);

    let s = await orders.getStock(variant.sku);
    check('stock after 1 callback', s.stock, stockBefore - QTY);
    rows = await sql`SELECT count(*)::int AS n FROM orders WHERE order_ref = ${refA}`;
    check('orders rows', rows[0].n, 1);

    /* ── 4. same callback again ── */
    console.log('\n══ 4. Callback #2 — identical replay ══');
    const res2 = fakeRes();
    await handler({
      method: 'POST',
      body: { billcode: 'TESTBILL' + stamp, order_id: refA, status: '1', amount: totalMyr.toFixed(2) },
    }, res2);
    check('HTTP status', res2.statusCode, 200);

    rows = await sql`SELECT count(*)::int AS n FROM orders WHERE order_ref = ${refA}`;
    check('orders rows STILL', rows[0].n, 1);
    items = await sql`
      SELECT count(*)::int AS n FROM order_items oi
       JOIN orders o ON o.id = oi.order_id WHERE o.order_ref = ${refA}`;
    check('order_items rows STILL', items[0].n, 1);

    s = await orders.getStock(variant.sku);
    check('stock UNCHANGED by replay', s.stock, stockBefore - QTY);

    // And a third, for good measure.
    const res3 = fakeRes();
    await handler({
      method: 'POST',
      body: { billcode: 'TESTBILL' + stamp, order_id: refA, status: '1' },
    }, res3);
    s = await orders.getStock(variant.sku);
    check('stock unchanged after 3rd callback', s.stock, stockBefore - QTY);
    check('decrementStock reports not applied', (await orders.decrementStock(refA)).applied, false);

    /* ── 5. amount mismatch is refused ── */
    console.log('\n══ 5. Callback with the wrong amount ══');
    await orders.createPendingOrder({
      orderRef: refB, lines, customer,
      totalMyr, subtotalMyr: totalMyr, discountMyr: 0, promoCode: '',
    });
    stubGateway(totalMyr + 100);            // gateway claims RM100 more

    const res4 = fakeRes();
    await handler({
      method: 'POST',
      body: { billcode: 'TESTBILL' + stamp + 'B', order_id: refB, status: '1' },
    }, res4);
    check('HTTP status (fails closed)', res4.statusCode, 503);
    o = await sql`SELECT status, stock_deducted_at FROM orders WHERE order_ref = ${refB}`;
    check('order left unpaid', o[0].status, 'pending');
    check('no stock deduction', o[0].stock_deducted_at, null);
    s = await orders.getStock(variant.sku);
    check('stock untouched', s.stock, stockBefore - QTY);

    /* ── 6. reads ── */
    console.log('\n══ 6. Admin read path ══');
    const list = await orders.getOrders({ limit: 500 });
    const found = list.find(x => x.orderRef === refA);
    check('getOrders returns the order', Boolean(found), true);
    check('  payment status', found.status, 'paid');
    check('  amountCents', found.amountCents, totalSen);
    check('  item count', found.items.length, 1);
    check('  item qty', found.items[0].qty, QTY);
    check('  address flattened', found.customer.address,
      '1 Test Road, Kuala Lumpur, 50000, Selangor');

    const adminHandler = require(path.join(ROOT, 'api', 'admin-orders.js'));
    const res5 = fakeRes();
    await adminHandler({ method: 'GET', headers: {}, query: {} }, res5);
    check('GET /api/admin-orders without a session', res5.statusCode, 401);

  } finally {
    /* ── Cleanup ── */
    console.log('\n══ Cleanup ══');
    if (KEEP) {
      await sql`DELETE FROM orders WHERE order_ref = ${refB}`;
      console.log('   --keep: left ' + refA + ' in place for the admin UI check.');
      console.log('   Remove it later with:');
      console.log("     DELETE FROM orders WHERE order_ref LIKE 'EP-TEST-%';");
    } else {
      await sql`DELETE FROM orders WHERE order_ref IN (${refA}, ${refB})`;
      await sql`
        UPDATE products_stock SET stock = ${stockBefore}, updated_at = now()
         WHERE sku = ${variant.sku}`;
      const s = await orders.getStock(variant.sku);
      console.log('   test orders deleted; stock restored to ' + s.stock);
    }

    console.log('\n══ Result ══');
    console.log('   ' + pass + ' passed, ' + fail + ' failed\n');
    process.exit(fail ? 1 : 0);
  }
})().catch(err => {
  console.error('\n✗ Harness error: ' + (err && err.stack ? err.stack : err));
  process.exit(1);
});
