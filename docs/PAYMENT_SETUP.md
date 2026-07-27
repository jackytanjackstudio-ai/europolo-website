# Euro Polo — Payment Setup & Go-Live Checklist

Everything below must be done before the site takes a real payment.
The code is complete; these are the operational steps that remain.

---

## 1. Environment variables

Set these in **Vercel → Project → Settings → Environment Variables**
(and in a local `.env` for the migration script).

| Variable | Required | What it is |
|---|---|---|
| `DATABASE_URL` | **yes** | Neon **pooled** connection string. Without it, checkout refuses to create a bill and the callback returns 503. |
| `TOYYIBPAY_SECRET_KEY` | **yes** | toyyibPay merchant secret key. |
| `TOYYIBPAY_CATEGORY_CODE` | **yes** | toyyibPay category code. |
| `ADMIN_SESSION_SECRET` | **yes** | Random string, 32+ chars. Signs admin session cookies. |
| `ADMIN_USERS` | **yes** | JSON array of admin users (see §2). |
| `SITE_URL` | no | Defaults to `https://europolo.my`. |
| `TOYYIBPAY_BASE_URL` | no | Set to `https://dev.toyyibpay.com` for sandbox. Defaults to production. |
| `PROMO_CODES` | no | JSON array to override the built-in promo list. |

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
Only `admin` and `cs` can read customer data via `/api/admin-orders`.

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

## 4. Sandbox end-to-end test

**Not yet performed — this is the remaining gate before go-live.**

1. Set `TOYYIBPAY_BASE_URL=https://dev.toyyibpay.com` and use sandbox
   credentials from <https://dev.toyyibpay.com>.
2. Deploy to a Vercel preview.
3. Confirm the functions exist: `curl -i https://<preview>/api/checkout`
   should return **405**, not 404. A 404 means `/api` is not deploying and
   nothing else will work.
4. Add an item, check out, and pay in the sandbox.
5. Verify, in order:
   - `orders` row created with `status='pending'` at checkout;
   - after payment, `status='paid'`, `paid_at` set, `gateway_ref` populated;
   - `stock_deducted_at` set once and `products_stock.stock` reduced by the
     ordered quantity;
   - the browser lands on `success.html` showing the order reference;
   - the cart is empty afterwards.
6. **Replay the callback** (re-POST the same body, or use toyyibPay's resend):
   confirm the order stays `paid`, `stock_deducted_at` does not move, and
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

The displayed total and the toyyibPay bill must both still show the real
price. The same applies to editing `discount` or posting `discountAmount`
directly to `/api/checkout` — the server never reads those fields.

---

## 5. Known gaps

- **Admin page shells are still publicly reachable.** They contain no
  credentials and no customer data (all data now comes from authenticated
  APIs), but for defence in depth enable **Vercel Deployment Protection** on
  `/admin/*`, or put it behind Vercel Authentication.
- **Product images are hotlinked from `cf.shopee.com.my`** (910 URLs) while
  582 local copies sit unused in `images/products/`. Shopee can block these at
  any time, which would blank the catalogue and the checkout summary.
  Deliberately deferred — see the audit report.
- **The `.xlsx` spreadsheets remain in git history.** `.vercelignore` stops
  them deploying, but if the GitHub repo is public, purge them from history.
- **toyyibPay callback signature.** The callback is verified by re-querying
  `getBillTransactions` server-side rather than by trusting a `hash` field,
  because toyyibPay's documentation is inconsistent about whether one is sent.
  Re-querying is strictly stronger: a forged callback cannot pass it.
