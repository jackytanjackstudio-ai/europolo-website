/* ═══════════════════════════════════════════════════
   EURO POLO · cart.js
   Shopping cart — drawer UI, localStorage, badge
═══════════════════════════════════════════════════ */
(function () {
  const CART_KEY = 'ep_cart';

  function getCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch { return []; }
  }
  function saveCart(items) { localStorage.setItem(CART_KEY, JSON.stringify(items)); }
  function getProducts() {
    try { return JSON.parse(localStorage.getItem('ep_products') || '[]'); } catch { return []; }
  }

  // ── Toast notification ────────────────────────────
  function showToast(msg, type) {
    let tc = document.getElementById('ep-cart-toasts');
    if (!tc) {
      tc = document.createElement('div');
      tc.id = 'ep-cart-toasts';
      tc.style.cssText = 'position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);z-index:10000;display:flex;flex-direction:column;gap:.5rem;align-items:center;pointer-events:none';
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

  // ── Badge count ───────────────────────────────────
  function updateBadge() {
    var c = Cart.count();
    document.querySelectorAll('.cart-badge').forEach(function (el) {
      el.textContent = c;
      el.style.display = c > 0 ? 'flex' : 'none';
    });
  }

  // ── Public Cart API ───────────────────────────────
  window.Cart = {
    get: getCart,
    count: function () { return getCart().reduce(function (s, i) { return s + i.qty; }, 0); },
    total: function () { return getCart().reduce(function (s, i) { return s + parseFloat(i.price) * i.qty; }, 0); },
    clear: function () { localStorage.removeItem(CART_KEY); updateBadge(); },

    add: function (id, name, price, sku, img, cat) {
      var products = getProducts();
      var prod = products.find(function (p) { return p.id === id; });
      var stockVal = prod && prod.stock !== undefined ? parseInt(prod.stock) : 99;
      var stock = isNaN(stockVal) ? 99 : stockVal;
      var status = prod ? prod.status : 'Active';

      if (status === 'Out of Stock' || stock === 0) {
        showToast('Sorry, this item is out of stock.', 'error');
        return false;
      }

      var items = getCart();
      var existing = items.find(function (i) { return i.id === id; });

      if (existing) {
        if (existing.qty >= stock) {
          showToast('Maximum available quantity reached.', 'warn');
          return false;
        }
        existing.qty += 1;
      } else {
        items.push({ id: id, name: name, price: String(price), sku: sku || '', img: img || '', cat: cat || '', qty: 1, stock: stock });
      }

      saveCart(items);
      updateBadge();
      renderCartBody();
      openCart();
      showToast('Added to cart!', 'success');
      return true;
    },

    remove: function (id) {
      saveCart(getCart().filter(function (i) { return i.id !== id; }));
      updateBadge();
      renderCartBody();
    },

    updateQty: function (id, qty) {
      var items = getCart();
      var item = items.find(function (i) { return i.id === id; });
      if (!item) return;
      if (qty <= 0) { this.remove(id); return; }
      item.qty = Math.min(qty, item.stock || 99);
      saveCart(items);
      updateBadge();
      renderCartBody();
    }
  };

  // ── Drawer HTML ───────────────────────────────────
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
    var body = document.getElementById('epCartBody');
    var foot = document.getElementById('epCartFoot');
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
      var p = parseFloat(item.price);
      return '<div class="cart-item">' +
        '<div class="cart-item__img">' +
          (item.img ? '<img src="' + item.img + '" alt="' + item.name + '" loading="lazy"/>' : '<div class="cart-item__ph">◇</div>') +
        '</div>' +
        '<div class="cart-item__info">' +
          '<div class="cart-item__name">' + item.name + '</div>' +
          (item.sku ? '<div class="cart-item__sku">' + item.sku + '</div>' : '') +
          '<div class="cart-item__price">RM ' + p.toLocaleString('en-MY', { minimumFractionDigits: 0 }) + '</div>' +
          '<div class="cart-item__row">' +
            '<div class="cart-qty">' +
              '<button class="qty-btn" onclick="Cart.updateQty(\'' + item.id + '\',' + (item.qty - 1) + ')">&#x2212;</button>' +
              '<span class="qty-val">' + item.qty + '</span>' +
              '<button class="qty-btn" onclick="Cart.updateQty(\'' + item.id + '\',' + (item.qty + 1) + ')">+</button>' +
            '</div>' +
            '<button class="cart-del-btn" onclick="Cart.remove(\'' + item.id + '\')">Remove</button>' +
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

  // ── Inject cart icon into .nav__links ─────────────
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

  // ── Bind Add-to-Cart buttons ──────────────────────
  function bindButtons() {
    document.querySelectorAll('.add-to-cart-btn').forEach(function (btn) {
      if (btn.dataset.cartBound) return;
      btn.dataset.cartBound = '1';
      btn.addEventListener('click', function () {
        var card = this.closest('[data-product-id]');
        if (!card) return;
        Cart.add(
          card.dataset.productId,
          card.dataset.productName,
          card.dataset.productPrice,
          card.dataset.productSku || '',
          card.dataset.productImg || '',
          card.dataset.productCat || ''
        );
      });
    });
  }

  // ── Init ──────────────────────────────────────────
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
