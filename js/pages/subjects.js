// Subjects page: notebooks for every available subject, favourites first.
import { loadCatalog } from "../catalog.js";
import { notebookCard, emptyState, skeletons } from "../ui.js";
import { getLibrary } from "../library.js";
import { plural } from "../util.js";

const grid = document.getElementById("subject-grid");
const summary = document.getElementById("year-2-summary");

async function render({ retry = false } = {}) {
  grid.innerHTML = skeletons(6, "skeleton-notebook");
  grid.setAttribute("aria-busy", "true");
  try {
    const catalog = await loadCatalog({ retry });
    const favs = getLibrary().favourites;
    const ordered = [...catalog.subjects].sort((a, b) => favs.includes(b.id) - favs.includes(a.id));
    grid.innerHTML = ordered.map((s) => `<li>${notebookCard(s, catalog.countBySubject.get(s.id) || 0)}</li>`).join("");
    if (summary) summary.textContent = `${plural(catalog.subjects.length, "subject")} · ${plural(catalog.resources.length, "resource")}`;
  } catch (error) {
    console.warn("Notes Central: could not load the catalogue.", error);
    grid.innerHTML = `<li>${emptyState({
      symbol: "!", error: true, tag: "h3", title: "Subjects couldn’t load",
      text: "Check your connection, then try again.",
      actions: '<button class="btn btn-primary" type="button" data-retry>Try again</button>',
    })}</li>`;
    grid.querySelector("[data-retry]").addEventListener("click", () => render({ retry: true }));
  } finally {
    grid.setAttribute("aria-busy", "false");
  }
}
render();
