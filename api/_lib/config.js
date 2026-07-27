/* ═══════════════════════════════════════════════════
   EURO POLO · api/_lib/config.js
   Canonical site configuration.

   The site has ONE canonical domain: europolo.my
   Override with the SITE_URL env var only if the domain changes.
═══════════════════════════════════════════════════ */

const DEFAULT_SITE_URL = 'https://europolo.my';

/**
 * Canonical origin, without a trailing slash.
 *
 * Deliberately NOT derived from req.headers.origin — that header is
 * attacker-controlled, and using it would let a third party point the
 * gateway's return and callback URLs at a server they control.
 */
function siteUrl() {
  const raw = (process.env.SITE_URL || DEFAULT_SITE_URL).trim();
  return raw.replace(/\/+$/, '');
}

/**
 * toyyibPay API base. Set TOYYIBPAY_BASE_URL to
 * https://dev.toyyibpay.com for sandbox testing.
 *
 * Kept here so the gateway host is swappable in one place.
 */
function gatewayBaseUrl() {
  const raw = (process.env.TOYYIBPAY_BASE_URL || 'https://toyyibpay.com').trim();
  return raw.replace(/\/+$/, '');
}

/** Origins permitted to call the payment endpoints. */
function allowedOrigins() {
  const extra = (process.env.EXTRA_ALLOWED_ORIGINS || '')
    .split(',')
    .map(s => s.trim().replace(/\/+$/, ''))
    .filter(Boolean);
  return [siteUrl(), 'https://www.europolo.my', ...extra];
}

/**
 * Apply a locked-down CORS policy. Replaces the previous
 * `Access-Control-Allow-Origin: *`, which let any site on the internet
 * create bills against the merchant account.
 */
function applyCors(req, res) {
  const origin = req.headers && req.headers.origin;
  if (origin && allowedOrigins().includes(origin.replace(/\/+$/, ''))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = { siteUrl, gatewayBaseUrl, allowedOrigins, applyCors, DEFAULT_SITE_URL };
