// Home page: subject chips, featured resources, live counts, hero parallax.
import { loadCatalog } from "../catalog.js";
import { escapeHtml as esc, prefersReducedMotion, plural } from "../util.js";
import { resourceCard, emptyState, skeletons, subjectUrl } from "../ui.js";

const chips = document.getElementById("home-subjects");
const featured = document.getElementById("home-featured");

async function render({ retry = false } = {}) {
  if (featured && retry) featured.innerHTML = Array.from({ length: 4 }, () => `<li>${skeletons(1)}</li>`).join("");
  try {
    const catalog = await loadCatalog({ retry });
    if (chips) {
      chips.innerHTML = catalog.subjects
        .map((s) => `<li><a class="chip hue-${esc(s.hue)}" href="${subjectUrl(s.id)}"><span class="chip-dot" aria-hidden="true"></span>${esc(s.title)}<span class="count"><span class="sr-only">, </span>${plural(catalog.countBySubject.get(s.id) || 0, "resource")}</span></a></li>`)
        .join("");
    }
    if (featured) {
      featured.innerHTML = catalog.resources.filter((r) => r.featured).map((r) => `<li>${resourceCard(r)}</li>`).join("");
      featured.setAttribute("aria-busy", "false");
    }
    document.querySelectorAll("[data-count]").forEach((el) => {
      const kind = el.dataset.count;
      if (kind === "resources") el.textContent = plural(catalog.resources.length, "resource");
      if (kind === "subjects") el.textContent = plural(catalog.subjects.length, "subject");
    });
  } catch (error) {
    console.warn("Notes Central: could not load the catalogue.", error);
    if (featured) {
      featured.setAttribute("aria-busy", "false");
      featured.innerHTML = `<li>${emptyState({
        symbol: "!", error: true, tag: "h3", title: "Featured notes couldn’t load",
        text: "Check your connection, then try again.",
        actions: '<button class="btn btn-primary" type="button" data-retry>Try again</button>',
      })}</li>`;
      featured.querySelector("[data-retry]").addEventListener("click", () => render({ retry: true }));
    }
  }
}
render();

// Hero: gentle depth parallax that follows the pointer (fine pointers only).
const visual = document.querySelector(".hero-visual");
if (visual && !prefersReducedMotion() && window.matchMedia("(pointer: fine)").matches) {
  const layers = visual.querySelectorAll("[data-depth]");
  let frame = 0;
  visual.closest(".hero").addEventListener("pointermove", (e) => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const r = visual.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width / 2)) / r.width;
      const y = (e.clientY - (r.top + r.height / 2)) / r.height;
      layers.forEach((layer) => {
        const d = Number(layer.dataset.depth);
        layer.style.translate = `${(x * d).toFixed(1)}px ${(y * d).toFixed(1)}px`;
      });
    });
  });
  visual.closest(".hero").addEventListener("pointerleave", () => layers.forEach((l) => (l.style.translate = "")));
}
