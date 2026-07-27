/* ═══════════════════════════════════════════════════
   EURO POLO · api/checkout.js
   Vercel Serverless Function — toyyibPay Bill Creation

   MONEY RULE: the server is the only source of truth.
   The browser proposes which sku and how many. Everything else —
   price, subtotal, discount, total — is recomputed here from
   data/product-data.json and api/_lib/promos.js. Any price, total or
   discount sent by the client is discarded.

   SETUP: Add these to Vercel Environment Variables
   ─────────────────────────────────────────────────
   TOYYIBPAY_SECRET_KEY    = your Secret Key  (from toyyibPay merchant panel)
   TOYYIBPAY_CATEGORY_CODE = your Category Code (from toyyibPay merchant panel)
   SITE_URL                = https://europolo.my   (optional, defaults to this)
   DATABASE_URL            = Neon pooled connection string (see api/_lib/orders.js)

   Register at: https://toyyibpay.com/
   Merchant panel: https://toyyibpay.com/index.php/dashboard
═══════════════════════════════════════════════════ */

const crypto = require('crypto');
const { priceCart, round2 } = require('./_lib/catalog');
const { applyPromo } = require('./_lib/promos');
const { siteUrl, applyCors, gatewayBaseUrl } = require('./_lib/config');
const orders = require('./_lib/orders');

// toyyibPay will not accept a bill below RM 1.00.
const MIN_CHARGE_MYR = 1;

module.exports = async function (req, res) {
  applyCors(req, res);

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST')    { res.status(405).json({ error: 'Method not allowed' }); return; }

  const secretKey    = process.env.TOYYIBPAY_SECRET_KEY;
  const categoryCode = process.env.TOYYIBPAY_CATEGORY_CODE;

  if (!secretKey || !categoryCode) {
    res.status(500).json({ error: 'Payment gateway not configured. Please contact support.' });
    return;
  }

  // An order we cannot record is an order we must not charge for.
  if (!orders.isConfigured()) {
    console.error('checkout: DATABASE_URL is not set — refusing to create a bill.');
    res.status(500).json({ error: 'Order system not configured. Please contact support.' });
    return;
  }

  try {
    // NOTE: `promoCode` is the only pricing-related field read from the client.
    // Any items[].price / discountAmount / total in the body is ignored.
    const { items, customer, promoCode } = req.body || {};

    // ── 1. Price the cart from the server catalogue ──
    const priced = priceCart(items);
    if (priced.error) { res.status(400).json({ error: priced.error }); return; }

    const { lines, subtotal } = priced;

    // ── 2. Resolve the discount server-side ──
    const promo = applyPromo(promoCode, subtotal);
    if (promo.error) { res.status(400).json({ error: promo.error }); return; }

    const discount = promo.discount;
    const total    = round2(Math.max(0, subtotal - discount));

    if (total < MIN_CHARGE_MYR) {
      res.status(400).json({ error: `Order total must be at least RM ${MIN_CHARGE_MYR.toFixed(2)}.` });
      return;
    }

    // ── 3. Validate the customer ──
    const name  = String(customer?.name  || '').trim();
    const email = String(customer?.email || '').trim();
    const phone = String(customer?.phone || '').trim();

    if (!name || !email || !phone) {
      res.status(400).json({ error: 'Name, email and phone number are required.' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }

    const amountInSen = Math.round(total * 100); // toyyibPay bills in sen

    // Random suffix, not just the clock: two checkouts in the same
    // millisecond would otherwise share a reference, and the second
    // customer's bill would be attached to the first customer's order.
    const refNo = 'EP-' + Date.now().toString(36).toUpperCase()
                + '-' + crypto.randomBytes(2).toString('hex').toUpperCase();
    const origin      = siteUrl();               // canonical, never req.headers.origin
    const billDesc    = lines.map(l => `${l.name} x${l.qty}`).join(', ').substring(0, 99)
                        || 'Euro Polo Order';

    // ── 4. Record the order as pending, before any money moves ──
    // Deliberately ahead of createBill: if this write fails we throw and
    // never create the bill, so a customer is never charged for an order
    // we could not record.
    const pending = await orders.createPendingOrder({
      orderRef:    refNo,
      lines,                                       // server-priced lines
      customer:    { ...(customer || {}), name, email, phone },
      totalMyr:    total,
      subtotalMyr: subtotal,
      discountMyr: discount,
      promoCode:   promo.code,
    });

    // created:false means that reference already existed. Refuse rather than
    // bill against somebody else's order row.
    if (!pending.created) {
      console.error('checkout: order reference collision on ' + refNo + ' — no bill created.');
      res.status(500).json({ error: 'Could not start your order. Please try again.' });
      return;
    }

    // ── 5. Create the bill ──
    const params = new URLSearchParams({
      userSecretKey:           secretKey,
      categoryCode:            categoryCode,
      billName:                'Euro Polo Order',
      billDescription:         billDesc,
      billPriceSetting:        1,          // 1 = fixed price
      billPayorInfo:           1,          // 1 = collect payor info
      billAmount:              amountInSen,
      billReturnUrl:           origin + '/api/payment-response',
      billCallbackUrl:         origin + '/api/payment-response',
      billExternalReferenceNo: refNo,
      billTo:                  name,
      billEmail:               email,
      billPhone:               phone,
      billSplitPayment:        0,
      billSplitPaymentArgs:    '',
      billPaymentChannel:      0,          // 0 = all (FPX + credit/debit card)
      billContentEmail:        'Thank you for your Euro Polo order! We will process it shortly.',
      billChargeToCustomer:    1,          // 1 = transaction fee charged to customer
      billExpiryDays:          1,
    });

    const apiResponse = await fetch(gatewayBaseUrl() + '/index.php/api/createBill', {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    params.toString(),
    });

    const result = await apiResponse.json();

    if (!result || !result[0] || !result[0].BillCode) {
      const msg = result?.[0]?.Message || 'Failed to create payment bill.';
      throw new Error(msg);
    }

    const billCode = result[0].BillCode;

    // Link the bill to the order so the callback can be matched on either
    // reference. Best-effort — markPaidByCallback() also back-fills
    // gateway_ref, so a failure here does not lose the payment.
    try {
      await orders.attachGatewayRef(refNo, billCode);
    } catch (err) {
      console.error('checkout: could not attach gateway ref to ' + refNo + ':', err.message);
    }

    // ── 6. Respond ──
    // The amounts below are echoed for display only. The customer is charged
    // `amountInSen`, which was computed entirely server-side.
    res.status(200).json({
      url:      gatewayBaseUrl() + '/' + billCode,
      refNo:    refNo,
      billCode: billCode,
      subtotal: subtotal,
      discount: discount,
      total:    total,
      promoCode: promo.code,
    });

  } catch (err) {
    console.error('toyyibPay error:', err.message);
    res.status(500).json({ error: err.message || 'Payment could not be started.' });
  }
};
