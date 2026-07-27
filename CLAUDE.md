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
1. **Images** — covers and galleries are served locally from
   `images/products/<slug>/`. Still on the Shopee CDN: all 372 variant swatch
   images (separate photographs that were never downloaded) and EP0063's 7
   cover/gallery images (never downloaded). Supply those files and re-run
   `node scripts/migrate-images.js --apply` to finish. Full breakdown in
   `data/image-migration-report.json`.

   IMPORTANT: `py data/build_variants.py` rewrites image URLs back to Shopee.
   Always re-run `node scripts/migrate-images.js --apply` after regenerating.
2. **Forms** — contact form and newsletter form are placeholder UI only (no backend, no data stored). Need Formspree / Mailchimp / similar before launch.
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
| `scripts/migrate-images.js` | Repoints Shopee CDN image refs to local files (re-runnable) |
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
