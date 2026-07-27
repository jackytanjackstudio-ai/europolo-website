/* ═══════════════════════════════════════════════════
   EURO POLO · api/_lib/billplz.js
   The ONLY module that knows the payment gateway is Billplz.

   Everything gateway-specific lives here: endpoints, auth, field names,
   and X-Signature verification. api/checkout.js and api/payment-response.js
   talk to this module in neutral terms, so swapping gateway again means
   rewriting this file and nothing else.

   Files under api/ starting with "_" are not routed as serverless
   functions, so this is server-only and never served to the browser.

   SETUP: Add these to Vercel Environment Variables
   ─────────────────────────────────────────────────
   BILLPLZ_API_KEY        = API Secret Key (Billplz → Settings → API keys)
   BILLPLZ_COLLECTION_ID  = the collection bills are created under
   BILLPLZ_XSIGNATURE_KEY = X Signature Key (same settings page)
   BILLPLZ_SANDBOX        = "false" to go live. ANY other value, or unset,
                            means SANDBOX. Defaults to sandbox deliberately:
                            a misconfigured deploy must never take real money.

   API reference: https://support.billplz.com/api
═══════════════════════════════════════════════════ */

const crypto = require('crypto');

/* Both hosts are hardcoded. The base URL is never taken from an env var, so
   a typo cannot point bill creation at an attacker-controlled host. */
const HOST_PRODUCTION = 'https://www.billplz.com';
const HOST_SANDBOX    = 'https://www.billplz-sandbox.com';

/** True only when BILLPLZ_SANDBOX is exactly "false" (case-insensitive). */
function isLive() {
  return String(process.env.BILLPLZ_SANDBOX || '').trim().toLowerCase() === 'false';
}

function baseUrl() {
  return isLive() ? HOST_PRODUCTION : HOST_SANDBOX;
}

/** True when every credential needed to create a bill is present. */
function isConfigured() {
  return Boolean(
    (process.env.BILLPLZ_API_KEY || '').trim() &&
    (process.env.BILLPLZ_COLLECTION_ID || '').trim()
  );
}

/** True when callbacks can be verified. Separate: a missing key must fail closed. */
function canVerify() {
  return Boolean((process.env.BILLPLZ_XSIGNATURE_KEY || '').trim());
}

/* ── X-Signature ──────────────────────────────────────
   HMAC-SHA256, hex, over a "source string" built from the payload.

   The source string is: for every parameter except x_signature, concatenate
   the key directly onto its value, then sort those combined strings in
   ascending byte order and join them with "|".

   SORT ON THE COMBINED STRING, NOT ON THE KEY. Billplz's prose says "sort
   keys in ascending order", but both worked examples in their own docs
   contradict that and match a sort of the combined pairs:

     ...|paid_amount100|paid_at2018-09-27 15:15:09 +0800|paidtrue|statepaid|...

   Sorting keys alone would put "paidtrue" first, because "paid" is a prefix
   of "paid_amount". Sorting the combined strings puts it last, because "_"
   (0x5F) sorts before "t" (0x74). Verified against both the callback and the
   redirect examples in the docs; key-sorting reproduces neither. */
function sourceString(pairs) {
  return Object.keys(pairs)
    .filter(k => k !== 'x_signature')
    .map(k => k + (pairs[k] == null ? '' : String(pairs[k])))
    .sort()
    .join('|');
}

function sign(source) {
  return crypto
    .createHmac('sha256', String(process.env.BILLPLZ_XSIGNATURE_KEY || ''))
    .update(source, 'utf8')
    .digest('hex');
}

/** Constant-time hex compare — avoids leaking the expected digest by timing. */
function safeEqualHex(a, b) {
  const ba = Buffer.from(String(a || ''), 'utf8');
  const bb = Buffer.from(String(b || ''), 'utf8');
  if (ba.length !== bb.length || ba.length === 0) return false;
  return crypto.timingSafeEqual(ba, bb);
}

/* ── Create a bill ─────────────────────────────────── */

/**
 * Create a Billplz bill.
 *
 * @param {object} o
 * @param {number} o.amountCents  positive integer, smallest currency unit (sen)
 * @param {string} o.name
 * @param {string} o.email
 * @param {string} [o.mobile]
 * @param {string} o.description   shown on the Billplz payment page (<=200 chars)
 * @param {string} o.callbackUrl   server-to-server notification target
 * @param {string} o.redirectUrl   where the shopper's browser lands afterwards
 * @param {string} o.orderRef      our reference, stored on the bill for support
 * @returns {Promise<{ billId:string, paymentUrl:string }>}
 */
async function createBill(o) {
  if (!isConfigured()) {
    throw new Error('Billplz is not configured (BILLPLZ_API_KEY / BILLPLZ_COLLECTION_ID).');
  }

  const amount = parseInt(o.amountCents, 10);
  if (!Number.isInteger(amount) || amount < 1) {
    throw new Error('createBill: amountCents must be a positive integer in sen.');
  }

  // amount is sent in CENTS — Billplz: "a positive integer in the smallest
  // currency unit". 27980 here means RM 279.80.
  const form = new URLSearchParams({
    collection_id: String(process.env.BILLPLZ_COLLECTION_ID).trim(),
    email:         String(o.email || ''),
    name:          String(o.name  || '').slice(0, 255),
    amount:        String(amount),
    callback_url:  String(o.callbackUrl),
    description:   String(o.description || 'Euro Polo Order').slice(0, 200),
    redirect_url:  String(o.redirectUrl),
    // Surfaces our reference in the Billplz dashboard for reconciliation.
    // NOTE: reference_1 is NOT echoed back in the callback, which is why the
    // order is matched on the bill id (stored as orders.gateway_ref) instead.
    reference_1_label: 'Order',
    reference_1:       String(o.orderRef || '').slice(0, 120),
    // We render our own confirmation page; no Billplz email/SMS.
    deliver: 'false',
  });

  if (o.mobile) form.set('mobile', String(o.mobile));

  // Basic auth: API secret key as the username, empty password.
  const auth = Buffer.from(String(process.env.BILLPLZ_API_KEY).trim() + ':', 'utf8')
    .toString('base64');

  const response = await fetch(baseUrl() + '/api/v3/bills', {
    method: 'POST',
    headers: {
      Authorization:  'Basic ' + auth,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form.toString(),
  });

  const text = await response.text();
  let body = null;
  try { body = JSON.parse(text); } catch { /* non-JSON error page */ }

  if (!response.ok) {
    // Billplz returns { error: { message: [...] } }. Log the detail, but do
    // not hand gateway internals to the shopper.
    const detail = body?.error?.message
      ? [].concat(body.error.message).join('; ')
      : text.slice(0, 300);
    throw new Error('Billplz create-bill failed (HTTP ' + response.status + '): ' + detail);
  }

  if (!body || !body.id || !body.url) {
    throw new Error('Billplz create-bill returned no bill id/url.');
  }

  return { billId: String(body.id), paymentUrl: String(body.url) };
}

/* ── Callback (server-to-server POST) ──────────────── */

/**
 * Verify and interpret a Billplz callback body.
 *
 * The X-Signature is the whole security model here: it proves Billplz sent
 * this, so no follow-up API call is needed. A body that fails the signature
 * is discarded entirely.
 *
 * @param {object} body  form-decoded POST body, values as received (strings)
 * @returns {{ ok:false, reason:string }
 *          | { ok:true, billId:string, paid:boolean, state:string,
 *              amountCents:number|null, paidAmountCents:number|null,
 *              paidAt:string, orderRef:string }}
 */
function readCallback(body) {
  if (!canVerify()) return { ok: false, reason: 'BILLPLZ_XSIGNATURE_KEY is not set' };
  if (!body || typeof body !== 'object') return { ok: false, reason: 'empty body' };

  const received = body.x_signature;
  if (!received) return { ok: false, reason: 'no x_signature in callback' };

  if (!safeEqualHex(sign(sourceString(body)), received)) {
    return { ok: false, reason: 'x_signature mismatch' };
  }

  const toCents = v => {
    if (v === undefined || v === null || v === '') return null;
    const n = parseInt(String(v), 10);
    return Number.isInteger(n) ? n : null;
  };

  return {
    ok:              true,
    billId:          String(body.id || ''),
    // Billplz sends the string "true"/"false".
    paid:            String(body.paid).toLowerCase() === 'true',
    state:           String(body.state || ''),
    amountCents:     toCents(body.amount),
    paidAmountCents: toCents(body.paid_amount),
    paidAt:          String(body.paid_at || ''),
    orderRef:        String(body.reference_1 || ''),   // usually absent
  };
}

/* ── Redirect (browser GET) ────────────────────────── */

/**
 * Interpret the return redirect. DISPLAY ONLY — this never marks an order paid.
 *
 * Params arrive bracketed (billplz[id], billplz[paid], billplz[paid_at],
 * billplz[x_signature]); the signature source string uses them flattened,
 * e.g. "billplzidzq0tm2wc".
 *
 * @returns {{ billId:string, paid:boolean, verified:boolean }}
 */
function readRedirect(query) {
  const q = query || {};
  const pairs = {};
  for (const key of Object.keys(q)) {
    const m = /^billplz\[(.+)\]$/.exec(key);
    // Skip the signature itself. It flattens to "billplzx_signature", which
    // sourceString()'s own x_signature filter would not catch.
    if (m && m[1] !== 'x_signature') pairs['billplz' + m[1]] = q[key];
  }

  const received = q['billplz[x_signature]'];
  const verified = Boolean(
    canVerify() && received && safeEqualHex(sign(sourceString(pairs)), received)
  );

  return {
    billId:   String(q['billplz[id]'] || ''),
    paid:     String(q['billplz[paid]']).toLowerCase() === 'true',
    verified,
  };
}

module.exports = {
  isConfigured,
  canVerify,
  isLive,
  baseUrl,
  createBill,
  readCallback,
  readRedirect,
  // exported for the verification harness
  sourceString,
  sign,
};
