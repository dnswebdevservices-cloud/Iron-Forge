/* ==========================================================================
   IRONFORGE

   Motion policy for this page:
     - Nothing animates on scroll except the capability figures, which count
       once when they arrive. There is no fade-and-rise on every section.
     - The hero plays a single orchestrated sequence on load.
     - Everything else answers a click, a key, or a drag.

   There is no scroll event listener anywhere in this file. Positional state
   comes from IntersectionObserver, which the browser batches off the main
   scroll path.
   ========================================================================== */

(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ----------------------------------------------------------------------
     Hero load sequence
     ---------------------------------------------------------------------- */

  function startHero() {
    document.documentElement.classList.add("is-ready");
  }

  if (document.readyState === "complete") {
    startHero();
  } else {
    window.addEventListener("load", startHero, { once: true });
    // Never let a slow third-party image hold the hero hostage.
    setTimeout(startHero, 1200);
  }

  /* ----------------------------------------------------------------------
     Header. A zero-height sentinel at the top of the document reports when
     the page has scrolled, without listening to scroll.
     ---------------------------------------------------------------------- */

  var header = document.querySelector(".header");

  if (header && "IntersectionObserver" in window) {
    var sentinel = document.createElement("div");
    sentinel.setAttribute("aria-hidden", "true");
    sentinel.style.cssText = "position:absolute;top:0;left:0;width:1px;height:1px;pointer-events:none";
    document.body.prepend(sentinel);

    new IntersectionObserver(function (entries) {
      header.dataset.stuck = String(!entries[0].isIntersecting);
    }, { threshold: 0 }).observe(sentinel);
  }

  /* ----------------------------------------------------------------------
     Theme
     ---------------------------------------------------------------------- */

  var themeBtn = document.getElementById("theme");
  var root = document.documentElement;

  function labelTheme() {
    if (!themeBtn) return;
    var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    themeBtn.setAttribute("aria-label", "Switch to " + next + " theme");
  }

  labelTheme();

  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("ironforge-theme", next); } catch (e) { /* private mode */ }
      labelTheme();
    });
  }

  /* ----------------------------------------------------------------------
     Mobile menu
     ---------------------------------------------------------------------- */

  var menuBtn = document.getElementById("menu");
  var nav = document.getElementById("nav");

  function setMenu(open) {
    if (!menuBtn || !nav) return;
    nav.dataset.open = String(open);
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }

  if (menuBtn && nav) {
    menuBtn.addEventListener("click", function () {
      setMenu(nav.dataset.open !== "true");
    });

    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") setMenu(false);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.dataset.open === "true") {
        setMenu(false);
        menuBtn.focus();
      }
    });
  }

  /* ----------------------------------------------------------------------
     Equipment rail. Arrow state comes from observing the first and last
     entries, not from reading scrollLeft on every frame.
     ---------------------------------------------------------------------- */

  var rail = document.getElementById("rail");
  var prev = document.getElementById("prev");
  var next = document.getElementById("next");

  if (rail && prev && next) {
    var entries = rail.querySelectorAll(".entry");
    var first = entries[0];
    var last = entries[entries.length - 1];

    function step(dir) {
      var card = rail.querySelector(".entry");
      var by = card ? card.getBoundingClientRect().width + 28 : rail.clientWidth * 0.8;
      rail.scrollBy({
        left: dir * by,
        behavior: reduced.matches ? "auto" : "smooth"
      });
    }

    prev.addEventListener("click", function () { step(-1); });
    next.addEventListener("click", function () { step(1); });

    if ("IntersectionObserver" in window && first && last) {
      var edges = new IntersectionObserver(function (obs) {
        obs.forEach(function (o) {
          if (o.target === first) prev.disabled = o.isIntersecting;
          if (o.target === last) next.disabled = o.isIntersecting;
        });
      }, { root: rail, threshold: 0.9 });

      edges.observe(first);
      edges.observe(last);
    }
  }

  /* ----------------------------------------------------------------------
     Capability figures. The one scroll-triggered moment on the page.
     ---------------------------------------------------------------------- */

  var figures = document.querySelectorAll("[data-count]");

  if (figures.length && "IntersectionObserver" in window) {
    var fmt = new Intl.NumberFormat();

    var countObserver = new IntersectionObserver(function (obs, self) {
      obs.forEach(function (o) {
        if (!o.isIntersecting) return;
        self.unobserve(o.target);

        var el = o.target;
        var target = parseInt(el.dataset.count, 10);
        var suffix = el.dataset.suffix || "";

        if (reduced.matches || !Number.isFinite(target)) {
          el.textContent = fmt.format(target) + suffix;
          return;
        }

        var duration = 1100;
        var start = null;

        function tick(now) {
          if (start === null) start = now;
          var t = Math.min((now - start) / duration, 1);
          // Ease out so the number decelerates into place.
          var eased = 1 - Math.pow(1 - t, 3);
          el.textContent = fmt.format(Math.round(target * eased)) + suffix;
          if (t < 1) requestAnimationFrame(tick);
        }

        requestAnimationFrame(tick);
      });
    }, { threshold: 0.6 });

    figures.forEach(function (f) { countObserver.observe(f); });
  }

  /* ----------------------------------------------------------------------
     Quote form
     ---------------------------------------------------------------------- */

  var form = document.getElementById("form");

  if (form) {
    var submit = document.getElementById("submit");
    var status = document.getElementById("status");

    var rules = [
      {
        id: "name",
        test: function (v) { return v.trim().length > 1; },
        message: "Enter the name we should address the quote to."
      },
      {
        id: "email",
        test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); },
        message: "Enter an email we can send the quote to, like name@yourgym.com"
      },
      {
        id: "details",
        test: function (v) { return v.trim().length > 9; },
        message: "Tell us the floor size and what you need, so we can price it."
      }
    ];

    function show(rule, ok) {
      var input = document.getElementById(rule.id);
      var err = document.getElementById(rule.id + "-err");
      var field = input.closest(".field");

      field.dataset.invalid = String(!ok);
      input.setAttribute("aria-invalid", String(!ok));
      if (err) err.textContent = ok ? "" : rule.message;
      return ok;
    }

    // Re-check a field only after it has already failed once, so the form
    // does not shout at someone who is still typing their first answer.
    rules.forEach(function (rule) {
      var input = document.getElementById(rule.id);
      input.addEventListener("blur", function () {
        if (input.closest(".field").dataset.invalid === "true") {
          show(rule, rule.test(input.value));
        }
      });
      input.addEventListener("input", function () {
        if (input.closest(".field").dataset.invalid === "true" && rule.test(input.value)) {
          show(rule, true);
        }
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var failed = rules.filter(function (rule) {
        var input = document.getElementById(rule.id);
        return !show(rule, rule.test(input.value));
      });

      if (failed.length) {
        status.textContent = "";
        document.getElementById(failed[0].id).focus();
        return;
      }

      // Draft the request in the visitor's own email app, addressed to sales.
      // This runs inside the click, which browsers require for mailto links.
      var field = function (id) { return document.getElementById(id); };
      var interest = field("interest").value;
      var phone = field("phone").value.trim();
      var body = [
        "Name: " + field("name").value.trim(),
        "Email: " + field("email").value.trim(),
        "Phone: " + (phone || "Not given"),
        "Need: " + interest,
        "",
        field("details").value.trim()
      ].join("\n");

      submit.dataset.busy = "true";
      submit.textContent = "Opening email…";
      status.textContent = "";

      window.location.href = "mailto:sales@ironforgefitness.com"
        + "?subject=" + encodeURIComponent("Quote request: " + interest)
        + "&body=" + encodeURIComponent(body);

      setTimeout(function () {
        submit.dataset.busy = "false";
        submit.textContent = "Request a quote";
        status.textContent = "Your email app should now be open with the request filled in. If it did not open, email sales@ironforgefitness.com or call (800) 555-4766.";
      }, 600);
    });
  }

  /* ----------------------------------------------------------------------
     Legal pages. The contents list follows the reader: the current section
     is marked, earlier ones are marked passed, and --progress (0 to 1) is
     set on the list for the version's own rail or highlight to use.
     ---------------------------------------------------------------------- */

  var legalToc = document.querySelector("[data-legal-toc]");

  if (legalToc && "IntersectionObserver" in window) {
    var tocLinks = Array.prototype.slice.call(legalToc.querySelectorAll('a[href^="#"]'));
    var tocHeads = tocLinks.map(function (a) { return document.getElementById(a.getAttribute("href").slice(1)); });
    var tocCurrent = -1;

    var markToc = function (index) {
      if (index === tocCurrent || index < 0) return;
      tocCurrent = index;
      tocLinks.forEach(function (a, i) {
        a.classList.toggle("is-active", i === index);
        a.classList.toggle("is-passed", i < index);
        if (i === index) a.setAttribute("aria-current", "location");
        else a.removeAttribute("aria-current");
      });
      legalToc.style.setProperty("--progress", tocLinks.length > 1 ? String(index / (tocLinks.length - 1)) : "1");
    };

    var tocObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) markToc(tocHeads.indexOf(entry.target));
      });
    }, { rootMargin: "-18% 0px -72% 0px" });

    tocHeads.forEach(function (head) { if (head) tocObserver.observe(head); });
    markToc(0);
  }

})();
