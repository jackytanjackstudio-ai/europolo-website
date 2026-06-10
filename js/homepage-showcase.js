/* ═══════════════════════════════════════════════════
   EURO POLO · homepage-showcase.js
   "Editor's Selection" — 3 independently cycling cards.
   Requires product-data-embed.js loaded before this.
═══════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (!window.EP_PRODUCTS) return;
  var grid = document.getElementById('trendingGrid');
  if (!grid) return;

  var prods = window.EP_PRODUCTS;

  function truncate(s, n) {
    s = String(s == null ? '' : s);
    return s.length > n ? s.slice(0, n - 1) + '…' : s;
  }
  function safeUrl(s) {
    return String(s == null ? '' : s).replace(/'/g, '%27');
  }

  /* ── Category definitions ── */
  var CATEGORIES = [
    {
      label: 'Best Selling Wallet',
      pick: function (p) {
        return p.category === 'wallets' &&
               (p.productType || '').toLowerCase().indexOf('gift') === -1 &&
               p.inStock && p.images && p.images.cover;
      },
    },
    {
      label: 'Best Selling Bag',
      pick: function (p) {
        return p.category === 'bags' && p.inStock && p.images && p.images.cover;
      },
    },
    {
      label: 'Best Selling Luggage',
      pick: function (p) {
        return p.category === 'luggage' && p.inStock && p.images && p.images.cover;
      },
    },
  ];

  /* ── Build cards ── */
  var states = [];

  CATEGORIES.forEach(function (cat) {
    var catProds = prods.filter(cat.pick).slice(0, 10);
    if (!catProds.length) return;

    var card = document.createElement('div');
    card.className = 'trending__card';

    /* Image wrap: stacked fading items */
    var imgWrap = document.createElement('div');
    imgWrap.className = 'trending__img-wrap';

    catProds.forEach(function (p, i) {
      var item = document.createElement('div');
      item.className = 'trending__item' + (i === 0 ? ' trending__item--active' : '');
      item.style.backgroundImage = "url('" + safeUrl(p.images.cover) + "')";
      imgWrap.appendChild(item);
    });

    /* Bottom gradient */
    var grad = document.createElement('div');
    grad.className = 'trending__img-gradient';
    imgWrap.appendChild(grad);

    /* Dots (shown only when there are multiple products) */
    var dotsEl = null;
    if (catProds.length > 1) {
      dotsEl = document.createElement('div');
      dotsEl.className = 'trending__dots';
      catProds.forEach(function (_, i) {
        var dot = document.createElement('button');
        dot.className = 'trending__dot' + (i === 0 ? ' trending__dot--active' : '');
        dot.setAttribute('aria-label', 'Product ' + (i + 1));
        dot.dataset.idx = String(i);
        dotsEl.appendChild(dot);
      });
      imgWrap.appendChild(dotsEl);
    }

    card.appendChild(imgWrap);

    /* Text body */
    var bodyLink = document.createElement('a');
    bodyLink.className = 'trending__body-link';
    bodyLink.href = 'product.html?id=' + catProds[0].id;

    var body = document.createElement('div');
    body.className = 'trending__body';

    var lbl = document.createElement('span');
    lbl.className = 'trending__cat-lbl';
    lbl.textContent = cat.label;

    var nameEl = document.createElement('p');
    nameEl.className = 'trending__name';
    nameEl.textContent = truncate(catProds[0].name, 60);

    var priceEl = document.createElement('p');
    priceEl.className = 'trending__price';
    priceEl.textContent = catProds[0].priceDisplay || '';

    var ctaEl = document.createElement('span');
    ctaEl.className = 'trending__cta';
    ctaEl.textContent = 'View Product →';

    body.appendChild(lbl);
    body.appendChild(nameEl);
    body.appendChild(priceEl);
    body.appendChild(ctaEl);
    bodyLink.appendChild(body);
    card.appendChild(bodyLink);

    grid.appendChild(card);

    states.push({
      products: catProds,
      current:  0,
      timer:    null,
      paused:   false,
      card:     card,
      imgWrap:  imgWrap,
      dotsEl:   dotsEl,
      bodyLink: bodyLink,
      nameEl:   nameEl,
      priceEl:  priceEl,
    });
  });

  if (!states.length) return;

  /* ── Navigate to a product within a card ── */
  function goTo(state, idx) {
    var items = state.imgWrap.querySelectorAll('.trending__item');
    var dots  = state.dotsEl ? state.dotsEl.querySelectorAll('.trending__dot') : [];

    items[state.current].classList.remove('trending__item--active');
    if (dots[state.current]) dots[state.current].classList.remove('trending__dot--active');

    state.current = (idx + state.products.length) % state.products.length;
    var p = state.products[state.current];

    items[state.current].classList.add('trending__item--active');
    if (dots[state.current]) dots[state.current].classList.add('trending__dot--active');

    /* Update text + link at mid-fade */
    setTimeout(function () {
      state.nameEl.textContent  = truncate(p.name, 60);
      state.priceEl.textContent = p.priceDisplay || '';
      state.bodyLink.href       = 'product.html?id=' + p.id;
    }, 400);
  }

  function startTimer(state) {
    clearInterval(state.timer);
    if (state.products.length < 2) return;
    state.timer = setInterval(function () {
      if (!state.paused) goTo(state, state.current + 1);
    }, 5000);
  }

  /* ── Wire up controls ── */
  states.forEach(function (state) {
    startTimer(state);

    /* Image area click → product page */
    state.imgWrap.addEventListener('click', function (e) {
      if (e.target.closest('.trending__dot')) return;
      window.location.href = 'product.html?id=' + state.products[state.current].id;
    });

    /* Hover pause — desktop only; touch devices do not fire persistent mouseenter */
    state.card.addEventListener('mouseenter', function () { state.paused = true; });
    state.card.addEventListener('mouseleave', function () { state.paused = false; });

    /* Dot clicks */
    if (state.dotsEl) {
      state.dotsEl.querySelectorAll('.trending__dot').forEach(function (dot) {
        dot.addEventListener('click', function (e) {
          e.stopPropagation();
          goTo(state, parseInt(this.dataset.idx, 10));
        });
      });
    }
  });

}());
