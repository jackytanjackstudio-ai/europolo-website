/* ═══════════════════════════════════════════════════
   EURO POLO · api/quote.js
   Server-priced cart quote — display only, creates nothing.

   Exists so the totals the customer SEES are produced by the same
   server-side code that decides what they are CHARGED. The checkout
   page no longer computes discounts locally.
═══════════════════════════════════════════════════ */

const { priceCart, round2 } = require('./_lib/catalog');
const { applyPromo } = require('./_lib/promos');
const { applyCors } = require('./_lib/config');

module.exports = async function (req, res) {
  applyCors(req, res);
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST')    { res.status(405).json({ error: 'Method not allowed' }); return; }

  const { items, promoCode } = req.body || {};

  const priced = priceCart(items);
  if (priced.error) { res.status(400).json({ error: priced.error }); return; }

  const promo = applyPromo(promoCode, priced.subtotal);
  if (promo.error) {
    // Cart is still valid — report the promo problem but return real totals.
    res.status(200).json({
      lines:      priced.lines,
      subtotal:   priced.subtotal,
      discount:   0,
      total:      priced.subtotal,
      promoCode:  '',
      promoError: promo.error,
    });
    return;
  }

  res.status(200).json({
    lines:     priced.lines,
    subtotal:  priced.subtotal,
    discount:  promo.discount,
    total:     round2(Math.max(0, priced.subtotal - promo.discount)),
    promoCode: promo.code,
  });
};
