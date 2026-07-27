/* ═══════════════════════════════════════════════════
   EURO POLO · api/_lib/auth.js
   Server-side admin authentication.

   Files under api/ starting with "_" are NOT routed as
   serverless functions — this is shared server-only code
   and is never served to the browser.

   SETUP: Add these to Vercel Environment Variables
   ─────────────────────────────────────────────────
   ADMIN_SESSION_SECRET = long random string (min 32 chars)
   ADMIN_USERS          = JSON array of user records, e.g.
     [{"u":"admin","role":"admin","salt":"...","hash":"..."}]

   Generate ADMIN_USERS with:
     node scripts/hash-admin-password.js <username> <role> <password>
═══════════════════════════════════════════════════ */

const crypto = require('crypto');

const SESSION_COOKIE = 'ep_admin_session';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

/* ── Password hashing (scrypt, no external deps) ── */
function hashPassword(password, salt) {
  return crypto.scryptSync(String(password), String(salt), 32).toString('hex');
}

function makeSalt() {
  return crypto.randomBytes(16).toString('hex');
}

/* Constant-time string compare — avoids timing oracles. */
function safeEqual(a, b) {
  const ba = Buffer.from(String(a), 'utf8');
  const bb = Buffer.from(String(b), 'utf8');
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

/* ── User directory (from env, never from client code) ── */
function loadUsers() {
  const raw = process.env.ADMIN_USERS;
  if (!raw) return null;
  try {
    const users = JSON.parse(raw);
    return Array.isArray(users) ? users : null;
  } catch {
    return null;
  }
}

/**
 * Verify a username/password pair.
 * Returns { username, role } on success, or null.
 */
function verifyCredentials(username, password) {
  const users = loadUsers();
  if (!users) return null;

  const key = String(username || '').toLowerCase().trim();
  const user = users.find(u => String(u.u || '').toLowerCase() === key);

  // Always run a hash even when the user is unknown, so response time
  // does not reveal whether a username exists.
  const salt = user ? user.salt : 'decoy-salt-value';
  const expected = user ? user.hash : hashPassword('decoy', 'decoy-salt-value');
  const actual = hashPassword(password || '', salt);

  if (!user) { safeEqual(actual, expected); return null; }
  if (!safeEqual(actual, expected)) return null;

  return { username: key, role: String(user.role || '') };
}

/* ── Signed session tokens (HMAC-SHA256) ── */
function sessionSecret() {
  return process.env.ADMIN_SESSION_SECRET || '';
}

function signSession(payload) {
  const secret = sessionSecret();
  if (!secret) throw new Error('ADMIN_SESSION_SECRET is not configured.');
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  return body + '.' + sig;
}

/**
 * Verify a session token. Returns the payload, or null if the token is
 * missing, tampered with, or expired.
 */
function verifySession(token) {
  const secret = sessionSecret();
  if (!secret || !token || typeof token !== 'string') return null;

  const dot = token.lastIndexOf('.');
  if (dot < 1) return null;

  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = crypto.createHmac('sha256', secret).update(body).digest('base64url');

  if (!safeEqual(sig, expected)) return null;

  let payload;
  try {
    payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  } catch { return null; }

  if (!payload || typeof payload.exp !== 'number' || Date.now() > payload.exp) return null;
  return payload;
}

/* ── Cookie helpers ── */
function parseCookies(req) {
  const header = req.headers?.cookie || '';
  const out = {};
  header.split(';').forEach(part => {
    const i = part.indexOf('=');
    if (i < 1) return;
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  });
  return out;
}

function setSessionCookie(res, token) {
  const maxAge = Math.floor(SESSION_TTL_MS / 1000);
  res.setHeader('Set-Cookie',
    `${SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`);
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie',
    `${SESSION_COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`);
}

/**
 * Read and verify the admin session from a request.
 * Returns { username, role } or null.
 */
function getSession(req) {
  const token = parseCookies(req)[SESSION_COOKIE];
  const payload = verifySession(token);
  if (!payload) return null;
  return { username: payload.sub, role: payload.role };
}

/**
 * Guard for admin API endpoints. Returns the session, or sends 401 and
 * returns null — callers must stop when this returns null.
 */
function requireAdmin(req, res, allowedRoles) {
  const session = getSession(req);
  if (!session) {
    res.status(401).json({ error: 'Not authenticated.' });
    return null;
  }
  if (Array.isArray(allowedRoles) && allowedRoles.length && !allowedRoles.includes(session.role)) {
    res.status(403).json({ error: 'Not authorised.' });
    return null;
  }
  return session;
}

module.exports = {
  SESSION_COOKIE,
  SESSION_TTL_MS,
  hashPassword,
  makeSalt,
  safeEqual,
  verifyCredentials,
  signSession,
  verifySession,
  parseCookies,
  setSessionCookie,
  clearSessionCookie,
  getSession,
  requireAdmin,
};
