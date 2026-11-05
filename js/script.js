/*
 * Notes Central — site-wide entry point (ES module, loaded on every page).
 *  1. Theme (light / dark, saved preference, follows the OS until chosen)
 *  2. Header: scrolled state, gliding nav indicator, mobile sheet
 *  3. Account area (Sign in ↔ account menu)
 *  4. Quick find palette
 *  5. Entrance reveals and highlight strokes
 *  6. Library sync + page-specific module (body[data-page])
 */
import { store, prefersReducedMotion, icons, escapeHtml as esc } from "./util.js";
import { getSession, signOut, displayName } from "./auth.js";
import { syncLibrary } from "./library.js";
import { initPalette } from "./palette.js";
import { wireLibraryButtons, announce } from "./ui.js";

const root = document.documentElement;

/* 1. Theme ------------------------------------------------------------------ */
const THEME_KEY = "nc:theme";
const systemDark = window.matchMedia("(prefers-color-scheme: dark)");

function applyTheme(theme, animate) {
  if (animate && !prefersReducedMotion()) {
    root.classList.add("theme-transition");
    setTimeout(() => root.classList.remove("theme-transition"), 400);
  }
  root.dataset.theme = theme;
  const next = theme === "dark" ? "light" : "dark";
  document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
    const label = btn.querySelector("[data-theme-label]");
    if (label) label.textContent = `Switch to ${next} theme`; // visible text is the name
    else btn.setAttribute("aria-label", `Switch to ${next} theme`); // icon-only button
  });
}

function toggleTheme() {
  const theme = root.dataset.theme === "dark" ? "light" : "dark";
  store.set(THEME_KEY, theme);
  applyTheme(theme, true);
  announce(`${theme[0].toUpperCase()}${theme.slice(1)} theme on.`);
}

applyTheme(root.dataset.theme || "light", false);
document.querySelectorAll("[data-theme-toggle]").forEach((btn) => btn.addEventListener("click", toggleTheme));
systemDark.addEventListener("change", (e) => {
  if (!store.get(THEME_KEY)) applyTheme(e.matches ? "dark" : "light", true);
});

/* 2. Header -------------------------------------------------------------------- */
const header = document.querySelector(".site-header");
const onScroll = () => header && header.classList.toggle("is-scrolled", window.scrollY > 8);
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

// Gliding highlighter under the nav links (desktop).
const navList = document.querySelector(".nav-list");
if (navList) {
  const indicator = document.createElement("span");
  indicator.className = "nav-indicator";
  indicator.setAttribute("aria-hidden", "true");
  navList.append(indicator);
  const current = navList.querySelector('[aria-current="page"]');
  const moveTo = (link) => {
    if (!link || !link.offsetWidth) {
      indicator.style.opacity = "0";
      return;
    }
    const pad = 12.8; // matches the link's horizontal padding (0.8rem)
    indicator.style.width = `${link.offsetWidth - pad * 2}px`;
    indicator.style.transform = `translateX(${link.offsetLeft + pad}px)`;
    indicator.style.opacity = "1";
  };
  if (current) navList.classList.add("has-indicator");
  requestAnimationFrame(() => moveTo(current));
  navList.addEventListener("pointerover", (e) => moveTo(e.target.closest(".nav-link") || current));
  navList.addEventListener("focusin", (e) => moveTo(e.target.closest(".nav-link")));
  navList.addEventListener("pointerleave", () => moveTo(current));
  navList.addEventListener("focusout", (e) => {
    if (!navList.contains(e.relatedTarget)) moveTo(current);
  });
  window.addEventListener("resize", () => moveTo(current));
}

// Mobile sheet
const navToggle = document.querySelector(".nav-toggle");
const sheet = document.getElementById("mobile-sheet");
const background = () => [document.querySelector("main"), document.querySelector(".site-footer")].filter(Boolean);

function setSheet(open, returnFocus = false) {
  if (!navToggle || !sheet) return;
  navToggle.setAttribute("aria-expanded", String(open));
  sheet.classList.toggle("is-open", open);
  background().forEach((el) => (el.inert = open));
  document.body.style.overflow = open ? "hidden" : "";
  if (!open && returnFocus) navToggle.focus();
}

if (navToggle && sheet) {
  navToggle.addEventListener("click", () => setSheet(navToggle.getAttribute("aria-expanded") !== "true"));
  sheet.addEventListener("click", (e) => {
    if (e.target.closest("a")) setSheet(false);
  });
  window.matchMedia("(min-width: 64em)").addEventListener("change", () => setSheet(false));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && navToggle.getAttribute("aria-expanded") === "true") setSheet(false, true);
  });
}

/* 3. Account area ---------------------------------------------------------------- */
function renderAccount() {
  const session = getSession();
  const area = document.querySelector("[data-account]");
  const mobile = document.querySelector("[data-account-mobile]");
  const isLogin = document.body.dataset.page === "login";

  if (!session) {
    const current = isLogin ? ' aria-current="page"' : "";
    if (area) area.innerHTML = `<a class="btn btn-primary btn-sm" href="login.html"${current}>Sign in</a>`;
    if (mobile) mobile.innerHTML = `<a class="btn btn-primary btn-lg btn-block" href="login.html"${current}>Sign in or create an account</a>`;
    return;
  }

  const name = esc(displayName(session));
  if (area) {
    area.innerHTML = `<button class="account-btn" type="button" aria-expanded="false" aria-controls="account-menu">
        <span class="avatar" aria-hidden="true">${name.slice(0, 1)}</span><span>${name}</span><span class="sr-only">, account menu</span></button>
      <div class="menu" id="account-menu" hidden>
        <p class="menu-label">Signed in as <strong>${name}</strong></p>
        <a class="menu-item" href="dashboard.html">${icons.library} Your library</a>
        <button class="menu-item" type="button" data-sign-out>${icons.logout} Sign out</button>
      </div>`;
    const btn = area.querySelector(".account-btn");
    const menu = area.querySelector(".menu");
    const setMenu = (open, focusBtn = false) => {
      btn.setAttribute("aria-expanded", String(open));
      menu.hidden = !open;
      if (open) menu.querySelector(".menu-item").focus();
      if (!open && focusBtn) btn.focus();
    };
    btn.addEventListener("click", () => setMenu(menu.hidden));
    area.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !menu.hidden) setMenu(false, true);
    });
    area.addEventListener("focusout", (e) => {
      if (!area.contains(e.relatedTarget)) setMenu(false);
    });
    document.addEventListener("click", (e) => {
      if (!area.contains(e.target)) setMenu(false);
    });
  }
  if (mobile) {
    mobile.innerHTML = `<p class="muted">Signed in as <strong>${name}</strong></p>
      <a class="btn btn-ghost btn-lg btn-block" href="dashboard.html">Your library</a>
      <button class="btn btn-quiet btn-lg btn-block" type="button" data-sign-out>Sign out</button>`;
  }
  document.querySelectorAll("[data-sign-out]").forEach((b) =>
    b.addEventListener("click", () => {
      signOut();
      window.location.href = "index.html";
    })
  );
}
renderAccount();

/* 4. Quick find ------------------------------------------------------------------- */
initPalette(() => [
  {
    title: root.dataset.theme === "dark" ? "Switch to light theme" : "Switch to dark theme",
    detail: "Appearance",
    run: toggleTheme,
  },
  { title: "Open your library", detail: "Saved resources and history", href: "dashboard.html" },
  { title: "Explore all resources", detail: "Search, filter and sort", href: "notess.html" },
  { title: "Browse subjects", detail: "By year", href: "subjects.html" },
  { title: "Request a subject", detail: "Contact", href: "contact.html" },
]);

/* 5. Reveals & highlight strokes ---------------------------------------------- */
const revealables = document.querySelectorAll("[data-reveal], .hl--draw");
if ("IntersectionObserver" in window && !prefersReducedMotion()) {
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-revealed", "is-drawn");
        io.unobserve(entry.target);
      }),
    { rootMargin: "0px 0px -8% 0px" }
  );
  revealables.forEach((el) => io.observe(el));
} else {
  revealables.forEach((el) => el.classList.add("is-revealed", "is-drawn"));
}

/* 6. Library + page module ------------------------------------------------------- */
wireLibraryButtons();
syncLibrary();

const page = document.body.dataset.page;
const pageModules = { home: "home", explore: "explorer", viewer: "viewer", subjects: "subjects", library: "dashboard" };
if (pageModules[page]) {
  import(`./pages/${pageModules[page]}.js`).catch((error) => console.error("Notes Central: page script failed to load.", error));
}

