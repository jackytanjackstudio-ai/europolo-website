/* ═══════════════════════════════════════════════════
   EURO POLO · api/admin-products.js
   Catalogue for the admin UI, at VARIANT level, with LIVE stock.

   READ-ONLY BY CONSTRUCTION. GET is the only method that returns
   anything, and the only database call it makes is orders.getAllStock(),
   which is a bare SELECT. There is no write path in this file — do not
   add one. Stock is changed by the payment callback (orders.decrementStock)
   and by nothing else; product facts are changed in the master spreadsheet.

   GET /api/admin-products → { variants: [...], totals: {...}, generatedAt }

   Why the two sources are joined here rather than in the browser:
   admin/content.html used to render stock straight out of
   js/product-data-embed.js, which is a spreadsheet snapshot frozen at the
   last `py data/build_variants.py` run. Checkout deducts from Neon
   products_stock, so the two drift apart the moment anything sells. The
   number staff see must be the number checkout uses.

   Admin session required (see api/_lib/auth.js). Restricted to the roles
   that ROLE_ACCESS in admin/auth.js lets reach content.html.
═══════════════════════════════════════════════════ */

const { requireAdmin } = require('./_lib/auth');
const orders = require('./_lib/orders');

// require() (not fs) so Vercel's dependency tracer bundles the JSON —
// the same source api/_lib/catalog.js prices from, so the admin list and
// the checkout price can never describe different catalogues.
const productData = require('../data/product-data.json');

/** Matches fmt_price() in data/build_variants.py. */
function fmtPrice(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '';
  return 'RM ' + v.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Flatten the catalogue to one entry per variant. Pure — no I/O. */
function flattenCatalogue() {
  const products = Array.isArray(productData) ? productData : (productData.products || []);
  const out = [];

  for (const product of products) {
    for (const variant of (product.variants || [])) {
      if (!variant.sku) continue;
      out.push({
        productId:    product.id || '',
        name:         product.name || '',
        category:     product.category || '',
        subcategory:  product.subcategory || '',
        sku:          String(variant.sku),
        option1Name:  product.option1Name || '',
        option1:      variant.option1 || '',
        option2Name:  product.option2Name || '',
        option2:      variant.option2 || '',
        price:        Number(variant.price),
        priceDisplay: fmtPrice(variant.price),
        // The spreadsheet figure, returned only so the UI can point out
        // where it disagrees with Neon. It is NOT the stock to trust.
        snapshotStock: Number(variant.stock),
      });
    }
  }
  return out;
}

module.exports = async function (req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  // Guard first: never disclose catalogue or stock levels to an
  // unauthenticated caller.
  const session = requireAdmin(req, res, ['admin', 'content']);
  if (!session) return;

  if (req.method !== 'GET') {
    // This endpoint is a reader. Nothing here can modify anything.
    res.status(405).json({ error: 'Method not allowed. This endpoint is read-only.' });
    return;
  }

  if (!orders.isConfigured()) {
    res.status(503).json({
      error: 'Stock database not configured. Add DATABASE_URL to this environment and redeploy.',
    });
    return;
  }

  try {
    const catalogue = flattenCatalogue();

    const stockRows = await orders.getAllStock();
    const stockBySku = new Map(stockRows.map(r => [r.sku, r]));

    let missingStockRows = 0;
    const variants = catalogue.map(v => {
      const row = stockBySku.get(v.sku);
      if (!row) missingStockRows++;
      return {
        ...v,
        // null, never 0, when Neon has no row for this sku. Showing 0 would
        // read as "sold out" when the truth is "never seeded".
        stock:        row ? row.stock : null,
        stockKnown:   Boolean(row),
        stockUpdatedAt: row ? row.updatedAt : null,
      };
    });

    // Stock rows with no matching catalogue sku — e.g. a sku removed from the
    // spreadsheet that still holds inventory in Neon. Surfaced as a count so a
    // silent orphan does not go unnoticed.
    const catalogueSkus = new Set(catalogue.map(v => v.sku));
    const orphanStockRows = stockRows.filter(r => !catalogueSkus.has(r.sku)).map(r => r.sku);

    res.status(200).json({
      variants,
      totals: {
        products:        new Set(catalogue.map(v => v.productId)).size,
        variants:        variants.length,
        missingStockRows,
        orphanStockRows,
      },
      generatedAt: new Date().toISOString(),
    });

  } catch (err) {
    console.error('admin-products: ' + (err && err.message ? err.message : err));
    res.status(500).json({ error: 'Could not load the catalogue.' });
  }
};
