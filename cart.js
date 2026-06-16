/* ═══════════════════════════════════════════════════
   EURO POLO · cart.js
   Shopping cart — drawer UI, localStorage, badge
═══════════════════════════════════════════════════ */
(function () {
  const CART_KEY = 'ep_cart';

  function getCart() {
    try {
      var items = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
      /* Normalise legacy items saved before variant support */
      items.forEach(function (item) {
        if (!item.lineId)      item.lineId      = item.id + '::' + (item.sku || item.colour || '');
        if (item.option1      === undefined) item.option1      = item.colour || '';
        if (item.option1Name  === undefined) item.option1Name  = item.colour ? 'Colour' : '';
        if (item.option2      === undefined) item.option2      = '';
        if (item.option2Name  === undefined) item.option2Name  = '';
      });
      return items;
    } catch { return []; }
  }
  function saveCart(items) { localStorage.setItem(CART_KEY, JSON.stringify(items)); }

  /* ── Get live variant stock from EP_PRODUCTS ── */
  function getVariantStock(productId, sku) {
    if (!window.EP_PRODUCTS) return 99;
    for (var i = 0; i < window.EP_PRODUCTS.length; i++) {
      var p = window.EP_PRODUCTS[i];
      if (p.id !== productId) continue;
      if (!p.variants) return 99;
      for (var j = 0; j < p.variants.length; j++) {
        if (p.variants[j].sku === sku) return p.variants[j].stock;
      }
    }
    return 99;
  }

  /* ── Toast notification ── */
  function showToast(msg, type) {
    let tc = document.getElementById('ep-cart-toasts');
    if (!tc) {
      tc = document.createElement('div');
      tc.id = 'ep-cart-toasts';
      tc.style.cssText = 'position:fixed;bottom:6.5rem;left:50%;transform:translateX(-50%);z-index:10000;display:flex;flex-direction:column;gap:.5rem;align-items:center;pointer-events:none';
      document.body.appendChild(tc);
    }
    const colors = { success: '#163320', error: '#a81c1c', warn: '#C09A42', info: '#1a1a18' };
    const t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = 'background:' + (colors[type] || colors.info) + ';color:#FAFAF7;padding:.55rem 1.1rem;border-radius:5px;font-size:.8rem;font-family:Inter,sans-serif;font-weight:500;white-space:nowrap;box-shadow:0 4px 20px rgba(0,0,0,.25);';
    tc.appendChild(t);
    setTimeout(function () {
      t.style.transition = 'opacity .3s';
      t.style.opacity = '0';
      setTimeout(function () { t.remove(); }, 300);
    }, 2400);
  }

  /* ── Badge count ── */
  function updateBadge() {
    var c = Cart.count();
    document.querySelectorAll('.cart-badge').forEach(function (el) {
      el.textContent = c;
      el.style.display = c > 0 ? 'flex' : 'none';
    });
  }

  /* ── Public Cart API ── */
  window.Cart = {
    get:   getCart,
    count: function () { return getCart().reduce(function (s, i) { return s + i.qty; }, 0); },
    total: function () { return getCart().reduce(function (s, i) { return s + parseFloat(i.price) * i.qty; }, 0); },
    clear: function () { localStorage.removeItem(CART_KEY); updateBadge(); },

    /* Signature: id, name, price, sku, img, cat, option1Name, option1, option2Name, option2 [, addQty=1] */
    add: function (id, name, price, sku, img, cat, option1Name, option1, option2Name, option2, addQty) {
      addQty = Math.max(1, parseInt(addQty, 10) || 1);
      var lineId = id + '::' + (sku || '');
      var stock  = getVariantStock(id, sku);

      if (stock === 0) {
        showToast('Sorry, this variant is out of stock.', 'error');
        return false;
      }

      var items    = getCart();
      var existing = items.find(function (i) { return i.lineId === lineId; });

      if (existing) {
        if (existing.qty + addQty > stock) {
          showToast('Maximum available quantity reached.', 'warn');
          return false;
        }
        existing.qty += addQty;
      } else {
        items.push({
          id:          id,
          lineId:      lineId,
          name:        name,
          price:       String(price),
          sku:         sku         || '',
          option1Name: option1Name || '',
          option1:     option1     || '',
          option2Name: option2Name || '',
          option2:     option2     || '',
          img:         img         || '',
          cat:         cat         || '',
          qty:         addQty,
          stock:       stock,
        });
      }

      saveCart(items);
      updateBadge();
      renderCartBody();
      openCart();
      showToast('Added to cart!', 'success');
      if (typeof fbq === 'function') {
        fbq('track', 'AddToCart', {
          content_name: name,
          content_ids:  [id],
          content_type: 'product',
          value:        Math.round(parseFloat(price) * addQty * 100) / 100,
          currency:     'MYR',
          quantity:     addQty
        });
      }
      return true;
    },

    remove: function (lineId) {
      saveCart(getCart().filter(function (i) { return i.lineId !== lineId; }));
      updateBadge();
      renderCartBody();
    },

    updateQty: function (lineId, qty) {
      if (qty <= 0) { this.remove(lineId); return; }
      var items = getCart();
      var item  = items.find(function (i) { return i.lineId === lineId; });
      if (!item) return;
      item.qty = Math.min(qty, item.stock || 99);
      saveCart(items);
      updateBadge();
      renderCartBody();
    }
  };

  /* ── Drawer HTML ── */
  function injectDrawer() {
    if (document.getElementById('epCartDrawer')) return;
    document.body.insertAdjacentHTML('beforeend',
      '<div class="cart-overlay" id="epCartOverlay" onclick="closeCart()"></div>' +
      '<aside class="cart-drawer" id="epCartDrawer" role="dialog" aria-label="Shopping Cart">' +
        '<div class="cart-drawer__header">' +
          '<span class="cart-drawer__title">Your Cart</span>' +
          '<button class="cart-drawer__close" onclick="closeCart()" aria-label="Close">&#x2715;</button>' +
        '</div>' +
        '<div class="cart-drawer__body" id="epCartBody"></div>' +
        '<div class="cart-drawer__foot" id="epCartFoot"></div>' +
      '</aside>');
  }

  function renderCartBody() {
    var items = getCart();
    var body  = document.getElementById('epCartBody');
    var foot  = document.getElementById('epCartFoot');
    if (!body) return;

    if (!items.length) {
      body.innerHTML =
        '<div class="cart-empty">' +
          '<div style="font-size:2rem;margin-bottom:.75rem;opacity:.3">◇</div>' +
          '<p style="color:#9A958E;font-size:.85rem">Your cart is empty.</p>' +
          '<button onclick="closeCart()" class="cart-ghost-btn" style="margin-top:1.25rem">Continue Shopping</button>' +
        '</div>';
      if (foot) foot.innerHTML = '';
      return;
    }

    body.innerHTML = items.map(function (item) {
      var p   = parseFloat(item.price);
      var lid = item.lineId.replace(/'/g, "\\'");
      /* Build variant label */
      var variantLines = '';
      if (item.option1) {
        variantLines += '<div class="cart-item__sku">' + (item.option1Name || 'Colour') + ': ' + item.option1 + '</div>';
      }
      if (item.option2) {
        variantLines += '<div class="cart-item__sku">' + (item.option2Name || 'Size') + ': ' + item.option2 + '</div>';
      }
      return '<div class="cart-item">' +
        '<div class="cart-item__img">' +
          (item.img ? '<img src="' + item.img + '" alt="' + item.name + '" loading="lazy"/>' : '<div class="cart-item__ph">◇</div>') +
        '</div>' +
        '<div class="cart-item__info">' +
          '<div class="cart-item__name">' + item.name + '</div>' +
          variantLines +
          '<div class="cart-item__price">RM ' + p.toLocaleString('en-MY', { minimumFractionDigits: 0 }) + '</div>' +
          '<div class="cart-item__row">' +
            '<div class="cart-qty">' +
              '<button class="qty-btn" onclick="Cart.updateQty(\'' + lid + '\',' + (item.qty - 1) + ')">&#x2212;</button>' +
              '<span class="qty-val">' + item.qty + '</span>' +
              '<button class="qty-btn" onclick="Cart.updateQty(\'' + lid + '\',' + (item.qty + 1) + ')">+</button>' +
            '</div>' +
            '<button class="cart-del-btn" onclick="Cart.remove(\'' + lid + '\')">Remove</button>' +
          '</div>' +
          '<div class="cart-item__line">RM ' + (p * item.qty).toLocaleString('en-MY', { minimumFractionDigits: 0 }) + '</div>' +
        '</div>' +
      '</div>';
    }).join('');

    var total = Cart.total();
    var count = Cart.count();
    if (foot) {
      foot.innerHTML =
        '<div class="cart-subtotal">' +
          '<span>Subtotal <em>(' + count + ' item' + (count !== 1 ? 's' : '') + ')</em></span>' +
          '<strong>RM ' + total.toLocaleString('en-MY', { minimumFractionDigits: 2 }) + '</strong>' +
        '</div>' +
        '<p class="cart-ship-note">Shipping &amp; taxes calculated at checkout</p>' +
        '<a href="checkout.html" class="cart-checkout-link">Proceed to Checkout</a>' +
        '<button class="cart-ghost-btn" onclick="closeCart()">Continue Shopping</button>';
    }
  }

  window.openCart = function () {
    document.getElementById('epCartDrawer') && document.getElementById('epCartDrawer').classList.add('open');
    document.getElementById('epCartOverlay') && document.getElementById('epCartOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
  };
  window.closeCart = function () {
    document.getElementById('epCartDrawer') && document.getElementById('epCartDrawer').classList.remove('open');
    document.getElementById('epCartOverlay') && document.getElementById('epCartOverlay').classList.remove('open');
    document.body.style.overflow = '';
  };

  /* ── Inject cart icon into .nav__links ── */
  function injectNavIcon() {
    var links = document.querySelector('.nav__links');
    if (!links || document.querySelector('.cart-nav-btn')) return;
    var li = document.createElement('li');
    li.innerHTML =
      '<button class="cart-nav-btn" onclick="openCart()" aria-label="Open cart">' +
        '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>' +
          '<line x1="3" y1="6" x2="21" y2="6"/>' +
          '<path d="M16 10a4 4 0 01-8 0"/>' +
        '</svg>' +
        '<span class="cart-badge" style="display:none">0</span>' +
      '</button>';
    links.appendChild(li);
  }

  /* ── Bind Add-to-Cart buttons not already bound ── */
  function bindButtons() {
    document.querySelectorAll('.add-to-cart-btn').forEach(function (btn) {
      if (btn.dataset.cartBound) return;
      btn.dataset.cartBound = '1';
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var card = this.closest('[data-product-id]');
        if (!card) return;
        var pid  = card.dataset.productId;
        var prod = null;
        if (window.EP_PRODUCTS) {
          for (var k = 0; k < window.EP_PRODUCTS.length; k++) {
            if (window.EP_PRODUCTS[k].id === pid) { prod = window.EP_PRODUCTS[k]; break; }
          }
        }
        if (!prod || !prod.variants || prod.variants.length !== 1) {
          window.location.href = 'product.html?id=' + encodeURIComponent(pid);
          return;
        }
        var v   = prod.variants[0];
        var img = v.image || (prod.images && prod.images.cover) || '';
        Cart.add(
          pid, card.dataset.productName,
          v.price, v.sku, img, card.dataset.productCat || '',
          prod.option1Name || '', v.option1 || '',
          prod.option2Name || '', v.option2 || ''
        );
      });
    });
  }

  /* ── Init ── */
  function init() {
    injectDrawer();
    injectNavIcon();
    updateBadge();
    renderCartBody();
    bindButtons();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
