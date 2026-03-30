/* ═══════════════════════════════════════════════════
   EURO POLO · content-injector.js
   Reads admin edits from localStorage and applies to page.
   Loaded on all frontend pages.
═══════════════════════════════════════════════════ */
(function () {
  function get(key) {
    try { return localStorage.getItem('ep_page_' + key); } catch { return null; }
  }

  // Plain text elements
  document.querySelectorAll('[data-ep]').forEach(el => {
    const val = get(el.getAttribute('data-ep'));
    if (val !== null && val.trim() !== '') el.textContent = val;
  });

  // HTML elements (formatted text with <em>, <br> etc.)
  document.querySelectorAll('[data-ep-html]').forEach(el => {
    const val = get(el.getAttribute('data-ep-html'));
    if (val !== null && val.trim() !== '') el.innerHTML = val;
  });

  // Href / link attributes
  document.querySelectorAll('[data-ep-href]').forEach(el => {
    const val = get(el.getAttribute('data-ep-href'));
    if (val !== null && val.trim() !== '') el.href = val;
  });

  // Background image
  document.querySelectorAll('[data-ep-bg]').forEach(el => {
    const val = get(el.getAttribute('data-ep-bg'));
    if (val !== null && val.trim() !== '') el.style.backgroundImage = 'url("' + val.replace(/"/g, '%22') + '")';
  });

  // Announcement bar
  const annActive = get('shared_ann_active');
  const annText   = get('shared_ann_text');
  const annBar    = document.getElementById('ep-announcement');
  if (annBar) {
    if (annActive !== 'true') {
      annBar.style.display = 'none';
    } else {
      annBar.style.display = '';
      if (annText) {
        const t = annBar.querySelector('[data-ep="shared_ann_text"]');
        if (t) t.textContent = annText;
      }
    }
  }
})();
