# Euro Polo — Payment Setup & Go-Live Checklist

Gateway: **Billplz** (v3 bills API). The gateway is isolated in
`api/_lib/billplz.js` — nothing else in the codebase knows which processor is
in use, so swapping again means rewriting that one file.

Everything below must be done before the site takes a real payment.
The code is complete; these are the operational steps that remain.

---

## 1. Environment variables

Set these in **Vercel → Project → Settings → Environment Variables**
(and in a local `.env` for the migration script).

| Variable | Required | What it is |
|---|---|---|
| `DATABASE_URL` | **yes** | Neon **pooled** connection string. Without it, checkout refuses to create a bill and the callback returns 503. |
| `BILLPLZ_API_KEY` | **yes** | API Secret Key. Sent as the HTTP Basic auth **username** with an empty password. |
| `BILLPLZ_COLLECTION_ID` | **yes** | The collection bills are created under. |
| `BILLPLZ_XSIGNATURE_KEY` | **yes** | X Signature Key. Without it the callback cannot be verified, so checkout refuses to create a bill at all. |
| `ADMIN_SESSION_SECRET` | **yes** | Random string, 32+ chars. Signs admin session cookies. |
| `ADMIN_USERS` | **yes** | JSON array of admin users (see §2). |
| `BILLPLZ_SANDBOX` | no | **Defaults to sandbox.** Set to exactly `false` to go live. Any other value, or unset, means sandbox. |
| `SITE_URL` | no | Defaults to `https://europolo.my`. Used for the callback and redirect URLs. |
| `PROMO_CODES` | no | JSON array to override the built-in promo list. |

All three Billplz values come from the Billplz dashboard → **Settings → API keys**.
Sandbox credentials come from a sandbox account at
<https://www.billplz-sandbox.com>; they are **not** interchangeable with live ones.

`BILLPLZ_SANDBOX` defaults to sandbox on purpose: a misconfigured deploy must
never be able to take real money. The two hosts are hardcoded in
`api/_lib/billplz.js`, so no env var can point bill creation somewhere else.

Generate a session secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 2. Admin credentials

**The six previous passwords (`europolo2026`, `mkt@polo`, `lovart2026`,
`cnt@polo`, `cs@polo`, `host@polo`) were committed to a public file and must
be treated as compromised. Do not reuse any of them.**

Generate one record per user:

```bash
node scripts/hash-admin-password.js admin admin '<new-strong-password>'
node scripts/hash-admin-password.js cs    cs    '<new-strong-password>'
```

Combine the printed objects into a single JSON array and set it as `ADMIN_USERS`:

```json
[{"u":"admin","role":"admin","salt":"…","hash":"…"},
 {"u":"cs","role":"cs","salt":"…","hash":"…"}]
```

Valid roles: `admin`, `marketing`, `content`, `cs`, `host`.
Only `admin` and `cs` can read customer data via `/api/admin-orders` — the
endpoint enforces this server-side, not just in the UI.

---

## 3. Database migration

```bash
node --env-file=.env scripts/db-migrate.js
```

Creates `orders`, `order_items`, `products_stock` and seeds `products_stock`
from `data/product-data.json`. Idempotent — safe to re-run.

Re-run it after any `data/build_variants.py` regeneration so new SKUs exist
in `products_stock`; the callback logs a warning for any SKU it cannot find.

---

## 4. Offline verification (no Billplz account needed)

```bash
node --env-file=.env scripts/verify-order-flow.js
```

61 checks against the real database. It signs its own callbacks with a test
X-Signature key, so the signature path is genuinely exercised. It also asserts
that the source strings match both worked examples in the Billplz docs — if
Billplz ever changes that format, this fails first.

Only the outbound create-bill HTTP call is stubbed.

---

## 5. Sandbox end-to-end test

**Not yet performed — this is the remaining gate before go-live.**

1. Set the three `BILLPLZ_*` variables to **sandbox** values and leave
   `BILLPLZ_SANDBOX` unset.
2. Deploy.
3. Confirm the functions exist: `curl -i https://europolo.my/api/checkout`
   should return **405**, not 404. A 404 means `/api` is not deploying and
   nothing else will work.
4. Add an item, check out, and pay in the Billplz sandbox.
5. Verify, in order:
   - `orders` row created with `status='pending'` at checkout, and
     `gateway_ref` set to the Billplz bill id;
   - after payment, `status='paid'` and `paid_at` set;
   - `stock_deducted_at` set once and `products_stock.stock` reduced by the
     ordered quantity;
   - the browser lands on `success.html` showing the order reference;
   - the cart is empty afterwards.
6. **Replay the callback** from the Billplz dashboard, or re-POST the exact
   same body: the order stays `paid`, `stock_deducted_at` does not move, and
   stock does **not** drop a second time.
7. Open `/admin/orders.html` **in a different browser** and confirm the order
   is listed. This is the check that the old localStorage store always failed.

### Price-tamper check

With DevTools open on `checkout.html`:

```js
// try to buy a RM 239.90 bag for RM 1
let c = JSON.parse(localStorage.ep_cart); c[0].price = "1";
localStorage.ep_cart = JSON.stringify(c); location.reload();
```

The displayed total and the Billplz bill must both still show the real price.
The same applies to editing `discount` or posting `discountAmount` directly to
`/api/checkout` — the server never reads those fields.

---

## 6. How the payment is trusted

- **Bill creation** (`api/checkout.js`) writes a `pending` order **before**
  calling Billplz. If the database write fails, no bill is created and nobody
  is charged for an order we could not record.
- **The POST callback is the only thing that marks an order paid.** It is
  authenticated by X-Signature (HMAC-SHA256 over the sorted source string,
  keyed with `BILLPLZ_XSIGNATURE_KEY`), so a forged callback cannot pass. The
  order is then marked paid only if `paid == true` **and** the amount Billplz
  reports equals the amount we billed.
- **The GET redirect only displays status.** Its signature is checked so we
  never show "success" off an unverified URL, but it writes nothing. A shopper
  who closes the tab still gets a recorded order.
- **Idempotency**: `order_ref`, `gateway_ref` and `(order_id, sku)` are all
  UNIQUE, and stock deduction claims `orders.stock_deducted_at` in the same
  statement that deducts. Replayed callbacks write nothing.
- **Fail closed**: the callback returns 200 only when the payment is recorded
  or there is definitively nothing to record. Anything else is a 5xx so
  Billplz retries.

### One documentation ambiguity worth knowing

Billplz's prose says to sort the X-Signature parameters by **key**, but both
worked examples in their own docs sort the **combined `key+value` strings** —
the examples end `…|paid_amount100|paid_at…|paidtrue|statepaid|…`, whereas
key-sorting would put `paidtrue` first. `api/_lib/billplz.js` follows the
examples, and `scripts/verify-order-flow.js` asserts against both of them.

If the very first sandbox callback is rejected with
`REJECTED (x_signature mismatch)` in the Vercel logs, this is the thing to
revisit — the fix is one line in `sourceString()`.

---

## 7. Known gaps

- **Admin page shells are still publicly reachable.** They contain no
  credentials and no customer data (all data now comes from authenticated
  APIs), but for defence in depth enable **Vercel Deployment Protection** on
  `/admin/*`, or put it behind Vercel Authentication.
- **Stock is validated against the static catalogue, not the database.**
  `api/_lib/catalog.js` `priceCart()` checks `data/product-data.json`, so once
  the callback starts deducting from `products_stock` the two drift and
  overselling becomes possible. Decide before real traffic.
- **Product images are hotlinked from `cf.shopee.com.my`** (910 URLs) while
  582 local copies sit unused in `images/products/`. Shopee can block these at
  any time, which would blank the catalogue and the checkout summary.
  Deliberately deferred — see the audit report.
- **The `.xlsx` spreadsheets remain in git history.** `.vercelignore` stops
  them deploying, but if the GitHub repo is public, purge them from history.
- **`dashboard.html` still reads `localStorage['ep_orders']`**, so it shows
  zero orders while `orders.html` shows the real ones.
