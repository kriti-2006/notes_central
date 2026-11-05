// Shared renderers and behaviours for resource cards, subject notebooks,
// empty states and skeletons.
import { escapeHtml as esc, icons, plural } from "./util.js";
import { highlight } from "./catalog.js";
import { isBookmarked, toggleBookmark, isFavourite, toggleFavourite, onLibraryChange } from "./library.js";

export const viewerUrl = (id) => `viewer.html?id=${encodeURIComponent(id)}`;
export const subjectUrl = (id) => `notess.html?subject=${encodeURIComponent(id)}`;

export function bookmarkButton(resource) {
  const saved = isBookmarked(resource.id);
  return `<button class="icon-btn bookmark-btn" type="button" data-bookmark="${esc(resource.id)}" aria-pressed="${saved}"
    aria-label="Save ${esc(resource.title)}">${icons.bookmark}</button>`;
}

/** A resource row card. `tokens` highlights search matches in the title. */
export function resourceCard(resource, { tokens = [], headingLevel = 3 } = {}) {
  const s = resource.subjectInfo;
  const h = `h${headingLevel}`;
  const title = highlight(esc(resource.title), tokens);
  const topics = resource.topics.slice(0, 3).map((t) => `<span class="tag">${esc(t)}</span>`).join("");
  return `<article class="resource hue-${esc(s.hue)}">
    <span class="monogram" aria-hidden="true">${esc(s.short)}</span>
    <div class="resource-body">
      <p class="resource-kicker"><span class="tag tag--hue">${esc(s.title)}</span><span>${esc(resource.type)}</span><span aria-hidden="true">·</span><span>${resource.minutes} min read</span></p>
      <${h}><a href="${viewerUrl(resource.id)}">${title}</a></${h}>
      <p>${esc(resource.summary)}</p>
      <div class="resource-topics">${topics}</div>
    </div>
    ${bookmarkButton(resource)}
  </article>`;
}

/** A subject notebook card linking to the explorer filtered by that subject. */
export function notebookCard(subject, count, { headingLevel = 3, favourite = true } = {}) {
  const h = `h${headingLevel}`;
  const fav = isFavourite(subject.id);
  const favBtn = favourite
    ? `<button class="icon-btn pin-btn" type="button" data-favourite="${esc(subject.id)}" aria-pressed="${fav}"
        aria-label="Favourite ${esc(subject.title)}">${icons.star}</button>`
    : "";
  return `<article class="notebook hue-${esc(subject.hue)}">
    <div class="notebook-top">
      <span class="monogram" aria-hidden="true">${esc(subject.short)}</span>
      ${favBtn}
    </div>
    <${h}><a href="${subjectUrl(subject.id)}">${esc(subject.title)}</a></${h}>
    <p>${esc(subject.description)}</p>
    <div class="notebook-meta">
      <span class="tag">${plural(count, "resource")}</span>
      <span class="explore" aria-hidden="true">Explore ${icons.arrow}</span>
    </div>
  </article>`;
}

export function emptyState({ symbol = "?", title, text, actions = "", tag = "h2", error = false }) {
  return `<div class="empty${error ? " empty--error" : ""}">
    <div class="empty-art" aria-hidden="true"><span></span><span></span><span>${esc(symbol)}</span></div>
    <${tag}>${esc(title)}</${tag}>
    <p>${text}</p>
    ${actions ? `<div class="actions">${actions}</div>` : ""}
  </div>`;
}

export const skeletons = (n, cls = "skeleton-card") =>
  Array.from({ length: n }, () => `<div class="skeleton ${cls}" aria-hidden="true"></div>`).join("");

/* ---- Toggle buttons (event delegation, works for any rendered card) ---- */
let wired = false;
export function wireLibraryButtons() {
  if (wired) return;
  wired = true;

  document.addEventListener("click", (event) => {
    const bm = event.target.closest("[data-bookmark]");
    const fav = event.target.closest("[data-favourite]");
    const btn = bm || fav;
    if (!btn) return;
    const id = bm ? bm.dataset.bookmark : fav.dataset.favourite;
    const on = bm ? toggleBookmark(id) : toggleFavourite(id);
    btn.classList.remove("is-popping");
    if (on) {
      void btn.offsetWidth; // restart the animation
      btn.classList.add("is-popping");
    }
    announce(bm ? (on ? "Saved to your library." : "Removed from your library.")
      : (on ? "Added to favourite subjects." : "Removed from favourite subjects."));
  });

  // Keep every button on the page in sync (also across tabs).
  onLibraryChange(() => {
    document.querySelectorAll("[data-bookmark]").forEach((b) => b.setAttribute("aria-pressed", String(isBookmarked(b.dataset.bookmark))));
    document.querySelectorAll("[data-favourite]").forEach((b) => b.setAttribute("aria-pressed", String(isFavourite(b.dataset.favourite))));
  });
}

/** Politely announces a short message to screen-reader users. */
export function announce(message) {
  let region = document.getElementById("nc-announcer");
  if (!region) {
    region = document.createElement("div");
    region.id = "nc-announcer";
    region.className = "sr-only";
    region.setAttribute("role", "status");
    document.body.append(region);
  }
  region.textContent = "";
  setTimeout(() => {
    region.textContent = message;
  }, 50);
}
