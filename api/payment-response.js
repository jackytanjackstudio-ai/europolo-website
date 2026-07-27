/* ═══════════════════════════════════════════════════
   EURO POLO · api/payment-response.js
   toyyibPay Return URL (GET) + Callback URL (POST)

   TWO DIFFERENT THINGS — do not conflate them:

   GET  = browser redirect after payment. DISPLAY ONLY.
          Params: status_id, billcode, order_id.
          Confirmed against toyyibPay's API reference: the return
          redirect carries NO hash, so it cannot be authenticated and
          must never be trusted to mark an order paid. The previous
          version required MD5(secretKey + billcode + status_id) here,
          which no toyyibPay redirect ever sends — so every successful
          payment was redirected to the error page.

   POST = server-to-server callback. THE ONLY THING THAT MARKS AN ORDER
          PAID. Params: refno, status, reason, billcode, order_id, amount.
          Must verify, persist, deduct stock, and be idempotent.

   ── HOW THE POST BRANCH IS SAFE ───────────────────
   Verify   The callback is unsigned, so the body is treated only as a
            hint about WHICH bill to check. The answer comes from
            toyyibPay's getBillTransactions API, and the amount it
            reports must equal the amount we billed.
   Persist  markPaidByCallback() flips status in one conditional UPDATE;
            a replay finds it already 'paid' and writes nothing.
   Stock    decrementStock() claims orders.stock_deducted_at in the same
            statement that deducts, so stock drops exactly once.

   ── FAIL CLOSED ───────────────────────────────────
   200 is returned only when the payment is definitively recorded, or
   when there is definitively nothing to record. Anything else answers
   5xx so toyyibPay retries — a real payment is never silently dropped.

   SETUP: Add these to Vercel Environment Variables
   ─────────────────────────────────────────────────
   TOYYIBPAY_SECRET_KEY = your Secret Key (from toyyibPay merchant panel)
   DATABASE_URL         = Neon pooled connection string (see api/_lib/orders.js)
═══════════════════════════════════════════════════ */

const orders = require('./_lib/orders');
const { gatewayBaseUrl } = require('./_lib/config');

// Set TOYYIBPAY_BASE_URL=https://dev.toyyibpay.com for sandbox testing.
const TXN_PATH = '/index.php/api/getBillTransactions';

const LOG = '[toyyibpay][callback] ';

/**
 * Read a form-encoded or JSON POST body.
 * Vercel normally parses this for us; the stream fallback covers an
 * unexpected content-type.
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

/** toyyibPay returns ringgit as a display string, e.g. "1,239.90". */
function parseMyr(value) {
  const n = parseFloat(String(value == null ? '' : value).replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? n : null;
}

/**
 * Confirm a payment with toyyibPay directly instead of believing the body.
 *
 * @returns {Promise<{ amountCents:number, invoiceNo:string, paidAt:string }|null>}
 *          null when toyyibPay reports no successful transaction for this bill.
 */
async function verifyBillPaid(billCode) {
  const params = new URLSearchParams({
    billCode:          String(billCode),
    billpaymentStatus: '1',                 // 1 = successful
  });
  const secretKey = process.env.TOYYIBPAY_SECRET_KEY;
  if (secretKey) params.set('userSecretKey', secretKey);

  const response = await fetch(gatewayBaseUrl() + TXN_PATH, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    params.toString(),
  });

  if (!response.ok) throw new Error('getBillTransactions HTTP ' + response.status);

  const rows = await response.json();
  if (!Array.isArray(rows)) return null;

  // An unknown bill code comes back as [{ msg: "..." }], which carries no
  // billpaymentStatus and so never matches.
  const paid = rows.find(t => String(t.billpaymentStatus) === '1');
  if (!paid) return null;

  const amountMyr = parseMyr(paid.billpaymentAmount);
  if (amountMyr === null) throw new Error('getBillTransactions returned no usable amount.');

  return {
    amountCents: Math.round(amountMyr * 100),
    invoiceNo:   String(paid.billpaymentInvoiceNo || ''),
    paidAt:      String(paid.billPaymentDate || paid.billpaymentDate || ''),
  };
}

/* ── Server-to-server callback (POST) ──────────────── */
async function handleCallback(req, res) {
  const body = await readBody(req).catch(() => ({}));

  const billCode = String(body.billcode || body.billCode || '').trim();
  const orderRef = String(body.order_id || body.orderId  || '').trim();
  const status   = String(body.status   || body.status_id || '').trim();

  if (!billCode || !orderRef) {
    // Malformed — retrying will not fix it.
    console.error(LOG + 'missing billcode/order_id.', JSON.stringify({ billCode, orderRef, status }));
    res.status(400).send('Missing billcode or order_id');
    return;
  }

  // status 1 = success, 2 = pending, 3 = fail. Only a success is actionable;
  // a pending bill produces a second callback once it settles.
  if (status && status !== '1') {
    console.log(LOG + orderRef + ' status=' + status + ' — nothing to persist.');
    res.status(200).send('');
    return;
  }

  if (!orders.isConfigured()) {
    console.error(LOG + 'NOT PERSISTED — DATABASE_URL is not set.', JSON.stringify({
      order_id: orderRef, billcode: billCode, refno: body.refno, amount: body.amount,
    }));
    res.status(503).send('Order store not configured');
    return;
  }

  try {
    // ── 1. Verify against toyyibPay, not against the request body ──
    const verified = await verifyBillPaid(billCode);
    if (!verified) {
      // Could be a spoofed callback, or the callback arriving before the
      // transaction is queryable. Fail closed and let the retry decide.
      console.error(LOG + 'toyyibPay reports no successful payment for bill ' +
        billCode + ' (order ' + orderRef + ') — not persisting.');
      res.status(503).send('Payment not confirmed by gateway');
      return;
    }

    // ── 2. Persist. A replay reports already_paid and writes nothing ──
    const result = await orders.markPaidByCallback({
      orderRef,
      gatewayRef:  billCode,
      amountCents: verified.amountCents,
    });

    if (result.outcome === 'not_found') {
      console.error(LOG + 'REAL PAYMENT WITH NO ORDER ROW — ref ' + orderRef +
        ', bill ' + billCode + ', ' + verified.amountCents +
        ' sen, invoice ' + verified.invoiceNo + '. Reconcile by hand.');
      res.status(503).send('Order not found');
      return;
    }

    if (result.outcome === 'amount_mismatch') {
      console.error(LOG + 'AMOUNT MISMATCH for ' + orderRef + ' — billed ' +
        result.amountCents + ' sen, toyyibPay reports ' + verified.amountCents +
        ' sen. Left unpaid for manual review.');
      res.status(503).send('Amount mismatch');
      return;
    }

    if (result.outcome === 'refused') {
      console.error(LOG + 'refused to mark ' + orderRef + ' paid from status "' +
        result.previousStatus + '".');
      res.status(503).send('Order not in a payable state');
      return;
    }

    if (result.outcome === 'already_paid') {
      console.log(LOG + orderRef + ' already paid — duplicate callback ignored.');
    } else {
      console.log(LOG + orderRef + ' marked PAID (' + result.amountCents +
        ' sen, invoice ' + verified.invoiceNo + ').');
    }

    // ── 3. Deduct stock. Guarded independently of the paid flip, so a
    //       callback retried after a mid-way failure still applies the
    //       deduction — exactly once. ──
    const stock = await orders.decrementStock(orderRef);
    if (stock.applied) {
      console.log(LOG + 'stock deducted for ' + orderRef + ' — ' +
        stock.updated.map(u => u.sku + '→' + u.stock).join(', '));
      if (stock.missingSkus.length) {
        console.error(LOG + orderRef + ' has skus absent from products_stock: ' +
          stock.missingSkus.join(', ') + ' — re-run scripts/db-migrate.js.');
      }
    } else {
      console.log(LOG + 'stock already deducted for ' + orderRef + ' — skipped.');
    }

    res.status(200).send('');

  } catch (err) {
    // Transient DB or gateway trouble. 5xx so toyyibPay retries; every step
    // above is idempotent, so the retry is safe.
    console.error(LOG + 'failed to process ' + orderRef + ' (bill ' + billCode + '): ' +
      (err && err.message ? err.message : err));
    res.status(503).send('Temporary failure');
  }
}

/* ── Browser redirect (GET) — DISPLAY ONLY ─────────── */
function handleReturn(req, res) {
  const { billcode, order_id, status_id, msg } = req.query || {};

  // status_id: 1 = success, 2 = pending, 3 = fail
  if (status_id === '1' || status_id === '2') {
    const qs = new URLSearchParams({
      status: status_id,
      refno:  order_id || '',
      bill:   billcode || '',
    });
    res.redirect(303, '/success.html?' + qs.toString());
    return;
  }

  const errMsg = msg || 'Payment was unsuccessful. Please try again.';
  res.redirect(303, '/checkout.html?err=' + encodeURIComponent(errMsg));
}

module.exports = async function (req, res) {
  if (req.method === 'POST') return handleCallback(req, res);
  return handleReturn(req, res);
};
