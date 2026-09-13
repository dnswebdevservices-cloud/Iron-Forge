/* ==========================================================================
   IRONFORGE v2

   Motion inventory. Every item has a one-line reason, per the taste skill's
   "motion must be motivated" rule.

     Hero intro       hierarchy: the headline lands first, then the evidence.
     Hero parallax    depth: the floating cards separate from the photograph.
     Bento assemble   storytelling: the capability claim, then the proof.
     Figures count    hierarchy: the two numbers are the point of the cell.
     Equipment pan    storytelling: walk the range one line at a time.
     Showroom zoom    depth: the floor opens up as you arrive at it.
     Theme reveal     state transition: shows where the change came from.
     Disclosure, form feedback: answers the click.

   There is no scroll event listener in this file. Scroll-linked motion runs
   through GSAP ScrollTrigger; one-shot reveals use IntersectionObserver.
   Under prefers-reduced-motion none of the scroll-linked work is created.
   ========================================================================== */

(function () {
  "use strict";

  var root = document.documentElement;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  var colours = { turf: "#e8f1ea", cobalt: "#eaeef7", brick: "#f6ebe6", night: "#111315" };
  var metaTheme = document.getElementById("theme-color");

  /* ----------------------------------------------------------------------
     Hero intro. Starts on load, with a ceiling so a slow image never holds
     the headline back.
     ---------------------------------------------------------------------- */

  function ready() { root.classList.add("is-ready"); }

  if (document.readyState === "complete") ready();
  else {
    window.addEventListener("load", ready, { once: true });
    setTimeout(ready, 1200);
  }

  /* ----------------------------------------------------------------------
     Header. A 1px sentinel at the top of the page reports scroll state.
     ---------------------------------------------------------------------- */

  var header = document.querySelector(".header");

  if (header && "IntersectionObserver" in window) {
    var sentinel = document.createElement("div");
    sentinel.setAttribute("aria-hidden", "true");
    sentinel.style.cssText = "position:absolute;top:0;left:0;width:1px;height:1px;pointer-events:none";
    document.body.prepend(sentinel);

    new IntersectionObserver(function (e) {
      header.dataset.stuck = String(!e[0].isIntersecting);
    }).observe(sentinel);
  }

  /* ----------------------------------------------------------------------
     Themes. Native radio inputs. The new palette opens as a circle from the
     swatch that was pressed, using the View Transitions API where the
     browser has it and an instant swap where it does not.
     ---------------------------------------------------------------------- */

  var radios = document.querySelectorAll('input[name="theme"]');

  function swapTheme(name) {
    root.classList.add("theme-switching");
    root.setAttribute("data-theme", name);
    if (metaTheme) metaTheme.setAttribute("content", colours[name]);
    try { localStorage.setItem("ironforge-theme", name); } catch (e) { /* private mode */ }
    // Commit the new colours with transitions off, then allow them again.
    void root.offsetWidth;
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { root.classList.remove("theme-switching"); });
    });
  }

  function applyTheme(name, origin) {
    if (!colours[name] || root.getAttribute("data-theme") === name) return;

    if (!document.startViewTransition || reduced.matches || !origin) {
      swapTheme(name);
      return;
    }

    var box = origin.getBoundingClientRect();
    var x = box.left + box.width / 2;
    var y = box.top + box.height / 2;
    var radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));

    // A soft, feathered edge where the browser can animate a registered
    // custom property inside a mask; a crisp circle everywhere else.
    var soft = !!(window.CSS && CSS.registerProperty &&
      CSS.supports("mask-image", "radial-gradient(#000, transparent)"));
    var feather = 140;

    root.style.setProperty("--vt-x", x + "px");
    root.style.setProperty("--vt-y", y + "px");
    if (soft) root.classList.add("vt-soft");

    var transition = document.startViewTransition(function () { swapTheme(name); });
    var timing = { duration: 1400, easing: "cubic-bezier(0.65, 0, 0.35, 1)",
                   pseudoElement: "::view-transition-new(root)", fill: "forwards" };

    transition.ready.then(function () {
      if (soft) {
        root.animate({ "--vt-r": ["0px", (radius + feather) + "px"] }, timing);
      } else {
        root.animate(
          { clipPath: ["circle(0px at " + x + "px " + y + "px)",
                       "circle(" + radius + "px at " + x + "px " + y + "px)"] },
          timing
        );
      }
    }).catch(function () { /* transition skipped, swap already applied */ });

    transition.finished.finally(function () { root.classList.remove("vt-soft"); });
  }

  radios.forEach(function (radio) {
    radio.checked = radio.value === root.getAttribute("data-theme");
    radio.addEventListener("change", function () {
      if (radio.checked) applyTheme(radio.value, radio.closest(".swatch"));
    });
  });

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
    document.documentElement.classList.toggle("menu-open", open);
    if (header) header.dataset.menu = String(open);
  }

  if (menuBtn && nav) {
    menuBtn.addEventListener("click", function () { setMenu(nav.dataset.open !== "true"); });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.dataset.open === "true") { setMenu(false); menuBtn.focus(); }
    });
  }

  /* ----------------------------------------------------------------------
     Equipment rail buttons (used whenever the section is not pinned).
     Arrow state comes from observing the first and last panels.
     ---------------------------------------------------------------------- */

  var rail = document.getElementById("rail");
  var prev = document.getElementById("prev");
  var next = document.getElementById("next");
  var stack = document.getElementById("stack");

  if (rail && prev && next) {
    var panels = rail.querySelectorAll(".panel");

    function step(dir) {
      var first = panels[0];
      var by = first ? first.getBoundingClientRect().width + 20 : rail.clientWidth * 0.8;
      rail.scrollBy({ left: dir * by, behavior: reduced.matches ? "auto" : "smooth" });
    }

    prev.addEventListener("click", function () { step(-1); });
    next.addEventListener("click", function () { step(1); });

    if ("IntersectionObserver" in window && panels.length) {
      var edges = new IntersectionObserver(function (list) {
        list.forEach(function (o) {
          if (o.target === panels[0]) prev.disabled = o.isIntersecting;
          if (o.target === panels[panels.length - 1]) next.disabled = o.isIntersecting;
        });
      }, { root: rail, threshold: 0.85 });

      edges.observe(panels[0]);
      edges.observe(panels[panels.length - 1]);
    }
  }

  /* ----------------------------------------------------------------------
     Bento. Assembles once, then the two figures count up.
     ---------------------------------------------------------------------- */

  var bento = document.getElementById("bento");
  var fmt = new Intl.NumberFormat();

  function countUp(el) {
    var target = parseInt(el.dataset.count, 10);
    var suffix = el.dataset.suffix || "";
    if (!Number.isFinite(target)) return;

    if (reduced.matches) { el.textContent = fmt.format(target) + suffix; return; }

    var start = null;
    var duration = 1300;

    function tick(now) {
      if (start === null) start = now;
      var t = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - t, 4);
      el.textContent = fmt.format(Math.round(target * eased)) + suffix;
      if (t < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  if (bento) {
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (list, self) {
        if (!list[0].isIntersecting) return;
        self.disconnect();
        bento.classList.add("is-in");
        bento.querySelectorAll("[data-count]").forEach(countUp);
      }, { threshold: 0.25 }).observe(bento);
    } else {
      bento.classList.add("is-in");
    }
  }

  /* ----------------------------------------------------------------------
     Scroll-linked motion. GSAP matchMedia builds each piece only while its
     condition holds and reverts it cleanly when the condition stops.
     If the CDN is unreachable the page simply stays static.
     ---------------------------------------------------------------------- */

  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    var mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", function () {
      // Hero parallax on the independent `translate` property.
      document.querySelectorAll(".collage [data-depth]").forEach(function (el) {
        gsap.fromTo(el, { "--py": "0px" }, {
          "--py": el.dataset.depth + "px",
          ease: "none",
          scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
        });
      });

      // Showroom: the photograph settles from a slight zoom as it arrives.
      var showImg = document.getElementById("show-img");
      if (showImg) {
        gsap.fromTo(showImg, { scale: 1.16 }, {
          scale: 1,
          ease: "none",
          scrollTrigger: { trigger: ".show__band", start: "top bottom", end: "bottom 40%", scrub: true }
        });
      }
    });

    // Process timeline. The rail fills as the reader moves down it, and each
    // step number lights as its card crosses the upper third of the screen.
    mm.add("(prefers-reduced-motion: no-preference)", function () {
      var fill = document.getElementById("timeline-fill");
      if (fill) {
        gsap.fromTo(fill, { scaleY: 0 }, {
          scaleY: 1,
          ease: "none",
          scrollTrigger: { trigger: "#timeline", start: "top 65%", end: "bottom 60%", scrub: 0.6 }
        });
      }
      document.querySelectorAll(".tl-step").forEach(function (step) {
        ScrollTrigger.create({
          trigger: step,
          start: "top 62%",
          onEnter: function () { step.classList.add("is-lit"); },
          onLeaveBack: function () { step.classList.remove("is-lit"); }
        });
      });
      return function () {
        document.querySelectorAll(".tl-step").forEach(function (step) { step.classList.remove("is-lit"); });
      };
    });

    // Equipment stack. As each card arrives at its resting place, the card
    // beneath it scales back slightly and fades toward the page colour, so
    // the stack reads as depth rather than cards simply overlapping.
    mm.add("(min-width: 961px) and (prefers-reduced-motion: no-preference)", function () {
      if (!stack) return;
      var cards = gsap.utils.toArray(stack.querySelectorAll(".panel"));
      var rem = parseFloat(getComputedStyle(document.documentElement).fontSize);

      cards.forEach(function (card, i) {
        var nextCard = cards[i + 1];
        if (!nextCard) return;
        var shade = card.querySelector(".panel__shade");

        gsap.timeline({
          scrollTrigger: {
            trigger: nextCard,
            start: "top 85%",
            end: function () { return "top " + Math.round(6 * rem + (i + 1) * 1.25 * rem) + "px"; },
            scrub: true,
            invalidateOnRefresh: true
          }
        })
          .to(card, { scale: 0.94 - (cards.length - 2 - i) * 0.01, ease: "none" }, 0)
          .to(shade, { opacity: 0.55, ease: "none" }, 0);
      });
    });

    // Fonts can change measured widths after first layout.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
    }
  }

  if (!(window.gsap && window.ScrollTrigger) || reduced.matches) {
    document.querySelectorAll(".tl-step").forEach(function (step) { step.classList.add("is-lit"); });
  }

  /* ----------------------------------------------------------------------
     Current section in the navigation, from IntersectionObserver.
     ---------------------------------------------------------------------- */

  var navLinks = nav ? nav.querySelectorAll('a[href^="#"]:not(.nav__quote)') : [];

  if (navLinks.length && "IntersectionObserver" in window) {
    var linkFor = {};
    navLinks.forEach(function (a) { linkFor[a.getAttribute("href").slice(1)] = a; });

    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = linkFor[entry.target.id];
        if (!link) return;
        if (entry.isIntersecting) {
          navLinks.forEach(function (a) { a.removeAttribute("aria-current"); });
          link.setAttribute("aria-current", "true");
        } else if (link.getAttribute("aria-current") === "true") {
          link.removeAttribute("aria-current");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });

    Object.keys(linkFor).forEach(function (id) {
      var section = document.getElementById(id);
      if (section) spy.observe(section);
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


  // Legal cards settle in just before they reach the screen, so the text is
  // already still by the time it is read. Opacity and transform only, so a
  // card that has not scrolled in yet is still reachable by keyboard.
  var legalCards = document.querySelectorAll("[data-legal-reveal]");
  if (legalCards.length) {
    var calmLegal = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if ("IntersectionObserver" in window && !calmLegal) {
      var cardObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          cardObserver.unobserve(entry.target);
        });
      }, { rootMargin: "0px 0px 12% 0px" });
      legalCards.forEach(function (card) {
        cardObserver.observe(card);
        card.addEventListener("focusin", function () { card.classList.add("is-in"); }, { once: true });
      });
    } else {
      legalCards.forEach(function (card) { card.classList.add("is-in"); });
    }
  }

  /* ----------------------------------------------------------------------
     Scroll reveals for the key blocks. Opacity and transform only, so a
     block that has not scrolled in is still reachable by keyboard; focus
     landing inside one reveals it at once.
     ---------------------------------------------------------------------- */

  var revealables = document.querySelectorAll("[data-reveal]");

  if (revealables.length) {
    if ("IntersectionObserver" in window && !reduced.matches) {
      var revealer = new IntersectionObserver(function (list) {
        list.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          revealer.unobserve(entry.target);
        });
      }, { rootMargin: "0px 0px -12% 0px" });

      revealables.forEach(function (el) {
        revealer.observe(el);
        el.addEventListener("focusin", function () { el.classList.add("is-in"); }, { once: true });
      });
    } else {
      revealables.forEach(function (el) { el.classList.add("is-in"); });
    }
  }

  /* ----------------------------------------------------------------------
     Back to top. Appears once the first block of the page has scrolled
     away; its ring fills with reading progress where ScrollTrigger is
     available. After scrolling up, focus returns to the top of the page.
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
      window.scrollTo({ top: 0, behavior: reduced.matches ? "auto" : "smooth" });
      var mainEl = document.getElementById("main");
      if (mainEl) mainEl.focus({ preventScroll: true });
    });

    var ring = document.getElementById("to-top-progress");
    if (ring && window.ScrollTrigger) {
      ScrollTrigger.create({
        start: 0,
        end: "max",
        onUpdate: function (self) { ring.style.strokeDashoffset = String(100 - self.progress * 100); }
      });
    } else {
      toTop.classList.add("to-top--plain");
    }
  }

  /* ----------------------------------------------------------------------
     Quote form
     ---------------------------------------------------------------------- */

  var form = document.getElementById("form");
  var done = document.getElementById("done");

  if (form) {
    var submit = document.getElementById("submit");
    var label = submit.querySelector(".btn__label");
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
        message: "Add the floor size and what you need so it can be priced." }
    ];

    function show(rule, ok) {
      var input = document.getElementById(rule.id);
      var err = document.getElementById(rule.id + "-err");
      input.closest(".field").dataset.invalid = String(!ok);
      input.setAttribute("aria-invalid", String(!ok));
      if (err) err.textContent = ok ? "" : rule.message;
      return ok;
    }

    // A field is only re-checked after it has failed once, so nobody is
    // told off while typing their first answer.
    rules.forEach(function (rule) {
      var input = document.getElementById(rule.id);
      input.addEventListener("input", function () {
        if (input.closest(".field").dataset.invalid === "true" && rule.test(input.value)) show(rule, true);
      });
      input.addEventListener("blur", function () {
        if (input.closest(".field").dataset.invalid === "true") show(rule, rule.test(input.value));
      });
    });

    form.addEventListener("input", function () { dirty = true; });

    // Warn before leaving with an unsent request.
    window.addEventListener("beforeunload", function (e) {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var failed = rules.filter(function (rule) {
        return !show(rule, rule.test(document.getElementById(rule.id).value));
      });

      if (failed.length) {
        document.getElementById(failed[0].id).focus();
        return;
      }

      // Draft the request in the visitor's own email app, addressed to
      // sales. This runs inside the click, which browsers require before
      // they will open a mailto link.
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
      submit.setAttribute("aria-disabled", "true");
      label.textContent = "Opening email…";

      dirty = false;
      window.location.href = "mailto:sales@ironforgefitness.com"
        + "?subject=" + encodeURIComponent("Quote request: " + interest)
        + "&body=" + encodeURIComponent(body);

      setTimeout(function () {
        submit.dataset.busy = "false";
        submit.removeAttribute("aria-disabled");
        label.textContent = "Request a quote";
        form.hidden = true;
        done.hidden = false;
        done.focus();
      }, 600);
    });

    if (again) {
      again.addEventListener("click", function () {
        done.hidden = true;
        form.hidden = false;
        document.getElementById("name").focus();
      });
    }
  }
})();
