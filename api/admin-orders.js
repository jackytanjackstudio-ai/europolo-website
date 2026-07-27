/* ═══════════════════════════════════════════════════
   EURO POLO · api/admin-orders.js
   Orders for the admin UI, read from Postgres.

   Replaces admin/orders.html reading localStorage['ep_orders'], which
   only ever contained orders placed in that same browser — so a real
   customer's order was invisible to the shop owner.

   GET   /api/admin-orders?limit=200&paidOnly=1   → { orders: [...] }
   PATCH /api/admin-orders  { orderRef, fulfilmentStatus } → { ok: true }

   Admin session required (see api/_lib/auth.js).
═══════════════════════════════════════════════════ */

const { requireAdmin } = require('./_lib/auth');
const orders = require('./_lib/orders');

module.exports = async function (req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  // Guard first: never disclose whether the store is configured to an
  // unauthenticated caller.
  //
  // Restricted to the two roles that ROLE_ACCESS (admin/auth.js) lets reach
  // orders.html. This endpoint returns customer names, emails, phone numbers
  // and addresses, so marketing/content/host must not be able to read it by
  // calling the API directly.
  const session = requireAdmin(req, res, ['admin', 'cs']);
  if (!session) return;

  if (!orders.isConfigured()) {
    res.status(503).json({
      error: 'Order store not configured. Add DATABASE_URL to this environment and redeploy.',
    });
    return;
  }

  try {
    if (req.method === 'GET') {
      const list = await orders.getOrders({
        limit:    req.query?.limit,
        paidOnly: req.query?.paidOnly === '1' || req.query?.paidOnly === 'true',
      });
      res.status(200).json({ orders: list });
      return;
    }

    if (req.method === 'PATCH' || req.method === 'POST') {
      const body = (req.body && typeof req.body === 'object') ? req.body : {};
      const orderRef = String(body.orderRef || '').trim();
      const status   = String(body.fulfilmentStatus || '').trim();

      if (!orderRef) {
        res.status(400).json({ error: 'orderRef is required.' });
        return;
      }
      if (!orders.FULFILMENT_STATUSES.includes(status)) {
        res.status(400).json({
          error: 'fulfilmentStatus must be one of: ' + orders.FULFILMENT_STATUSES.join(', '),
        });
        return;
      }

      const updated = await orders.setFulfilmentStatus(orderRef, status);
      if (!updated) {
        res.status(404).json({ error: 'Order ' + orderRef + ' not found.' });
        return;
      }
      res.status(200).json({ ok: true, orderRef, fulfilmentStatus: status });
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });

  } catch (err) {
    console.error('admin-orders: ' + (err && err.message ? err.message : err));
    res.status(500).json({ error: 'Could not load orders.' });
  }
};
