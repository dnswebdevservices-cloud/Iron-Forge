/* ==========================================================================
   IRONFORGE v3  /  Industrial

   Motion, all through GSAP 3.13 and ScrollTrigger from the CDN:
     - Headline lines wipe upward through a clip-path, staggered.
     - Hero photograph settles from scale 1.15 to 1 on load, power3.out.
     - "Installed for" names run as an infinite marquee that pauses on hover,
       on keyboard focus, and whenever the strip is off screen.
     - Sections reveal once as they arrive. Stats count up once.
     - Photographs drift a few percent against their frames while scrolling.
   Hover inversions and the nav underline are CSS, 150ms linear.

   Everything above is created inside gsap.matchMedia for visitors without a
   reduced-motion preference. With the preference set, nothing is staged and
   nothing moves. There is no scroll event listener anywhere in this file.
   ========================================================================== */

(function () {
  "use strict";

  var root = document.documentElement;
  var fmt = new Intl.NumberFormat("en-US");

  /* ----------------------------------------------------------------------
     Mobile menu
     ---------------------------------------------------------------------- */

  var menuBtn = document.getElementById("menu");
  var menuLabel = document.getElementById("menu-label");
  var nav = document.getElementById("nav");

  function setMenu(open) {
    nav.dataset.open = String(open);
    menuBtn.setAttribute("aria-expanded", String(open));
    menuLabel.textContent = open ? "Close" : "Menu";
  }

  if (menuBtn && nav && menuLabel) {
    menuBtn.addEventListener("click", function () { setMenu(nav.dataset.open !== "true"); });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.dataset.open === "true") {
        setMenu(false);
        menuBtn.focus();
      }
    });
  }

  /* ----------------------------------------------------------------------
     Current section in the navigation. The signal underline stays on the
     link for whichever section holds the middle of the viewport.
     ---------------------------------------------------------------------- */

  var navLinks = nav ? nav.querySelectorAll('a[href^="#"]:not(.nav__quote)') : [];

  if (navLinks.length && "IntersectionObserver" in window) {
    var byId = {};
    navLinks.forEach(function (a) { byId[a.getAttribute("href").slice(1)] = a; });

    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = byId[entry.target.id];
        if (!link) return;
        if (entry.isIntersecting) {
          navLinks.forEach(function (a) { a.removeAttribute("aria-current"); });
          link.setAttribute("aria-current", "true");
        } else if (link.getAttribute("aria-current") === "true") {
          link.removeAttribute("aria-current");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });

    Object.keys(byId).forEach(function (id) {
      var section = document.getElementById(id);
      if (section) spy.observe(section);
    });
  }

  /* ----------------------------------------------------------------------
     Quote form. Validates inline, then drafts the request in the visitor's
     own email app, addressed to sales. The same form posts natively through
     its mailto action when scripting is off.
     ---------------------------------------------------------------------- */

  var form = document.getElementById("form");
  var done = document.getElementById("done");

  if (form && done) {
    var submit = document.getElementById("submit");
    var again = document.getElementById("again");
    var dirty = false;

    var rules = [
      { id: "name",
        test: function (v) { return v.trim().length > 1; },
        message: "Enter the name the quote should be addressed to." },
      { id: "email",
        test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); },
        message: "Enter an email the quote can be sent to, like name@yourgym.com." },
      { id: "details",
        test: function (v) { return v.trim().length > 9; },
        message: "Add the floor size and the stations you need so it can be priced." }
    ];

    function field(id) { return document.getElementById(id); }

    function show(rule, ok) {
      var input = field(rule.id);
      var err = field(rule.id + "-err");
      input.closest(".field").dataset.invalid = String(!ok);
      input.setAttribute("aria-invalid", String(!ok));
      err.textContent = ok ? "" : rule.message;
      return ok;
    }

    // A field is only re-checked after it has failed once, so nobody is
    // corrected while typing a first answer.
    rules.forEach(function (rule) {
      var input = field(rule.id);
      input.addEventListener("input", function () {
        if (input.closest(".field").dataset.invalid === "true" && rule.test(input.value)) show(rule, true);
      });
      input.addEventListener("blur", function () {
        if (input.closest(".field").dataset.invalid === "true") show(rule, rule.test(input.value));
      });
    });

    form.addEventListener("input", function () { dirty = true; });

    window.addEventListener("beforeunload", function (e) {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var failed = rules.filter(function (rule) { return !show(rule, rule.test(field(rule.id).value)); });
      if (failed.length) {
        field(failed[0].id).focus();
        return;
      }

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

      var href = "mailto:sales@ironforgefitness.com"
        + "?subject=" + encodeURIComponent("Quote request: " + interest)
        + "&body=" + encodeURIComponent(body);

      submit.setAttribute("aria-disabled", "true");
      submit.textContent = "Opening email…";

      // The request now lives in the email draft, so leaving is safe.
      dirty = false;
      window.location.href = href;

      setTimeout(function () {
        submit.removeAttribute("aria-disabled");
        submit.textContent = "Request a quote";
        form.hidden = true;
        done.hidden = false;
        done.focus();
      }, 600);
    });

    // Values are kept, so editing picks up exactly where the draft left off.
    again.addEventListener("click", function () {
      done.hidden = true;
      form.hidden = false;
      field("name").focus();
    });
  }

  /* ----------------------------------------------------------------------
     Back to top. Shows once the first block of the page has scrolled away.
     After scrolling up, focus returns to the top of the page. On the home
     page the readout under the arrow tracks scroll progress; see below.
     ---------------------------------------------------------------------- */

  var toTop = document.getElementById("to-top");

  if (toTop) {
    // A marker most of a screen down the page. Once it has scrolled up past
    // the top edge the button appears; this works the same on long pages
    // and on the legal pages, whose first block never leaves the screen.
    var marker = document.createElement("div");
    marker.setAttribute("aria-hidden", "true");
    marker.style.cssText = "position:absolute;left:0;top:90vh;width:1px;height:1px;pointer-events:none";
    document.body.appendChild(marker);

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (e) {
        toTop.classList.toggle("is-shown", !e[0].isIntersecting && e[0].boundingClientRect.top < 0);
      }).observe(marker);
    } else {
      toTop.classList.add("is-shown");
    }

    toTop.addEventListener("click", function () {
      var calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: 0, behavior: calm ? "auto" : "smooth" });
      var mainEl = document.getElementById("main");
      if (mainEl) mainEl.focus({ preventScroll: true });
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

  /* ----------------------------------------------------------------------
     Motion
     ---------------------------------------------------------------------- */

  if (!(window.gsap && window.ScrollTrigger)) {
    root.classList.remove("motion");
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  root.classList.add("motion-live");

  // Back-to-top readout: scroll progress as a percentage.
  var toTopRead = document.getElementById("to-top-read");
  if (toTopRead) {
    var showProgress = function (self) { toTopRead.textContent = Math.round(self.progress * 100) + "%"; };
    var progress = ScrollTrigger.create({ start: 0, end: "max", onUpdate: showProgress, onRefresh: showProgress });
    showProgress(progress);
  }

  var mm = gsap.matchMedia();

  mm.add("(prefers-reduced-motion: no-preference)", function () {

    // Intro. Lines wipe upward through their clip, one after another.
    var intro = gsap.timeline({ defaults: { ease: "power4.out" } });

    intro
      .fromTo(".hero__tag", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6 }, 0)
      .fromTo(".hero__title .line",
        { clipPath: "inset(100% 0% 0% 0%)", yPercent: 24 },
        { clipPath: "inset(0% 0% 0% 0%)", yPercent: 0, duration: 1.15, stagger: 0.12 }, 0.1)
      .fromTo([".hero .lede", ".hero__actions", ".ledger"],
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.1 }, 0.6)
      .fromTo(".spec-card",
        { opacity: 0, y: 32 },
        { opacity: 1, y: 0, duration: 0.9, ease: "power3.out" }, 0.85);

    gsap.fromTo("#hero-img", { scale: 1.15 }, { scale: 1, duration: 2.6, ease: "power3.out" });

    // Hero photograph drifts as the hero scrolls away.
    gsap.to(".hero__drift", {
      yPercent: 7,
      ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
    });

    // Marquee. Two identical tracks, so moving the rail by half its width
    // loops without a seam.
    var marquee = document.getElementById("marquee");
    var rail = document.getElementById("marquee-rail");
    var loop = gsap.to(rail, { xPercent: -50, ease: "none", duration: 34, repeat: -1 });
    var held = false;
    var onScreen = true;

    function sync() { if (held || !onScreen) loop.pause(); else loop.play(); }
    function hold() { held = true; sync(); }
    function release() { held = false; sync(); }

    marquee.addEventListener("mouseenter", hold);
    marquee.addEventListener("mouseleave", release);
    marquee.addEventListener("focusin", hold);
    marquee.addEventListener("focusout", release);

    ScrollTrigger.create({
      trigger: marquee,
      start: "top bottom",
      end: "bottom top",
      onToggle: function (self) { onScreen = self.isActive; sync(); }
    });

    // Sections reveal once. Opacity only, never visibility, so content that
    // has not scrolled in yet stays reachable by keyboard; and if focus
    // lands inside an unrevealed block, it finishes revealing immediately.
    gsap.utils.toArray("[data-reveal]").forEach(function (el) {
      var reveal = gsap.fromTo(el, { opacity: 0, y: 48 }, {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 88%", once: true }
      });
      el.addEventListener("focusin", function () { reveal.progress(1); }, { once: true });
    });

    // Stats count up once, formatted as they climb.
    var stats = gsap.utils.toArray("[data-count]");
    ScrollTrigger.create({
      trigger: "#stats",
      start: "top 80%",
      once: true,
      onEnter: function () {
        stats.forEach(function (el) {
          var target = parseInt(el.dataset.count, 10);
          var suffix = el.dataset.suffix || "";
          var counter = { value: 0 };
          gsap.to(counter, {
            value: target,
            duration: 1.8,
            ease: "power2.out",
            onUpdate: function () { el.textContent = fmt.format(Math.round(counter.value)) + suffix; }
          });
        });
      }
    });

    // Photographs drift against their frames.
    gsap.utils.toArray("[data-drift]").forEach(function (el) {
      gsap.fromTo(el, { yPercent: -5 }, {
        yPercent: 5,
        ease: "none",
        scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true }
      });
    });

    return function () {
      marquee.removeEventListener("mouseenter", hold);
      marquee.removeEventListener("mouseleave", release);
      marquee.removeEventListener("focusin", hold);
      marquee.removeEventListener("focusout", release);
    };
  });

  // Web fonts change measured heights after first layout.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  }
})();
