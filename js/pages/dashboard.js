// Library (dashboard.html): continue reading, saved resources, favourite
// subjects and shortcuts — all from the user's own library data.
import { loadCatalog } from "../catalog.js";
import { escapeHtml as esc, relativeTime, icons, plural } from "../util.js";
import { resourceCard, notebookCard, emptyState, skeletons } from "../ui.js";
import { getLibrary, clearRecent, onLibraryChange, getSyncStatus } from "../library.js";
import { getSession, displayName } from "../auth.js";

const $ = (id) => document.getElementById(id);
const els = {
  greeting: $("library-greeting"),
  sync: $("sync-note"),
  recent: $("recent-list"),
  recentCount: $("recent-count"),
  clearRecent: $("clear-recent"),
  saved: $("saved-list"),
  savedCount: $("saved-count"),
  favs: $("favourite-list"),
  favCount: $("favourite-count"),
};
let catalog = null;

function renderSync() {
  const session = getSession();
  els.greeting.textContent = session ? `Welcome back, ${displayName(session)}.` : "Everything you save and read, in one place.";
  const status = getSyncStatus();
  const messages = {
    guest: [icons.device, 'Saved on this device. <a href="login.html">Sign in</a> to keep your library in sync across devices.'],
    syncing: [icons.cloud, "Syncing with your account…"],
    synced: [icons.cloud, "Synced with your account."],
    offline: [icons.cloud, "Couldn’t reach the server. Changes are saved on this device and will sync next time."],
  };
  const [icon, text] = messages[session ? status : "guest"] || messages.guest;
  els.sync.innerHTML = `${icon}<p>${text}</p>`;
}

function render() {
  renderSync();
  if (!catalog) return;
  const lib = getLibrary();

  const recent = lib.recent.map((e) => ({ e, r: catalog.byId.get(e.id) })).filter((x) => x.r).slice(0, 8);
  els.recentCount.textContent = recent.length ? plural(recent.length, "resource") : "";
  els.clearRecent.hidden = !recent.length;
  els.recent.innerHTML = recent.length
    ? `<ol class="recent-list list-reset">${recent
        .map(({ e, r }) => `<li class="recent-item hue-${esc(r.subjectInfo.hue)}">
          <span class="monogram" aria-hidden="true">${esc(r.subjectInfo.short)}</span>
          <span><a href="viewer.html?id=${encodeURIComponent(r.id)}">${esc(r.title)}</a><small>${esc(r.subjectInfo.title)} · ${esc(r.type)}</small></span>
          <time datetime="${new Date(e.at).toISOString()}">${relativeTime(e.at)}</time>
        </li>`)
        .join("")}</ol>`
    : emptyState({
        symbol: "↺", tag: "h3", title: "No reading history yet",
        text: "Resources you open will appear here, so you can pick up where you left off.",
        actions: '<a class="btn btn-primary" href="notess.html">Start exploring</a>',
      });

  const saved = lib.bookmarks.map((b) => catalog.byId.get(b.id)).filter(Boolean);
  els.savedCount.textContent = saved.length ? plural(saved.length, "resource") : "";
  els.saved.innerHTML = saved.length
    ? `<ul class="resource-grid list-reset">${saved.map((r) => `<li>${resourceCard(r)}</li>`).join("")}</ul>`
    : emptyState({
        symbol: "☆", tag: "h3", title: "No saved resources",
        text: "Tap the bookmark on any resource to keep it here for revision.",
        actions: '<a class="btn btn-primary" href="notess.html">Find something to save</a>',
      });

  const favs = lib.favourites.map((id) => catalog.subjectMap.get(id)).filter(Boolean);
  els.favCount.textContent = favs.length ? plural(favs.length, "subject") : "";
  els.favs.innerHTML = favs.length
    ? `<ul class="notebook-grid list-reset">${favs.map((s) => `<li>${notebookCard(s, catalog.countBySubject.get(s.id) || 0)}</li>`).join("")}</ul>`
    : emptyState({
        symbol: "★", tag: "h3", title: "No favourite subjects",
        text: "Star the subjects you’re studying this semester to keep them one tap away.",
        actions: '<a class="btn btn-primary" href="subjects.html">Choose subjects</a>',
      });
}

const laterSections = () => [...document.querySelectorAll(".library-section")].slice(1);

async function boot({ retry = false } = {}) {
  renderSync();
  // Loading: one skeleton block; the other sections appear together with the data.
  els.recent.innerHTML = skeletons(1, "skeleton-notebook");
  laterSections().forEach((s) => (s.hidden = true));
  try {
    catalog = await loadCatalog({ retry });
    render();
    laterSections().forEach((s) => (s.hidden = false));
  } catch (error) {
    console.warn("Notes Central: could not load the catalogue.", error);
    const problem = emptyState({
      symbol: "!", error: true, tag: "h3", title: "Your library couldn’t load",
      text: "Check your connection, then try again.",
      actions: '<button class="btn btn-primary" type="button" data-retry>Try again</button>',
    });
    els.recent.innerHTML = problem;
    els.saved.innerHTML = "";
    els.favs.innerHTML = "";
    els.recent.querySelector("[data-retry]").addEventListener("click", () => boot({ retry: true }));
  }
}

els.clearRecent.addEventListener("click", () => {
  clearRecent();
  els.recent.querySelector("a, button")?.focus();
});
// Re-render on any change, except while the user is using a toggle (keeps focus).
onLibraryChange(() => {
  const focused = document.activeElement;
  if (focused && focused.matches("[data-bookmark], [data-favourite]")) {
    // Let the toggle animation finish, then re-render and keep the user's place.
    const heading = focused.closest(".library-section")?.querySelector("h2");
    renderSync();
    setTimeout(() => {
      render();
      heading?.focus({ preventScroll: true });
    }, 450);
    return;
  }
  render();
});
boot();
