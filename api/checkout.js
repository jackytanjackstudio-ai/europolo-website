/* ═══════════════════════════════════════════════════
   EURO POLO · api/checkout.js
   Vercel Serverless Function — payment bill creation

   MONEY RULE: the server is the only source of truth.
   The browser proposes which sku and how many. Everything else —
   price, subtotal, discount, total — is recomputed here from
   data/product-data.json and api/_lib/promos.js. Any price, total or
   discount sent by the client is discarded.

   The gateway itself lives entirely behind api/_lib/billplz.js. This file
   knows only "create a bill for this many sen and give me a payment URL".

   SETUP: Add these to Vercel Environment Variables
   ─────────────────────────────────────────────────
   BILLPLZ_API_KEY       = API Secret Key       (see api/_lib/billplz.js)
   BILLPLZ_COLLECTION_ID = collection for bills (see api/_lib/billplz.js)
   SITE_URL              = https://europolo.my  (optional, defaults to this)
   DATABASE_URL          = Neon pooled connection string (see api/_lib/orders.js)
═══════════════════════════════════════════════════ */

const crypto = require('crypto');
const { priceCart, round2 } = require('./_lib/catalog');
const { applyPromo } = require('./_lib/promos');
const { siteUrl, applyCors } = require('./_lib/config');
const orders  = require('./_lib/orders');
const gateway = require('./_lib/billplz');

// Billplz rejects a bill below RM 1.00.
const MIN_CHARGE_MYR = 1;

module.exports = async function (req, res) {
  applyCors(req, res);

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST')    { res.status(405).json({ error: 'Method not allowed' }); return; }

  if (!gateway.isConfigured()) {
    console.error('checkout: Billplz is not configured — refusing to create a bill.');
    res.status(500).json({ error: 'Payment gateway not configured. Please contact support.' });
    return;
  }

  // Without the X-Signature key the callback cannot be verified, so a payment
  // taken now could never be safely recorded. Refuse before charging anyone.
  if (!gateway.canVerify()) {
    console.error('checkout: BILLPLZ_XSIGNATURE_KEY is not set — refusing to create a bill.');
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

    const amountInSen = Math.round(total * 100); // Billplz bills in sen

    // Random suffix, not just the clock: two checkouts in the same
    // millisecond would otherwise share a reference, and the second
    // customer's bill would be attached to the first customer's order.
    const refNo = 'EP-' + Date.now().toString(36).toUpperCase()
                + '-' + crypto.randomBytes(2).toString('hex').toUpperCase();
    const origin   = siteUrl();               // canonical, never req.headers.origin
    const billDesc = lines.map(l => `${l.name} x${l.qty}`).join(', ').substring(0, 200)
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
    // `ref` on the callback URL is a fallback only. Billplz does not echo
    // reference_1 in the callback, so the order is normally found via the
    // bill id stored below as gateway_ref. The query string is NOT covered
    // by the X-Signature, so it is used only to locate a row after the
    // signature has already proved the payload came from Billplz.
    const bill = await gateway.createBill({
      amountCents:  amountInSen,
      name:         name,
      email:        email,
      // mobile is deliberately omitted: Billplz wants a country-code number
      // with no spaces or dashes, and our field holds local formats like
      // "012-3456789", which would get the whole bill rejected. email alone
      // satisfies Billplz's email-or-mobile requirement, and we keep the
      // phone number in our own orders table regardless.
      description:  billDesc,
      callbackUrl:  origin + '/api/payment-response?ref=' + encodeURIComponent(refNo),
      // Same hint on the redirect, so the confirmation page can show the
      // order reference even if this browser lost its sessionStorage.
      redirectUrl:  origin + '/api/payment-response?ref=' + encodeURIComponent(refNo),
      orderRef:     refNo,
    });

    // Link the bill to the order. This is the ONLY reference Billplz sends
    // back in the callback, so if it fails the payment can still be taken but
    // will need reconciling by hand from the Billplz dashboard (where refNo
    // appears as reference_1).
    try {
      await orders.attachGatewayRef(refNo, bill.billId);
    } catch (err) {
      console.error('checkout: FAILED to attach bill ' + bill.billId + ' to order ' +
        refNo + ' — callback may not find it: ' + err.message);
    }

    // ── 6. Respond ──
    // The amounts below are echoed for display only. The customer is charged
    // `amountInSen`, which was computed entirely server-side.
    res.status(200).json({
      url:      bill.paymentUrl,
      refNo:    refNo,
      billCode: bill.billId,
      subtotal: subtotal,
      discount: discount,
      total:    total,
      promoCode: promo.code,
    });

  } catch (err) {
    console.error('checkout error:', err.message);
    res.status(500).json({ error: err.message || 'Payment could not be started.' });
  }
};
