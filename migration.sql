-- ═══════════════════════════════════════════════════
-- EURO POLO · migration.sql
-- Order persistence schema (Neon Postgres).
--
-- Run with:  node scripts/db-migrate.js
-- Idempotent — safe to re-run.
--
-- IDEMPOTENCY DESIGN
-- ------------------
-- A payment gateway may deliver the same callback more than once, and
-- Billplz explicitly retries. Three uniqueness rules make a duplicate
-- write impossible rather than merely unlikely:
--
--   1. orders.order_ref      UNIQUE  — one row per checkout attempt.
--   2. orders.gateway_ref    UNIQUE  — one row per gateway bill.
--   3. order_items(order_id, sku) UNIQUE — an item cannot be added twice.
--
-- Stock deduction is guarded separately by orders.stock_deducted_at, which
-- is claimed in the same statement that performs the deduction. A second
-- callback finds it already set and deducts nothing.
-- ═══════════════════════════════════════════════════

-- ── orders ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id                bigserial   PRIMARY KEY,

  -- Our reference, generated in api/checkout.js ("EP-XXXXXXX").
  -- Sent to the gateway as our own reference. Billplz surfaces it as
  -- reference_1, but does NOT echo it in the callback, so the callback
  -- is matched on gateway_ref below.
  order_ref         text        NOT NULL UNIQUE,

  -- Gateway bill id (Billplz bill id). NULL until the bill is created.
  -- Postgres allows many NULLs under a UNIQUE constraint, so pending rows
  -- do not collide with each other.
  gateway_ref       text        UNIQUE,

  -- Payment lifecycle. Only the gateway callback moves this to 'paid'.
  status            text        NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending', 'paid', 'failed')),

  -- Warehouse lifecycle, driven by the admin UI. Independent of payment.
  fulfilment_status text        NOT NULL DEFAULT 'Processing'
                                CHECK (fulfilment_status IN ('Processing', 'Shipped', 'Delivered', 'Cancelled')),

  -- All money in integer sen. amount_cents is what the customer is charged
  -- and is computed server-side by api/_lib/catalog.js + promos.js.
  amount_cents      integer     NOT NULL CHECK (amount_cents >= 0),
  subtotal_cents    integer     NOT NULL DEFAULT 0 CHECK (subtotal_cents >= 0),
  discount_cents    integer     NOT NULL DEFAULT 0 CHECK (discount_cents >= 0),
  promo_code        text        NOT NULL DEFAULT '',
  currency          text        NOT NULL DEFAULT 'MYR',

  customer_name     text        NOT NULL DEFAULT '',
  email             text        NOT NULL DEFAULT '',
  phone             text        NOT NULL DEFAULT '',
  address           text        NOT NULL DEFAULT '',

  created_at        timestamptz NOT NULL DEFAULT now(),
  paid_at           timestamptz,

  -- Set at the moment stock is deducted. The deduction guard.
  stock_deducted_at timestamptz
);

CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS orders_status_idx     ON orders (status);

-- ── order_items ────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id               bigserial PRIMARY KEY,
  order_id         bigint    NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  sku              text      NOT NULL,
  name             text      NOT NULL DEFAULT '',
  unit_price_cents integer   NOT NULL CHECK (unit_price_cents >= 0),
  qty              integer   NOT NULL CHECK (qty > 0),

  -- One line per sku per order. priceCart() already merges duplicate skus,
  -- so this both enforces that and blocks a replayed item insert.
  UNIQUE (order_id, sku)
);

CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items (order_id);

-- ── products_stock ─────────────────────────────────
-- Stock source of truth for deduction, keyed by variant sku.
-- Seeded from data/product-data.json by scripts/db-migrate.js.
CREATE TABLE IF NOT EXISTS products_stock (
  sku        text        PRIMARY KEY,
  product_id text        NOT NULL DEFAULT '',
  name       text        NOT NULL DEFAULT '',
  stock      integer     NOT NULL DEFAULT 0 CHECK (stock >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ── enquiries ──────────────────────────────────────
-- Contact-form leads. Before this table the form wrote to the visitor's own
-- localStorage, so a real customer's enquiry was invisible to the shop —
-- the same defect admin-orders.js fixed for orders.
--
-- No uniqueness on email: a customer may legitimately ask twice, and
-- silently swallowing the second enquiry loses a sale. Duplicate protection
-- is the submitter's problem, not the database's.
CREATE TABLE IF NOT EXISTS enquiries (
  id         bigserial   PRIMARY KEY,

  name       text        NOT NULL DEFAULT '',
  email      text        NOT NULL DEFAULT '',
  -- Always empty for web submissions (the form has no phone field). Kept so
  -- an enquiry taken by hand over the phone can be entered in the same list.
  phone      text        NOT NULL DEFAULT '',
  interest   text        NOT NULL DEFAULT '',
  message    text        NOT NULL DEFAULT '',

  -- Mirrors the states the admin drawer already offered when this list was
  -- localStorage-backed, so the existing UI keeps working unchanged.
  status     text        NOT NULL DEFAULT 'Unread'
                         CHECK (status IN ('Unread', 'Pending', 'Replied', 'Closed')),
  reply      text        NOT NULL DEFAULT '',
  notes      text        NOT NULL DEFAULT '',

  -- Kept for abuse triage only. Not shown in the admin UI.
  source_ip  text        NOT NULL DEFAULT '',

  created_at timestamptz NOT NULL DEFAULT now(),
  replied_at timestamptz
);

CREATE INDEX IF NOT EXISTS enquiries_created_at_idx ON enquiries (created_at DESC);
CREATE INDEX IF NOT EXISTS enquiries_status_idx     ON enquiries (status);

-- ── newsletter_subscribers ─────────────────────────
-- Separate from enquiries: a subscription is a standing consent, an enquiry
-- is one conversation. Mixing them would make "how many subscribers" a query
-- over a list that also contains people who only ever asked a question.
--
-- email IS unique here, and re-subscribing is an idempotent no-op — unlike an
-- enquiry, a second identical subscription carries no new information.
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id            bigserial   PRIMARY KEY,
  email         text        NOT NULL UNIQUE,
  source        text        NOT NULL DEFAULT 'website',
  source_ip     text        NOT NULL DEFAULT '',
  subscribed_at timestamptz NOT NULL DEFAULT now(),
  -- Set on unsubscribe rather than deleting the row, so a later re-subscribe
  -- cannot be mistaken for a never-unsubscribed one.
  unsubscribed_at timestamptz
);

CREATE INDEX IF NOT EXISTS newsletter_subscribed_at_idx ON newsletter_subscribers (subscribed_at DESC);
