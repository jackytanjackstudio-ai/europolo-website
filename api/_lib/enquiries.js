/* ═══════════════════════════════════════════════════
   EURO POLO · api/_lib/enquiries.js
   The ONLY module that talks SQL for leads. Mirrors _lib/orders.js.

   Files under api/ starting with "_" are not routed as serverless
   functions, so this is server-only code and is never served to the
   browser. (It deliberately does not live in a top-level lib/ —
   vercel.json sets outputDirectory ".", which would publish it as a
   static asset.)

   Schema lives in migration.sql (tables `enquiries` and
   `newsletter_subscribers`). Apply it with:
     node --env-file=.env scripts/db-migrate.js
═══════════════════════════════════════════════════ */

const { neon } = require('@neondatabase/serverless');

/* ── Connection ─────────────────────────────────────
   Same lazily-built stateless client as orders.js. Deliberately a second
   local `client` rather than a shared one: these two modules are imported
   by different endpoints, and neither should drag the other's code into a
   cold start it does not need. */
let client = null;

function db() {
  if (client) return client;

  const url = (process.env.DATABASE_URL || '').trim();
  if (!url) {
    // Never fall back to client-side storage. That fallback is exactly the
    // defect this module exists to remove: a lead the shop cannot see is a
    // lead that was never captured.
    throw new Error(
      'DATABASE_URL is not configured. Add the Neon pooled connection string to ' +
      '.env locally and to Vercel (vercel env add DATABASE_URL production / preview), ' +
      'then redeploy.'
    );
  }
  client = neon(url);
  return client;
}

/** True when the database is configured. Lets callers fail cleanly. */
function isConfigured() {
  return Boolean((process.env.DATABASE_URL || '').trim());
}

/* ── Helpers ────────────────────────────────────────── */

const STATUSES = ['Unread', 'Pending', 'Replied', 'Closed'];

/* Same shape the browser checks. Repeated here because client-side
   validation is a convenience, never a guarantee — this endpoint is public
   and reachable with curl. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isEmail(value) {
  const v = String(value || '').trim();
  return v.length <= 200 && EMAIL_RE.test(v);
}

function clean(value, max) {
  return String(value == null ? '' : value).trim().slice(0, max);
}

/**
 * Best-effort client IP, for abuse triage only.
 *
 * Never used for identity or rate limiting decisions that matter — on Vercel
 * x-forwarded-for is set by the platform edge, but it is still a header and
 * a spoofed value must not be able to do anything worse than pollute a
 * column nobody displays.
 */
function clientIp(req) {
  const fwd = req.headers?.['x-forwarded-for'];
  const first = String(fwd || '').split(',')[0].trim();
  return clean(first || req.socket?.remoteAddress || '', 64);
}

/* ── Writes ─────────────────────────────────────────── */

/**
 * Record a contact-form enquiry.
 *
 * @param {object} e
 * @param {string} e.name
 * @param {string} e.email
 * @param {string} [e.phone]
 * @param {string} [e.interest]
 * @param {string} e.message
 * @param {string} [e.sourceIp]
 * @returns {Promise<{ id:number }>}
 */
async function createEnquiry(e) {
  const sql = db();

  const name    = clean(e.name, 200);
  const email   = clean(e.email, 200);
  const message = clean(e.message, 5000);

  // Validated again at the boundary rather than trusting api/contact.js, so
  // a future second caller cannot bypass it.
  if (!name)           throw new Error('name is required.');
  if (!isEmail(email)) throw new Error('a valid email is required.');
  if (!message)        throw new Error('message is required.');

  const rows = await sql.query(
    `INSERT INTO enquiries (name, email, phone, interest, message, source_ip)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [name, email, clean(e.phone, 50), clean(e.interest, 120), message, clean(e.sourceIp, 64)]
  );

  return { id: Number(rows[0].id) };
}

/**
 * Record a newsletter subscription. Idempotent.
 *
 * A repeat subscribe reports created:false rather than erroring — from the
 * visitor's side "you are on the list" is true either way, and surfacing the
 * difference would leak whether an address is already subscribed.
 *
 * Re-subscribing after an unsubscribe clears unsubscribed_at, so the row
 * means "currently subscribed" without needing a second table.
 *
 * @returns {Promise<{ created:boolean }>}
 */
async function subscribe(email, opts = {}) {
  const sql = db();
  const addr = clean(email, 200).toLowerCase();
  if (!isEmail(addr)) throw new Error('a valid email is required.');

  const rows = await sql.query(
    `INSERT INTO newsletter_subscribers (email, source, source_ip)
     VALUES ($1, $2, $3)
     ON CONFLICT (email) DO UPDATE
        SET unsubscribed_at = NULL
      RETURNING (xmax = 0) AS created`,
    [addr, clean(opts.source, 60) || 'website', clean(opts.sourceIp, 64)]
  );

  return { created: Boolean(rows[0]?.created) };
}

/** Update an enquiry's reply/notes/status. Returns false if it does not exist. */
async function updateEnquiry(id, changes) {
  const sql = db();
  const key = parseInt(id, 10);
  if (!Number.isFinite(key)) throw new Error('a numeric enquiry id is required.');

  const status = changes.status === undefined ? null : String(changes.status);
  if (status !== null && !STATUSES.includes(status)) {
    throw new Error('status must be one of: ' + STATUSES.join(', '));
  }

  // COALESCE per column so a caller may send only the fields it changed;
  // replied_at is stamped the first time the row reaches 'Replied' and is
  // never moved afterwards, so it records when the customer was answered.
  const rows = await sql.query(
    `UPDATE enquiries
        SET status     = COALESCE($2, status),
            reply      = COALESCE($3, reply),
            notes      = COALESCE($4, notes),
            replied_at = CASE WHEN $2 = 'Replied' THEN COALESCE(replied_at, now())
                              ELSE replied_at END
      WHERE id = $1
      RETURNING id`,
    [
      key,
      status,
      changes.reply === undefined ? null : clean(changes.reply, 5000),
      changes.notes === undefined ? null : clean(changes.notes, 2000),
    ]
  );

  return rows.length > 0;
}

/** Delete an enquiry. Returns false if it did not exist. */
async function deleteEnquiry(id) {
  const sql = db();
  const key = parseInt(id, 10);
  if (!Number.isFinite(key)) throw new Error('a numeric enquiry id is required.');
  const rows = await sql.query(`DELETE FROM enquiries WHERE id = $1 RETURNING id`, [key]);
  return rows.length > 0;
}

/* ── Reads ──────────────────────────────────────────── */

/**
 * Enquiries for the admin list, newest first.
 *
 * @param {object} [opts]
 * @param {number} [opts.limit=200]
 * @param {string} [opts.status]  filter to one status
 */
async function getEnquiries(opts = {}) {
  const sql = db();
  const limit = Math.min(Math.max(parseInt(opts.limit, 10) || 200, 1), 1000);
  const status = STATUSES.includes(opts.status) ? opts.status : null;

  const rows = await sql.query(
    `SELECT id, name, email, phone, interest, message, status, reply, notes,
            created_at, replied_at
       FROM enquiries
      WHERE ($2::text IS NULL OR status = $2)
      ORDER BY created_at DESC
      LIMIT $1`,
    [limit, status]
  );

  return rows.map(r => ({
    // String, because the admin UI carries ids through HTML attributes and
    // compares them with ===; a number there would silently stop matching.
    id:        String(r.id),
    name:      r.name,
    email:     r.email,
    phone:     r.phone,
    interest:  r.interest,
    message:   r.message,
    status:    r.status,
    reply:     r.reply,
    notes:     r.notes,
    // The old localStorage records carried a plain YYYY-MM-DD `date`; keep
    // that field so the existing renderer needs no change, and pass the full
    // timestamp alongside it.
    date:      r.created_at ? new Date(r.created_at).toISOString().slice(0, 10) : '',
    createdAt: r.created_at,
    repliedAt: r.replied_at,
  }));
}

/** Newsletter subscribers, newest first. Excludes unsubscribed addresses. */
async function getSubscribers(opts = {}) {
  const sql = db();
  const limit = Math.min(Math.max(parseInt(opts.limit, 10) || 500, 1), 5000);
  const rows = await sql.query(
    `SELECT id, email, source, subscribed_at
       FROM newsletter_subscribers
      WHERE unsubscribed_at IS NULL
      ORDER BY subscribed_at DESC
      LIMIT $1`,
    [limit]
  );
  return rows.map(r => ({
    id:           String(r.id),
    email:        r.email,
    source:       r.source,
    subscribedAt: r.subscribed_at,
  }));
}

module.exports = {
  isConfigured,
  isEmail,
  clientIp,
  createEnquiry,
  subscribe,
  updateEnquiry,
  deleteEnquiry,
  getEnquiries,
  getSubscribers,
  STATUSES,
};
