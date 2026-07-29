/* ============================================================
   CHINACHEM GROUP — motion system
   GSAP + ScrollTrigger + SplitText + Lenis
   ============================================================ */

gsap.registerPlugin(ScrollTrigger, SplitText);

const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;

document.body.classList.add("is-loading");

/* ---------- smooth scroll ---------- */

let lenis = null;

if (!prefersReduced) {
  lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1 });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop(); // resume after the loader
}

function scrollToTarget(selector) {
  const target = document.querySelector(selector);
  if (!target) return;
  if (lenis) lenis.scrollTo(target, { duration: 1.6 });
  else target.scrollIntoView({ behavior: "smooth" });
}

// Anchor links route through Lenis
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  const href = a.getAttribute("href");
  if (href.length < 2) return;
  a.addEventListener("click", (e) => {
    e.preventDefault();
    scrollToTarget(href);
  });
});

/* ---------- split text helper ---------- */

function splitLines(el) {
  try {
    return new SplitText(el, { type: "lines", linesClass: "split-line", mask: "lines" }).lines;
  } catch (err) {
    return [el];
  }
}

/* ---------- loader → hero intro ---------- */

function runIntro() {
  const loader = document.querySelector(".loader");
  const letters = loader.querySelectorAll(".loader__letter");
  const count = loader.querySelector(".loader__count");
  const heroTitleLines = splitLines(document.querySelector(".hero__title"));
  const heroFades = document.querySelectorAll(".hero .anim-fade");
  const heroMedia = document.querySelector(".hero__media");
  const heroImg = heroMedia.querySelector("img");
  const nav = document.querySelector(".nav");

  const baseScale = (img) => parseFloat(img.dataset.baseScale) || 1;

  gsap.set(nav, { yPercent: -120 });
  gsap.set(heroTitleLines, { yPercent: 110 });
  gsap.set(heroFades, { autoAlpha: 0, y: 24 });
  gsap.set(heroMedia, { clipPath: "inset(0% 0% 100% 0%)" });
  gsap.set(heroImg, { scale: 1.35 });

  if (prefersReduced) {
    gsap.set([nav, heroTitleLines, heroFades], { clearProps: "all" });
    gsap.set(heroMedia, { clipPath: "inset(0% 0% 0% 0%)" });
    gsap.set(heroImg, { scale: baseScale(heroImg) });
    loader.remove();
    document.body.classList.remove("is-loading");
    return;
  }

  const counter = { value: 0 };
  const tl = gsap.timeline({
    defaults: { ease: "power4.out" },
    onComplete: () => {
      loader.remove();
      document.body.classList.remove("is-loading");
      if (lenis) lenis.start();
      ScrollTrigger.refresh();
    },
  });

  tl.from(letters, { yPercent: 120, duration: 1.1, stagger: 0.045, ease: "expo.out" })
    .from(".loader__meta", { autoAlpha: 0, y: 12, duration: 0.6 }, "-=0.5")
    .to(
      counter,
      {
        value: 100,
        duration: 1.4,
        ease: "power2.inOut",
        onUpdate: () => (count.textContent = String(Math.round(counter.value)).padStart(2, "0")),
      },
      "<"
    )
    .to(".loader__inner", { autoAlpha: 0, y: -30, duration: 0.6, ease: "power2.in" }, "+=0.15")
    .to(".loader__curtain", { yPercent: -100, duration: 1.1, ease: "expo.inOut" }, "-=0.15")

    // hero entrance
    .to(heroMedia, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.5, ease: "expo.inOut" }, "-=0.8")
    .to(heroImg, { scale: () => baseScale(heroImg), duration: 1.9, ease: "expo.out" }, "<+=0.2")
    .to(heroTitleLines, { yPercent: 0, duration: 1.3, ease: "expo.out", stagger: 0.09 }, "<+=0.3")
    .to(heroFades, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.08 }, "<+=0.3")
    .to(nav, { yPercent: 0, duration: 1, ease: "expo.out" }, "<");
}

/* ---------- nav hide / reveal ---------- */

function initNav() {
  const nav = document.querySelector(".nav");
  ScrollTrigger.create({
    start: "top top",
    end: "max",
    onUpdate: (self) => {
      if (self.scroll() < 120) return nav.classList.remove("is-hidden");
      nav.classList.toggle("is-hidden", self.direction === 1);
    },
  });
}

/* ---------- overlay menu ---------- */

function initMenu() {
  const menu = document.querySelector(".menu");
  const btn = document.querySelector("[data-menu-toggle]");
  const label = btn.querySelector(".nav__menu-label");
  const links = menu.querySelectorAll(".menu__link");
  let isOpen = false;

  const tl = gsap.timeline({ paused: true });
  tl.set(menu, { visibility: "visible" })
    .to(menu, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.9, ease: "expo.inOut" })
    .fromTo(links, { y: 44, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7, stagger: 0.055, ease: "power3.out" }, "-=0.35")
    .fromTo(".menu__foot", { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.5 }, "-=0.4");

  function toggle(force) {
    isOpen = force !== undefined ? force : !isOpen;
    document.body.classList.toggle("is-menu-open", isOpen);
    btn.setAttribute("aria-expanded", String(isOpen));
    menu.setAttribute("aria-hidden", String(!isOpen));
    label.textContent = isOpen ? "Close" : "Menu";
    if (isOpen) {
      if (lenis) lenis.stop();
      tl.timeScale(1).play();
    } else {
      if (lenis && !document.body.classList.contains("is-loading")) lenis.start();
      tl.timeScale(1.4).reverse();
    }
  }

  btn.addEventListener("click", () => toggle());

  links.forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      toggle(false);
      gsap.delayedCall(0.5, () => scrollToTarget(a.getAttribute("href")));
    });
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen) toggle(false);
  });
}

/* ---------- section headline & fade reveals ---------- */

function initHeadlines() {
  document.querySelectorAll("[data-split]").forEach((el) => {
    if (el.closest(".hero")) return; // handled by intro
    const lines = splitLines(el);
    gsap.set(lines, { yPercent: 110 });
    gsap.to(lines, {
      yPercent: 0,
      duration: 1.2,
      ease: "expo.out",
      stagger: 0.09,
      scrollTrigger: { trigger: el, start: "top 85%" },
    });
  });

  document.querySelectorAll(".anim-fade").forEach((el) => {
    if (el.closest(".hero")) return;
    gsap.fromTo(
      el,
      { autoAlpha: 0, y: 24 },
      { autoAlpha: 1, y: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%" } }
    );
  });
}

/* ---------- generic reveals ---------- */

function initReveals() {
  document.querySelectorAll("[data-reveal]").forEach((el, i) => {
    gsap.fromTo(
      el,
      { autoAlpha: 0, y: 50 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 1.1,
        ease: "power3.out",
        delay: (i % 4) * 0.08,
        scrollTrigger: { trigger: el, start: "top 88%" },
      }
    );
  });
}

/* ---------- parallax ---------- */

function initParallax() {
  // Each image gets a base "cover" scale big enough that translating it
  // never exposes the container edges; the strength's sign sets direction.
  document.querySelectorAll("[data-parallax]").forEach((el) => {
    const strength = parseFloat(el.dataset.parallax) || 12;
    const img = el.tagName === "IMG" ? el : el.querySelector("img");
    if (!img) return;

    const base = Math.max(1.1, 1 + (Math.abs(strength) * 1.3) / 100);
    img.dataset.baseScale = base;
    gsap.set(img, { scale: base });

    gsap.fromTo(
      img,
      { yPercent: -strength / 2 },
      {
        yPercent: strength / 2,
        ease: "none",
        scrollTrigger: {
          trigger: el.tagName === "IMG" ? el.parentElement : el,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      }
    );
  });
}

/* ---------- word-by-word scrub (about intro) ---------- */

function initWordScrub() {
  document.querySelectorAll("[data-scrub-words]").forEach((el) => {
    let words;
    try {
      words = new SplitText(el, { type: "words", wordsClass: "w" }).words;
    } catch (err) {
      return;
    }
    gsap.fromTo(
      words,
      { opacity: 0.14, y: 6 },
      {
        opacity: 1,
        y: 0,
        ease: "none",
        stagger: 0.06,
        scrollTrigger: { trigger: el, start: "top 78%", end: "bottom 45%", scrub: 0.6 },
      }
    );
  });
}

/* ---------- slider engine (portfolio / stats / news) ---------- */

function initSliders() {
  const pad = (n) => String(n).padStart(2, "0");

  document.querySelectorAll("[data-slider]").forEach((root) => {
    const viewport = root.querySelector("[data-slider-viewport]");
    const track = root.querySelector("[data-slider-track]");
    const slides = Array.from(track.children);
    const prev = root.querySelector("[data-prev]");
    const next = root.querySelector("[data-next]");
    const current = root.querySelector("[data-current]");
    const total = root.querySelector("[data-total]");
    const progress = root.querySelector("[data-progress]");

    if (total) total.textContent = pad(slides.length);

    let index = 0;

    const step = () => {
      const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 0;
      return slides[0].getBoundingClientRect().width + gap;
    };

    const maxIndex = () => {
      const visible = Math.max(1, Math.round(viewport.clientWidth / step()));
      return Math.max(0, slides.length - visible);
    };

    function go(i, instant = false) {
      index = Math.max(0, Math.min(i, maxIndex()));
      gsap.to(track, { x: -index * step(), duration: instant ? 0 : 1, ease: "expo.out" });

      if (current) current.textContent = pad(index + 1);
      if (progress) {
        const p = maxIndex() === 0 ? 1 : index / maxIndex();
        gsap.to(progress, { scaleX: Math.max(p, 0.02), duration: instant ? 0 : 1, ease: "expo.out" });
      }
      if (prev) prev.disabled = index === 0;
      if (next) next.disabled = index === maxIndex();
    }

    if (prev) prev.addEventListener("click", () => go(index - 1));
    if (next) next.addEventListener("click", () => go(index + 1));

    window.addEventListener("resize", () => go(index, true));
    go(0, true);
  });
}

/* ---------- community spotlights ---------- */

const SPOTLIGHTS = [
  {
    title: "Warm Meals, Warm Hearts",
    copy:
      "Every week our kitchens turn surplus produce into hot, nourishing meals for elderly neighbours living alone — delivered by colleagues and residents, door to door.",
  },
  {
    title: "Roots & Routes",
    copy:
      "The CubeHouse is built using 75% reclaimed and/or biobased materials for the structure, mainly timber. About 3,700 m³ of sustainable timber will be used — storing a significant volume of CO₂ for generations.",
  },
  {
    title: "Colleagues Who Care",
    copy:
      "More than 1,200 CCG colleagues volunteer on company time each year — mentoring students, restoring trails, and staffing community clinics across every district we build in.",
  },
  {
    title: "Reeds in Harmony",
    copy:
      "At our wetland-edge developments, restored reed beds now shelter migratory birds and filter stormwater naturally — proof that density and biodiversity can share an address.",
  },
  {
    title: "Building Belonging",
    copy:
      "From rooftop farms to tool libraries, our placemaking team seeds the small shared rituals that turn a block of new addresses into a neighbourhood.",
  },
];

function initSpotlights() {
  const section = document.querySelector(".spotlights");
  if (!section) return;

  const items = section.querySelectorAll("[data-spot]");
  const figs = section.querySelectorAll("[data-spot-img]");
  const title = section.querySelector("[data-spot-title]");
  const copy = section.querySelector("[data-spot-copy]");
  let active = 0;

  function activate(i) {
    if (i === active) return;
    active = i;

    items.forEach((btn) => btn.classList.toggle("is-active", Number(btn.dataset.spot) === i));

    figs.forEach((fig) => {
      const on = Number(fig.dataset.spotImg) === i;
      if (on) {
        fig.classList.add("is-active");
        gsap.fromTo(fig, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8, ease: "power2.out" });
        gsap.fromTo(fig.querySelector("img"), { scale: 1.08 }, { scale: 1, duration: 1.4, ease: "expo.out" });
      } else {
        gsap.to(fig, { autoAlpha: 0, duration: 0.5, onComplete: () => fig.classList.remove("is-active") });
      }
    });

    gsap.to([title, copy], {
      autoAlpha: 0,
      y: 10,
      duration: 0.3,
      ease: "power2.in",
      onComplete: () => {
        title.innerHTML = `<em>${SPOTLIGHTS[i].title}</em>`;
        copy.textContent = SPOTLIGHTS[i].copy;
        gsap.to([title, copy], { autoAlpha: 1, y: 0, duration: 0.5, ease: "power3.out", stagger: 0.08 });
      },
    });
  }

  items.forEach((btn) => btn.addEventListener("click", () => activate(Number(btn.dataset.spot))));
}

/* ---------- stat counters ---------- */

function initCounters() {
  document.querySelectorAll("[data-count]").forEach((el) => {
    const target = parseInt(el.dataset.count, 10);
    const counter = { value: 0 };
    ScrollTrigger.create({
      trigger: el,
      start: "top 88%",
      once: true,
      onEnter: () =>
        gsap.to(counter, {
          value: target,
          duration: 2,
          ease: "power3.out",
          onUpdate: () => (el.textContent = Math.round(counter.value).toLocaleString("en-GB")),
        }),
    });
  });
}

/* ---------- magnetic elements ---------- */

function initMagnetic() {
  if (isTouch || prefersReduced) return;
  document.querySelectorAll("[data-magnetic]").forEach((el) => {
    const xTo = gsap.quickTo(el, "x", { duration: 0.7, ease: "elastic.out(1, 0.4)" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.7, ease: "elastic.out(1, 0.4)" });

    el.addEventListener("mousemove", (e) => {
      const rect = el.getBoundingClientRect();
      xTo((e.clientX - rect.left - rect.width / 2) * 0.3);
      yTo((e.clientY - rect.top - rect.height / 2) * 0.35);
    });
    el.addEventListener("mouseleave", () => {
      xTo(0);
      yTo(0);
    });
  });
}

/* ---------- custom cursor ---------- */

function initCursor() {
  if (isTouch || prefersReduced) return;
  const cursor = document.querySelector(".cursor");
  const xTo = gsap.quickTo(cursor, "x", { duration: 0.35, ease: "power3.out" });
  const yTo = gsap.quickTo(cursor, "y", { duration: 0.35, ease: "power3.out" });

  window.addEventListener("mousemove", (e) => {
    xTo(e.clientX);
    yTo(e.clientY);
  });

  document.querySelectorAll('[data-cursor="view"]').forEach((el) => {
    el.addEventListener("mouseenter", () => cursor.classList.add("is-view"));
    el.addEventListener("mouseleave", () => cursor.classList.remove("is-view"));
  });
}

/* ---------- boot ---------- */

window.addEventListener("load", () => {
  initNav();
  initMenu();
  initHeadlines();
  initReveals();
  initParallax();
  initWordScrub();
  initSliders();
  initSpotlights();
  initCounters();
  initMagnetic();
  initCursor();
  runIntro();
  ScrollTrigger.refresh();
});
