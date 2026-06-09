/* ═══════════════════════════════════════════════════
   EURO POLO · products-loader.js
   Renders product cards from window.EP_PRODUCTS.
   Load AFTER product-data-embed.js, BEFORE script.js.
═══════════════════════════════════════════════════ */
(function () {
  if (!window.EP_PRODUCTS) return;

  /* ── HTML escape ── */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ── Colour name → hex ── */
  var COLOR_HEX = {
    'Black': '#1a1a1a',      'Dark Brown': '#3d2b1a',  'Brown': '#8B5E3C',
    'Light Brown': '#a0724d','Grey': '#6b6b6b',         'Gray': '#6b6b6b',
    'Dark Grey': '#3a3a3a',  'Blue': '#1a3a5c',         'Dark Blue': '#0d2540',
    'Light Blue': '#4a6c8c', 'Green': '#163320',        'Dark Green': '#0c1c0f',
    'Moss Green': '#4a5c2a', 'Khaki': '#8B8C5E',        'White': '#f0f0f0',
    'Rose Gold': '#c8a882',  'Red': '#8b1a1a',          'Maroon': '#5c1a1a',
    'Purple': '#4a235a',     'Dark Purple': '#3a1a4a',  'Caramel': '#c87941',
    'Yellow': '#c8a832',
    /* combo colours — rendered as split-circle via CSS */
    'BROWN / BLACK':         '#8B5E3C', 'Black / Green':          '#163320',
    'Blue (New)':            '#1a3a5c', 'Dark Brown / Brown':     '#3d2b1a',
    'GREY / BLACK':          '#6b6b6b', 'Light Brown/ Caramel':   '#c87941',
    'RED / BLACK':           '#8b1a1a', 'WHITE / BLACK':          '#f0f0f0'
  };

  /* ── Natural sort for option values (Task 1) ── */
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

  /* ── Subcategory → display label ── */
  var CAT_LABEL = {
    'crossbody':     'Crossbody',
    'backpacks':     'Backpack',
    'laptop-bags':   'Laptop Bag',
    'waist-chest':   'Waist Bag',
    'bifold-trifold':'Wallet',
    'card-holders':  'Card Holder',
    'long-wallets':  'Long Wallet',
    'belts':         'Belt',
    'luggage':       'Luggage'
  };

  /* ── Page detection ── */
  var path = location.pathname.toLowerCase();
  var pageCategories, filterFn, cardSizeClass;

  if (path.indexOf('bags') !== -1) {
    pageCategories = ['bags'];
    filterFn       = function (p) { return p.subcategory || p.category; };
    cardSizeClass  = '';
  } else if (path.indexOf('wallets') !== -1) {
    pageCategories = ['wallets', 'belts'];
    filterFn       = function (p) {
      if (p.category === 'belts') return 'belts';
      return p.subcategory || 'bifold-trifold';
    };
    cardSizeClass  = 'product-card--wallet-img';
  } else if (path.indexOf('luggage') !== -1) {
    pageCategories = ['luggage'];
    filterFn       = function () { return 'set'; };
    cardSizeClass  = 'product-card--luggage-img';
  } else {
    return;
  }

  var products = window.EP_PRODUCTS.filter(function (p) {
    return pageCategories.indexOf(p.category) !== -1;
  });
  if (!products.length) return;

  /* ── Short description from 👍 bullet lines ── */
  function shortDesc(desc) {
    if (!desc) return '';
    var lines = desc.split('\n');
    var benefits = [];
    for (var i = 0; i < lines.length; i++) {
      var l = lines[i].trim();
      if (l.indexOf('👍') === 0) {
        benefits.push(l.replace(/^👍\s*/, ''));
        if (benefits.length === 2) break;
      }
    }
    if (benefits.length) return benefits.join('. ') + '.';
    for (var j = 0; j < lines.length; j++) {
      var line = lines[j].trim();
      if (line && line.indexOf('http') !== 0 && line.length > 15) return line;
    }
    return '';
  }

  /* ── Variant hints: colour dots or option-count chip ── */
  function variantHints(p) {
    if (!p.variants || !p.variants.length) return '';
    var seen = {}, opt1Vals = [];
    p.variants.forEach(function (v) {
      if (v.option1 && !seen[v.option1]) { seen[v.option1] = true; opt1Vals.push(v.option1); }
    });
    if (opt1Vals.length <= 1) return '';
    var isColour = p.option1Name && /colou?r|warna/i.test(p.option1Name);
    if (isColour) {
      var valid = opt1Vals.filter(function (c) { return COLOR_HEX[c.trim()]; });
      if (valid.length) {
        var limit = Math.min(valid.length, 6);
        var html = '';
        for (var i = 0; i < limit; i++) {
          html += '<span class="colour-swatch" style="--c:' + COLOR_HEX[valid[i].trim()] + '" title="' + esc(valid[i]) + '"></span>';
        }
        if (valid.length > 6) html += '<span class="product-card__colour-name">+' + (valid.length - 6) + '</span>';
        return '<div class="product-card__colours">' + html + '</div>';
      }
    }
    return '<div class="product-card__variant-count">' + opt1Vals.length + ' ' + esc((p.option1Name || 'variants').toLowerCase()) + 's</div>';
  }

  /* ── WhatsApp enquiry link ── */
  function waLink(name, price) {
    return 'https://wa.me/601160601277?text=' +
      encodeURIComponent("Hello Euro Polo, I'm interested in the " + name + ' (' + price + ')');
  }

  /* ── Format price ── */
  function fmtPrice(n) {
    return 'RM ' + parseFloat(n).toLocaleString('en-MY', { minimumFractionDigits: 2 });
  }

  /* ── Render one product card ── */
  function renderCard(p) {
    var filterCat = filterFn(p);
    var catLabel  = CAT_LABEL[p.subcategory] || CAT_LABEL[p.category] || '';
    var cover     = p.images && p.images.cover ? p.images.cover : '';
    var sizeClass = cardSizeClass ? ' ' + cardSizeClass : '';
    var imgStyle  = cover
      ? 'background-color:#111;background-image:url(\'' + cover + '\');background-size:cover;background-position:center center'
      : 'background:linear-gradient(145deg,#0c1c0f,#163320)';
    var desc     = esc(shortDesc(p.description));
    var price    = esc(p.priceDisplay || '');
    var pMin     = p.priceMin != null ? p.priceMin : '';
    var firstSku = (p.variants && p.variants.length) ? (p.variants[0].sku || '') : '';

    return '<div class="product-card product-card--page reveal"' +
      ' data-category="'     + esc(filterCat) + '"' +
      ' data-product-id="'   + esc(p.id)      + '"' +
      ' data-product-name="' + esc(p.name)    + '"' +
      ' data-product-price="'+ pMin           + '"' +
      ' data-product-sku="'  + esc(firstSku)  + '"' +
      ' data-product-cat="'  + esc(catLabel)  + '">' +
        '<div class="product-card__img' + sizeClass + '" style="' + imgStyle + '" data-label="' + esc(p.id) + '">' +
          '<div class="product-card__hover-tag">In Stock</div>' +
          '<div class="product-card__wishlist">&#9671;</div>' +
        '</div>' +
        '<div class="product-card__info">' +
          '<span class="product-card__cat">' + esc(catLabel) + '</span>' +
          '<h3>' + esc(p.name) + '</h3>' +
          '<p class="product-card__desc">' + desc + '</p>' +
          variantHints(p) +
          '<div class="product-card__footer">' +
            '<span class="product-card__price">' + price + '</span>' +
            '<div style="display:flex;gap:.7rem">' +
              '<a href="' + waLink(p.name, p.priceDisplay || '') + '" class="btn btn--sm" target="_blank" rel="noopener">Enquire</a>' +
              '<button class="btn btn--cart add-to-cart-btn">Add to Cart</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  /* ══════════════════════════════════════════════════
     QUICK-ADD POPUP
  ══════════════════════════════════════════════════ */

  function closeAllQuickAdds() {
    document.querySelectorAll('.quick-add').forEach(function (el) { el.remove(); });
  }

  function openQuickAdd(card, prod) {
    closeAllQuickAdds();

    var opt1Name  = prod.option1Name || 'Option 1';
    var opt2Name  = prod.option2Name || null;
    var isColour1 = /colou?r|warna/i.test(opt1Name);

    /* Collect unique option values, then sort naturally */
    var seen1 = {}, opt1Vals = [];
    var seen2 = {}, opt2Vals = [];
    prod.variants.forEach(function (v) {
      if (v.option1 && !seen1[v.option1]) { seen1[v.option1] = true; opt1Vals.push(v.option1); }
      if (v.option2 && !seen2[v.option2]) { seen2[v.option2] = true; opt2Vals.push(v.option2); }
    });
    opt1Vals = sortOptionVals(opt1Vals);
    opt2Vals = sortOptionVals(opt2Vals);

    var sel1 = null, sel2 = null;

    /* Build opt1 button HTML */
    function opt1HTML() {
      return opt1Vals.map(function (val) {
        var hasStock = prod.variants.some(function (v) { return v.option1 === val && v.stock > 0; });
        var selCls   = val === sel1;
        if (isColour1 && COLOR_HEX[val.trim()]) {
          var cls = 'qa-swatch' + (selCls ? ' qa-swatch--selected' : '') + (!hasStock ? ' qa-swatch--oos' : '');
          return '<button class="' + cls + '" style="--c:' + COLOR_HEX[val.trim()] + '"' +
            ' data-opt="1" data-val="' + esc(val) + '" title="' + esc(val) + '"' +
            (!hasStock ? ' disabled' : '') + '></button>';
        }
        var cls = 'qa-btn' + (selCls ? ' qa-btn--selected' : '') + (!hasStock ? ' qa-btn--oos' : '');
        return '<button class="' + cls + '" data-opt="1" data-val="' + esc(val) + '"' +
          (!hasStock ? ' disabled' : '') + '>' + esc(val) + '</button>';
      }).join('');
    }

    /* Build opt2 button HTML */
    function opt2HTML() {
      return opt2Vals.map(function (val) {
        var hasStock = prod.variants.some(function (v) {
          return v.option2 === val && v.stock > 0 && (!sel1 || v.option1 === sel1);
        });
        var selCls = val === sel2;
        var cls = 'qa-btn' + (selCls ? ' qa-btn--selected' : '') + (!hasStock ? ' qa-btn--oos' : '');
        return '<button class="' + cls + '" data-opt="2" data-val="' + esc(val) + '"' +
          (!hasStock ? ' disabled' : '') + '>' + esc(val) + '</button>';
      }).join('');
    }

    /* Derive current price text */
    function currentPrice() {
      if (!sel1) return prod.priceDisplay || '';
      var matched = prod.variants.find(function (v) {
        return v.option1 === sel1 && (opt2Name ? v.option2 === sel2 : true);
      });
      if (matched) return fmtPrice(matched.price);
      if (opt2Name) {
        var prices = prod.variants.filter(function (v) { return v.option1 === sel1; }).map(function (v) { return v.price; });
        if (prices.length) {
          var lo = Math.min.apply(null, prices), hi = Math.max.apply(null, prices);
          return lo === hi ? fmtPrice(lo) : fmtPrice(lo) + ' – ' + fmtPrice(hi);
        }
      }
      return prod.priceDisplay || '';
    }

    /* Derive Add-button label / disabled state */
    function addBtnState() {
      var ready = sel1 && (!opt2Name || sel2);
      if (!ready) return { disabled: true,  label: 'Select ' + opt1Name };
      var v = prod.variants.find(function (vv) {
        return vv.option1 === sel1 && (opt2Name ? vv.option2 === sel2 : true);
      });
      if (!v || v.stock <= 0) return { disabled: true, label: 'Out of Stock' };
      return { disabled: false, label: 'Add to Cart', variant: v };
    }

    /* Full re-render of popup interior */
    function render() {
      var btnState = addBtnState();
      var showOpt2 = opt2Name && opt2Vals.length > 0 && sel1;

      popup.innerHTML =
        '<div class="qa-header">' +
          '<span class="qa-title">Select ' + esc(opt1Name) + '</span>' +
          '<button class="qa-close" aria-label="Close">&#x2715;</button>' +
        '</div>' +
        '<div class="qa-group">' + opt1HTML() + '</div>' +
        (opt2Name
          ? '<div class="qa-group-label qa-opt2-label"' + (showOpt2 ? '' : ' style="display:none"') + '>' + esc(opt2Name) + '</div>' +
            '<div class="qa-group qa-opt2-group"' + (showOpt2 ? '' : ' style="display:none"') + '>' + opt2HTML() + '</div>'
          : '') +
        '<div class="qa-footer">' +
          '<span class="qa-price">' + esc(currentPrice()) + '</span>' +
          '<button class="qa-add-btn"' + (btnState.disabled ? ' disabled' : '') + '>' + esc(btnState.label) + '</button>' +
        '</div>';

      bindEvents();
    }

    /* Bind all popup event listeners after each render */
    function bindEvents() {
      /* Close button */
      var closeBtn = popup.querySelector('.qa-close');
      if (closeBtn) closeBtn.addEventListener('click', function (e) { e.stopPropagation(); popup.remove(); });

      /* Option 1 */
      popup.querySelectorAll('[data-opt="1"]:not([disabled])').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          sel1 = this.dataset.val;
          /* Clear sel2 if it's no longer in-stock for new sel1 */
          if (sel2) {
            var ok = prod.variants.some(function (v) {
              return v.option1 === sel1 && v.option2 === sel2 && v.stock > 0;
            });
            if (!ok) sel2 = null;
          }
          render();
        });
      });

      /* Option 2 */
      popup.querySelectorAll('[data-opt="2"]:not([disabled])').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          sel2 = this.dataset.val;
          render();
        });
      });

      /* Add to Cart */
      var addBtn = popup.querySelector('.qa-add-btn');
      if (addBtn && !addBtn.disabled) {
        addBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          var state = addBtnState();
          if (state.disabled || !state.variant) return;
          var v   = state.variant;
          var img = v.image || (prod.images && prod.images.cover) || '';
          Cart.add(
            prod.id, prod.name,
            v.price, v.sku, img,
            card.dataset.productCat || '',
            prod.option1Name || '', v.option1 || '',
            prod.option2Name || '', v.option2 || ''
          );
          popup.remove();
        });
      }
    }

    /* Create and attach popup */
    var popup = document.createElement('div');
    popup.className = 'quick-add';
    card.appendChild(popup);
    render();

    /* Close on outside click */
    setTimeout(function () {
      function outsideClick(e) {
        if (!card.contains(e.target)) {
          popup.remove();
          document.removeEventListener('click', outsideClick);
        }
      }
      document.addEventListener('click', outsideClick);
      /* Cleanup listener if popup is removed another way */
      var obs = new MutationObserver(function () {
        if (!document.contains(popup)) {
          document.removeEventListener('click', outsideClick);
          obs.disconnect();
        }
      });
      obs.observe(document.body, { childList: true, subtree: true });
    }, 0);

    /* Close on Escape */
    function keyClose(e) {
      if (e.key === 'Escape') { popup.remove(); document.removeEventListener('keydown', keyClose); }
    }
    document.addEventListener('keydown', keyClose);
  }

  /* ══════════════════════════════════════════════════
     INJECT CARDS + BIND INTERACTIONS
  ══════════════════════════════════════════════════ */

  var grid    = document.querySelector('.products-grid');
  var countEl = document.querySelector('.products-count span');
  if (!grid) return;

  grid.innerHTML = products.map(renderCard).join('\n');
  if (countEl) countEl.textContent = products.length;

  /* Build a pid → product lookup for quick access */
  var prodMap = {};
  products.forEach(function (p) { prodMap[p.id] = p; });

  grid.querySelectorAll('.product-card').forEach(function (card) {
    card.style.cursor = 'pointer';

    /* Card body click → product detail page (ignore clicks on buttons/links) */
    card.addEventListener('click', function (e) {
      if (e.target.closest('a, button, .quick-add')) return;
      var id = card.dataset.productId;
      if (id) window.location.href = 'product.html?id=' + encodeURIComponent(id);
    });

    /* Add to Cart button */
    var cartBtn = card.querySelector('.add-to-cart-btn');
    if (!cartBtn) return;
    cartBtn.dataset.cartBound = '1'; /* prevent cart.js re-bind */

    cartBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var pid  = card.dataset.productId;
      var prod = prodMap[pid];
      if (!prod) { window.location.href = 'product.html?id=' + encodeURIComponent(pid); return; }

      var variants = prod.variants || [];

      /* Single variant → add directly */
      if (variants.length === 1) {
        var v   = variants[0];
        var img = v.image || (prod.images && prod.images.cover) || '';
        Cart.add(
          pid, card.dataset.productName,
          v.price, v.sku, img,
          card.dataset.productCat || '',
          prod.option1Name || '', v.option1 || '',
          prod.option2Name || '', v.option2 || ''
        );
        return;
      }

      /* Multi-variant → toggle quick-add popup */
      if (card.querySelector('.quick-add')) {
        closeAllQuickAdds(); /* second click closes it */
      } else {
        openQuickAdd(card, prod);
      }
    });
  });

})();
