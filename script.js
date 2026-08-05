/* ═══════════════════════════════════════════════════
   EURO POLO · script.js
═══════════════════════════════════════════════════ */

/* ── NAV: Scroll Effect ── */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
});

/* ── NAV: Mobile Menu ── */
const burger = document.getElementById('burger');
const mobileMenu = document.getElementById('mobileMenu');

burger.addEventListener('click', () => {
  mobileMenu.classList.toggle('open');
  const spans = burger.querySelectorAll('span');
  const isOpen = mobileMenu.classList.contains('open');
  spans[0].style.transform = isOpen ? 'translateY(6.5px) rotate(45deg)' : '';
  spans[1].style.opacity   = isOpen ? '0' : '1';
  spans[2].style.transform = isOpen ? 'translateY(-6.5px) rotate(-45deg)' : '';
});

document.querySelectorAll('.mobile-link').forEach(link => {
  link.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    const spans = burger.querySelectorAll('span');
    spans[0].style.transform = '';
    spans[1].style.opacity   = '1';
    spans[2].style.transform = '';
  });
});

/* ── REVEAL ON SCROLL ── */
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
);

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* ── CONTACT FORM ──
   Posts to /api/contact, which writes to Postgres. It previously wrote to
   this visitor's own localStorage and then said "Your enquiry has been
   received" — so every lead was lost while the customer believed they had
   reached us. Nothing here may claim success that the server did not
   confirm. */
const form = document.getElementById('contactForm');
if (form) {
  /* Inline error line, created once and reused. */
  function formError(message) {
    let el = form.querySelector('.form-error');
    if (!el) {
      el = document.createElement('p');
      el.className = 'form-error';
      el.setAttribute('role', 'alert');
      el.style.cssText = 'font-size:0.8rem;color:#c0392b;margin-top:0.75rem;line-height:1.6';
      form.appendChild(el);
    }
    el.textContent = message;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nameEl    = form.querySelector('#name');
    const emailEl   = form.querySelector('#email');
    const messageEl = form.querySelector('#message');
    const name      = nameEl.value.trim();
    const email     = emailEl.value.trim();
    const message   = messageEl.value.trim();
    const interest  = (form.querySelector('#interest') || {}).value || '';

    if (!name)    { formError('Please enter your name.');    nameEl.focus();    return; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      formError('Please enter a valid email address.'); emailEl.focus(); return;
    }
    if (!message) { formError('Please enter a message.'); messageEl.focus(); return; }

    const btn = form.querySelector('[type="submit"]');
    const originalLabel = btn.textContent;
    formError('');
    btn.textContent = 'Sending...';
    btn.disabled = true;

    let res, data = {};
    try {
      res = await fetch('/api/contact', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        // `company` is the honeypot (see index.html) — always empty for a
        // real submission, so it is sent as-is rather than validated here.
        body:    JSON.stringify({
          name, email, interest, message,
          company: (form.querySelector('#company') || {}).value || '',
        }),
      });
      try { data = await res.json(); } catch (_) {}
    } catch (_) {
      // Network failure. Re-enable the form: the customer's words are still
      // in it, and a retry is the only thing that can still capture them.
      btn.textContent = originalLabel;
      btn.disabled = false;
      formError('Could not reach the server. Please check your connection and try again, or WhatsApp us.');
      return;
    }

    if (!res.ok) {
      btn.textContent = originalLabel;
      btn.disabled = false;
      formError(data.error || 'Could not send your message. Please try again, or WhatsApp us.');
      return;
    }

    // Only now — the server has the enquiry.
    form.innerHTML = `
      <div class="form-success" style="display:block">
        <p style="font-family:var(--font-serif);font-size:1.4rem;color:var(--gold);margin-bottom:0.75rem">
          Thank You.
        </p>
        <p style="font-size:0.875rem;color:var(--mid);line-height:1.8">
          Your enquiry has been received.<br/>
          A Euro Polo representative will be in touch within 24 hours.
        </p>
      </div>
    `;
  });
}

/* ── SMOOTH ANCHOR SCROLL with offset ── */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const navH = document.getElementById('nav').offsetHeight;
    const targetTop = target.getBoundingClientRect().top + window.scrollY - navH - 16;
    window.scrollTo({ top: targetTop, behavior: 'smooth' });
  });
});

/* ── NEWSLETTER FORM ──
   Same rule as the contact form: "Subscribed ✓" is only shown once the
   server has actually stored the address. */
const nlForm = document.getElementById('newsletterForm');
if (nlForm) {
  nlForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = nlForm.querySelector('input[type="email"]');
    const btn   = nlForm.querySelector('button');
    const email = input.value.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { input.focus(); return; }

    const originalLabel = btn.textContent;
    btn.textContent = 'Subscribing...';
    btn.disabled = true;

    let ok = false;
    try {
      const res = await fetch('/api/contact', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ kind: 'newsletter', email }),
      });
      ok = res.ok;
    } catch (_) { ok = false; }

    if (!ok) {
      btn.textContent = originalLabel;
      btn.disabled = false;
      input.setAttribute('aria-invalid', 'true');
      input.placeholder = 'Could not subscribe — please try again';
      input.value = '';
      return;
    }

    btn.textContent = 'Subscribed ✓';
    btn.style.background = '#163320';
    btn.disabled = true;
    input.value = '';
  });
}

/* ── MARQUEE: Pause on hover ── */
const track = document.querySelector('.marquee-track');
if (track) {
  track.addEventListener('mouseenter', () => track.style.animationPlayState = 'paused');
  track.addEventListener('mouseleave', () => track.style.animationPlayState = 'running');
}

/* ── STAGGER children within revealed parents ── */
const staggerObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const children = entry.target.querySelectorAll('.reveal');
        children.forEach((child, i) => {
          setTimeout(() => child.classList.add('visible'), i * 100);
        });
        staggerObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.05 }
);

document.querySelectorAll('.pillars__grid, .collections__grid, .products-row, .style-codes__grid, .products-grid, .social-platforms')
  .forEach(el => staggerObserver.observe(el));
