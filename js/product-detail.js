/* ═══════════════════════════════════════════════════
   EURO POLO · product-detail.js
   Renders the product detail page from window.EP_PRODUCTS.
   Load AFTER product-data-embed.js, BEFORE script.js.
═══════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (!window.EP_PRODUCTS) return;

  /* ── HTML escape ── */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ── WhatsApp link ── */
  function waLink(name, price) {
    return 'https://wa.me/601160601277?text=' +
      encodeURIComponent("Hello Euro Polo, I'm interested in the " + name + ' (' + price + ')');
  }

  /* ── Category / label maps ── */
  var CAT_PAGE = {
    'bags':    'bags.html',
    'wallets': 'wallets.html',
    'belts':   'wallets.html',
    'luggage': 'luggage.html'
  };
  var CAT_LABEL = {
    'bags':    'Bags',
    'wallets': 'Wallets &amp; Belts',
    'belts':   'Wallets &amp; Belts',
    'luggage': 'Luggage'
  };
  var SUBCAT_LABEL = {
    'crossbody':      'Crossbody',
    'backpacks':      'Backpack',
    'laptop-bags':    'Laptop Bag',
    'waist-chest':    'Waist Bag',
    'bifold-trifold': 'Wallet',
    'card-holders':   'Card Holder',
    'long-wallets':   'Long Wallet',
    'belts':          'Belt',
    'luggage':        'Luggage'
  };
  var CARD_SIZE = {
    'bags':    '',
    'wallets': 'product-card--wallet-img',
    'belts':   'product-card--wallet-img',
    'luggage': 'product-card--luggage-img'
  };
  var GRID_CLASS = {
    'bags':    'products-grid products-grid--bags',
    'wallets': 'products-grid products-grid--small',
    'belts':   'products-grid products-grid--small',
    'luggage': 'products-grid products-grid--luggage'
  };

  /* ── Parse ?id= from URL ── */
  var pid = '';
  try { pid = new URLSearchParams(location.search).get('id') || ''; }
  catch (e) { pid = (location.search.match(/[?&]id=([^&]+)/) || [])[1] || ''; }

  var root = document.getElementById('pd-root');
  if (!root) return;

  /* ── Find product ── */
  var product = null;
  for (var i = 0; i < window.EP_PRODUCTS.length; i++) {
    if (window.EP_PRODUCTS[i].id === pid) { product = window.EP_PRODUCTS[i]; break; }
  }

  /* ── Not found ── */
  if (!product) {
    document.title = 'Product Not Found | Euro Polo Malaysia';
    root.innerHTML =
      '<div class="pd-notfound container">' +
        '<p class="section-eyebrow">Not Found</p>' +
        '<h2>Product Unavailable</h2>' +
        '<p>This product may no longer be available or the link is incorrect.</p>' +
        '<a href="index.html" class="btn btn--gold">Return to Home</a>' +
      '</div>';
    return;
  }

  /* ── Variant state ── */
  var variants     = product.variants || [];
  var option1Name  = product.option1Name || '';
  var option2Name  = product.option2Name || null;
  var selectedOpt1 = null;
  var selectedOpt2 = null;
  var qty          = 1;

  /* ── Natural sort for option values (Task 1) ──
     Rule: single values first sorted by leading number;
     multi-part combos (containing "+") after, shortest first;
     ties fall back to alphabetical.
  ── */
  function sortOptionVals(vals) {
    function key(s) {
      var combo = /\+|2in1|3in1/i.test(s);
      var m     = s.match(/(\d+)/);
      var num   = m ? parseInt(m[1], 10) : 9999;
      var parts = combo ? (s.match(/\+/g) || []).length : 0;
      return [combo ? 1 : 0, num, parts, s.toLowerCase()];
    }
    return vals.slice().sort(function (a, b) {
      var ka = key(a), kb = key(b);
      for (var i = 0; i < ka.length; i++) {
        if (ka[i] < kb[i]) return -1;
        if (ka[i] > kb[i]) return  1;
      }
      return 0;
    });
  }

  /* ── Variant helpers ── */
  function getOpt1Values() {
    var seen = {}, out = [];
    variants.forEach(function (v) {
      if (v.option1 && !seen[v.option1]) { seen[v.option1] = true; out.push(v.option1); }
    });
    return sortOptionVals(out);
  }

  function getOpt2Values() {
    var seen = {}, out = [];
    variants.forEach(function (v) {
      if (v.option2 && !seen[v.option2]) { seen[v.option2] = true; out.push(v.option2); }
    });
    return sortOptionVals(out);
  }

  function findSelectedVariant() {
    if (!selectedOpt1) return null;
    return variants.find(function (v) {
      return v.option1 === selectedOpt1 && (option2Name ? v.option2 === selectedOpt2 : true);
    }) || null;
  }

  function fmtPrice(n) {
    return 'RM ' + parseFloat(n).toLocaleString('en-MY', { minimumFractionDigits: 2 });
  }

  /* ── Extract size chart URL from description (Task 3) ── */
  function extractSizeChart(desc) {
    if (!desc) return { url: null, clean: '' };
    var m = desc.match(/\bSize\s+Chart\s*:\s*(https?:\/\/\S+)/i);
    if (!m) return { url: null, clean: desc };
    var clean = desc.replace(/[\r\n]*[^\r\n]*Size\s+Chart\s*:\s*https?:\/\/\S+[^\r\n]*/gi, '').trim();
    return { url: m[1], clean: clean };
  }

  /* ── Update page SEO ── */
  var pageTitle = product.name + ' | Euro Polo Malaysia';
  var pageDesc  = product.name +
    (product.priceDisplay ? ' — ' + product.priceDisplay : '') +
    '. Premium men\'s accessories by Euro Polo Malaysia.';
  document.title = pageTitle;
  (function () {
    function sm(sel, attr, val) {
      var el = document.querySelector(sel);
      if (el) el.setAttribute(attr, val);
    }
    sm('meta[name="description"]',         'content', pageDesc);
    sm('meta[property="og:title"]',        'content', pageTitle);
    sm('meta[property="og:description"]',  'content', pageDesc);
    sm('meta[name="twitter:title"]',       'content', pageTitle);
    sm('meta[name="twitter:description"]', 'content', pageDesc);
    if (product.images && product.images.cover) {
      var c   = product.images.cover;
      var abs = c.indexOf('http') === 0 ? c : 'https://europolo.my/' + c;
      sm('meta[property="og:image"]',  'content', abs);
      sm('meta[name="twitter:image"]', 'content', abs);
    }
  }());

  /* ── Highlight matching nav link ── */
  var catHref = CAT_PAGE[product.category];
  if (catHref) {
    var navLink = document.querySelector('.nav__links a[href="' + catHref + '"]');
    if (navLink) navLink.setAttribute('aria-current', 'page');
  }

  /* ── Build image list: cover first, then remaining gallery ── */
  var allImages = [];
  if (product.images) {
    var displayCover = product.images.cover || '';
    if (displayCover) allImages.push(displayCover);
    if (Array.isArray(product.images.gallery)) {
      product.images.gallery.forEach(function (img) { if (img && img !== displayCover) allImages.push(img); });
    }
  }

  /* ── Derived labels ── */
  var catPageUrl  = CAT_PAGE[product.category]  || 'index.html';
  var catLabel    = CAT_LABEL[product.category]  || esc(product.category);
  var subcatLabel = SUBCAT_LABEL[product.subcategory] ||
                    SUBCAT_LABEL[product.category]    || catLabel;
  var coverImg    = product.images && product.images.cover ? product.images.cover : '';

  /* ── Extract size chart ── */
  var scData = extractSizeChart(product.description);

  /* ────────────────────────────────────────────────
     RENDER HELPERS
   ──────────────────────────────────────────────── */

  function renderDesc(desc) {
    if (!desc) return '';
    var lines      = desc.split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
    var highlights = [];
    var specLines  = [];
    var variantRe  = /^[^\w\s]{0,3}\s*[A-Z]{2,4}\d{3,}/;
    lines.forEach(function (l) {
      if (!l || l.indexOf('http') === 0) return;
      if (variantRe.test(l)) return;
      if (l.indexOf('👍') !== -1) {
        var text = l.replace(/👍/g, '').trim().replace(/\.$/, '').trim();
        if (text) highlights.push(text);
      } else {
        specLines.push(l);
      }
    });
    if (!highlights.length && !specLines.length) return '';
    var h = '';
    if (highlights.length) {
      h += '<div class="pd-field"><span class="pd-label">Highlights</span><ul class="pd-features">';
      highlights.forEach(function (b) { h += '<li>' + esc(b) + '</li>'; });
      h += '</ul></div>';
    }
    if (specLines.length) {
      h += '<details class="pd-details-block"><summary class="pd-label">Full Description</summary><div class="pd-spec-lines">';
      specLines.forEach(function (l) { h += '<p>' + esc(l) + '</p>'; });
      h += '</div></details>';
    }
    return h;
  }

  /* ── Variant picker HTML (re-rendered on each state change) ── */
  function renderVariantSection() {
    if (!variants.length) return '';
    var opt1Vals = getOpt1Values();
    if (!opt1Vals.length) return '';
    var opt2Vals = getOpt2Values();
    var html = '<div class="variant-section">';

    /* Option 1 */
    html += '<div class="variant-group"><div class="variant-group__label">' + esc(option1Name || 'Option 1');
    if (selectedOpt1) html += ': <span class="variant-group__selected">' + esc(selectedOpt1) + '</span>';
    html += '</div><div class="variant-group__buttons">';
    opt1Vals.forEach(function (val) {
      var hasStock = variants.some(function (v) { return v.option1 === val && v.stock > 0; });
      var cls = 'variant-btn' +
        (val === selectedOpt1 ? ' variant-btn--active'   : '') +
        (!hasStock            ? ' variant-btn--disabled' : '');
      html += '<button class="' + cls + '" data-opt="1" data-val="' + esc(val) + '"' +
              (!hasStock ? ' disabled' : '') + '>' + esc(val) + '</button>';
    });
    html += '</div></div>';

    /* Option 2 */
    if (option2Name && opt2Vals.length) {
      html += '<div class="variant-group"><div class="variant-group__label">' + esc(option2Name);
      if (selectedOpt2) html += ': <span class="variant-group__selected">' + esc(selectedOpt2) + '</span>';
      html += '</div><div class="variant-group__buttons">';
      opt2Vals.forEach(function (val) {
        var hasStock = variants.some(function (v) {
          return v.option2 === val && v.stock > 0 && (!selectedOpt1 || v.option1 === selectedOpt1);
        });
        var cls = 'variant-btn' +
          (val === selectedOpt2 ? ' variant-btn--active'   : '') +
          (!hasStock            ? ' variant-btn--disabled' : '');
        html += '<button class="' + cls + '" data-opt="2" data-val="' + esc(val) + '"' +
                (!hasStock ? ' disabled' : '') + '>' + esc(val) + '</button>';
      });
      html += '</div></div>';
    }

    html += '</div>';
    return html;
  }

  /* ── Related product card ── */
  function renderRelatedCard(p) {
    var sc       = CARD_SIZE[p.category] || '';
    var cover    = p.images && p.images.cover ? p.images.cover : '';
    var imgStyle = cover
      ? 'background-color:#f7f6f4;background-image:url(\'' + esc(cover) + '\');background-size:cover;background-position:center center;background-repeat:no-repeat'
      : 'background:linear-gradient(145deg,#0c1c0f,#163320)';
    var cl       = SUBCAT_LABEL[p.subcategory] || SUBCAT_LABEL[p.category] || '';
    var fc       = p.category === 'belts' ? 'belt' : (p.subcategory || p.category);
    var firstSku = (p.variants && p.variants.length) ? (p.variants[0].sku || '') : '';

    return '<div class="product-card product-card--page reveal"' +
             ' data-category="'     + esc(fc)       + '"' +
             ' data-product-id="'   + esc(p.id)     + '"' +
             ' data-product-name="' + esc(p.name)   + '"' +
             ' data-product-price="'+ (p.priceMin != null ? p.priceMin : '') + '"' +
             ' data-product-sku="'  + esc(firstSku) + '"' +
             ' data-product-img="'  + esc(cover)    + '"' +
             ' data-product-cat="'  + esc(cl)       + '">' +
               '<div class="product-card__img' + (sc ? ' ' + sc : '') + '" style="' + imgStyle + '">' +
                 '<div class="product-card__hover-tag">In Stock</div>' +
                 '<div class="product-card__wishlist">&#9671;</div>' +
               '</div>' +
               '<div class="product-card__info">' +
                 '<span class="product-card__cat">' + esc(cl) + '</span>' +
                 '<h3>' + esc(p.name) + '</h3>' +
                 '<div class="product-card__footer">' +
                   '<span class="product-card__price">' + esc(p.priceDisplay || '') + '</span>' +
                   '<div style="display:flex;gap:.7rem">' +
                     '<a href="' + waLink(p.name, p.priceDisplay || '') + '" class="btn btn--sm" target="_blank" rel="noopener">Enquire</a>' +
                     '<button class="btn btn--cart add-to-cart-btn">Add to Cart</button>' +
                   '</div>' +
                 '</div>' +
               '</div>' +
           '</div>';
  }

  /* ────────────────────────────────────────────────
     BUILD PAGE HTML
   ──────────────────────────────────────────────── */

  var thumbsHtml = '';
  allImages.forEach(function (img, i) {
    thumbsHtml +=
      '<button class="pd-thumb' + (i === 0 ? ' pd-thumb--active' : '') + '" data-idx="' + i + '" aria-label="View image ' + (i + 1) + '">' +
        '<img src="' + esc(img) + '" alt="" loading="lazy" />' +
      '</button>';
  });

  var hasMulti    = allImages.length > 1;
  var galleryHtml =
    '<div class="pd-gallery">' +
      '<div class="pd-main-img-wrap">' +
        (hasMulti ? '<button class="pd-arrow pd-arrow--prev pd-arrow--disabled" id="pdPrev" aria-label="Previous image">&#8592;</button>' : '') +
        '<div class="pd-main-img" id="pdMainImg" title="Click to enlarge">' +
          (allImages[0] ? '<img id="pdMainImgEl" src="' + esc(allImages[0]) + '" alt="' + esc(product.name) + '" />' : '') +
        '</div>' +
        (hasMulti ? '<button class="pd-arrow pd-arrow--next" id="pdNext" aria-label="Next image">&#8594;</button>' : '') +
      '</div>' +
      (hasMulti
        ? '<p class="pd-img-counter" id="pdCounter">1 / ' + allImages.length + '</p>' +
          '<div class="pd-thumbs" id="pdThumbs">' + thumbsHtml + '</div>'
        : (allImages.length === 1
            ? '<p class="pd-img-counter" style="visibility:hidden">1 / 1</p><div class="pd-thumbs">' + thumbsHtml + '</div>'
            : '')) +
    '</div>';

  /* Info panel */
  var infoHtml =
    '<div class="pd-info"' +
      ' data-product-id="'  + esc(product.id)   + '"' +
      ' data-product-name="'+ esc(product.name)  + '"' +
      ' data-product-img="' + esc(coverImg)      + '"' +
      ' data-product-cat="' + esc(subcatLabel)   + '">' +
      '<span class="product-card__cat">' + esc(subcatLabel) + '</span>' +
      '<h1 class="pd-name">' + esc(product.name) + '</h1>' +
      '<div class="pd-price" id="pdPrice">' + esc(product.priceDisplay || '') + '</div>' +
      '<div id="pdVariantSection"></div>' +
      renderDesc(scData.clean) +
      (scData.url
        ? '<button class="pd-sizechart-btn" id="pdSizeChart">Size Chart ›</button>'
        : '') +
      '<div class="pd-qty" id="pdQty" style="display:none">' +
        '<span class="pd-qty__label">Qty</span>' +
        '<div class="pd-qty__ctrl">' +
          '<button class="pd-qty__btn" id="pdQtyMinus" aria-label="Decrease quantity">−</button>' +
          '<input  class="pd-qty__input" id="pdQtyInput" type="number" min="1" value="1" aria-label="Quantity" />' +
          '<button class="pd-qty__btn" id="pdQtyPlus"  aria-label="Increase quantity">+</button>' +
        '</div>' +
      '</div>' +
      '<div class="pd-actions">' +
        '<p class="pd-stock-msg" id="pdStockMsg"></p>' +
        '<a href="' + waLink(product.name, product.priceDisplay || '') + '" id="pdWaLink" class="btn btn--gold btn--full" target="_blank" rel="noopener">Enquire via WhatsApp</a>' +
        '<button class="btn btn--cart btn--full pd-cart-btn" id="pdCartBtn">Add to Cart</button>' +
      '</div>' +
      '<div class="pd-trust">' +
        '<div class="pd-trust__item">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>' +
          '<span>Secure Checkout</span>' +
        '</div>' +
        '<div class="pd-trust__item">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="10" r="3"/><path d="M12 2a8 8 0 0 0-8 8c0 5.4 7.4 12 8 12s8-6.6 8-12a8 8 0 0 0-8-8z"/></svg>' +
          '<span>Malaysian Seller</span>' +
        '</div>' +
        '<div class="pd-trust__item">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>' +
          '<span>Encrypted Payment</span>' +
        '</div>' +
      '</div>' +
      '<div class="pd-shipping">' +
        '<span class="pd-label">Shipping &amp; Returns</span>' +
        '<ul class="pd-shipping__list">' +
          '<li>' +
            '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>' +
            '<span>Free Shipping within Malaysia</span>' +
          '</li>' +
          '<li>' +
            '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' +
            '<span>Ships in 1–3 Working Days</span>' +
          '</li>' +
          '<li>' +
            '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/></svg>' +
            '<span>7-Day Return Policy</span>' +
          '</li>' +
        '</ul>' +
      '</div>' +
    '</div>';

  var related = window.EP_PRODUCTS.filter(function (p) {
    return p.category === product.category && p.id !== product.id;
  }).slice(0, 4);

  var relatedHtml = '';
  if (related.length) {
    var gc = GRID_CLASS[product.category] || 'products-grid products-grid--bags';
    relatedHtml =
      '<section class="related-section">' +
        '<div class="container"><div class="section-header">' +
          '<p class="section-eyebrow">You May Also Like</p>' +
          '<h2 class="section-title">From the <em>Same Collection</em></h2>' +
        '</div>' +
        '<div class="' + gc + '">' + related.map(renderRelatedCard).join('\n') + '</div>' +
        '</div></section>';
  }

  /* Product-image lightbox */
  var lightboxHtml =
    '<div class="ep-lightbox" id="epLightbox" role="dialog" aria-modal="true" aria-label="Image viewer">' +
      '<button class="ep-lightbox__close" id="epLbClose" aria-label="Close">&#x2715;</button>' +
      (allImages.length > 1
        ? '<button class="ep-lightbox__arrow ep-lightbox__arrow--prev" id="epLbPrev" aria-label="Previous">&#8592;</button>' +
          '<button class="ep-lightbox__arrow ep-lightbox__arrow--next" id="epLbNext" aria-label="Next">&#8594;</button>'
        : '') +
      '<div class="ep-lightbox__inner"><img id="epLbImg" src="' + esc(allImages[0] || '') + '" alt="' + esc(product.name) + '" /></div>' +
      (allImages.length > 1 ? '<div class="ep-lightbox__counter" id="epLbCounter">1 / ' + allImages.length + '</div>' : '') +
    '</div>';

  /* Size-chart lightbox (Task 3) — only if URL was found in description */
  var scLightboxHtml = scData.url
    ? '<div class="ep-lightbox" id="scLightbox" role="dialog" aria-modal="true" aria-label="Size chart">' +
        '<button class="ep-lightbox__close" id="scLbClose" aria-label="Close">&#x2715;</button>' +
        '<div class="ep-lightbox__inner"><img src="' + esc(scData.url) + '" alt="Size Chart" /></div>' +
      '</div>'
    : '';

  root.innerHTML =
    '<nav class="breadcrumb" aria-label="Breadcrumb"><div class="breadcrumb__inner">' +
      '<a href="index.html">Home</a><span class="breadcrumb__sep">·</span>' +
      '<a href="' + catPageUrl + '">' + catLabel + '</a><span class="breadcrumb__sep">·</span>' +
      '<span class="breadcrumb__current" aria-current="page">' + esc(product.name) + '</span>' +
    '</div></nav>' +
    '<main class="pd-main container"><div class="pd-layout">' +
      galleryHtml + infoHtml +
    '</div></main>' +
    relatedHtml +
    lightboxHtml +
    scLightboxHtml;

  /* ────────────────────────────────────────────────
     GALLERY INTERACTIONS
   ──────────────────────────────────────────────── */
  var currentIdx = 0;
  var imgEl      = document.getElementById('pdMainImgEl');
  var thumbsEl   = document.getElementById('pdThumbs');
  var counterEl  = document.getElementById('pdCounter');
  var prevBtn    = document.getElementById('pdPrev');
  var nextBtn    = document.getElementById('pdNext');
  var mainImgDiv = document.getElementById('pdMainImg');

  function goTo(idx) {
    if (idx < 0 || idx >= allImages.length) return;
    currentIdx = idx;
    if (imgEl)     imgEl.src = allImages[currentIdx];
    if (counterEl) counterEl.textContent = (currentIdx + 1) + ' / ' + allImages.length;
    if (prevBtn)   prevBtn.classList.toggle('pd-arrow--disabled', currentIdx === 0);
    if (nextBtn)   nextBtn.classList.toggle('pd-arrow--disabled', currentIdx === allImages.length - 1);
    if (thumbsEl) {
      thumbsEl.querySelectorAll('.pd-thumb').forEach(function (t) {
        t.classList.toggle('pd-thumb--active', parseInt(t.dataset.idx, 10) === currentIdx);
      });
      var active = thumbsEl.querySelector('.pd-thumb--active');
      if (active) active.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
    }
  }

  if (thumbsEl) {
    thumbsEl.addEventListener('click', function (e) {
      var t = e.target.closest('.pd-thumb');
      if (t) goTo(parseInt(t.dataset.idx, 10));
    });
  }
  if (prevBtn) prevBtn.addEventListener('click', function () { goTo(currentIdx - 1); });
  if (nextBtn) nextBtn.addEventListener('click', function () { goTo(currentIdx + 1); });

  if (mainImgDiv) {
    var swipeX = 0;
    mainImgDiv.addEventListener('touchstart', function (e) { swipeX = e.changedTouches[0].clientX; }, { passive: true });
    mainImgDiv.addEventListener('touchend',   function (e) {
      var dx = e.changedTouches[0].clientX - swipeX;
      if (Math.abs(dx) > 40) goTo(dx < 0 ? currentIdx + 1 : currentIdx - 1);
    }, { passive: true });
  }

  /* ────────────────────────────────────────────────
     PRODUCT-IMAGE LIGHTBOX
   ──────────────────────────────────────────────── */
  var lb      = document.getElementById('epLightbox');
  var lbImg   = document.getElementById('epLbImg');
  var lbClose = document.getElementById('epLbClose');
  var lbPrev  = document.getElementById('epLbPrev');
  var lbNext  = document.getElementById('epLbNext');
  var lbCount = document.getElementById('epLbCounter');

  function lbSync(idx) {
    lbImg.src = allImages[idx];
    if (lbCount) lbCount.textContent = (idx + 1) + ' / ' + allImages.length;
    goTo(idx);
  }
  function lbGoTo(idx) {
    if (idx < 0) idx = allImages.length - 1;
    if (idx >= allImages.length) idx = 0;
    lbSync(idx);
  }
  function openLb(idx)  { lbSync(idx); lb.classList.add('open'); document.body.style.overflow = 'hidden'; }
  function closeLb()    { lb.classList.remove('open'); document.body.style.overflow = ''; }

  if (mainImgDiv) {
    mainImgDiv.addEventListener('click', function (e) {
      if (!e.target.closest('.pd-arrow') && allImages.length) openLb(currentIdx);
    });
  }
  if (lbClose) lbClose.addEventListener('click', closeLb);
  if (lb)      lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
  if (lbPrev)  lbPrev.addEventListener('click', function (e) { e.stopPropagation(); lbGoTo(currentIdx - 1); });
  if (lbNext)  lbNext.addEventListener('click', function (e) { e.stopPropagation(); lbGoTo(currentIdx + 1); });

  if (lb) {
    var lbSwipeX = 0;
    lb.addEventListener('touchstart', function (e) { lbSwipeX = e.changedTouches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend',   function (e) {
      var dx = e.changedTouches[0].clientX - lbSwipeX;
      if (Math.abs(dx) > 40) lbGoTo(dx < 0 ? currentIdx + 1 : currentIdx - 1);
    }, { passive: true });
  }

  /* ────────────────────────────────────────────────
     SIZE-CHART LIGHTBOX (Task 3)
   ──────────────────────────────────────────────── */
  var scLb    = document.getElementById('scLightbox');
  var scClose = document.getElementById('scLbClose');
  var scBtn   = document.getElementById('pdSizeChart');

  function openScLb()  { if (scLb) { scLb.classList.add('open');    document.body.style.overflow = 'hidden'; } }
  function closeScLb() { if (scLb) { scLb.classList.remove('open'); document.body.style.overflow = ''; } }

  if (scBtn)  scBtn.addEventListener('click', openScLb);
  if (scClose) scClose.addEventListener('click', closeScLb);
  if (scLb)   scLb.addEventListener('click', function (e) { if (e.target === scLb) closeScLb(); });

  /* Unified keyboard handler (gallery + size-chart lightboxes) */
  document.addEventListener('keydown', function (e) {
    if (lb && lb.classList.contains('open')) {
      if (e.key === 'Escape' || e.key === 'Esc') { closeLb(); return; }
      if (e.key === 'ArrowLeft')  lbGoTo(currentIdx - 1);
      if (e.key === 'ArrowRight') lbGoTo(currentIdx + 1);
    }
    if (scLb && scLb.classList.contains('open')) {
      if (e.key === 'Escape' || e.key === 'Esc') closeScLb();
    }
  });

  /* ────────────────────────────────────────────────
     QUANTITY CONTROLS (Task 2)
   ──────────────────────────────────────────────── */
  function setQty(n) {
    var v   = findSelectedVariant();
    var max = v ? Math.max(1, v.stock) : 1;
    qty = Math.max(1, Math.min(Math.round(n) || 1, max));
    var inp = document.getElementById('pdQtyInput');
    if (inp) inp.value = qty;
  }

  function bindQtyControls() {
    var minus = document.getElementById('pdQtyMinus');
    var plus  = document.getElementById('pdQtyPlus');
    var inp   = document.getElementById('pdQtyInput');

    if (minus) minus.addEventListener('click', function () { setQty(qty - 1); });
    if (plus)  plus.addEventListener('click',  function () { setQty(qty + 1); });
    if (inp) {
      /* Validate on change (Enter / tab away) and on blur */
      function validate() {
        var n = parseInt(inp.value, 10);
        setQty(isNaN(n) ? 1 : n);
      }
      inp.addEventListener('change', validate);
      inp.addEventListener('blur',   validate);
      /* Prevent e / + / - keys that browsers allow in number inputs */
      inp.addEventListener('keydown', function (e) {
        if (e.key === 'e' || e.key === 'E' || e.key === '+') e.preventDefault();
      });
    }
  }

  bindQtyControls();

  /* ────────────────────────────────────────────────
     VARIANT PICKER LOGIC
   ──────────────────────────────────────────────── */

  /* Switch main image when a colour/opt1 variant is selected */
  function switchVariantImage(opt1Val) {
    var isColour = /colou?r|warna/i.test(option1Name || '');

    /* Find this variant's registered image */
    var variantImg = null;
    for (var j = 0; j < variants.length; j++) {
      if (variants[j].option1 === opt1Val && variants[j].image) {
        variantImg = variants[j].image;
        break;
      }
    }

    var url = variantImg || (product.images && product.images.cover) || '';

    /* For colour options: when all variants share the same cover image,
       map colour position → gallery image so switching gives visual feedback */
    if (isColour) {
      var coverUrl = (product.images && product.images.cover) || '';
      var allShared = variants.every(function (v) {
        return !v.image || v.image === coverUrl;
      });
      if (allShared && allImages.length > 1) {
        var opt1Vals = getOpt1Values();
        var colorIdx = opt1Vals.indexOf(opt1Val);
        var galLen   = allImages.length - 1; /* number of gallery images */
        if (colorIdx <= 0) {
          url = allImages[0] || coverUrl;
        } else {
          /* Cycle through gallery images so every colour click shows a different image */
          url = allImages[((colorIdx - 1) % galLen) + 1];
        }
      }
    }

    if (!url) return;

    if (imgEl) imgEl.src = url;
    if (lbImg) lbImg.src = url;

    /* Sync currentIdx + thumbnail strip + arrows + counter */
    var newIdx = allImages.indexOf(url);
    if (newIdx < 0) newIdx = 0;
    currentIdx = newIdx;

    if (counterEl) counterEl.textContent = (currentIdx + 1) + ' / ' + allImages.length;
    if (prevBtn)   prevBtn.classList.toggle('pd-arrow--disabled', currentIdx === 0);
    if (nextBtn)   nextBtn.classList.toggle('pd-arrow--disabled', currentIdx === allImages.length - 1);

    if (thumbsEl) {
      thumbsEl.querySelectorAll('.pd-thumb').forEach(function (t) {
        t.classList.toggle('pd-thumb--active', parseInt(t.dataset.idx, 10) === currentIdx);
      });
      var active = thumbsEl.querySelector('.pd-thumb--active');
      if (active) active.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
    }
  }

  function updateVariantUI() {
    var vsEl     = document.getElementById('pdVariantSection');
    var priceEl  = document.getElementById('pdPrice');
    var cartBtn  = document.getElementById('pdCartBtn');
    var stockMsg = document.getElementById('pdStockMsg');
    var waLinkEl = document.getElementById('pdWaLink');
    var qtyEl    = document.getElementById('pdQty');
    var qtyInp   = document.getElementById('pdQtyInput');

    if (vsEl) { vsEl.innerHTML = renderVariantSection(); bindVariantButtons(); }

    var v = findSelectedVariant();

    /* Price */
    if (priceEl) {
      if (v) {
        priceEl.textContent = fmtPrice(v.price);
      } else if (selectedOpt1 && option2Name) {
        var prices = variants
          .filter(function (vv) { return vv.option1 === selectedOpt1; })
          .map(function (vv) { return vv.price; });
        if (prices.length) {
          var lo = Math.min.apply(null, prices), hi = Math.max.apply(null, prices);
          priceEl.textContent = lo === hi ? fmtPrice(lo) : fmtPrice(lo) + ' – ' + fmtPrice(hi);
        }
      } else {
        priceEl.textContent = product.priceDisplay || '';
      }
    }

    /* WhatsApp link */
    if (waLinkEl) {
      waLinkEl.href = waLink(product.name, v ? fmtPrice(v.price) : (product.priceDisplay || ''));
    }

    /* Cart button */
    if (cartBtn) {
      if (!selectedOpt1 && variants.length > 0) {
        cartBtn.textContent = 'Select ' + (option1Name || 'Option');
        cartBtn.disabled = true;
      } else if (option2Name && !selectedOpt2) {
        cartBtn.textContent = 'Select ' + option2Name;
        cartBtn.disabled = true;
      } else if (v && v.stock <= 0) {
        cartBtn.textContent = 'Out of Stock';
        cartBtn.disabled = true;
      } else if (v) {
        cartBtn.textContent = 'Add to Cart';
        cartBtn.disabled = false;
      } else {
        cartBtn.textContent = 'Unavailable';
        cartBtn.disabled = true;
      }
    }

    /* Low-stock message */
    if (stockMsg) {
      stockMsg.textContent = (v && v.stock > 0 && v.stock <= 3) ? 'Only ' + v.stock + ' left!' : '';
    }

    /* Qty input: show when in-stock variant selected; update max; clamp */
    if (qtyEl)  qtyEl.style.display = (v && v.stock > 0) ? '' : 'none';
    if (qtyInp && v && v.stock > 0) {
      qtyInp.setAttribute('max', String(v.stock));
      if (qty > v.stock) { qty = v.stock; qtyInp.value = qty; }
    }
  }

  function bindVariantButtons() {
    var vsEl = document.getElementById('pdVariantSection');
    if (!vsEl) return;
    vsEl.querySelectorAll('.variant-btn:not([disabled])').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var opt = this.dataset.opt;
        var val = this.dataset.val;
        if (opt === '1') {
          selectedOpt1 = val;
          if (option2Name && selectedOpt2) {
            var stillOk = variants.some(function (vv) {
              return vv.option1 === selectedOpt1 && vv.option2 === selectedOpt2 && vv.stock > 0;
            });
            if (!stillOk) selectedOpt2 = null;
          }
          switchVariantImage(val);
        } else {
          selectedOpt2 = val;
        }
        /* Reset qty to 1 whenever the variant changes */
        qty = 1;
        var qtyInp = document.getElementById('pdQtyInput');
        if (qtyInp) qtyInp.value = 1;
        updateVariantUI();
      });
    });
  }

  /* ── Auto-select first available variant on load ── */
  (function autoSelect() {
    var opt1Vals = getOpt1Values();
    if (!opt1Vals.length) { updateVariantUI(); return; }

    selectedOpt1 = opt1Vals.find(function (val) {
      return variants.some(function (v) { return v.option1 === val && v.stock > 0; });
    }) || opt1Vals[0];

    if (option2Name) {
      var opt2Vals = getOpt2Values();
      selectedOpt2 = opt2Vals.find(function (val) {
        return variants.some(function (v) {
          return v.option1 === selectedOpt1 && v.option2 === val && v.stock > 0;
        });
      }) || null;
    }

    switchVariantImage(selectedOpt1);
    updateVariantUI();
  }());

  /* ── Add to Cart — detail page only ── */
  var pdCartBtn = document.getElementById('pdCartBtn');
  if (pdCartBtn) {
    pdCartBtn.dataset.cartBound = '1';
    pdCartBtn.addEventListener('click', function () {
      if (this.disabled) return;
      var v = findSelectedVariant();
      if (!v || v.stock <= 0) return;
      Cart.add(
        product.id, product.name,
        v.price, v.sku, v.image || coverImg, subcatLabel,
        option1Name || '', v.option1 || '',
        option2Name || '', v.option2 || '',
        qty
      );
    });
  }

  /* ────────────────────────────────────────────────
     RELATED CARD — CLICK TO NAVIGATE
   ──────────────────────────────────────────────── */
  var relSection = document.querySelector('.related-section');
  if (relSection) {
    relSection.addEventListener('click', function (e) {
      if (e.target.closest('a, button')) return;
      var card = e.target.closest('[data-product-id]');
      if (card && card.dataset.productId) {
        window.location.href = 'product.html?id=' + encodeURIComponent(card.dataset.productId);
      }
    });
  }

}());
