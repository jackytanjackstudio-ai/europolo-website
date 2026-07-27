/* ═══════════════════════════════════════════════════
   EURO POLO · api/_lib/promos.js
   Server-side promo source of truth.

   Replaces the previous client-side check against
   localStorage['ep_promos'], which the customer fully controlled
   (and which was only ever populated in an admin's own browser,
   so no real customer could redeem a code anyway).

   The client may send a promo CODE. It may never send a discount.

   Optional override — set PROMO_CODES in Vercel to a JSON array to
   change promos without a redeploy. Same shape as DEFAULT_PROMOS.
═══════════════════════════════════════════════════ */

const { round2 } = require('./catalog');

const DEFAULT_PROMOS = [
  { code: 'RAYA2026',  type: 'percent', value: 10, min: 200, expiry: '2026-04-15', active: true },
  { code: 'WELCOME15', type: 'percent', value: 15, min: 150, expiry: '2026-12-31', active: true },
  { code: 'LUGGAGE50', type: 'flat',    value: 50, min: 800, expiry: '2026-06-30', active: true },
];

function loadPromos() {
  const raw = process.env.PROMO_CODES;
  if (!raw) return DEFAULT_PROMOS;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_PROMOS;
  } catch {
    return DEFAULT_PROMOS;
  }
}

/**
 * Resolve a promo code against the server-side list and compute the
 * discount from the SERVER-computed subtotal.
 *
 * Never trusts a client-supplied discount amount.
 *
 * @returns {{ discount: number, code: string }}  discount 0 when not applicable
 *          or {{ error: string }} when the customer typed a code that failed
 */
function applyPromo(codeInput, subtotal) {
  const code = String(codeInput || '').trim().toUpperCase();
  if (!code) return { discount: 0, code: '' };

  const promo = loadPromos().find(p => String(p.code).toUpperCase() === code && p.active);
  if (!promo) return { error: 'Invalid or expired promo code.' };

  if (promo.expiry) {
    // Compare at end of the expiry day, UTC.
    const expiresAt = new Date(promo.expiry + 'T23:59:59Z').getTime();
    if (Number.isFinite(expiresAt) && Date.now() > expiresAt) {
      return { error: 'This promo code has expired.' };
    }
  }

  const min = Number(promo.min) || 0;
  if (subtotal < min) {
    return { error: `Minimum purchase of RM ${min.toFixed(2)} required for this code.` };
  }

  let discount = 0;
  if (String(promo.type).toLowerCase() === 'percent') {
    discount = subtotal * (Number(promo.value) / 100);
  } else {
    discount = Number(promo.value) || 0;
  }

  // A discount can never exceed the subtotal or turn negative.
  discount = round2(Math.min(Math.max(discount, 0), subtotal));

  return { discount, code };
}

module.exports = { applyPromo, loadPromos, DEFAULT_PROMOS };
