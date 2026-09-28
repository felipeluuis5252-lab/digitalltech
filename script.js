/* =========================================================
   AI & IT INCOME BLUEPRINT — script.js
   ========================================================= */

/* ---------- 1. EDIT THESE TWO LINES ---------- */
const CHECKOUT_URL = "https://pay.kiwify.com.br/d1njTyZ?afid=0qIqizw8";   // your checkout link (Kiwify, Hotmart, Stripe, etc.)
const PRICE_LABEL  = "€19.90";                      // price shown across the page

(function () {
  "use strict";

  var UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid"];
  var STORE_KEY = "aiit_utm";

  /* ---------- Price ---------- */
  document.querySelectorAll("[data-price]").forEach(function (el) { el.textContent = PRICE_LABEL; });

  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Meta Pixel helper (safe if Pixel is not installed yet) ---------- */
  function track(eventName, params) {
    try {
      if (typeof window.fbq === "function") window.fbq("track", eventName, params || {});
    } catch (e) { /* never break the page because of tracking */ }
  }
  // PageView is fired by the Meta Pixel base code in index.html (<!-- META PIXEL HERE -->)

  /* ---------- UTM persistence ---------- */
  function readSaved() {
    try { return JSON.parse(sessionStorage.getItem(STORE_KEY) || "{}"); } catch (e) { return {}; }
  }
  function saveUtms() {
    var saved = readSaved();
    var current = new URLSearchParams(window.location.search);
    UTM_KEYS.forEach(function (k) { if (current.has(k)) saved[k] = current.get(k); });
    try { sessionStorage.setItem(STORE_KEY, JSON.stringify(saved)); } catch (e) {}
    return saved;
  }
  var savedUtms = saveUtms();

  /* Build checkout URL keeping every query parameter from the current page + saved UTMs */
  function buildCheckoutUrl() {
    if (!CHECKOUT_URL || CHECKOUT_URL.indexOf("PASTE_CHECKOUT_URL") === 0) return null;
    var url;
    try { url = new URL(CHECKOUT_URL, window.location.href); } catch (e) { return null; }

    // 1) saved UTMs (from first landing)
    Object.keys(savedUtms).forEach(function (k) {
      if (!url.searchParams.has(k)) url.searchParams.set(k, savedUtms[k]);
    });
    // 2) every parameter currently in the address bar
    new URLSearchParams(window.location.search).forEach(function (v, k) {
      if (!url.searchParams.has(k)) url.searchParams.set(k, v);
    });
    return url.toString();
  }

  /* ---------- Every CTA uses CHECKOUT_URL ---------- */
  var ctas = document.querySelectorAll("[data-checkout]");
  var ready = buildCheckoutUrl();

  ctas.forEach(function (a) {
    if (ready) a.setAttribute("href", ready);

    a.addEventListener("click", function (e) {
      var target = buildCheckoutUrl();
      // Nav / hero / mid-page CTAs guide people down to the offer first;
      // the pricing, sticky and final CTAs go straight to checkout.
      var direct = ["pricing", "sticky", "final"].indexOf(a.dataset.cta) !== -1 || a.classList.contains("nav-cta");
      var offer = document.getElementById("offer");
      var offerVisible = offer && offer.getBoundingClientRect().top < window.innerHeight * 0.6 && offer.getBoundingClientRect().bottom > 0;

      if (!direct && !offerVisible) {
        e.preventDefault();
        // Hero CTA = curiosity step (show the opportunities); other mid-page CTAs go to the offer
        var dest = a.dataset.cta === "hero" ? document.getElementById("opportunities") : offer;
        if (dest) dest.scrollIntoView({ behavior: "smooth", block: "start" });
        if (a.classList.contains("nav-cta")) closeMenu();
        return;
      }

      if (!target) {
        e.preventDefault();
        console.warn("CHECKOUT_URL is not set. Edit script.js and paste your checkout link.");
        return;
      }
      track("InitiateCheckout", { content_name: "AI & IT Income Blueprint", currency: "EUR", value: parseFloat(PRICE_LABEL.replace(/[^\d.,]/g, "").replace(",", ".")) || 0 });
      a.setAttribute("href", target);
      // let the browser follow the link (same tab)
    });
  });

  /* ---------- ViewContent when the offer is seen ---------- */
  var offerSection = document.getElementById("offer");
  if (offerSection && "IntersectionObserver" in window) {
    var vcFired = false;
    new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (en) {
        if (en.isIntersecting && !vcFired) {
          vcFired = true;
          track("ViewContent", { content_name: "AI & IT Income Blueprint", content_type: "product" });
          obs.disconnect();
        }
      });
    }, { threshold: 0.35 }).observe(offerSection);
  }

  /* ---------- Mobile navigation ---------- */
  var menuBtn = document.getElementById("menuBtn");
  var nav = document.getElementById("nav");
  function closeMenu() {
    if (!menuBtn) return;
    nav.classList.remove("open");
    menuBtn.setAttribute("aria-expanded", "false");
    menuBtn.setAttribute("aria-label", "Open menu");
  }
  if (menuBtn && nav) {
    menuBtn.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", String(open));
      menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    nav.querySelectorAll("a:not([data-checkout])").forEach(function (l) { l.addEventListener("click", closeMenu); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMenu(); });
  }

  /* ---------- Sticky mobile CTA: show after hero, hide while pricing is on screen ---------- */
  var sticky = document.getElementById("stickyCta");
  var hero = document.querySelector(".hero");
  if (sticky && hero && "IntersectionObserver" in window) {
    var heroGone = false, offerOn = false;
    var stickyLink = sticky.querySelector("a");
    function updateSticky() {
      var show = heroGone && !offerOn;
      sticky.classList.toggle("show", show);
      sticky.setAttribute("aria-hidden", String(!show));
      stickyLink.setAttribute("tabindex", show ? "0" : "-1");
    }
    new IntersectionObserver(function (e) { heroGone = !e[0].isIntersecting; updateSticky(); }, { threshold: 0.05 }).observe(hero);
    if (offerSection) new IntersectionObserver(function (e) { offerOn = e[0].isIntersecting; updateSticky(); }, { threshold: 0.25 }).observe(offerSection);
  }

  /* ---------- Photos: hide broken images so the gradient fallback shows ---------- */
  document.querySelectorAll(".photo img").forEach(function (img) {
    function fail() { img.style.display = "none"; }
    if (img.complete && img.naturalWidth === 0) fail();
    img.addEventListener("error", fail);
  });

  /* ---------- FAQ: keep one item open at a time ---------- */
  var items = document.querySelectorAll(".faq details");
  items.forEach(function (d) {
    d.addEventListener("toggle", function () {
      if (d.open) items.forEach(function (o) { if (o !== d) o.open = false; });
    });
  });

  /* ---------- Subtle parallax (skipped for reduced motion and touch-only) ---------- */
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var layers = document.querySelectorAll("[data-parallax]");
  if (!reduce && layers.length) {
    var ticking = false;
    function apply() {
      var vh = window.innerHeight;
      layers.forEach(function (el) {
        var r = el.parentElement.getBoundingClientRect(); // parent isn't transformed, so no feedback loop
        if (r.bottom < -100 || r.top > vh + 100) return;
        var offset = (r.top + r.height / 2 - vh / 2) * parseFloat(el.dataset.parallax);
        el.style.setProperty("--py", (-offset).toFixed(1) + "px");
        el.style.transform = (el.dataset.baseTransform || "") + " translate3d(0," + (-offset).toFixed(1) + "px,0)";
      });
      ticking = false;
    }
    // keep existing CSS rotation on the ebook
    layers.forEach(function (el) {
      var t = getComputedStyle(el).transform;
      el.dataset.baseTransform = t && t !== "none" ? t : "";
    });
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(apply); }
    }, { passive: true });
    apply();
  }
})();
