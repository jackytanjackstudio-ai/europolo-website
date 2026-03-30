/* ═══════════════════════════════════════════════════
   EURO POLO · products.js
   Filter tab logic for collection pages
═══════════════════════════════════════════════════ */

/* ── Colour Swatches ── */
document.querySelectorAll('.product-card__colours').forEach(group => {
  const swatches = group.querySelectorAll('.colour-swatch');
  const label = group.querySelector('.product-card__colour-name');
  swatches.forEach(swatch => {
    swatch.addEventListener('click', () => {
      swatches.forEach(s => s.classList.remove('colour-swatch--active'));
      swatch.classList.add('colour-swatch--active');
      if (label) label.textContent = swatch.dataset.name;
    });
  });
});

document.addEventListener('DOMContentLoaded', () => {
  const tabs = document.querySelectorAll('.filter-tab');
  const cards = document.querySelectorAll('.product-card[data-category]');
  const countEl = document.querySelector('.products-count span');

  if (!tabs.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const filter = tab.dataset.filter;

      // Update active tab
      tabs.forEach(t => t.classList.remove('filter-tab--active'));
      tab.classList.add('filter-tab--active');

      // Show / hide cards
      let visible = 0;
      cards.forEach(card => {
        const match = filter === 'all' || card.dataset.category === filter;
        card.classList.toggle('product-card--hidden', !match);
        if (match) visible++;
      });

      // Update count
      if (countEl) countEl.textContent = visible;
    });
  });
});
