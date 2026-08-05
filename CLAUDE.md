# Euro Polo Website — Claude Session State

## Project overview

Static HTML/CSS/JS storefront for Euro Polo Malaysia (men's accessories brand).
Deployed on Vercel. No build step — `vercel.json` sets `"outputDirectory": "."`.

### Pages
- `index.html` — homepage
- `bags.html`, `wallets.html`, `luggage.html` — collection pages
- `product.html` — product detail page (rendered from `?id=EP0001` etc.)
- `checkout.html`, `success.html` — order flow (Billplz; see api/checkout.js)

---

## Data pipeline

Source: `Euro polo ( finalised)).xlsx` (two sheets: Products + Variants)

Run to regenerate all product data after any spreadsheet change:
```
py data/build_variants.py
```

Outputs:
- `data/product-data.json` — source JSON (`{ "products": [...] }`)
- `js/product-data-embed.js` — `window.EP_PRODUCTS = [...]` for browser

### Product data structure
```json
{
  "id": "EP0001",
  "name": "...",
  "category": "bags",          // bags | wallets | belts | luggage
  "subcategory": "crossbody",  // crossbody | backpacks | laptop-bags | waist-chest |
                               //  bifold-trifold | card-holders | long-wallets | belts | luggage
  "option1Name": "Colour",
  "option2Name": null,         // null if single-option product
  "description": "...",
  "images": { "cover": "https://...", "gallery": ["https://..."] },
  "variants": [
    { "sku": "EBA51208SB", "option1": "Dark Brown", "option2": null,
      "price": 239.9, "stock": 2, "image": "https://..." }
  ],
  "priceMin": 239.9,
  "priceMax": 239.9,
  "priceDisplay": "RM 239.90",
  "inStock": true
}
```

### Cart item structure
```json
{
  "id": "EP0001",
  "lineId": "EP0001::EBA51208SB",   // productId::sku — unique per variant
  "name": "...",
  "price": "239.9",
  "sku": "EBA51208SB",
  "option1Name": "Colour",
  "option1": "Dark Brown",
  "option2Name": "",
  "option2": "",
  "img": "https://...",
  "cat": "Crossbody",
  "qty": 1,
  "stock": 2
}
```

---

## Current status (as of 2026-06-09)

### What is working
- Variant system fully implemented (Shopee-style)
- Collection pages: colour dot swatches, Add to Cart button triggers quick-add popup for multi-variant products; single-variant products add directly
- Product detail page: auto-selects first in-stock variant; price/image update on selection; disabled OOS buttons; low-stock warning
- Cart: SKU-based line identity; shows option1/option2 labels; legacy `colour` items normalised on read
- Checkout & success pages: show option1/option2 variant labels
- Dev server: `py -m http.server 3000` from the project root

### What is NOT done yet
1. ~~**Images**~~ — **DONE.** `024e97b` downloaded the last 368 refs, so as of
   2026-08-05 the catalogue is **910 of 910 local, 0 on the Shopee CDN**
   (verify with a count over `data/product-data.json`). The old
   "542 local / 368 remote" figure below this line was true on 2026-06-09 and
   is now wrong — do not plan against it.

   🚨 **DO NOT re-run the full pipeline until `resolveDir` is fixed.**

   The old advice — "`build_variants.py` rewrites URLs back to Shopee, so
   always re-run `migrate-images.js --apply` afterwards" — **no longer
   restores the catalogue.** It was written when the URL map in
   `data/_image-check.json` (561 entries) covered every local ref. It no
   longer does: many refs were wired by filename convention or placed by hand,
   and `data/product-data.json` is now the only record of those paths.

   The mechanism: `resolveDir()` in `scripts/migrate-images.js` prefers "the
   directory of a path this product already points at". That preference is
   what carries most products today — and regenerating destroys it, because
   every ref becomes an `https://` URL again. The fallback derives a directory
   by stripping the SKU's last **whitespace-separated** token, so a no-space
   SKU yields nothing usable: `EBA51208SB` gives candidate `eba51208sb`, while
   the real directory is `eba51208s`.

   Measured 2026-08-05 by simulating the post-regeneration run:

   | | |
   |---|---|
   | refs recoverable by convention | 382 of 910 |
   | refs that would stay on Shopee | **528** |
   | products with no resolvable directory | **29 of 63** (covers included) |

   `migrate-images.js` would still exit 0 and print a normal report, so this
   failure is silent. Fix `resolveDir` (strip a trailing colour suffix from
   no-space SKUs) and re-run the simulation before trusting the pipeline again.

   To change a few images in the meantime, overwrite the files in place at the
   paths the catalogue already points at, and leave the pipeline alone.

   Note on the spreadsheet's Shopee URLs: they rotate. On 2026-08-05, 78
   `variant_image` URLs in `finaliseddd.xlsx` changed (`10a0e6c`), and all 62
   distinct files they map to fetched **byte-identical** to what was already on
   disk. A changed URL there means a new CDN file id, not necessarily a new
   photograph — always diff the bytes before replacing anything.

2. ~~**Forms**~~ — **DONE 2026-08-05.** Both forms now POST to `/api/contact`,
   which writes to Neon (`enquiries` and `newsletter_subscribers`, see
   `migration.sql`). Leads appear in `admin/customer-service.html`, which reads
   `/api/admin-enquiries` instead of localStorage. Neither form shows success
   unless the server confirmed it. Verified end to end against production on
   2026-08-05 (validation paths, honeypot, a real submission, and idempotent
   re-subscribe; the test rows were deleted afterwards).
3. **Live payment verification** — the Billplz integration is code-complete but has not been
   run end-to-end against the Billplz sandbox. See `docs/PAYMENT_SETUP.md`.

---

## Key files

| File | Purpose |
|------|---------|
| `data/build_variants.py` | Data pipeline — spreadsheet → JSON + JS |
| `js/product-data-embed.js` | Auto-generated; do not edit manually |
| `js/product-detail.js` | Product detail page renderer + variant picker |
| `js/products-loader.js` | Collection page card renderer + quick-add popup |
| `cart.js` | Cart drawer, localStorage, badge, Cart.add() |
| `css/product-detail.css` | Product detail + variant button styles |
| `products.css` | Collection pages + quick-add popup styles |
| `checkout.html` | Checkout page (Billplz; totals come from `/api/checkout`) |
| `api/_lib/billplz.js` | The ONLY gateway-aware module — endpoints, auth, X-Signature |
| `api/_lib/orders.js` | The ONLY module that talks SQL (Neon order persistence) |
| `api/_lib/enquiries.js` | The ONLY module that talks SQL for leads (contact + newsletter) |
| `api/contact.js` | Public lead capture — the only public write endpoint besides checkout |
| `api/admin-enquiries.js` | Admin read/reply/delete for leads (admin + cs roles) |
| `scripts/migrate-images.js` | Repoints Shopee CDN image refs to local files (re-runnable) |
| `scripts/gen-missing-images.js` | Regenerates `docs/missing-images.md` worklist |
| `success.html` | Order confirmation page |

---

## Key constraints

- `product_id` (EP0001–EP0063) is the unique product key, not SKU
- Variant SKU is unique per variant and is used as cart line identity
- Product images are served from local `images/products/<sku>/`; any variant with no
  local file still points at the Shopee CDN (see the migration report)
- Path convention: `images/...` (relative, not `/images/...`) for local + Vercel compatibility

---

## Dev commands

```powershell
# Start dev server
py -m http.server 3000

# Regenerate product data after spreadsheet change
py data/build_variants.py

# Open a specific product page for testing
# http://localhost:3000/product.html?id=EP0001
```
