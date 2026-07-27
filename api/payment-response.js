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

   ── NOT YET COMPLETE ──────────────────────────────
   The POST branch cannot be finished until an order store exists:
   DATABASE_URL is not configured. Until then it FAILS CLOSED with 503
   rather than acknowledging a payment it cannot record — a 5xx makes
   toyyibPay retry, so a real payment is never silently dropped.

   DO NOT ACCEPT LIVE PAYMENTS UNTIL THE POST BRANCH PERSISTS ORDERS.
═══════════════════════════════════════════════════ */

module.exports = async function (req, res) {

  /* ── Server-to-server callback (POST) ──────────── */
  if (req.method === 'POST') {
    const body = req.body || {};

    // Logged so a payment taken before the store exists can be
    // reconciled by hand from the toyyibPay merchant panel.
    console.error('[toyyibpay][callback] NOT PERSISTED — no order store configured.', JSON.stringify({
      order_id: body.order_id,
      billcode: body.billcode,
      refno:    body.refno,
      status:   body.status,
      amount:   body.amount,
      reason:   body.reason,
    }));

    if (!process.env.DATABASE_URL) {
      // Fail closed. Never 200 a payment we cannot record.
      res.status(503).send('Order store not configured');
      return;
    }

    // TODO(P3b): verify signature -> confirm paid via getBillTransactions
    // -> persist order idempotently on order_id -> deduct stock -> 200.
    res.status(503).send('Order persistence not implemented');
    return;
  }

  /* ── Browser redirect (GET) — DISPLAY ONLY ─────── */
  const { billcode, order_id, status_id, msg } = req.query || {};

  // status_id: 1 = success, 2 = pending, 3 = fail
  if (status_id === '1') {
    const qs = new URLSearchParams({
      status: '1',
      refno:  order_id || '',
      bill:   billcode || '',
    });
    res.redirect(303, '/success.html?' + qs.toString());
    return;
  }

  if (status_id === '2') {
    const qs = new URLSearchParams({
      status: '2',
      refno:  order_id || '',
      bill:   billcode || '',
    });
    res.redirect(303, '/success.html?' + qs.toString());
    return;
  }

  const errMsg = msg || 'Payment was unsuccessful. Please try again.';
  res.redirect(303, '/checkout.html?err=' + encodeURIComponent(errMsg));
};
