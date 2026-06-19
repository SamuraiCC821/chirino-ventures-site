(() => {
  // Signal JS is running — enables .js [data-reveal] CSS animations
  document.documentElement.classList.add('js');

  // ── NAV: sticky + splash-hide ────────────────────────────
  const nav    = document.querySelector('[data-nav]');
  const toggle = document.querySelector('[data-toggle]');
  const links  = document.getElementById('nav-links');

  if (nav) {
    const splash = document.querySelector('.splash');
    const onScroll = () => {
      if (splash) {
        const past = scrollY > splash.offsetHeight * 0.98;
        nav.classList.toggle('visible', past);
        nav.classList.toggle('stuck',   past);
      } else {
        nav.classList.toggle('stuck', scrollY > 20);
      }
    };
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      links.classList.toggle('open', !open);
    });
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      toggle.setAttribute('aria-expanded', 'false');
      links.classList.remove('open');
    }));
    addEventListener('resize', () => {
      if (innerWidth > 820) {
        toggle.setAttribute('aria-expanded', 'false');
        links.classList.remove('open');
      }
    });
  }

  // ── TYPEWRITER ENGINE ────────────────────────────────────
  // Writes HTML character by character, skipping over tags instantly.
  // Returns a Promise that resolves when done.
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  async function typewrite(el, speed) {
    const html = el.dataset.src;
    if (!html) return;
    el.innerHTML = '';
    el.style.visibility = 'visible';

    if (reduced) { el.innerHTML = html; return; }

    let out = '';
    let inTag = false;
    let tagBuf = '';

    for (let i = 0; i < html.length; i++) {
      const ch = html[i];
      if (ch === '<') {
        inTag = true;
        tagBuf = '<';
      } else if (inTag) {
        tagBuf += ch;
        if (ch === '>') {
          inTag = false;
          out += tagBuf;
          el.innerHTML = out;
          tagBuf = '';
        }
      } else {
        out += ch;
        el.innerHTML = out;
        // punctuation gets a slightly longer pause
        const pause = /[.,;:!?—]/.test(ch) ? speed * 4 : speed;
        await sleep(pause);
      }
    }
  }

  // ── SEQUENTIAL MANUSCRIPT WRITE-IN ───────────────────────
  // Elements with [data-write] fire one after another, top to bottom.
  // data-speed overrides the per-character ms (default 28).
  async function runManuscript() {
    const els = [...document.querySelectorAll('[data-write]')];
    if (!els.length) return;

    for (const el of els) {
      // Store original HTML, clear for typewriter
      el.dataset.src = el.innerHTML;
      el.innerHTML   = '';
      el.style.visibility = 'hidden';
    }

    // Small initial pause before first word appears
    await sleep(300);

    for (const el of els) {
      const speed = parseInt(el.dataset.speed ?? '28', 10);
      await typewrite(el, speed);
      // Breath between elements
      await sleep(parseInt(el.dataset.pause ?? '120', 10));
    }
  }

  // Only run on pages that have manuscript elements
  if (document.querySelector('[data-write]')) {
    runManuscript();
  }

  // ── SCROLL REVEAL ────────────────────────────────────────
  const reveals = document.querySelectorAll('[data-reveal]');
  if (reveals.length) {
    if (reduced) {
      reveals.forEach(el => el.classList.add('revealed'));
    } else {
      const io = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (e.isIntersecting) { e.target.classList.add('revealed'); io.unobserve(e.target); }
        });
      }, { threshold: 0.2 });
      reveals.forEach(el => io.observe(el));
    }
  }

  // ── YEAR ─────────────────────────────────────────────────
  document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());

  // ── SPLASH: force mobile layout on small/resized windows ─────
  // The desktop calligraphy layout only works at ~1200px+ wide and ~700px+ tall.
  // Below those thresholds (on load OR after resize), snap to the clean mobile layout.
  if (document.querySelector('.splash-svg')) {
    const body = document.body;
    function checkSplashLayout() {
      const small = window.innerWidth < 1200 || window.innerHeight < 700;
      body.classList.toggle('splash-resized', small);
    }
    checkSplashLayout(); // check immediately on load
    window.addEventListener('resize', checkSplashLayout, { passive: true });
  }
})();
