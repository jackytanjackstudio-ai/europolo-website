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

/* ── CONTACT FORM ── */
const form = document.getElementById('contactForm');
if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = form.querySelector('[type="submit"]');
    btn.textContent = 'Sending...';
    btn.disabled = true;

    setTimeout(() => {
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
    }, 1200);
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

/* ── NEWSLETTER FORM ── */
const nlForm = document.getElementById('newsletterForm');
if (nlForm) {
  nlForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = nlForm.querySelector('button');
    btn.textContent = 'Subscribed ✓';
    btn.style.background = '#163320';
    btn.disabled = true;
    nlForm.querySelector('input').value = '';
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
