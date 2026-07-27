/* ═══════════════════════════════════════════════════
   EURO POLO · api/admin-session.js
   Returns the current admin session, or 401.
   Admin pages call this to decide whether to render.
═══════════════════════════════════════════════════ */

const { getSession } = require('./_lib/auth');

module.exports = async function (req, res) {
  res.setHeader('Cache-Control', 'no-store');

  const session = getSession(req);
  if (!session) {
    res.status(401).json({ error: 'Not authenticated.' });
    return;
  }
  res.status(200).json(session);
};
