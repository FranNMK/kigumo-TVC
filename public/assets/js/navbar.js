/**
 * Kigumo TVC Shared Navbar Component
 *
 * Dynamically builds the top bar + main navigation bar
 * with dropdown menus and a Google Translate language toggle.
 *
 * Usage: Include this script on every page, then call
 *         buildNavbar('pageIdentifier') where pageIdentifier
 *         is one of: 'home','about','courses','admissions',
 *         'news','contact','downloads','portal'.
 *
 * The navbar will be inserted as the first element in <body>.
 */

(function () {
  "use strict";

  /**
   * Builds the entire top bar and navbar and inserts it into the DOM.
   * @param {string} currentPage - Identifier to highlight the active nav link.
   */
  window.buildNavbar = function (currentPage) {
    const current = currentPage || "home";

    // Build HTML structure
    const navbarHTML = `
      <!-- ═══════════ TOP BAR ═══════════ -->
      <div class="top-bar">
        <div class="container">
          <div class="top-bar-left">
            <span>📞  +254 769-394 200</span>
            <span>✉️ <a href="mailto:info@kigumotvc.ac.ke">info@kigumotvc.ac.ke</a></span>
            <span>✉️ <a href="mailto:info@kigumotvc.ac.ke">kigumotvc@gmail.com</a></span>
          </div>
          <div class="top-bar-right">
            <div class="lang-switcher">
              <button class="lang-toggle-btn" id="langToggleBtn" aria-label="Choose language">
                🌐 Language
              </button>
              <div class="lang-dropdown" id="langDropdown">
                <div id="google_translate_element"></div>
              </div>
            </div>
            <span class="top-bar-hours">Mon – Fri: 8:00 AM – 5:00 PM</span>
          </div>
        </div>
      </div>

      <!-- ═══════════ NAVBAR ═══════════ -->
      <nav class="navbar">
        <div class="container">
         <a href="/index.html" class="nav-brand">
            <img src="assets/images/logo.jpeg" alt="Kigumo TVC Logo" />
            <div class="nav-brand-text">
              <h1>Kigumo</h1>
              <span>Technical & Vocational College</span>
            </div>
          </a>

          <div class="hamburger" id="hamburger" aria-label="Open menu">
            <span></span><span></span><span></span>
          </div>

          <div class="nav-mobile-header">
            <span>Menu</span>
            <button id="nav-close-btn" aria-label="Close menu">&times;</button>
          </div>
          <ul class="nav-links" id="nav-links">
  <li><a href="/index.html" class="${current === "home" ? "active" : ""}">Home</a></li>
  
  <!-- About Us Dropdown -->
  <li class="nav-dropdown">
    <a href="/about.html" class="dropdown-toggle ${current === "about" ? "active" : ""}">About Us <span class="arrow">▼</span></a>
    <ul class="dropdown-menu">
      <li><a href="/about.html#about">About KTVC</a></li>
      <li><a href="/about.html#charter">Service Charter</a></li>
      <li><a href="/about.html#vision">Vision & Mission</a></li>
      <li class="sub-dropdown">
        <a href="/about.html#bom">Administration <span class="arrow-right">▶</span></a>
        <ul class="sub-dropdown-menu">
          <li><a href="/about.html#bom">Board of Management</a></li>
          <li><a href="/about.html#chief-principal">Chief Principal</a></li>
          <li><a href="/about.html#dp-academics">Deputy Principal Academics</a></li>
          <li><a href="/about.html#dp-administration">Deputy Principal Admin</a></li>
          <li><a href="/about.html#hods">Heads of Departments</a></li>
        </ul>
      </li>
    </ul>
  </li>

  <!-- Departments Dropdown -->
  <li class="nav-dropdown" id="departmentsDropdown">
    <a href="/departments.html" class="dropdown-toggle ${current === "departments" ? "active" : ""}">Departments <span class="arrow">▼</span></a>
    <ul class="dropdown-menu">
      <li class="dropdown-group">
        <span class="dropdown-group-title">Academic</span>
        <ul id="academicDeptLinks">
          <li><a href="/departments.html">Loading...</a></li>
        </ul>
      </li>
      <li class="dropdown-group">
        <span class="dropdown-group-title">Non-Academic</span>
        <ul id="nonAcademicDeptLinks">
          <li><a href="/departments.html">Loading...</a></li>
        </ul>
      </li>
    </ul>
  </li>

  <li><a href="/courses.html" class="${current === 'courses' ? 'active' : ''}">Our Programs</a></li>
  <li><a href="/admissions.html" class="${current === "admissions" ? "active" : ""}">Admissions</a></li>
  <li><a href="/news.html" class="${current === "news" ? "active" : ""}">News</a></li>
  <li><a href="/contact.html" class="${current === "contact" ? "active" : ""}">Contact</a></li>
  <li><a href="/downloads.html" class="${current === "downloads" ? "active" : ""}">Downloads</a></li>
   <!-- Apply Now button -->
  <li><a href="/apply.html" class="btn-apply ${current === "apply" ? "active" : ""}">Apply Now</a></li>
  <li><a href="/portals.html" class="btn-portal">Portals</a></li>
</ul>                
        </div>
      </nav>
      <div class="nav-overlay" id="nav-overlay"></div>
    `;

    // Insert at the beginning of body
    document.body.insertAdjacentHTML("afterbegin", navbarHTML);

    // Initialize mobile menu functionality
    initMobileMenu();

    // Initialize dropdown hover/tap behavior
    initDropdowns();

    // Initialize Google Translate toggle
    initLanguageToggle();

    // Load department links dynamically
    loadDepartmentLinks();
  };

  /**
   * Mobile menu open/close logic.
   */
  function initMobileMenu() {
    const hamburger = document.getElementById("hamburger");
    const closeBtn = document.getElementById("nav-close-btn");
    const overlay = document.getElementById("nav-overlay");
    const navLinks = document.getElementById("nav-links");

    if (!hamburger || !navLinks) return;

    function openNav() {
      navLinks.classList.add("open");
      overlay.classList.add("open");
      hamburger.classList.add("open"); // ← triggers X animation
      document.body.style.overflow = "hidden";
    }

    function closeNav() {
      navLinks.classList.remove("open");
      overlay.classList.remove("open");
      hamburger.classList.remove("open");
      document.body.style.overflow = "";

      // Reset any expanded dropdowns/sub-dropdowns so the menu
      // always reopens in a clean, collapsed state
      navLinks
        .querySelectorAll(".dropdown-menu.open, .sub-dropdown-menu.open")
        .forEach((el) => el.classList.remove("open"));

      // Reset all arrow indicators back to pointing down
      navLinks
        .querySelectorAll(".dropdown-toggle.open-arrow")
        .forEach((el) => el.classList.remove("open-arrow"));

      // Also reset scroll position so it doesn't reopen mid-scroll
      navLinks.scrollTop = 0;
    }

    // Toggle on hamburger click (open/close)
    hamburger.addEventListener("click", () => {
      if (navLinks.classList.contains("open")) {
        closeNav();
      } else {
        openNav();
      }
    });

    // Close when clicking the dark overlay
    if (overlay) {
      overlay.addEventListener("click", closeNav);
    }

    // Close when clicking any nav link EXCEPT dropdown toggles
    navLinks.querySelectorAll("a").forEach((link) => {
      const parentLi = link.closest('li');
      // Skip if this link is a toggle for a dropdown or sub-dropdown
      if (parentLi && (parentLi.classList.contains('nav-dropdown') || parentLi.classList.contains('sub-dropdown'))) {
        return;
      }
      link.addEventListener("click", closeNav);
    });

    // Close when clicking the X button
    if (closeBtn) {
      closeBtn.addEventListener("click", closeNav);
    }
  }

  /**
   * Dropdown menu hover (desktop) and tap (mobile) behavior.
   */
  function initDropdowns() {
    const dropdowns = document.querySelectorAll(".nav-dropdown");

    dropdowns.forEach((drop) => {
      const toggle = drop.querySelector(":scope > .dropdown-toggle");
      const menu = drop.querySelector(":scope > .dropdown-menu");

      if (!toggle || !menu) return;

      // Desktop hover via mouseenter/mouseleave
      drop.addEventListener("mouseenter", () => {
        if (window.innerWidth > 992) {
          menu.style.display = "block";
        }
      });
      drop.addEventListener("mouseleave", () => {
        if (window.innerWidth > 992) {
          menu.style.display = "";
        }
      });

      // Mobile tap toggle with AUTO-CLOSE logic
      toggle.addEventListener("click", function (e) {
        if (window.innerWidth <= 992) {
          e.preventDefault();

          // 1. Close all other open dropdown menus and reset their arrows
          const allOpenMenus = document.querySelectorAll('.nav-links .dropdown-menu.open');
          allOpenMenus.forEach(openMenu => {
            if (openMenu !== menu) {
              openMenu.classList.remove('open');
              // reset arrow on the sibling toggle
              const siblingToggle = openMenu.closest('.nav-dropdown')
                && openMenu.closest('.nav-dropdown').querySelector(':scope > .dropdown-toggle');
              if (siblingToggle) siblingToggle.classList.remove('open-arrow');
            }
          });

          // 2. Toggle the clicked one and its arrow
          const isNowOpen = menu.classList.toggle("open");
          toggle.classList.toggle("open-arrow", isNowOpen);
        }
      });
    });

    // Sub-dropdowns for Administration with AUTO-CLOSE logic
    const subDrops = document.querySelectorAll(".sub-dropdown");
    subDrops.forEach((sub) => {
      const subToggle = sub.querySelector(":scope > a");
      const subMenu = sub.querySelector(":scope > .sub-dropdown-menu");
      if (!subToggle || !subMenu) return;

      sub.addEventListener("mouseenter", () => {
        if (window.innerWidth > 992) {
          subMenu.style.display = "block";
        }
      });
      sub.addEventListener("mouseleave", () => {
        if (window.innerWidth > 992) {
          subMenu.style.display = "";
        }
      });

      // Mobile tap toggle with AUTO-CLOSE logic
      subToggle.addEventListener("click", function (e) {
        if (window.innerWidth <= 992) {
          e.preventDefault();

          // 1. Find ALL other open sub-menus and close them
          const allOpenSubMenus = document.querySelectorAll('.sub-dropdown-menu.open');
          allOpenSubMenus.forEach(openSub => {
            if (openSub !== subMenu) {
              openSub.classList.remove('open');
            }
          });

          // 2. Toggle the clicked one
          subMenu.classList.toggle("open");
        }
      });
    });
  }

  /**
   * Language toggle: show/hide the Google Translate dropdown.
   */
  function initLanguageToggle() {
    const toggleBtn = document.getElementById("langToggleBtn");
    const langDropdown = document.getElementById("langDropdown");

    if (toggleBtn && langDropdown) {
      toggleBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        langDropdown.classList.toggle("visible");
      });

      document.addEventListener("click", () => {
        langDropdown.classList.remove("visible");
      });
    }
  }

  /**
   * Fetch departments from API and populate the dropdown links.
   */
  async function loadDepartmentLinks() {
    // Shared helper: close the mobile drawer from dynamically injected links.
    // initMobileMenu() runs before the async fetch resolves, so those new <a>
    // elements are never covered by the static querySelectorAll listener there.
    function closeMobileNav() {
      const navLinks = document.getElementById("nav-links");
      const overlay  = document.getElementById("nav-overlay");
      const hamburger = document.getElementById("hamburger");
      if (navLinks) {
        navLinks.classList.remove("open");
        navLinks.querySelectorAll(".dropdown-menu.open, .sub-dropdown-menu.open")
          .forEach((el) => el.classList.remove("open"));
        navLinks.querySelectorAll(".dropdown-toggle.open-arrow")
          .forEach((el) => el.classList.remove("open-arrow"));
        navLinks.scrollTop = 0;
      }
      if (overlay)   overlay.classList.remove("open");
      if (hamburger) hamburger.classList.remove("open");
      document.body.style.overflow = "";
    }

    // Wire closeNav onto every <a> inside a container after innerHTML is set
    function bindClose(container) {
      container.querySelectorAll("a").forEach((a) => {
        a.addEventListener("click", closeMobileNav);
      });
    }

    try {
      const res = await fetch("/api/v1/departments");
      if (!res.ok) throw new Error("Failed to fetch departments");
      const data = await res.json();
      if (!data.success || !data.data) return;

      const academic    = data.data.filter((d) => d.type === "academic");
      const nonAcademic = data.data.filter((d) => d.type === "non_academic");

      const academicContainer    = document.getElementById("academicDeptLinks");
      const nonAcademicContainer = document.getElementById("nonAcademicDeptLinks");

      if (academicContainer) {
        academicContainer.innerHTML =
          academic
            .map((d) => `<li><a href="/departments.html#dept-${d.id}">${escapeHtml(d.name)}</a></li>`)
            .join("") || "<li>No academic departments</li>";
        bindClose(academicContainer);
      }
      if (nonAcademicContainer) {
        nonAcademicContainer.innerHTML =
          nonAcademic
            .map((d) => `<li><a href="/departments.html#dept-${d.id}">${escapeHtml(d.name)}</a></li>`)
            .join("") || "<li>No non-academic departments</li>";
        bindClose(nonAcademicContainer);
      }
    } catch (e) {
      console.log("Could not load department links for navbar");
    }
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
  }
})();
