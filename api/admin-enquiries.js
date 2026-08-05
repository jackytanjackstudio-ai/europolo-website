/* ═══════════════════════════════════════════════════
   EURO POLO · api/admin-enquiries.js
   Contact-form leads for the admin UI, read from Postgres.

   Replaces admin/customer-service.html reading localStorage['ep_enquiries'],
   which only ever contained the three seeded demo rows — a real customer's
   enquiry was invisible to the shop. Same fix as admin-orders.js.

   GET    /api/admin-enquiries?limit=200&status=Unread  → { enquiries: [...] }
   GET    /api/admin-enquiries?kind=newsletter          → { subscribers: [...] }
   PATCH  /api/admin-enquiries  { id, status?, reply?, notes? } → { ok:true }
   DELETE /api/admin-enquiries?id=123                   → { ok:true }

   Admin session required (see api/_lib/auth.js).
═══════════════════════════════════════════════════ */

const { requireAdmin } = require('./_lib/auth');
const enquiries = require('./_lib/enquiries');

module.exports = async function (req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  // Guard first: never disclose whether the store is configured to an
  // unauthenticated caller.
  //
  // Restricted to the two roles ROLE_ACCESS (admin/auth.js) lets reach
  // customer-service.html. Enquiries carry customer names, emails and phone
  // numbers, so marketing/content/host must not be able to read them by
  // calling the API directly.
  const session = requireAdmin(req, res, ['admin', 'cs']);
  if (!session) return;

  if (!enquiries.isConfigured()) {
    res.status(503).json({
      error: 'Enquiry store not configured. Add DATABASE_URL to this environment and redeploy.',
    });
    return;
  }

  try {
    if (req.method === 'GET') {
      if (String(req.query?.kind || '') === 'newsletter') {
        res.status(200).json({ subscribers: await enquiries.getSubscribers({ limit: req.query?.limit }) });
        return;
      }
      const list = await enquiries.getEnquiries({
        limit:  req.query?.limit,
        status: req.query?.status,
      });
      res.status(200).json({ enquiries: list });
      return;
    }

    if (req.method === 'PATCH' || req.method === 'POST') {
      const body = (req.body && typeof req.body === 'object') ? req.body : {};
      const id = String(body.id || '').trim();
      if (!id) { res.status(400).json({ error: 'id is required.' }); return; }

      // Only the three fields the reply drawer edits. Everything the customer
      // submitted stays exactly as they sent it — an enquiry is a record of
      // what was said, not a document staff rewrite.
      const changes = {};
      if (body.status !== undefined) changes.status = body.status;
      if (body.reply  !== undefined) changes.reply  = body.reply;
      if (body.notes  !== undefined) changes.notes  = body.notes;
      if (!Object.keys(changes).length) {
        res.status(400).json({ error: 'Nothing to update — send status, reply or notes.' });
        return;
      }

      const updated = await enquiries.updateEnquiry(id, changes);
      if (!updated) { res.status(404).json({ error: 'Enquiry ' + id + ' not found.' }); return; }
      res.status(200).json({ ok: true, id });
      return;
    }

    if (req.method === 'DELETE') {
      const id = String(req.query?.id || req.body?.id || '').trim();
      if (!id) { res.status(400).json({ error: 'id is required.' }); return; }
      const removed = await enquiries.deleteEnquiry(id);
      if (!removed) { res.status(404).json({ error: 'Enquiry ' + id + ' not found.' }); return; }
      res.status(200).json({ ok: true, id });
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });

  } catch (err) {
    console.error('admin-enquiries: ' + (err && err.message ? err.message : err));
    res.status(500).json({ error: 'Could not load enquiries.' });
  }
};
