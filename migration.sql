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
-- toyyibPay explicitly retries. Three uniqueness rules make a duplicate
-- write impossible rather than merely unlikely:
--
--   1. orders.order_ref      UNIQUE  — one row per checkout attempt.
--   2. orders.gateway_ref    UNIQUE  — one row per toyyibPay bill.
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
  -- Sent to toyyibPay as billExternalReferenceNo and returned in the callback.
  order_ref         text        NOT NULL UNIQUE,

  -- toyyibPay BillCode. NULL until the bill is created.
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
