/* ═══════════════════════════════════════════════════
   EURO POLO · api/contact.js
   Public lead capture — contact form and newsletter subscribe.

   Replaces script.js writing to the visitor's own localStorage, which meant
   the shop never received a single enquiry while the form still showed
   "Your enquiry has been received." Same defect admin-orders.js fixed for
   orders, on the other side of the funnel.

   POST /api/contact  { name, email, interest?, message }   → { ok:true, id }
   POST /api/contact  { kind:"newsletter", email }          → { ok:true }

   Both kinds share one function so the deployment stays inside Vercel
   Hobby's function limit; `kind` is the only thing that distinguishes them.

   No admin session — this is called by anonymous visitors. It is therefore
   the only public write endpoint besides checkout, and is deliberately
   narrow: it inserts into two tables and can read nothing back.
═══════════════════════════════════════════════════ */

const { applyCors } = require('./_lib/config');
const enquiries = require('./_lib/enquiries');

module.exports = async function (req, res) {
  applyCors(req, res);
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST')    { res.status(405).json({ error: 'Method not allowed' }); return; }

  if (!enquiries.isConfigured()) {
    // 503, not a silent success. The form must be able to tell the visitor
    // the truth — "we could not receive this" — rather than repeat the old
    // lie in a new place.
    res.status(503).json({
      error: 'Enquiry store not configured. Add DATABASE_URL to this environment and redeploy.',
    });
    return;
  }

  const body = (req.body && typeof req.body === 'object') ? req.body : {};
  const kind = String(body.kind || 'contact').toLowerCase();
  const sourceIp = enquiries.clientIp(req);

  // Honeypot: a field no human sees and no real submission fills. Answered
  // with the same 200 a real submission gets, so a bot cannot tell it was
  // caught and retry with the field removed.
  if (String(body.company || '').trim()) {
    res.status(200).json({ ok: true });
    return;
  }

  try {
    if (kind === 'newsletter') {
      if (!enquiries.isEmail(body.email)) {
        res.status(400).json({ error: 'Please enter a valid email address.' });
        return;
      }
      await enquiries.subscribe(body.email, { source: 'website', sourceIp });
      // created:false (already subscribed) is reported as plain success —
      // telling the caller which one it was would leak list membership.
      res.status(200).json({ ok: true });
      return;
    }

    const name    = String(body.name || '').trim();
    const message = String(body.message || '').trim();

    if (!name)                          { res.status(400).json({ error: 'Please enter your name.' }); return; }
    if (!enquiries.isEmail(body.email)) { res.status(400).json({ error: 'Please enter a valid email address.' }); return; }
    if (!message)                       { res.status(400).json({ error: 'Please enter a message.' }); return; }

    const { id } = await enquiries.createEnquiry({
      name,
      email:    body.email,
      phone:    body.phone,
      interest: body.interest,
      message,
      sourceIp,
    });

    res.status(200).json({ ok: true, id });

  } catch (err) {
    // The visitor gets a generic failure; the detail goes to the function log.
    // Whatever went wrong, the one thing this must never do is answer 200.
    console.error('contact: ' + (err && err.message ? err.message : err));
    res.status(500).json({ error: 'Could not send your message. Please try again, or WhatsApp us.' });
  }
};
