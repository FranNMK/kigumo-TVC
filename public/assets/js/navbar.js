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
            <span>📞  +254 769-394 273</span>
            <span>✉️ <a href="mailto:info@kigumotvc.ac.ke">info@kigumotvc.ac.ke</a></span>
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

  <li><a href="/courses.html" class="${current === "courses" ? "active" : ""}">Courses</a></li>
  <li><a href="/admissions.html" class="${current === "admissions" ? "active" : ""}">Admissions</a></li>
  <li><a href="/news.html" class="${current === "news" ? "active" : ""}">News</a></li>
  <li><a href="/contact.html" class="${current === "contact" ? "active" : ""}">Contact</a></li>
  <li><a href="/downloads.html" class="${current === "downloads" ? "active" : ""}">Downloads</a></li>
  <li><a href="/portal/login.html" class="btn-portal">School Portal</a></li>
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
      hamburger.classList.remove("open"); // ← removes X animation
      document.body.style.overflow = "";
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

    // Close when clicking any nav link
    navLinks.querySelectorAll("a").forEach((link) => {
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

      // Mobile tap toggle
      toggle.addEventListener("click", function (e) {
        if (window.innerWidth <= 992) {
          e.preventDefault();
          menu.classList.toggle("open");
        }
      });
    });

    // Sub-dropdowns for Administration
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
      subToggle.addEventListener("click", function (e) {
        if (window.innerWidth <= 992) {
          e.preventDefault();
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
    try {
      const res = await fetch("/api/v1/departments");
      if (!res.ok) throw new Error("Failed to fetch departments");
      const data = await res.json();
      if (!data.success || !data.data) return;

      const academic = data.data.filter((d) => d.type === "academic");
      const nonAcademic = data.data.filter((d) => d.type === "non_academic");

      const academicContainer = document.getElementById("academicDeptLinks");
      const nonAcademicContainer = document.getElementById(
        "nonAcademicDeptLinks",
      );

      if (academicContainer) {
        academicContainer.innerHTML =
          academic
            .map(
              (d) =>
                `<li><a href="/departments.html#dept-${d.id}">${escapeHtml(d.name)}</a></li>`,
            )
            .join("") || "<li>No academic departments</li>";
      }
      if (nonAcademicContainer) {
        nonAcademicContainer.innerHTML =
          nonAcademic
            .map(
              (d) =>
                `<li><a href="/departments.html#dept-${d.id}">${escapeHtml(d.name)}</a></li>`,
            )
            .join("") || "<li>No non-academic departments</li>";
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
