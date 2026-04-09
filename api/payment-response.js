/* ═══════════════════════════════════════════════════
   EURO POLO · api/payment-response.js
   Toyyibpay Return URL + Callback URL handler

   Toyyibpay calls this URL after payment:
   - Browser redirect (GET)  → verify hash → redirect to success/fail page
   - Server notification (POST) → acknowledge with empty 200
═══════════════════════════════════════════════════ */

const crypto = require('crypto');

module.exports = async function (req, res) {

  // ── Server-to-server callback (POST) ────────────
  // Toyyibpay sends POST notification — just acknowledge it
  if (req.method === 'POST') {
    res.status(200).send('');
    return;
  }

  // ── Browser redirect (GET) ──────────────────────
  const {
    billcode,
    order_id,
    status_id,
    msg,
    transaction_id,
    hash,
  } = req.query || {};

  const secretKey = process.env.TOYYIBPAY_SECRET_KEY;

  if (!secretKey) {
    res.redirect('/checkout.html?err=' + encodeURIComponent('Payment gateway not configured.'));
    return;
  }

  // Verify hash: MD5(secretKey + billCode + status_id)
  const expectedHash = crypto
    .createHash('md5')
    .update(secretKey + (billcode || '') + (status_id || ''))
    .digest('hex');

  const valid = (hash === expectedHash);

  if (status_id === '1' && valid) {
    // Payment successful
    const qs = new URLSearchParams({
      status:  '1',
      refno:   order_id       || '',
      transid: transaction_id || '',
    });
    res.redirect('/success.html?' + qs.toString());
  } else {
    // Payment failed or cancelled
    const errMsg = (status_id === '2')
      ? 'Payment is pending. Please check your email for confirmation.'
      : (msg || 'Payment was unsuccessful. Please try again.');
    res.redirect('/checkout.html?err=' + encodeURIComponent(errMsg));
  }
};
