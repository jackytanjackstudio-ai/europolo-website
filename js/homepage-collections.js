/* ═══════════════════════════════════════════════════
   EURO POLO · homepage-collections.js
   Injects real product images into collection cards.
   Requires product-data-embed.js loaded before this.
═══════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (!window.EP_PRODUCTS) return;

  function pick(opts) {
    var prods = window.EP_PRODUCTS;
    if (opts.prefer) {
      var found = prods.find(function (p) {
        return p.id === opts.prefer && p.images && p.images.cover;
      });
      if (found) return found;
    }
    return prods.find(function (p) {
      if (p.category !== opts.category) return false;
      if (!p.inStock) return false;
      if (!p.images || !p.images.cover) return false;
      if (opts.skipType) {
        if ((p.productType || '').toLowerCase().indexOf(opts.skipType) !== -1) return false;
      }
      if (opts.skipName) {
        if ((p.name || '').toLowerCase().indexOf(opts.skipName) !== -1) return false;
      }
      return true;
    });
  }

  var CONFIG = [
    { imgId: 'collImgBags',    category: 'bags',    prefer: 'EP0001',  skipName: 'gift',   page: 'bags.html'    },
    { imgId: 'collImgWallets', category: 'wallets', prefer: null,       skipType: 'gift',   page: 'wallets.html', skipName: 'gift' },
    /* Luggage: use gallery-1 (different angle, cleaner than cover 3-piece composite) */
    { imgId: 'collImgLuggage', category: 'luggage', prefer: 'EP0008',  page: 'luggage.html', galleryIdx: 1 },
  ];

  CONFIG.forEach(function (cfg) {
    var el = document.getElementById(cfg.imgId);
    if (!el) return;
    var p = pick(cfg);
    if (!p) return;

    var imgSrc = (cfg.galleryIdx !== undefined && p.images.gallery && p.images.gallery[cfg.galleryIdx])
      ? p.images.gallery[cfg.galleryIdx]
      : p.images.cover;
    el.style.backgroundImage    = "url('" + imgSrc.replace(/'/g, "\\'") + "')";
    el.style.backgroundSize     = 'cover';
    el.style.backgroundPosition = 'center center';
    el.style.backgroundColor   = '#0c0c0c';
    el.classList.add('has-img');

    var card = el.closest('.collection-card');
    if (card) card.dataset.collectionHref = cfg.page;
  });

  /* Make entire card body + image area navigate to the collection page */
  document.querySelectorAll('.collection-card[data-collection-href]').forEach(function (card) {
    card.style.cursor = 'pointer';
    card.addEventListener('click', function (e) {
      if (e.target.closest('a')) return;
      window.location.href = card.dataset.collectionHref;
    });
  });

}());
