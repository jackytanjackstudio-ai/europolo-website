#!/usr/bin/env node
/* ═══════════════════════════════════════════════════
   EURO POLO · scripts/verify-order-flow.js
   Proves the Billplz payment flow and order persistence against the real
   Neon database, without needing Billplz credentials.

   Usage (from the project root):
     node --env-file=.env scripts/verify-order-flow.js
     node --env-file=.env scripts/verify-order-flow.js --keep

   Checks
     0. X-Signature source strings match both worked examples in the
        Billplz docs. This locks in the one genuinely ambiguous detail —
        their prose says "sort keys", their examples sort the combined
        key+value pairs, and only the latter reproduces the examples.
     1. createPendingOrder writes exactly one order + its items.
     2. Replaying createPendingOrder writes nothing more.
     3. A correctly SIGNED callback marks the order paid and drops stock.
     4. Firing the SAME callback twice leaves one row and one deduction.
     5. A callback with a bad signature is rejected and writes nothing.
     6. A signed callback whose amount disagrees with the bill is refused.
     7. paid=false writes nothing.
     8. getOrders returns the order; the admin endpoint enforces roles.

   Steps 3-7 drive the real api/payment-response.js handler with genuinely
   signed payloads, so the signature path is exercised for real. Only the
   outbound Billplz create-bill HTTP call is stubbed (step 9) — this project
   has no Billplz credentials, so the gateway cannot be reached from here.

   Test rows are deleted and stock restored on the way out (--keep leaves
   one paid order behind so it can be eyeballed in admin/orders.html).

   Local tooling only — scripts/ is excluded by .vercelignore.
═══════════════════════════════════════════════════ */

const path = require('path');
const { neon } = require('@neondatabase/serverless');

const ROOT = path.join(__dirname, '..');

// Test-only signing key. The real one is BILLPLZ_XSIGNATURE_KEY in Vercel;
// set here before requiring the gateway so both sides agree.
process.env.BILLPLZ_XSIGNATURE_KEY = 'verify-harness-xsignature-key';
process.env.BILLPLZ_API_KEY        = process.env.BILLPLZ_API_KEY        || 'verify-harness-api-key';
process.env.BILLPLZ_COLLECTION_ID  = process.env.BILLPLZ_COLLECTION_ID  || 'verifycol';

const orders  = require(path.join(ROOT, 'api', '_lib', 'orders'));
const catalog = require(path.join(ROOT, 'api', '_lib', 'catalog'));
const gateway = require(path.join(ROOT, 'api', '_lib', 'billplz'));

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

/* ── Minimal req/res doubles for the real serverless handlers ── */
function fakeRes() {
  return {
    statusCode: null, bodySent: null, headers: {},
    setHeader(k, v) { this.headers[k] = v; return this; },
    status(c) { this.statusCode = c; return this; },
    send(b) { this.bodySent = b; return this; },
    json(b) { this.bodySent = b; return this; },
    redirect(...a) { this.statusCode = a.length > 1 ? a[0] : 302; this.bodySent = a[a.length - 1]; return this; },
    end() { return this; },
  };
}

/** Build a Billplz callback body and sign it exactly as Billplz would. */
function signedCallback(fields) {
  const body = { ...fields };
  body.x_signature = gateway.sign(gateway.sourceString(body));
  return body;
}

(async () => {
  const handler      = require(path.join(ROOT, 'api', 'payment-response.js'));
  const adminHandler = require(path.join(ROOT, 'api', 'admin-orders.js'));

  /* ── 0. Signature spec, against the docs' own examples ── */
  console.log('\n══ 0. X-Signature source string vs Billplz documented examples ══');

  const DOC_CB_PARAMS = {
    id: 'zq0tm2wc', collection_id: 'yhx5t1pp', paid: 'true', state: 'paid',
    amount: '100', paid_amount: '100', due_at: '2018-9-27',
    email: 'api@billplz.com', mobile: '', name: 'TESTER',
    url: 'http://www.billplz-sandbox.com/bills/zq0tm2wc',
    paid_at: '2018-09-27 15:15:09 +0800',
    x_signature: 'ignored-must-be-excluded',
  };
  const DOC_CB_SOURCE =
    'amount100|collection_idyhx5t1pp|due_at2018-9-27|emailapi@billplz.com|idzq0tm2wc|' +
    'mobile|nameTESTER|paid_amount100|paid_at2018-09-27 15:15:09 +0800|paidtrue|statepaid|' +
    'urlhttp://www.billplz-sandbox.com/bills/zq0tm2wc';
  check('callback source string', gateway.sourceString(DOC_CB_PARAMS), DOC_CB_SOURCE);

  const DOC_RD_QUERY = {
    'billplz[id]': 'zq0tm2wc',
    'billplz[paid]': 'true',
    'billplz[paid_at]': '2018-09-27 15:15:09 +0800',
    'billplz[x_signature]': 'deadbeef',
  };
  const DOC_RD_SOURCE =
    'billplzidzq0tm2wc|billplzpaid_at2018-09-27 15:15:09 +0800|billplzpaidtrue';
  const rdPairs = {};
  for (const k of Object.keys(DOC_RD_QUERY)) {
    const m = /^billplz\[(.+)\]$/.exec(k);
    if (m && m[1] !== 'x_signature') rdPairs['billplz' + m[1]] = DOC_RD_QUERY[k];
  }
  check('redirect source string', gateway.sourceString(rdPairs), DOC_RD_SOURCE);

  /* ── Fixture ── */
  const [seed] = await sql`
    SELECT sku, stock FROM products_stock WHERE stock >= 3 ORDER BY stock DESC LIMIT 1`;
  if (!seed) { console.error('✗ No sku with stock >= 3 — run scripts/db-migrate.js first.'); process.exit(1); }

  const variant = catalog.lookupSku(seed.sku);
  if (!variant) { console.error('✗ ' + seed.sku + ' is in the DB but not in the catalogue.'); process.exit(1); }

  const QTY = 2;
  const stamp = Date.now().toString(36).toUpperCase();
  const refA = 'EP-TEST-' + stamp + 'A';
  const refB = 'EP-TEST-' + stamp + 'B';
  const billA = 'billa' + stamp.toLowerCase();
  const billB = 'billb' + stamp.toLowerCase();
  const stockBefore = Number(seed.stock);

  const lines = [{ ...variant, qty: QTY }];
  const totalMyr = Math.round(variant.price * QTY * 100) / 100;
  const totalSen = Math.round(totalMyr * 100);

  console.log('\n══ Fixture ══');
  console.log('   sku=' + variant.sku + '  price=RM' + variant.price + '  qty=' + QTY +
              '  total=RM' + totalMyr.toFixed(2) + ' (' + totalSen + ' sen)');
  console.log('   stock before = ' + stockBefore);
  console.log('   gateway host = ' + gateway.baseUrl() + '  (live=' + gateway.isLive() + ')');

  const customer = {
    name: 'Verify Bot', email: 'verify@example.com', phone: '012-0000000',
    address: '1 Test Road', city: 'Kuala Lumpur', postcode: '50000', state: 'Selangor',
  };

  const baseFields = ref => ({
    id: ref, collection_id: 'verifycol', state: 'paid',
    amount: String(totalSen), paid_amount: String(totalSen),
    due_at: '2026-12-31', email: customer.email, mobile: '',
    name: customer.name, url: 'https://www.billplz-sandbox.com/bills/' + ref,
    paid_at: '2026-07-27 12:00:00 +0800', paid: 'true',
  });

  try {
    /* ── 1. createPendingOrder ── */
    console.log('\n══ 1. createPendingOrder ══');
    const c1 = await orders.createPendingOrder({
      orderRef: refA, lines, customer,
      totalMyr, subtotalMyr: totalMyr, discountMyr: 0, promoCode: '',
    });
    check('created', c1.created, true);
    check('items inserted', c1.itemCount, 1);
    await orders.attachGatewayRef(refA, billA);

    let rows = await sql`SELECT count(*)::int AS n FROM orders WHERE order_ref = ${refA}`;
    check('orders rows', rows[0].n, 1);
    let amt = await sql`SELECT amount_cents, status, gateway_ref FROM orders WHERE order_ref = ${refA}`;
    check('amount_cents stored', Number(amt[0].amount_cents), totalSen);
    check('status', amt[0].status, 'pending');
    check('gateway_ref attached', amt[0].gateway_ref, billA);

    /* ── 2. replay createPendingOrder ── */
    console.log('\n══ 2. createPendingOrder replayed (same order_ref) ══');
    const c2 = await orders.createPendingOrder({
      orderRef: refA, lines, customer,
      totalMyr, subtotalMyr: totalMyr, discountMyr: 0, promoCode: '',
    });
    check('created', c2.created, false);
    check('same order id', c2.id, c1.id);
    check('no extra items', c2.itemCount, 0);
    let items = await sql`
      SELECT count(*)::int AS n FROM order_items oi
       JOIN orders o ON o.id = oi.order_id WHERE o.order_ref = ${refA}`;
    check('order_items rows still', items[0].n, 1);

    /* ── 3. first signed callback ── */
    console.log('\n══ 3. Callback #1 — correctly signed, paid=true ══');
    const res1 = fakeRes();
    await handler({ method: 'POST', query: {}, body: signedCallback(baseFields(billA)) }, res1);
    check('HTTP status', res1.statusCode, 200);

    let o = await sql`SELECT status, paid_at, stock_deducted_at FROM orders WHERE order_ref = ${refA}`;
    check('order status', o[0].status, 'paid');
    check('paid_at set', o[0].paid_at !== null, true);
    check('stock_deducted_at set', o[0].stock_deducted_at !== null, true);

    let s = await orders.getStock(variant.sku);
    check('stock after 1 callback', s.stock, stockBefore - QTY);

    /* ── 4. same callback again ── */
    console.log('\n══ 4. Callback #2 and #3 — identical replays ══');
    for (const n of [2, 3]) {
      const r = fakeRes();
      await handler({ method: 'POST', query: {}, body: signedCallback(baseFields(billA)) }, r);
      check('replay #' + n + ' HTTP status', r.statusCode, 200);
    }
    rows = await sql`SELECT count(*)::int AS n FROM orders WHERE order_ref = ${refA}`;
    check('orders rows STILL', rows[0].n, 1);
    items = await sql`
      SELECT count(*)::int AS n FROM order_items oi
       JOIN orders o ON o.id = oi.order_id WHERE o.order_ref = ${refA}`;
    check('order_items rows STILL', items[0].n, 1);
    s = await orders.getStock(variant.sku);
    check('stock UNCHANGED by replays', s.stock, stockBefore - QTY);
    check('decrementStock reports not applied', (await orders.decrementStock(refA)).applied, false);

    /* ── 5. forged signature ── */
    console.log('\n══ 5. Callback with a BAD signature ══');
    await orders.createPendingOrder({
      orderRef: refB, lines, customer,
      totalMyr, subtotalMyr: totalMyr, discountMyr: 0, promoCode: '',
    });
    await orders.attachGatewayRef(refB, billB);

    const forged = { ...baseFields(billB), x_signature: 'f'.repeat(64) };
    const res5 = fakeRes();
    await handler({ method: 'POST', query: {}, body: forged }, res5);
    check('HTTP status (rejected)', res5.statusCode, 400);
    o = await sql`SELECT status, stock_deducted_at FROM orders WHERE order_ref = ${refB}`;
    check('order untouched', o[0].status, 'pending');
    check('no stock deduction', o[0].stock_deducted_at, null);

    // Tampering with a field after signing must also fail.
    const tampered = signedCallback(baseFields(billB));
    tampered.paid_amount = '1';
    const res5b = fakeRes();
    await handler({ method: 'POST', query: {}, body: tampered }, res5b);
    check('tampered amount rejected', res5b.statusCode, 400);
    o = await sql`SELECT status FROM orders WHERE order_ref = ${refB}`;
    check('order still pending', o[0].status, 'pending');

    /* ── 6. signed, but amount disagrees with the bill ── */
    console.log('\n══ 6. Signed callback whose amount != the bill ══');
    const wrongAmount = signedCallback({
      ...baseFields(billB), amount: String(totalSen + 10000), paid_amount: String(totalSen + 10000),
    });
    const res6 = fakeRes();
    await handler({ method: 'POST', query: {}, body: wrongAmount }, res6);
    check('HTTP status (fails closed)', res6.statusCode, 503);
    o = await sql`SELECT status, stock_deducted_at FROM orders WHERE order_ref = ${refB}`;
    check('order left unpaid', o[0].status, 'pending');
    check('no stock deduction', o[0].stock_deducted_at, null);
    s = await orders.getStock(variant.sku);
    check('stock untouched', s.stock, stockBefore - QTY);

    /* ── 7. paid=false ── */
    console.log('\n══ 7. Signed callback with paid=false ══');
    const unpaid = signedCallback({ ...baseFields(billB), paid: 'false', state: 'due', paid_amount: '0' });
    const res7 = fakeRes();
    await handler({ method: 'POST', query: {}, body: unpaid }, res7);
    check('HTTP status (acknowledged)', res7.statusCode, 200);
    o = await sql`SELECT status FROM orders WHERE order_ref = ${refB}`;
    check('order still pending', o[0].status, 'pending');

    /* ── 8. redirect is display only ── */
    console.log('\n══ 8. Return redirect (GET) never marks paid ══');
    const rdFields = { 'billplz[id]': billB, 'billplz[paid]': 'true',
                       'billplz[paid_at]': '2026-07-27 12:00:00 +0800' };
    const rdPairs2 = {};
    for (const k of Object.keys(rdFields)) rdPairs2['billplz' + /^billplz\[(.+)\]$/.exec(k)[1]] = rdFields[k];
    const rdSigned = { ...rdFields, ref: refB,
                       'billplz[x_signature]': gateway.sign(gateway.sourceString(rdPairs2)) };
    const res8 = fakeRes();
    await handler({ method: 'GET', query: rdSigned }, res8);
    check('redirects to success page', /^\/success\.html\?/.test(String(res8.bodySent)), true);
    check('carries status=1', /status=1/.test(String(res8.bodySent)), true);
    o = await sql`SELECT status FROM orders WHERE order_ref = ${refB}`;
    check('order STILL pending after redirect', o[0].status, 'pending');

    const res8b = fakeRes();
    await handler({ method: 'GET', query: { ...rdFields, 'billplz[x_signature]': 'bad' } }, res8b);
    check('unverified redirect shows pending', /status=2/.test(String(res8b.bodySent)), true);

    /* ── 9. checkout creates the bill via the gateway module ── */
    console.log('\n══ 9. checkout.js -> gateway.createBill (HTTP stubbed) ══');
    const realFetch = global.fetch.bind(global);
    let sent = null, authHeader = null, calledUrl = null;
    global.fetch = async (url, init) => {
      if (String(url).includes('/api/v3/bills')) {
        calledUrl = String(url);
        authHeader = init.headers.Authorization;
        sent = Object.fromEntries(new URLSearchParams(init.body));
        return { ok: true, status: 200, text: async () => JSON.stringify({
          id: 'stubbill' + stamp.toLowerCase(),
          url: 'https://www.billplz-sandbox.com/bills/stubbill',
        }) };
      }
      return realFetch(url, init);
    };

    const checkout = require(path.join(ROOT, 'api', 'checkout.js'));
    const res9 = fakeRes();
    // Client sends a LYING price — it must be ignored.
    await checkout({
      method: 'POST', headers: { origin: 'https://europolo.my' },
      body: { items: [{ sku: variant.sku, qty: QTY, price: '0.01', name: 'hacked' }], customer },
    }, res9);
    global.fetch = realFetch;

    check('HTTP status', res9.statusCode, 200);
    check('sandbox endpoint used', calledUrl, 'https://www.billplz-sandbox.com/api/v3/bills');
    check('basic auth is key + empty password',
      Buffer.from(String(authHeader).replace('Basic ', ''), 'base64').toString('utf8'),
      process.env.BILLPLZ_API_KEY + ':');
    check('amount sent in CENTS', sent.amount, String(totalSen));
    check('client price ignored', sent.amount, String(totalSen));
    check('collection_id sent', sent.collection_id, process.env.BILLPLZ_COLLECTION_ID);
    check('callback_url is canonical + ref',
      sent.callback_url, 'https://europolo.my/api/payment-response?ref=' + res9.bodySent.refNo);
    check('redirect_url is canonical', /^https:\/\/europolo\.my\/api\/payment-response/.test(sent.redirect_url), true);
    check('reference_1 carries our ref', sent.reference_1, res9.bodySent.refNo);
    check('no mobile sent', sent.mobile, undefined);

    const created = await sql`
      SELECT amount_cents, gateway_ref, status FROM orders WHERE order_ref = ${res9.bodySent.refNo}`;
    check('pending row written with server amount', Number(created[0].amount_cents), totalSen);
    check('gateway_ref = returned bill id', created[0].gateway_ref, 'stubbill' + stamp.toLowerCase());
    check('status pending', created[0].status, 'pending');
    await sql`DELETE FROM orders WHERE order_ref = ${res9.bodySent.refNo}`;

    /* ── 10. admin reads ── */
    console.log('\n══ 10. Admin read path ══');
    const list = await orders.getOrders({ limit: 500 });
    const found = list.find(x => x.orderRef === refA);
    check('getOrders returns the order', Boolean(found), true);
    check('  payment status', found.status, 'paid');
    check('  amountCents', found.amountCents, totalSen);
    check('  item qty', found.items[0].qty, QTY);
    check('  address flattened', found.customer.address,
      '1 Test Road, Kuala Lumpur, 50000, Selangor');

    const res10 = fakeRes();
    await adminHandler({ method: 'GET', headers: {}, query: {} }, res10);
    check('GET /api/admin-orders without a session', res10.statusCode, 401);

    const auth = require(path.join(ROOT, 'api', '_lib', 'auth'));
    process.env.ADMIN_SESSION_SECRET = 'verify-harness-session-secret-32-chars';
    for (const [role, expected] of [['admin', 200], ['cs', 200], ['marketing', 403], ['host', 403]]) {
      const tok = encodeURIComponent(auth.signSession({ sub: 'u', role, exp: Date.now() + 60000 }));
      const r = fakeRes();
      await adminHandler({ method: 'GET', headers: { cookie: auth.SESSION_COOKIE + '=' + tok }, query: {} }, r);
      check('role ' + role, r.statusCode, expected);
    }

  } finally {
    /* ── Cleanup ── */
    console.log('\n══ Cleanup ══');
    if (KEEP) {
      await sql`DELETE FROM orders WHERE order_ref = ${refB}`;
      console.log('   --keep: left ' + refA + ' in place for the admin UI check.');
      console.log("   Remove it later with: DELETE FROM orders WHERE order_ref LIKE 'EP-TEST-%';");
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
