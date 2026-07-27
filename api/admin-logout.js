/* ═══════════════════════════════════════════════════
   EURO POLO · api/admin-logout.js
   Clears the admin session cookie.
═══════════════════════════════════════════════════ */

const { clearSessionCookie } = require('./_lib/auth');

module.exports = async function (req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  clearSessionCookie(res);
  res.status(200).json({ ok: true });
};
