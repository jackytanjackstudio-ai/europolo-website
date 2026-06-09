/* ═══════════════════════════════════════════════════
   EURO POLO · products.js
   Filter tab logic + URL ?sub= routing for collection pages
═══════════════════════════════════════════════════ */

/* ── Colour Swatches ── */
document.querySelectorAll('.product-card__colours').forEach(function (group) {
  var swatches = group.querySelectorAll('.colour-swatch');
  var label    = group.querySelector('.product-card__colour-name');
  swatches.forEach(function (swatch) {
    swatch.addEventListener('click', function () {
      swatches.forEach(function (s) { s.classList.remove('colour-swatch--active'); });
      swatch.classList.add('colour-swatch--active');
      if (label) label.textContent = swatch.dataset.name;
    });
  });
});

/* ── Subcategory display labels for title / breadcrumb ── */
var SUB_LABEL = {
  /* bags */
  'crossbody':      'Crossbody Bags',
  'backpacks':      'Backpacks',
  'laptop-bags':    'Laptop Bags',
  'waist-chest':    'Waist & Chest Bags',
  /* wallets */
  'bifold-trifold': 'Bifold & Trifold Wallets',
  'card-holders':   'Card Holders',
  'long-wallets':   'Long Wallets',
  'belts':          'Belts',
  /* luggage */
  'cabin':    'Cabin 20"',
  'checkin':  'Check-in 24"',
  'large':    'Large 28"',
  'set':      'Travel Sets',
};

/* ── Collection-level titles for title tag ── */
var PAGE_TITLE = {
  'bags':    "Men's Bags",
  'wallets': "Wallets & Belts",
  'luggage': 'Luggage',
};

document.addEventListener('DOMContentLoaded', function () {
  var tabs    = document.querySelectorAll('.filter-tab');
  var cards   = document.querySelectorAll('.product-card[data-category]');
  var countEl = document.querySelector('.products-count span');

  if (!tabs.length) return;

  /* ── Derive collection from path ── */
  var path  = location.pathname.toLowerCase();
  var pageKey = path.indexOf('bags') !== -1    ? 'bags'
              : path.indexOf('wallets') !== -1  ? 'wallets'
              : path.indexOf('luggage') !== -1  ? 'luggage'
              : '';

  /* ── Apply a filter (show/hide cards, update count, mark active tab) ── */
  function applyFilter(filterValue) {
    tabs.forEach(function (t) { t.classList.remove('filter-tab--active'); });

    var activeTab = null;
    tabs.forEach(function (t) {
      if (t.dataset.filter === filterValue) { t.classList.add('filter-tab--active'); activeTab = t; }
    });
    /* Fall back to "all" if filterValue has no matching tab */
    if (!activeTab) {
      tabs.forEach(function (t) { if (t.dataset.filter === 'all') t.classList.add('filter-tab--active'); });
      filterValue = 'all';
    }

    var visible = 0;
    cards.forEach(function (card) {
      var match = filterValue === 'all' || card.dataset.category === filterValue;
      card.classList.toggle('product-card--hidden', !match);
      if (match) visible++;
    });

    if (countEl) countEl.textContent = visible;
    return filterValue;
  }

  /* ── Update <title> and breadcrumb when a subcategory is active ── */
  function updateMeta(filterValue) {
    if (!pageKey || filterValue === 'all') return;

    var subLabel   = SUB_LABEL[filterValue];
    var parentTitle = PAGE_TITLE[pageKey] || '';
    if (!subLabel) return;

    /* Page title */
    document.title = subLabel + ' — ' + parentTitle + ' | Euro Polo Malaysia';

    /* Breadcrumb: find the last <span.breadcrumb__current> and insert an extra crumb */
    var bc      = document.querySelector('.breadcrumb__inner');
    var current = bc && bc.querySelector('.breadcrumb__current');
    if (!current) return;

    /* Only inject once */
    if (bc.querySelector('.breadcrumb__sub')) return;

    var parentHref = (pageKey === 'bags')    ? 'bags.html'
                   : (pageKey === 'wallets') ? 'wallets.html'
                   : 'luggage.html';

    /* Replace the static current text with a link, then add sub as active */
    current.innerHTML = '<a href="' + parentHref + '">' + current.textContent + '</a>';
    current.classList.remove('breadcrumb__current');

    var sep  = document.createElement('span');
    sep.className   = 'breadcrumb__sep';
    sep.textContent = '·';
    bc.appendChild(sep);

    var sub  = document.createElement('span');
    sub.className   = 'breadcrumb__current breadcrumb__sub';
    sub.setAttribute('aria-current', 'page');
    sub.textContent = subLabel;
    bc.appendChild(sub);
  }

  /* ── Read ?sub= from URL and pre-activate ── */
  var params    = new URLSearchParams(location.search);
  var subParam  = params.get('sub') || 'all';
  var applied   = applyFilter(subParam);
  updateMeta(applied);

  /* ── Click handler ── */
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var filter = applyFilter(tab.dataset.filter);
      updateMeta(filter);

      /* Keep URL in sync so back/forward works correctly */
      var newSearch = filter === 'all' ? '' : '?sub=' + encodeURIComponent(filter);
      if (history.replaceState) {
        history.replaceState(null, '', location.pathname + newSearch + location.hash);
      }
    });
  });
});
