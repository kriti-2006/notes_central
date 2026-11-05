// Explorer (notess.html): search, faceted filters, sorting and URL state.
import { loadCatalog, tokenize, scoreResource } from "../catalog.js";
import { escapeHtml as esc, debounce, icons, plural } from "../util.js";
import { resourceCard, emptyState } from "../ui.js";
import { getLibrary, onLibraryChange } from "../library.js";

const $ = (id) => document.getElementById(id);
const els = {
  form: $("explore-search-form"),
  q: $("explore-q"),
  clearQ: $("explore-clear-q"),
  sort: $("explore-sort"),
  filters: $("filters"),
  toggle: $("filters-toggle"),
  toggleCount: $("filters-count"),
  subjects: $("facet-subject"),
  types: $("facet-type"),
  categories: $("facet-category"),
  saved: $("facet-saved"),
  savedCount: $("facet-saved-count"),
  clearAll: $("filters-clear"),
  status: $("results-status"),
  active: $("active-filters"),
  results: $("results"),
  resetBtn: $("results-reset"),
};

const state = { q: "", subject: [], type: [], category: [], saved: false, sort: "recommended" };
let catalog = null;

/* ---- URL <-> state ---------------------------------------------------- */
function readUrl() {
  const p = new URLSearchParams(location.search);
  const list = (k) => (p.get(k) || "").split(",").map((v) => v.trim()).filter(Boolean);
  state.q = p.get("q") || "";
  state.subject = list("subject");
  state.type = list("type");
  state.category = list("category");
  state.saved = p.get("saved") === "1";
  state.sort = p.get("sort") || "recommended";
}

function writeUrl() {
  const p = new URLSearchParams();
  if (state.q) p.set("q", state.q);
  ["subject", "type", "category"].forEach((k) => state[k].length && p.set(k, state[k].join(",")));
  if (state.saved) p.set("saved", "1");
  if (state.sort !== "recommended") p.set("sort", state.sort);
  const qs = p.toString();
  history.replaceState(null, "", `${location.pathname}${qs ? `?${qs}` : ""}`);
}

/* ---- Filtering ----------------------------------------------------------- */
function matches(r, tokens, except) {
  const saved = new Set(getLibrary().bookmarks.map((b) => b.id));
  if (except !== "subject" && state.subject.length && !state.subject.includes(r.subject)) return 0;
  if (except !== "type" && state.type.length && !state.type.includes(r.type)) return 0;
  if (except !== "category" && state.category.length && !state.category.includes(r.subjectInfo.category)) return 0;
  if (except !== "saved" && state.saved && !saved.has(r.id)) return 0;
  return scoreResource(r, tokens);
}

const sorters = {
  recommended: (a, b) => (b.score - a.score) || (a.order - b.order),
  "title-asc": (a, b) => a.r.title.localeCompare(b.r.title),
  "title-desc": (a, b) => b.r.title.localeCompare(a.r.title),
  "short-first": (a, b) => (a.r.minutes - b.r.minutes) || a.r.title.localeCompare(b.r.title),
  subject: (a, b) => a.r.subjectInfo.title.localeCompare(b.r.subjectInfo.title) || (a.order - b.order),
};

/* ---- Rendering ------------------------------------------------------------ */
function facetOption(name, value, label, count, checked, hue) {
  const id = `f-${name}-${value}`.replace(/[^a-z0-9-]/gi, "-");
  return `<label class="check" for="${id}">
    <input type="checkbox" id="${id}" name="${name}" value="${esc(value)}"${checked ? " checked" : ""}>
    ${hue ? `<span class="chip-dot hue-${esc(hue)}" aria-hidden="true"></span>` : ""}
    <span>${esc(label)}</span><span class="count"><span class="sr-only">(</span>${count}<span class="sr-only"> ${count === 1 ? "resource" : "resources"})</span></span>
  </label>`;
}

function renderFacets(tokens) {
  const count = (except, pred) => catalog.resources.filter((r) => pred(r) && matches(r, tokens, except) > 0).length;
  els.subjects.innerHTML = catalog.subjects
    .map((s) => facetOption("subject", s.id, s.title, count("subject", (r) => r.subject === s.id), state.subject.includes(s.id), s.hue))
    .join("");
  els.types.innerHTML = catalog.types
    .map((t) => facetOption("type", t, t, count("type", (r) => r.type === t), state.type.includes(t)))
    .join("");
  els.categories.innerHTML = catalog.categories
    .map((c) => facetOption("category", c, c, count("category", (r) => r.subjectInfo.category === c), state.category.includes(c)))
    .join("");
  els.saved.checked = state.saved;
  els.savedCount.textContent = String(getLibrary().bookmarks.filter((b) => catalog.byId.has(b.id)).length);
}

function renderActive() {
  const chips = [];
  const chip = (label, key, value) =>
    chips.push(`<button class="chip" type="button" data-remove="${key}" data-value="${esc(value)}" aria-label="Remove filter: ${esc(label)}">${esc(label)} ${icons.close}</button>`);
  if (state.q) chip(`“${state.q}”`, "q", "");
  state.subject.forEach((id) => chip(catalog.subjectMap.get(id)?.title || id, "subject", id));
  state.type.forEach((t) => chip(t, "type", t));
  state.category.forEach((c) => chip(c, "category", c));
  if (state.saved) chip("Saved only", "saved", "");
  els.active.innerHTML = chips.join("");

  const n = state.subject.length + state.type.length + state.category.length + (state.saved ? 1 : 0);
  els.toggleCount.textContent = n ? String(n) : "";
  els.toggleCount.hidden = !n;
  els.clearAll.hidden = !(n || state.q);
  els.resetBtn.hidden = !(n || state.q);
}

function render() {
  const tokens = tokenize(state.q);
  const rows = catalog.resources
    .map((r, order) => ({ r, order, score: matches(r, tokens) }))
    .filter((x) => x.score > 0)
    .sort(sorters[state.sort] || sorters.recommended);

  renderFacets(tokens);
  renderActive();
  els.clearQ.hidden = !els.q.value;

  const total = catalog.resources.length;
  els.status.textContent = rows.length === total
    ? `Showing all ${plural(total, "resource")}`
    : `${plural(rows.length, "resource")} of ${total}${state.q ? ` for “${state.q}”` : ""}`;

  if (!rows.length) {
    const savedOnlyEmpty = state.saved && !getLibrary().bookmarks.length;
    els.results.innerHTML = savedOnlyEmpty
      ? emptyState({
          symbol: "☆", tag: "h3", title: "Nothing saved yet",
          text: "Use the bookmark button on any resource to save it here and in your library.",
          actions: '<button class="btn btn-primary" type="button" data-clear-filters>Show all resources</button>',
        })
      : emptyState({
          symbol: "?", tag: "h3", title: "No resources match",
          text: `Try a shorter search, remove a filter, or <a href="contact.html">request this topic</a>.`,
          actions: '<button class="btn btn-primary" type="button" data-clear-filters>Clear search and filters</button>',
        });
    return;
  }
  els.results.innerHTML = rows.map(({ r }) => `<li>${resourceCard(r, { tokens })}</li>`).join("");
}

const update = () => {
  writeUrl();
  render();
};

function clearAll() {
  Object.assign(state, { q: "", subject: [], type: [], category: [], saved: false });
  els.q.value = "";
  update();
  els.q.focus();
}

/* ---- Events ----------------------------------------------------------------- */
function wire() {
  els.q.value = state.q;
  els.sort.value = sorters[state.sort] ? state.sort : "recommended";

  els.q.addEventListener("input", debounce(() => {
    state.q = els.q.value.trim();
    update();
  }, 180));
  els.form.addEventListener("submit", (e) => {
    e.preventDefault();
    state.q = els.q.value.trim();
    update();
  });
  els.clearQ.addEventListener("click", () => {
    els.q.value = "";
    state.q = "";
    update();
    els.q.focus();
  });
  els.sort.addEventListener("change", () => {
    state.sort = els.sort.value;
    update();
  });
  els.filters.addEventListener("change", (e) => {
    const input = e.target;
    if (input.name === "saved") state.saved = input.checked;
    else if (state[input.name]) {
      const set = new Set(state[input.name]);
      input.checked ? set.add(input.value) : set.delete(input.value);
      state[input.name] = [...set];
    }
    const focusedId = input.id;
    update();
    document.getElementById(focusedId)?.focus(); // keep keyboard position after re-render
  });
  els.clearAll.addEventListener("click", clearAll);
  els.resetBtn.addEventListener("click", clearAll);
  els.results.addEventListener("click", (e) => {
    if (e.target.closest("[data-clear-filters]")) clearAll();
  });
  els.active.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-remove]");
    if (!btn) return;
    const { remove: key, value } = btn.dataset;
    if (key === "q") {
      state.q = "";
      els.q.value = "";
    } else if (key === "saved") state.saved = false;
    else state[key] = state[key].filter((v) => v !== value);
    update();
    (els.active.querySelector("button") || els.q).focus();
  });
  els.toggle.addEventListener("click", () => {
    const open = els.toggle.getAttribute("aria-expanded") !== "true";
    els.toggle.setAttribute("aria-expanded", String(open));
    els.filters.classList.toggle("is-open", open);
    if (open) els.filters.querySelector("summary")?.focus();
  });
  // Saving or un-saving changes the "Saved only" results and count.
  onLibraryChange(() => catalog && render());
}

/* ---- Boot -------------------------------------------------------------------- */
async function boot({ retry = false } = {}) {
  els.results.innerHTML = Array.from({ length: 4 }, () => '<li><div class="skeleton skeleton-card" aria-hidden="true"></div></li>').join("");
  els.results.setAttribute("aria-busy", "true");
  els.status.textContent = "Loading resources…";
  try {
    catalog = await loadCatalog({ retry });
    els.results.setAttribute("aria-busy", "false");
    render();
  } catch (error) {
    console.warn("Notes Central: could not load the catalogue.", error);
    els.results.setAttribute("aria-busy", "false");
    els.status.textContent = "The library couldn’t be loaded.";
    els.results.innerHTML = `<li>${emptyState({
      symbol: "!", error: true, tag: "h3", title: "The library couldn’t load",
      text: "This is usually a connection problem. Check your connection, then try again.",
      actions: '<button class="btn btn-primary" type="button" data-retry>Try again</button>',
    })}</li>`;
    els.results.querySelector("[data-retry]").addEventListener("click", () => boot({ retry: true }));
  }
}

readUrl();
wire();
boot();
