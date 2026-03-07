(function() {
  "use strict";
  document.documentElement.classList.add("js");

  const THEME_KEY = "dexterwura-theme";
  const THEME_DARK = "dark";
  const THEME_LIGHT = "light";

  function getStoredTheme() {
    return localStorage.getItem(THEME_KEY);
  }

  function getPreferredTheme() {
    const stored = getStoredTheme();
    if (stored) return stored;
    return window.matchMedia("(prefers-color-scheme: light)").matches ? THEME_LIGHT : THEME_DARK;
  }

  function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    const toggle = document.querySelector(".theme-toggle");
    if (toggle) {
      toggle.setAttribute("aria-label", theme === THEME_DARK ? "Switch to light mode" : "Switch to dark mode");
      toggle.setAttribute("title", theme === THEME_DARK ? "Switch to light mode" : "Switch to dark mode");
    }
  }

  function initTheme() {
    setTheme(getPreferredTheme());
    document.querySelector(".theme-toggle")?.addEventListener("click", function() {
      const next = document.documentElement.getAttribute("data-theme") === THEME_LIGHT ? THEME_DARK : THEME_LIGHT;
      localStorage.setItem(THEME_KEY, next);
      setTheme(next);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTheme);
  } else {
    initTheme();
  }

  const select = (el, all = false) => {
    el = el.trim();
    if (all) return [...document.querySelectorAll(el)];
    return document.querySelector(el);
  };

  const on = (type, el, listener, all = false) => {
    const elList = select(el, all);
    if (elList) {
      if (all) elList.forEach(e => e.addEventListener(type, listener));
      else elList.addEventListener(type, listener);
    }
  };

  const onscroll = (el, listener) => el.addEventListener("scroll", listener);

  const scrollto = (selector) => {
    const target = select(selector);
    const header = select("#header");
    if (!target || !header) return;
    const offset = header.offsetHeight;
    window.scrollTo({
      top: target.offsetTop - offset,
      behavior: "smooth"
    });
  };

  // Header scroll state
  const header = select("#header");
  if (header) {
    const headerScrolled = () => {
      if (window.scrollY > 80) header.classList.add("scrolled");
      else header.classList.remove("scrolled");
    };
    window.addEventListener("load", headerScrolled);
    onscroll(document, headerScrolled);
  }

  // Nav active state on scroll (only one section active at a time)
  const navLinks = select("#navbar .scrollto", true);
  const setNavActive = () => {
    const scrollY = window.scrollY + 140;
    let activeLink = null;
    navLinks.forEach(link => {
      const href = link.getAttribute("href");
      if (!href || href.charAt(0) !== "#") return;
      const section = select(href);
      if (!section) return;
      const top = section.offsetTop;
      const bottom = top + section.offsetHeight;
      link.classList.remove("active");
      if (scrollY >= top && scrollY < bottom) activeLink = link;
    });
    if (activeLink) activeLink.classList.add("active");
  };
  window.addEventListener("load", setNavActive);
  onscroll(document, setNavActive);

  // Back to top
  const backToTop = select(".back-to-top");
  if (backToTop) {
    const toggleBackToTop = () => {
      if (window.scrollY > 400) backToTop.classList.add("visible");
      else backToTop.classList.remove("visible");
    };
    window.addEventListener("load", toggleBackToTop);
    onscroll(document, toggleBackToTop);
    on("click", ".back-to-top", (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // Mobile nav toggle
  on("click", ".mobile-nav-toggle", function() {
    const navbar = select("#navbar ul");
    const icon = this.querySelector("i");
    if (navbar) navbar.classList.toggle("open");
    if (icon) {
      icon.classList.toggle("bi-list");
      icon.classList.toggle("bi-x");
    }
  });

  // Nav link click: scroll + close mobile menu
  on("click", ".navbar .scrollto", function(e) {
    if (this.hash && select(this.hash)) {
      e.preventDefault();
      scrollto(this.hash);
    }
    const navbar = select("#navbar ul");
    const toggle = select(".mobile-nav-toggle i");
    if (navbar && navbar.classList.contains("open")) {
      navbar.classList.remove("open");
      if (toggle) {
        toggle.classList.add("bi-list");
        toggle.classList.remove("bi-x");
      }
    }
  }, true);

  // Scroll reveal
  const revealEls = select(".reveal", true);
  if (revealEls.length && "IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          el.classList.add("visible");
          if (el.dataset.delay) el.classList.add("delay-" + el.dataset.delay);
        }
      });
    }, { rootMargin: "0px 0px -60px 0px", threshold: 0.1 });

    revealEls.forEach((el) => {
      const parent = el.closest(".row");
      if (parent) {
        const idx = [...parent.children].indexOf(el);
        el.dataset.delay = Math.min((idx % 4) + 1, 4);
      }
      revealObserver.observe(el);
    });
  }

  // Typed.js
  const typedEl = select(".typed");
  if (typedEl && typeof Typed !== "undefined") {
    const items = typedEl.getAttribute("data-typed-items");
    if (items) {
      new Typed(".typed", {
        strings: items.split(",").map(s => s.trim()),
        loop: true,
        typeSpeed: 80,
        backSpeed: 40,
        backDelay: 2000
      });
    }
  }

  // GLightbox (if any .portfolio-lightbox exist)
  if (typeof GLightbox !== "undefined") {
    GLightbox({ selector: ".portfolio-lightbox" });
  }

  // Preloader
  const preloader = select("#preloader");
  if (preloader) {
    window.addEventListener("load", () => preloader.remove());
  }

  // Hash on load
  window.addEventListener("load", () => {
    if (window.location.hash && select(window.location.hash)) {
      scrollto(window.location.hash);
    }
  });

  // Hero terminal: code typing effect
  (function initTerminalTyping() {
    const cmdEl = select("#terminal-cmd");
    const typedEl = select("#terminal-typed");
    if (!cmdEl || !typedEl) return;

    const sequences = [
      { cmd: "whoami", output: "Dexterity Wurayayi" },
      { cmd: "git status", output: "On branch main. Building cool things." },
      { cmd: "cat passion.txt", output: "Java • Laravel • PHP • The web." }
    ];

    let seqIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let doneTyping = false;

    function tick() {
      const seq = sequences[seqIndex];
      const text = seq.output;

      if (isDeleting) {
        typedEl.textContent = text.substring(0, charIndex - 1);
        charIndex--;
        if (charIndex === 0) {
          isDeleting = false;
          seqIndex = (seqIndex + 1) % sequences.length;
          cmdEl.textContent = sequences[seqIndex].cmd;
          doneTyping = false;
        }
      } else {
        typedEl.textContent = text.substring(0, charIndex + 1);
        charIndex++;
        if (charIndex === text.length) {
          doneTyping = true;
          isDeleting = true;
        }
      }

      const delay = isDeleting ? 40 : (doneTyping ? 2200 : 70);
      setTimeout(tick, delay);
    }

    cmdEl.textContent = sequences[0].cmd;
    setTimeout(tick, 600);
  })();
})();
