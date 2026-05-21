/* ============================================================
   KIGUMO TVC — Main JavaScript
   ============================================================ */

// ── Slider ───────────────────────────────────────────────────
(function () {
  const slides = document.querySelectorAll('.slide');
  const dots   = document.querySelectorAll('.dot');
  if (!slides.length) return;

  let current = 0;
  let timer;

  function goTo(n) {
    slides[current].classList.remove('active');
    dots[current].classList.remove('active');
    current = (n + slides.length) % slides.length;
    slides[current].classList.add('active');
    dots[current].classList.add('active');
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  function startAuto() { timer = setInterval(next, 5000); }
  function resetAuto()  { clearInterval(timer); startAuto(); }

  document.querySelector('.slider-arrow.next')
    ?.addEventListener('click', () => { next(); resetAuto(); });
  document.querySelector('.slider-arrow.prev')
    ?.addEventListener('click', () => { prev(); resetAuto(); });

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => { goTo(i); resetAuto(); });
  });

  slides[0].classList.add('active');
  dots[0].classList.add('active');
  startAuto();
})();

// ── Mobile Nav ───────────────────────────────────────────────
(function () {
  const hamburger = document.querySelector('.hamburger');
  const navLinks  = document.querySelector('.nav-links');
  const overlay   = document.getElementById('nav-overlay');
  if (!hamburger) return;

const mobileHeader = document.querySelector('.nav-mobile-header');

  function openNav() {
    navLinks.classList.add('open');
    overlay.classList.add('open');
    hamburger.classList.add('open');
    if (mobileHeader) mobileHeader.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeNav() {
    navLinks.classList.remove('open');
    overlay.classList.remove('open');
    hamburger.classList.remove('open');
    if (mobileHeader) mobileHeader.classList.remove('open');
    document.body.style.overflow = '';
  }

  // Toggle on hamburger click
  hamburger.addEventListener('click', () => {
    navLinks.classList.contains('open') ? closeNav() : openNav();
  });

  // Close when clicking the dark overlay
  overlay.addEventListener('click', closeNav);

  // Close when clicking any nav link
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeNav);
  });

  // Close when clicking the X button
  const closeBtn = document.getElementById('nav-close-btn');
  if (closeBtn) closeBtn.addEventListener('click', closeNav);
})();

// ── Stats Counter Animation ───────────────────────────────────
(function () {
  const counters = document.querySelectorAll('.stat-number');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el     = entry.target;
      const target = parseInt(el.dataset.target);
      const suffix = el.dataset.suffix || '';
      let count    = 0;
      const step   = Math.ceil(target / 60);

      const tick = setInterval(() => {
        count += step;
        if (count >= target) { count = target; clearInterval(tick); }
        el.textContent = count.toLocaleString() + suffix;
      }, 30);

      observer.unobserve(el);
    });
  }, { threshold: 0.5 });

  counters.forEach(c => observer.observe(c));
})();

// // ── Language Toggle (EN / SW) ─────────────────────────────────
// (function () {
//   const langBtns = document.querySelectorAll('.lang-btn');
//   if (!langBtns.length) return;

//   const translations = {
//     en: {
//       'nav-home':       'Home',
//       'nav-about':      'About Us',
//       'nav-courses':    'Courses',
//       'nav-admissions': 'Admissions',
//       'nav-news':       'News',
//       'nav-contact':    'Contact',
//       'nav-portal':     'Student Portal',
//       'hero-badge':     'TVETA Accredited College',
//       'hero-tagline':   'Empowering Youth Through Technical Excellence',
//       'hero-sub':       'Join thousands of students building real careers at Kigumo TVC — Kirinyaga\'s premier TVET institution.',
//       'hero-apply':     'Apply Now',
//       'hero-explore':   'Explore Courses',
//       'ql-student':     'Student Portal',
//       'ql-lecturer':    'Lecturer Portal',
//       'ql-downloads':   'Downloads',
//       'ql-contact':     'Contact Us',
//       'why-title':      'Why Choose Kigumo TVC?',
//       'why-sub':        'We are committed to producing competent, job-ready graduates',
//       'courses-title':  'Our Departments',
//       'courses-sub':    'Explore our TVETA-accredited programmes',
//       'news-title':     'Latest News',
//       'news-sub':       'Stay updated with happenings at Kigumo TVC',
//       'cta-title':      'Ready to Start Your Journey?',
//       'cta-sub':        'Applications are open. Join Kigumo TVC and build a career that matters.',
//       'cta-apply':      'Apply Now',
//       'cta-downloads':  'Download Forms',
//     },
//     sw: {
//       'nav-home':       'Nyumbani',
//       'nav-about':      'Kuhusu Sisi',
//       'nav-courses':    'Kozi',
//       'nav-admissions': 'Udahili',
//       'nav-news':       'Habari',
//       'nav-contact':    'Wasiliana',
//       'nav-portal':     'Lango la Mwanafunzi',
//       'hero-badge':     'Chuo Kilichoidhinishwa na TVETA',
//       'hero-tagline':   'Kuwawezesha Vijana Kupitia Ubora wa Kiufundi',
//       'hero-sub':       'Jiunge na maelfu ya wanafunzi wanaojenga kazi halisi katika Kigumo TVC.',
//       'hero-apply':     'Omba Sasa',
//       'hero-explore':   'Chunguza Kozi',
//       'ql-student':     'Lango la Mwanafunzi',
//       'ql-lecturer':    'Lango la Mwalimu',
//       'ql-downloads':   'Vipakuliwa',
//       'ql-contact':     'Wasiliana Nasi',
//       'why-title':      'Kwa Nini Kigumo TVC?',
//       'why-sub':        'Tunajitolea kutengeneza wahitimu wenye uwezo na tayari kwa ajira',
//       'courses-title':  'Idara Zetu',
//       'courses-sub':    'Chunguza programu zetu zilizoidhinishwa na TVETA',
//       'news-title':     'Habari za Hivi Karibuni',
//       'news-sub':       'Endelea kupata habari za Kigumo TVC',
//       'cta-title':      'Uko Tayari Kuanza Safari Yako?',
//       'cta-sub':        'Maombi yako yanakaribishwa. Jiunge na Kigumo TVC ujenge kazi.',
//       'cta-apply':      'Omba Sasa',
//       'cta-downloads':  'Pakua Fomu',
//     }
//   };

//   let currentLang = localStorage.getItem('ktvc-lang') || 'en';

//   function applyLang(lang) {
//     const t = translations[lang];
//     Object.keys(t).forEach(key => {
//       const el = document.querySelector(`[data-i18n="${key}"]`);
//       if (el) el.textContent = t[key];
//     });
//     langBtns.forEach(btn => {
//       btn.classList.toggle('active', btn.dataset.lang === lang);
//     });
//     localStorage.setItem('ktvc-lang', lang);
//     currentLang = lang;
//   }

//   langBtns.forEach(btn => {
//     btn.addEventListener('click', () => applyLang(btn.dataset.lang));
//   });

//   applyLang(currentLang);
// })();

// ── Sticky nav active link ────────────────────────────────────
(function () {
  const links = document.querySelectorAll('.nav-links a');
  links.forEach(link => {
    if (link.href === window.location.href) {
      link.classList.add('active');
    }
  });
})();

