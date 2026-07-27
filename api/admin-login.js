/* ═══════════════════════════════════════════════════
   EURO POLO · api/admin-login.js
   Admin login — credentials are verified server-side only.

   Requires env vars ADMIN_USERS and ADMIN_SESSION_SECRET.
   See api/_lib/auth.js for setup.
═══════════════════════════════════════════════════ */

const { verifyCredentials, signSession, setSessionCookie, SESSION_TTL_MS } = require('./_lib/auth');

module.exports = async function (req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!process.env.ADMIN_USERS || !process.env.ADMIN_SESSION_SECRET) {
    res.status(500).json({ error: 'Admin auth is not configured.' });
    return;
  }

  const { username, password } = req.body || {};

  const user = verifyCredentials(username, password);
  if (!user) {
    // Deliberately vague — do not reveal whether the username exists.
    res.status(401).json({ error: 'Invalid username or password.' });
    return;
  }

  const token = signSession({
    sub:  user.username,
    role: user.role,
    exp:  Date.now() + SESSION_TTL_MS,
  });

  setSessionCookie(res, token);
  res.status(200).json({ username: user.username, role: user.role });
};
