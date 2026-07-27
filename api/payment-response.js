/* ═══════════════════════════════════════════════════
   EURO POLO · api/payment-response.js
   Billplz callback URL (POST) + redirect URL (GET)

   TWO DIFFERENT THINGS — do not conflate them:

   POST = server-to-server callback. THE ONLY THING THAT MARKS AN ORDER
          PAID. Params: id, collection_id, paid, state, amount, paid_amount,
          due_at, email, mobile, name, url, paid_at, x_signature.
          Authenticated by X-Signature (HMAC-SHA256), so a forged callback
          cannot pass. Marks paid only when paid == true AND the amount
          matches what we billed.

   GET  = browser redirect after payment. DISPLAY ONLY.
          Params: billplz[id], billplz[paid], billplz[paid_at],
          billplz[x_signature]. Its signature is checked purely so we do not
          show "success" off an unverified URL — it never writes anything.
          A shopper who closes the tab still gets a recorded order, because
          the POST callback is independent of the browser.

   ── IDEMPOTENCY ───────────────────────────────────
   Billplz retries callbacks. markPaidByCallback() flips status in one
   conditional UPDATE, and decrementStock() claims orders.stock_deducted_at
   in the same statement that deducts, so a replay writes nothing and stock
   drops exactly once.

   ── FAIL CLOSED ───────────────────────────────────
   200 is returned only when the payment is definitively recorded, or when
   there is definitively nothing to record. Anything else answers 5xx so
   Billplz retries — a real payment is never silently dropped.

   SETUP: Add these to Vercel Environment Variables
   ─────────────────────────────────────────────────
   BILLPLZ_XSIGNATURE_KEY = X Signature Key (see api/_lib/billplz.js)
   DATABASE_URL           = Neon pooled connection string (see api/_lib/orders.js)
═══════════════════════════════════════════════════ */

const orders  = require('./_lib/orders');
const gateway = require('./_lib/billplz');

const LOG = '[billplz][callback] ';

/**
 * Read a form-encoded or JSON POST body.
 * Billplz posts application/x-www-form-urlencoded; Vercel normally parses
 * that for us, and the stream fallback covers an unexpected content-type.
 */
async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;

  let raw = typeof req.body === 'string' ? req.body : '';
  if (!raw) {
    raw = await new Promise((resolve) => {
      let buf = '';
      req.on('data', chunk => { buf += chunk; });
      req.on('end', () => resolve(buf));
      req.on('error', () => resolve(''));
    });
  }
  if (!raw) return {};

  if (raw.trim().startsWith('{')) {
    try { return JSON.parse(raw); } catch { /* fall through */ }
  }
  return Object.fromEntries(new URLSearchParams(raw));
}

/* ── Server-to-server callback (POST) ──────────────── */
async function handleCallback(req, res) {
  const body = await readBody(req).catch(() => ({}));

  // ── 1. Authenticate the payload before trusting any field in it ──
  const event = gateway.readCallback(body);
  if (!event.ok) {
    // Either forged, or BILLPLZ_XSIGNATURE_KEY is wrong/missing. Both are
    // worth shouting about; neither is something to retry into.
    console.error(LOG + 'REJECTED (' + event.reason + ') for bill ' +
      (body && body.id ? body.id : '?') + '.');
    res.status(400).send('Invalid signature');
    return;
  }

  // Unsigned fallback hint from the callback URL query string. Only ever used
  // to locate a row, and only after the signature above has passed.
  const refHint = String(req.query?.ref || event.orderRef || '').trim() || null;

  if (!event.paid) {
    console.log(LOG + 'bill ' + event.billId + ' state=' + event.state +
      ' paid=false — nothing to persist.');
    res.status(200).send('');
    return;
  }

  if (!orders.isConfigured()) {
    console.error(LOG + 'NOT PERSISTED — DATABASE_URL is not set.', JSON.stringify({
      bill: event.billId, ref: refHint, amount: event.amountCents,
    }));
    res.status(503).send('Order store not configured');
    return;
  }

  try {
    // The amount actually received. Billplz sends both; paid_amount is the
    // money that moved, so that is what has to equal what we billed.
    const paidCents = event.paidAmountCents !== null
      ? event.paidAmountCents
      : event.amountCents;

    // ── 2. Persist. A replay reports already_paid and writes nothing ──
    // Matched on the bill id (stored as gateway_ref at checkout); refHint is
    // the fallback for the case where that write failed.
    let result = await orders.markPaidByCallback({
      gatewayRef:  event.billId,
      amountCents: paidCents,
    });

    if (result.outcome === 'not_found' && refHint) {
      result = await orders.markPaidByCallback({
        orderRef:    refHint,
        gatewayRef:  event.billId,
        amountCents: paidCents,
      });
    }

    if (result.outcome === 'not_found') {
      console.error(LOG + 'REAL PAYMENT WITH NO ORDER ROW — bill ' + event.billId +
        ', ref ' + refHint + ', ' + paidCents + ' sen. Reconcile by hand.');
      res.status(503).send('Order not found');
      return;
    }

    if (result.outcome === 'amount_mismatch') {
      console.error(LOG + 'AMOUNT MISMATCH for ' + result.orderRef + ' — billed ' +
        result.amountCents + ' sen, Billplz reports ' + paidCents +
        ' sen. Left unpaid for manual review.');
      res.status(503).send('Amount mismatch');
      return;
    }

    if (result.outcome === 'refused') {
      console.error(LOG + 'refused to mark ' + result.orderRef + ' paid from status "' +
        result.previousStatus + '".');
      res.status(503).send('Order not in a payable state');
      return;
    }

    if (result.outcome === 'already_paid') {
      console.log(LOG + result.orderRef + ' already paid — duplicate callback ignored.');
    } else {
      console.log(LOG + result.orderRef + ' marked PAID (' + result.amountCents +
        ' sen, bill ' + event.billId + ').');
    }

    // ── 3. Deduct stock. Guarded independently of the paid flip, so a
    //       callback retried after a mid-way failure still applies the
    //       deduction — exactly once. ──
    const stock = await orders.decrementStock(result.orderRef);
    if (stock.applied) {
      console.log(LOG + 'stock deducted for ' + result.orderRef + ' — ' +
        stock.updated.map(u => u.sku + '→' + u.stock).join(', '));
      if (stock.missingSkus.length) {
        console.error(LOG + result.orderRef + ' has skus absent from products_stock: ' +
          stock.missingSkus.join(', ') + ' — re-run scripts/db-migrate.js.');
      }
    } else {
      console.log(LOG + 'stock already deducted for ' + result.orderRef + ' — skipped.');
    }

    res.status(200).send('');

  } catch (err) {
    // Transient DB trouble. 5xx so Billplz retries; every step above is
    // idempotent, so the retry is safe.
    console.error(LOG + 'failed to process bill ' + event.billId + ': ' +
      (err && err.message ? err.message : err));
    res.status(503).send('Temporary failure');
  }
}

/* ── Browser redirect (GET) — DISPLAY ONLY ─────────── */
function handleReturn(req, res) {
  const view = gateway.readRedirect(req.query);
  const ref  = String(req.query?.ref || '');   // cosmetic hint from checkout

  // Unverified redirects are treated as failures for display purposes only.
  // Nothing is written either way, so this cannot lose a payment: if the
  // money really moved, the POST callback records it regardless.
  if (view.paid && view.verified) {
    const qs = new URLSearchParams({ status: '1', refno: ref, bill: view.billId });
    res.redirect(303, '/success.html?' + qs.toString());
    return;
  }

  if (view.paid && !view.verified) {
    console.error('[billplz][redirect] paid=true but signature did not verify for bill ' +
      view.billId + ' — showing pending instead of success.');
    const qs = new URLSearchParams({ status: '2', refno: ref, bill: view.billId });
    res.redirect(303, '/success.html?' + qs.toString());
    return;
  }

  res.redirect(303, '/checkout.html?err=' +
    encodeURIComponent('Payment was not completed. Please try again.'));
}

module.exports = async function (req, res) {
  if (req.method === 'POST') return handleCallback(req, res);
  return handleReturn(req, res);
};
