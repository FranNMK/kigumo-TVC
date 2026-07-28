/* ============================================================
   KIGUMO TVC — Main JavaScript
   ============================================================ */

// ── Loading Screen (Premium) ─────────────────────────────────
(function () {
  const loadingScreen = document.getElementById("loadingScreen");
  const loadingBar = document.getElementById("loadingBar");
  const loadingPercent = document.getElementById("loadingPercent");
  const loadingStatus = document.getElementById("loadingStatus");

  if (!loadingScreen) return;

  // Skip if already loaded this session
  if (sessionStorage.getItem("siteLoaded")) {
    loadingScreen.style.display = "none";
    return;
  }

  let progress = 0;

  // Status messages that cycle during loading
  const statusMessages = [
    "Establishing connection...",
    "Loading college data...",
    "Preparing departments...",
    "Fetching latest news...",
    "Setting up your experience...",
    "Almost ready...",
  ];
  let statusIndex = 0;

  function updateProgress(increment) {
    progress = Math.min(progress + increment, 95);
    loadingBar.style.width = progress + "%";
    loadingPercent.textContent = Math.floor(progress) + "%";
  }

  // Cycle through status messages
  const statusInterval = setInterval(() => {
    statusIndex = (statusIndex + 1) % statusMessages.length;
    loadingStatus.textContent = statusMessages[statusIndex];
  }, 2500);

  // Simulate realistic loading progress
  const progressSteps = [
    { at: 500, to: 15 },
    { at: 1500, to: 35 },
    { at: 3000, to: 55 },
    { at: 5000, to: 75 },
    { at: 8000, to: 90 },
  ];

  progressSteps.forEach((step) => {
    setTimeout(() => {
      if (progress < step.to) updateProgress(step.to - progress);
    }, step.at);
  });

  // When page fully loads
  window.addEventListener("load", () => {
    clearInterval(statusInterval);
    updateProgress(100 - progress);
    loadingStatus.textContent = "Welcome! 🎉";
    loadingPercent.textContent = "100%";
    loadingBar.style.width = "100%";

    setTimeout(() => {
      loadingScreen.style.opacity = "0";
      setTimeout(() => {
        loadingScreen.style.display = "none";
        sessionStorage.setItem("siteLoaded", "true");
      }, 600);
    }, 800);
  });

  // Safety fallback: hide after 18 seconds max
  setTimeout(() => {
    if (loadingScreen.style.display !== "none") {
      clearInterval(statusInterval);
      loadingStatus.textContent = "Welcome! 🎉";
      loadingScreen.style.opacity = "0";
      setTimeout(() => {
        loadingScreen.style.display = "none";
        sessionStorage.setItem("siteLoaded", "true");
      }, 500);
    }
  }, 18000);

  // Create floating particles
  const particlesContainer = document.getElementById("loadingParticles");
  if (particlesContainer) {
    for (let i = 0; i < 20; i++) {
      const particle = document.createElement("div");
      particle.style.cssText = `
        position:absolute;
        width:${Math.random() * 4 + 2}px;
        height:${Math.random() * 4 + 2}px;
        background:rgba(245,197,24,${Math.random() * 0.4 + 0.1});
        border-radius:50%;
        top:${Math.random() * 100}%;
        left:${Math.random() * 100}%;
        animation:floatParticle ${Math.random() * 6 + 4}s linear infinite;
        animation-delay:${Math.random() * 5}s;
      `;
      particlesContainer.appendChild(particle);
    }

    // Add particle animation style
    const style = document.createElement("style");
    style.textContent = `
      @keyframes floatParticle {
        0% { transform: translateY(0) translateX(0); opacity: 0; }
        20% { opacity: 1; }
        80% { opacity: 1; }
        100% { transform: translateY(-100vh) translateX(${Math.random() * 100 - 50}px); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
})();

// ── Dynamic Slider ───────────────────────────────────────────
(async function () {
  try {
    const res = await fetch("/api/v1/slides");
    if (!res.ok) return;
    const data = await res.json();

    if (!data.success || !data.data || data.data.length === 0) return;

    // Filter only active slides, sorted by sort_order
    const slides = data.data
      .filter((s) => s.is_active)
      .sort((a, b) => a.sort_order - b.sort_order);
    if (slides.length === 0) return;

    const hero = document.getElementById("heroSlider");
    const dotsContainer = document.getElementById("sliderDots");
    if (!hero || !dotsContainer) return;

    // Build slide HTML
    slides.forEach((slide, index) => {
      const div = document.createElement("div");
      div.className = "slide" + (index === 0 ? " active" : "");

      const isVideo = slide.media_type === "video";

      if (isVideo) {
        // Video slide — use a <video> tag as background
        div.style.position = "relative";
        div.style.overflow = "hidden";
        div.innerHTML = `
          <video class="slide-video-bg" src="${slide.image_path}"
            autoplay muted loop playsinline
            style="position:absolute;top:50%;left:50%;min-width:100%;min-height:100%;width:auto;height:auto;transform:translate(-50%,-50%);object-fit:cover;z-index:0;">
          </video>
          <div class="slide-overlay" style="z-index:1;"></div>
          <div class="slide-content" style="position:relative;z-index:2;">
            ${slide.badge_text ? `<span class="slide-badge">${escapeHtml(slide.badge_text)}</span>` : ""}
            ${slide.heading ? `<h2>${escapeHtml(slide.heading)}</h2>` : ""}
            ${slide.subtext ? `<p>${escapeHtml(slide.subtext)}</p>` : ""}
            <div class="slide-buttons">
              ${slide.btn1_text && slide.btn1_url ? `<a href="${slide.btn1_url}" class="btn btn-yellow">${escapeHtml(slide.btn1_text)}</a>` : ""}
              ${slide.btn2_text && slide.btn2_url ? `<a href="${slide.btn2_url}" class="btn btn-outline">${escapeHtml(slide.btn2_text)}</a>` : ""}
            </div>
          </div>`;
      } else {
        // Image slide
        div.style.backgroundImage = `url('${slide.image_path}')`;
        div.innerHTML = `
          <div class="slide-overlay"></div>
          <div class="slide-content">
            ${slide.badge_text ? `<span class="slide-badge">${escapeHtml(slide.badge_text)}</span>` : ""}
            ${slide.heading ? `<h2>${escapeHtml(slide.heading)}</h2>` : ""}
            ${slide.subtext ? `<p>${escapeHtml(slide.subtext)}</p>` : ""}
            <div class="slide-buttons">
              ${slide.btn1_text && slide.btn1_url ? `<a href="${slide.btn1_url}" class="btn btn-yellow">${escapeHtml(slide.btn1_text)}</a>` : ""}
              ${slide.btn2_text && slide.btn2_url ? `<a href="${slide.btn2_url}" class="btn btn-outline">${escapeHtml(slide.btn2_text)}</a>` : ""}
            </div>
          </div>`;
      }

      hero.insertBefore(div, hero.querySelector(".slider-arrow.prev"));

      // Build dot
      const dot = document.createElement("button");
      dot.className = "dot" + (index === 0 ? " active" : "");
      dot.setAttribute("aria-label", `Slide ${index + 1}`);
      dotsContainer.appendChild(dot);
    });

    // Show the section
    hero.style.display = "";

    // Slider logic
    const slideEls = hero.querySelectorAll(".slide");
    const dots = hero.querySelectorAll(".dot");
    let current = 0;
    let timer;

    function goTo(n) {
      // Pause any video in the outgoing slide
      const outVideo = slideEls[current].querySelector("video");
      if (outVideo) outVideo.pause();

      slideEls[current].classList.remove("active");
      dots[current].classList.remove("active");
      current = (n + slideEls.length) % slideEls.length;
      slideEls[current].classList.add("active");
      dots[current].classList.add("active");

      // Play video in the incoming slide
      const inVideo = slideEls[current].querySelector("video");
      if (inVideo) inVideo.play().catch(() => {});
    }

    function next() {
      goTo(current + 1);
    }
    function prev() {
      goTo(current - 1);
    }
    function startAuto() {
      timer = setInterval(next, 5000);
    }
    function resetAuto() {
      clearInterval(timer);
      startAuto();
    }

    hero.querySelector(".slider-arrow.next").addEventListener("click", () => {
      next();
      resetAuto();
    });
    hero.querySelector(".slider-arrow.prev").addEventListener("click", () => {
      prev();
      resetAuto();
    });

    dots.forEach((dot, i) => {
      dot.addEventListener("click", () => {
        goTo(i);
        resetAuto();
      });
    });

    startAuto();
  } catch (e) {
    console.log("Dynamic slider not loaded");
  }

  function escapeHtml(str) {
    if (!str) return "";
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }
})();

// ── Load Real Stats & Animate ─────────────────────────────────
(async function () {
  try {
    // Fetch real stats from API
    const res = await fetch("/api/v1/stats");
    if (!res.ok) throw new Error("Stats fetch failed");
    const result = await res.json();

    if (result.success && result.data) {
      const d = result.data;

      // Update data-target attributes with real values
      const statStudents = document.getElementById("statStudents");
      const statCourses = document.getElementById("statCourses");
      const statYears = document.getElementById("statYears");

      // Students count is static (2500) — do not overwrite with API value
      if (statCourses) statCourses.dataset.target = d.totalCourses || 0;
      if (statYears) statYears.dataset.target = d.yearsSinceEstablishment || 3;
    }
  } catch (e) {
    // Fallback: use the hardcoded values already in the HTML
    console.log("Stats API unavailable, using static values");
  }

  // Now animate the counters (works with either real or static data)
  const counters = document.querySelectorAll(".stat-number");
  if (!counters.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseInt(el.dataset.target) || 0;
        const suffix = el.dataset.suffix || "";

        if (target === 0) {
          el.textContent = "0" + suffix;
          observer.unobserve(el);
          return;
        }

        let count = 0;
        const step = Math.max(1, Math.ceil(target / 60));

        const tick = setInterval(() => {
          count += step;
          if (count >= target) {
            count = target;
            clearInterval(tick);
          }
          el.textContent = count.toLocaleString() + suffix;
        }, 30);

        observer.unobserve(el);
      });
    },
    { threshold: 0.5 },
  );

  counters.forEach((c) => observer.observe(c));
})();

// ── Sticky nav active link ────────────────────────────────────
(function () {
  const links = document.querySelectorAll(".nav-links a");
  links.forEach((link) => {
    if (link.href === window.location.href) {
      link.classList.add("active");
    }
  });
})();

// ── Load Principal's Message ─────────────────────────────────
(async function () {
  try {
    const res = await fetch("/api/v1/content/principal-message");
    if (!res.ok) return;
    const data = await res.json();

    // If no data or no message, hide the section entirely
    if (!data.success || !data.data || !data.data.message) {
      return;
    }

    const p = data.data;
    const section = document.getElementById("principalMessageSection");
    if (!section) return;

    // Populate the message body
    document.getElementById("principalMessageBody").innerHTML = p.message;

    // Populate the signature
    document.getElementById("principalSignature").innerHTML = `
      <strong>${escapeHtml(p.principal_name || "")}</strong>
      ${escapeHtml(p.title || "")}
    `;
    // Handle photo
    const photoEl = document.getElementById("principalPhoto");
    if (p.image_path) {
      let cleanPath = p.image_path.replace(/\\/g, "/");
      if (cleanPath.startsWith("http://") || cleanPath.startsWith("https://")) {
        photoEl.src = cleanPath;
      } else if (cleanPath.startsWith("uploads/")) {
        photoEl.src = "/" + cleanPath;
      } else {
        photoEl.src = "/uploads/" + cleanPath;
      }
      photoEl.style.display = "";
    } else {
      const placeholder = document.createElement("div");
      placeholder.className = "principal-photo-placeholder";
      placeholder.textContent = getInitials(p.principal_name || "CP");
      photoEl.parentNode.replaceChild(placeholder, photoEl);
    }

    // Show the section
    section.style.display = "";
  } catch (e) {
    // Silently fail – section remains hidden
    console.log("Principal message not loaded");
  }

  function escapeHtml(str) {
    if (!str) return "";
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function getInitials(name) {
    if (!name) return "CP";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (
      parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  }
})();

// ── Load Departments Preview (WITH REAL IMAGES) ────────────────
(async function () {
  try {
    const res = await fetch("/api/v1/departments");
    if (!res.ok) return;
    const data = await res.json();

    if (!data.success || !data.data || data.data.length === 0) return;

    const grid = document.getElementById("departmentsGrid");
    if (!grid) return;

    // Filter only academic departments
    const academicDepts = data.data.filter(d => d.type === 'academic');
    
    if (academicDepts.length === 0) {
      grid.innerHTML = '<div class="course-card"><p>No academic departments found.</p></div>';
      return;
    }

    // Show only the first 6 departments
    const firstSixDepts = academicDepts.slice(0, 6);

    grid.innerHTML = firstSixDepts
      .map(
        (dept) => `
      <div class="course-card">
        <div class="course-card-header">
          ${dept.image_path ? 
            `<div class="dept-image-wrapper" style="width:100%;height:140px;overflow:hidden;border-radius:12px 12px 0 0;margin-bottom:16px;">
               <img src="${dept.image_path}" alt="${escapeHtml(dept.name)}" style="width:100%;height:100%;object-fit:cover;" loading="lazy" onerror="this.onerror=null;this.parentElement.innerHTML='<div class=\'dept-icon\' style=\'font-size:3rem;text-align:center;padding:20px;\'>🏛️</div>'">
             </div>` : 
            `<div class="dept-icon" style="font-size:3rem;text-align:center;padding:20px;">🏛️</div>`
          }
          <h3 style="padding:0 20px;">${escapeHtml(dept.name)}</h3>
        </div>
        <div class="course-card-body">
          <p>${escapeHtml(dept.description ? dept.description.substring(0, 120) + "..." : "Academic department at Kigumo TVC.")}</p>
        </div>
        <div class="course-card-footer">
          <a href="departments.html#dept-${dept.id}">View Department &rarr;</a>
        </div>
      </div>
    `,
      )
      .join("");
  } catch (e) {
    console.error("Departments preview error:", e);
    const grid = document.getElementById("departmentsGrid");
    if (grid) {
      grid.innerHTML = '<div class="course-card"><p>Unable to load departments. Please refresh the page.</p></div>';
    }
  }

  function escapeHtml(str) {
    if (!str) return "";
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }
})();

// ── Load News Preview ────────────────────────────────────────
(async function () {
  try {
    const res = await fetch("/api/v1/news?limit=3");
    if (!res.ok) return;
    const data = await res.json();

    if (!data.success || !data.data || data.data.length === 0) return;

    const grid = document.getElementById("newsGrid");
    if (!grid) return;

    // Category colours
    const categoryColors = {
      event: "#cce5ff",
      partnership: "#d4edda",
      graduation: "#fff3cd",
      achievement: "#f8d7da",
      general: "#e2e3e5",
    };

    grid.innerHTML = data.data
      .map((article) => {
        const excerpt = getExcerpt(article.body, 120);
        const date = new Date(article.published_at).toLocaleDateString(
          "en-KE",
          {
            year: "numeric",
            month: "long",
            day: "numeric",
          },
        );
        const bgColor = categoryColors[article.category] || "#e2e3e5";

        // Use image if available, otherwise show emoji
        const imageHtml = article.image_path
          ? `<img src="${article.image_path}" alt="${escapeHtml(article.title)}" style="width:100%;height:100%;object-fit:cover;" loading="lazy" onerror="this.style.display='none';this.parentElement.innerHTML='📰'">`
          : getCategoryEmoji(article.category);

        return `
        <div class="news-card">
          <div class="news-img">
            ${imageHtml}
          </div>
          <div class="news-body">
            <div class="news-meta">
              <span class="news-category" style="background:${bgColor};">${capitalize(article.category)}</span>
              <span>${date}</span>
            </div>
            <h3>${escapeHtml(article.title)}</h3>
            <p>${escapeHtml(excerpt)}</p>
          </div>
          <div class="news-card-footer">
            <a href="news-article.html?id=${article.id}">Read More &rarr;</a>
          </div>
        </div>
      `;
      })
      .join("");
  } catch (e) {
    console.log("News preview not loaded");
  }

  function getExcerpt(html, maxChars) {
    const div = document.createElement("div");
    div.innerHTML = html;
    const text = div.textContent || div.innerText || "";
    return text.length > maxChars
      ? text.substring(0, maxChars).trim() + "..."
      : text;
  }

  function getCategoryEmoji(category) {
    const map = {
      event: "📅",
      partnership: "🤝",
      graduation: "🎓",
      achievement: "🏆",
      general: "📰",
    };
    return map[category] || "📰";
  }

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function escapeHtml(str) {
    if (!str) return "";
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }
})();

// ── Load Partners Slider ─────────────────────────────────────
(async function () {
  try {
    const res = await fetch("/api/v1/partners");
    if (!res.ok) return;
    const data = await res.json();

    if (!data.success || !data.data || data.data.length === 0) return;

    if (data.data.length === 0) return;

    const track = document.getElementById("partnersTrack");
    const section = document.getElementById("partnersSection");
    if (!track || !section) return;

    // Build partner logos (duplicated for seamless loop)
    const items = data.data
      .map((p) => {
        const imgSrc = p.logo_path || "";
        const link = p.website_url
          ? `<a href="${p.website_url}" target="_blank" rel="noopener">`
          : "";
        const linkClose = p.website_url ? "</a>" : "";

        if (imgSrc) {
          return `${link}<div class="partner-item"><img src="${imgSrc}" alt="${escapeHtml(p.name)}" loading="lazy" onerror="this.style.display='none';this.parentElement.innerHTML='${escapeHtml(p.name)}'" /></div>${linkClose}`;
        } else {
          return `${link}<div class="partner-item" style="font-weight:600;color:#1a7a1a;font-size:0.9rem;">${escapeHtml(p.name)}</div>${linkClose}`;
        }
      })
      .join("");

    // Duplicate for seamless infinite scroll
    track.innerHTML = items + items;

    section.style.display = "";
  } catch (e) {
    console.log("Partners slider not loaded");
  }

  function escapeHtml(str) {
    if (!str) return "";
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }
})();

// ── Intake Announcement Popup ────────────────────────────
(async function () {
  const overlay = document.getElementById('intakePopupOverlay');
  if (!overlay) return; // Only runs on pages that include the popup HTML

  const STORAGE_KEY = 'intakePopupSeen';

  function pad(n) { return String(n).padStart(2, '0'); }

  function fmtDate(v) {
    if (!v) return '—';
    return new Date(v).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function showPopup(intake) {
    // Populate dynamic fields
    document.getElementById('intakePopupTitle').textContent = intake.label.toUpperCase() + ' INTAKE';
    document.getElementById('intakePopupLabel').textContent = intake.label + ' Intake';
    document.getElementById('intakePopupDeadline').textContent = fmtDate(intake.application_deadline);
    document.getElementById('intakePopupDate').textContent = fmtDate(intake.intake_date);
    document.getElementById('intakePopupPrograms').textContent = intake.programs_available || 'All Programmes';

    const statusSub = intake.status === 'open' ? 'Applications are now Open' : 'Applications will Open Soon';
    const subtitleEl = overlay.querySelector('.intake-popup-subtitle');
    if (subtitleEl) subtitleEl.textContent = statusSub;

    // Show overlay
    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // Countdown to application_deadline
    const deadline = new Date(intake.application_deadline);
    deadline.setHours(23, 59, 59, 999); // end of that day

    function tick() {
      const now = new Date();
      const diff = deadline - now;
      if (diff <= 0) {
        document.getElementById('cdDays').textContent  = '00';
        document.getElementById('cdHours').textContent = '00';
        document.getElementById('cdMins').textContent  = '00';
        document.getElementById('cdSecs').textContent  = '00';
        return;
      }
      const days  = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const mins  = Math.floor((diff % 3600000)  / 60000);
      const secs  = Math.floor((diff % 60000)    / 1000);
      document.getElementById('cdDays').textContent  = pad(days);
      document.getElementById('cdHours').textContent = pad(hours);
      document.getElementById('cdMins').textContent  = pad(mins);
      document.getElementById('cdSecs').textContent  = pad(secs);
    }
    tick();
    const timer = setInterval(tick, 1000);

    function dismiss() {
      clearInterval(timer);
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity 0.25s ease';
      setTimeout(() => {
        overlay.style.display = 'none';
        overlay.style.opacity = '';
        overlay.style.transition = '';
        document.body.style.overflow = '';
      }, 250);
      // Remember that this intake was seen
      localStorage.setItem(STORAGE_KEY, String(intake.id));
    }

    document.getElementById('intakePopupClose').addEventListener('click', dismiss);
    document.getElementById('intakePopupDismiss').addEventListener('click', dismiss);
    // Click on dark backdrop dismisses too
    overlay.addEventListener('click', function onBdClick(e) {
      if (e.target === overlay) { dismiss(); overlay.removeEventListener('click', onBdClick); }
    });
    // Escape key
    document.addEventListener('keydown', function onEsc(e) {
      if (e.key === 'Escape') { dismiss(); document.removeEventListener('keydown', onEsc); }
    });
  }

  try {
    const res = await fetch('/api/v1/admin/intake-dates/popup');
    if (!res.ok) return;
    const data = await res.json();
    if (!data.success || !data.data) return;

    const intake = data.data;

    // Only show once per unique intake id (stored in localStorage)
    const seenId = localStorage.getItem(STORAGE_KEY);
    if (seenId === String(intake.id)) return;

    // Show after a 1.5 s delay (lets the page finish loading nicely)
    setTimeout(() => showPopup(intake), 1500);
  } catch (e) {
    // Silently skip — popup is non-critical
  }
})();
