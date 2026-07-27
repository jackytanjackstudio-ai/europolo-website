/* ═══════════════════════════════════════════════════
   EURO POLO · api/_lib/orders.js
   The ONLY module that talks SQL. Nothing else touches the database.

   Files under api/ starting with "_" are not routed as serverless
   functions, so this is server-only code and is never served to the
   browser. (It deliberately does not live in a top-level lib/ —
   vercel.json sets outputDirectory ".", which would publish it as a
   static asset.)

   SETUP: Add this to Vercel Environment Variables
   ─────────────────────────────────────────────────
   DATABASE_URL = Neon POOLED connection string, e.g.
     postgresql://USER:PASS@HOST-pooler.REGION.aws.neon.tech/neondb?sslmode=require&channel_binding=require

   Schema lives in migration.sql. Apply it with:
     node --env-file=.env scripts/db-migrate.js

   MONEY: every amount here is integer sen, computed upstream by
   api/_lib/catalog.js + api/_lib/promos.js. This module stores what it
   is given and never re-prices anything.
═══════════════════════════════════════════════════ */

const { neon } = require('@neondatabase/serverless');

/* ── Connection ─────────────────────────────────────
   The Neon HTTP driver is stateless, so one lazily-built client per
   cold start is all we need — no pool to drain, no sockets to leak. */
let client = null;

function db() {
  if (client) return client;

  const url = (process.env.DATABASE_URL || '').trim();
  if (!url) {
    // Never fall back to a stub or to client-side storage: an order we
    // cannot record is an order we must not take money for.
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

const FULFILMENT_STATUSES = ['Processing', 'Shipped', 'Delivered', 'Cancelled'];

function toCents(amountMyr) {
  return Math.round((Number(amountMyr) || 0) * 100);
}

/** Flatten the checkout address fields into the single address column. */
function formatAddress(customer) {
  if (!customer) return '';
  return [customer.address, customer.city, customer.postcode, customer.state]
    .map(v => String(v || '').trim())
    .filter(Boolean)
    .join(', ');
}

/** Variant labels folded into the item name, since order_items has no option columns. */
function itemLabel(line) {
  const opts = [];
  if (line.option1) opts.push(`${line.option1Name || 'Colour'}: ${line.option1}`);
  if (line.option2) opts.push(`${line.option2Name || 'Option'}: ${line.option2}`);
  const suffix = opts.length ? ` (${opts.join(', ')})` : '';
  return String(line.name || line.sku || '').slice(0, 180) + suffix;
}

/* ── Writes ─────────────────────────────────────────── */

/**
 * Record a checkout attempt as a pending order, with its line items.
 *
 * One statement, so the order and its items are written atomically —
 * an order can never exist without its items. Re-running with the same
 * order_ref is a no-op (ON CONFLICT DO NOTHING) and reports created:false.
 *
 * @param {object}  o
 * @param {string}  o.orderRef       our reference, e.g. "EP-M2X8QK1"
 * @param {string} [o.gatewayRef]    toyyibPay BillCode, if already known
 * @param {Array}   o.lines          priced lines from catalog.priceCart()
 * @param {object}  o.customer       { name, email, phone, address, city, postcode, state }
 * @param {number}  o.totalMyr       amount charged, in ringgit
 * @param {number} [o.subtotalMyr]
 * @param {number} [o.discountMyr]
 * @param {string} [o.promoCode]
 * @returns {Promise<{ id:number, created:boolean, itemCount:number }>}
 */
async function createPendingOrder(o) {
  const sql = db();

  const orderRef = String(o.orderRef || '').trim();
  if (!orderRef) throw new Error('createPendingOrder: orderRef is required.');
  if (!Array.isArray(o.lines) || !o.lines.length) {
    throw new Error('createPendingOrder: at least one line is required.');
  }

  const items = o.lines.map(l => ({
    sku:              String(l.sku),
    name:             itemLabel(l),
    unit_price_cents: toCents(l.price),
    qty:              parseInt(l.qty, 10),
  }));

  const c = o.customer || {};

  const rows = await sql.query(
    `WITH ins AS (
       INSERT INTO orders (order_ref, gateway_ref, status, amount_cents,
                           subtotal_cents, discount_cents, promo_code, currency,
                           customer_name, email, phone, address)
       VALUES ($1, $2, 'pending', $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (order_ref) DO NOTHING
       RETURNING id
     ),
     target AS (
       SELECT id, true AS created FROM ins
       UNION ALL
       SELECT id, false FROM orders
        WHERE order_ref = $1 AND NOT EXISTS (SELECT 1 FROM ins)
     ),
     new_items AS (
       INSERT INTO order_items (order_id, sku, name, unit_price_cents, qty)
       SELECT t.id, x.sku, x.name, x.unit_price_cents, x.qty
         FROM target t
        CROSS JOIN jsonb_to_recordset($12::jsonb)
              AS x(sku text, name text, unit_price_cents int, qty int)
        WHERE t.created
       ON CONFLICT (order_id, sku) DO NOTHING
       RETURNING 1
     )
     SELECT t.id, t.created, (SELECT count(*) FROM new_items)::int AS item_count
       FROM target t`,
    [
      orderRef,
      o.gatewayRef ? String(o.gatewayRef) : null,
      toCents(o.totalMyr),
      toCents(o.subtotalMyr || 0),
      toCents(o.discountMyr || 0),
      String(o.promoCode || ''),
      String(o.currency || 'MYR'),
      String(c.name  || '').slice(0, 200),
      String(c.email || '').slice(0, 200),
      String(c.phone || '').slice(0, 50),
      formatAddress(c).slice(0, 500),
      JSON.stringify(items),
    ]
  );

  if (!rows.length) throw new Error('createPendingOrder: insert returned no row.');
  return {
    id:        Number(rows[0].id),
    created:   Boolean(rows[0].created),
    itemCount: Number(rows[0].item_count),
  };
}

/**
 * Attach the gateway's bill code once it is known.
 * No-op if one is already recorded — the callback may have got there first.
 */
async function attachGatewayRef(orderRef, gatewayRef) {
  const sql = db();
  const rows = await sql.query(
    `UPDATE orders SET gateway_ref = $2
      WHERE order_ref = $1 AND gateway_ref IS NULL
      RETURNING id`,
    [String(orderRef), String(gatewayRef)]
  );
  return rows.length > 0;
}

/**
 * Mark an order paid from a VERIFIED gateway callback. Idempotent.
 *
 * The flip is a single conditional UPDATE, so two callbacks racing in
 * separate function invocations cannot both succeed — Postgres serialises
 * them on the row and the loser sees status already 'paid'.
 *
 * When `amountCents` is supplied it must match what we billed, otherwise
 * the order is left untouched and reported as an amount mismatch.
 *
 * @returns {Promise<{ outcome:'paid'|'already_paid'|'not_found'|'amount_mismatch'|'refused',
 *                     orderRef:string, id:number|null, amountCents:number|null,
 *                     previousStatus:string|null }>}
 */
async function markPaidByCallback({ orderRef, gatewayRef = null, amountCents = null }) {
  const sql = db();
  const ref = String(orderRef || '').trim();
  if (!ref) throw new Error('markPaidByCallback: orderRef is required.');

  const expected = (amountCents === null || amountCents === undefined)
    ? null
    : parseInt(amountCents, 10);

  const rows = await sql.query(
    `WITH upd AS (
       UPDATE orders
          SET status      = 'paid',
              paid_at     = COALESCE(paid_at, now()),
              gateway_ref = COALESCE(gateway_ref, $2)
        WHERE order_ref = $1
          AND status <> 'paid'
          AND ($3::int IS NULL OR amount_cents = $3)
        RETURNING id
     )
     SELECT o.id,
            o.status       AS previous_status,
            o.amount_cents,
            EXISTS (SELECT 1 FROM upd) AS flipped
       FROM orders o
      WHERE o.order_ref = $1`,
    [ref, gatewayRef ? String(gatewayRef) : null, expected]
  );

  if (!rows.length) {
    return { outcome: 'not_found', orderRef: ref, id: null, amountCents: null, previousStatus: null };
  }

  const row = rows[0];
  // The outer SELECT reads the pre-UPDATE snapshot, so previous_status is
  // the status as it stood when the callback arrived.
  const result = {
    orderRef:       ref,
    id:             Number(row.id),
    amountCents:    Number(row.amount_cents),
    previousStatus: row.previous_status,
  };

  if (row.flipped)                       return { ...result, outcome: 'paid' };
  if (row.previous_status === 'paid')     return { ...result, outcome: 'already_paid' };
  if (expected !== null && Number(row.amount_cents) !== expected) {
    return { ...result, outcome: 'amount_mismatch' };
  }
  return { ...result, outcome: 'refused' };
}

/**
 * Deduct this order's quantities from products_stock. Idempotent.
 *
 * The claim on orders.stock_deducted_at and the deduction itself happen in
 * one statement, so a replayed callback deducts nothing. Because the claim
 * is the guard (not the paid flip), a callback retried after a mid-way
 * failure still gets a chance to apply the deduction.
 *
 * Only ever called for orders already marked paid.
 *
 * @returns {Promise<{ applied:boolean, updated:Array<{sku:string,stock:number}>, missingSkus:string[] }>}
 */
async function decrementStock(orderRef) {
  const sql = db();
  const ref = String(orderRef || '').trim();
  if (!ref) throw new Error('decrementStock: orderRef is required.');

  const rows = await sql.query(
    `WITH claim AS (
       UPDATE orders SET stock_deducted_at = now()
        WHERE order_ref = $1
          AND status = 'paid'
          AND stock_deducted_at IS NULL
        RETURNING id
     ),
     agg AS (
       SELECT oi.sku, SUM(oi.qty)::int AS qty
         FROM order_items oi
         JOIN claim c ON c.id = oi.order_id
        GROUP BY oi.sku
     ),
     deducted AS (
       UPDATE products_stock ps
          SET stock = GREATEST(0, ps.stock - a.qty), updated_at = now()
         FROM agg a
        WHERE ps.sku = a.sku
        RETURNING ps.sku, ps.stock
     )
     SELECT (SELECT count(*) FROM claim)::int AS claimed,
            COALESCE((SELECT json_agg(json_build_object('sku', sku, 'stock', stock))
                        FROM deducted), '[]'::json) AS updated,
            COALESCE((SELECT json_agg(a.sku) FROM agg a
                       WHERE NOT EXISTS (SELECT 1 FROM products_stock p WHERE p.sku = a.sku)),
                     '[]'::json) AS missing`,
    [ref]
  );

  const row = rows[0] || {};
  return {
    applied:     Number(row.claimed || 0) > 0,
    updated:     row.updated || [],
    missingSkus: row.missing || [],
  };
}

/** Move an order through the warehouse lifecycle. Does not touch payment status. */
async function setFulfilmentStatus(orderRef, status) {
  const sql = db();
  if (!FULFILMENT_STATUSES.includes(status)) {
    throw new Error('setFulfilmentStatus: unknown status "' + status + '".');
  }
  const rows = await sql.query(
    `UPDATE orders SET fulfilment_status = $2 WHERE order_ref = $1 RETURNING id`,
    [String(orderRef), status]
  );
  return rows.length > 0;
}

/* ── Reads ──────────────────────────────────────────── */

/**
 * Orders for the admin list, newest first, with their items attached.
 *
 * @param {object}  [opts]
 * @param {number}  [opts.limit=200]
 * @param {boolean} [opts.paidOnly=false]  drop abandoned pending checkouts
 * @returns {Promise<Array>}
 */
async function getOrders(opts = {}) {
  const sql = db();
  const limit = Math.min(Math.max(parseInt(opts.limit, 10) || 200, 1), 1000);
  const paidOnly = Boolean(opts.paidOnly);

  const rows = await sql.query(
    `SELECT o.id, o.order_ref, o.gateway_ref, o.status, o.fulfilment_status,
            o.amount_cents, o.subtotal_cents, o.discount_cents, o.promo_code, o.currency,
            o.customer_name, o.email, o.phone, o.address,
            o.created_at, o.paid_at, o.stock_deducted_at,
            COALESCE(
              json_agg(
                json_build_object('sku', oi.sku, 'name', oi.name,
                                  'unitPriceCents', oi.unit_price_cents, 'qty', oi.qty)
                ORDER BY oi.id
              ) FILTER (WHERE oi.id IS NOT NULL),
              '[]'::json
            ) AS items
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE ($2::bool = false OR o.status = 'paid')
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT $1`,
    [limit, paidOnly]
  );

  return rows.map(r => ({
    id:               Number(r.id),
    orderRef:         r.order_ref,
    gatewayRef:       r.gateway_ref,
    status:           r.status,
    fulfilmentStatus: r.fulfilment_status,
    amountCents:      Number(r.amount_cents),
    subtotalCents:    Number(r.subtotal_cents),
    discountCents:    Number(r.discount_cents),
    promoCode:        r.promo_code,
    currency:         r.currency,
    customer: {
      name:    r.customer_name,
      email:   r.email,
      phone:   r.phone,
      address: r.address,
    },
    createdAt:       r.created_at,
    paidAt:          r.paid_at,
    stockDeductedAt: r.stock_deducted_at,
    items:           r.items || [],
  }));
}

/** Current stock for one sku, or null if unknown. Used by tests and diagnostics. */
async function getStock(sku) {
  const sql = db();
  const rows = await sql.query(
    `SELECT sku, stock FROM products_stock WHERE sku = $1`,
    [String(sku)]
  );
  return rows.length ? { sku: rows[0].sku, stock: Number(rows[0].stock) } : null;
}

module.exports = {
  isConfigured,
  createPendingOrder,
  attachGatewayRef,
  markPaidByCallback,
  decrementStock,
  setFulfilmentStatus,
  getOrders,
  getStock,
  FULFILMENT_STATUSES,
};
