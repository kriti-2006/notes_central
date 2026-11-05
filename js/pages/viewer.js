// Reader (viewer.html?id=…): renders a note, table of contents, reading
// progress, text size, bookmark, download, print and related resources.
import { loadCatalog } from "../catalog.js";
import { renderMarkdown } from "../markdown.js";
import { escapeHtml as esc, icons, formatDate, store, plural } from "../util.js";
import { resourceCard, emptyState, bookmarkButton, subjectUrl, announce } from "../ui.js";
import { recordView } from "../library.js";

const id = new URLSearchParams(location.search).get("id");
const head = document.getElementById("reader-head");
const body = document.getElementById("reader-body");
const tocDesktop = document.getElementById("toc-desktop");
const tocMobile = document.getElementById("toc-mobile");
const related = document.getElementById("related");
const crumbSubject = document.getElementById("crumb-subject");
const crumbTitle = document.getElementById("crumb-title");
const layout = document.getElementById("reader-layout");

const SIZE_KEY = "nc:reader-size";
const SIZES = [0.9375, 1.0625, 1.1875, 1.3125];

function showProblem({ title, text, symbol, error, retry }) {
  head.innerHTML = "";
  layout.hidden = false;
  tocDesktop.hidden = true;
  tocMobile.hidden = true;
  related.hidden = true;
  body.innerHTML = emptyState({
    symbol, error, tag: "h1", title, text,
    actions: `${retry ? '<button class="btn btn-primary" type="button" data-retry>Try again</button>' : ""}
      <a class="btn ${retry ? "btn-ghost" : "btn-primary"}" href="notess.html">Explore the library</a>`,
  });
  body.querySelector("[data-retry]")?.addEventListener("click", () => boot({ retry: true }));
  crumbTitle.textContent = title;
}

function tocHtml(headings) {
  return `<ol class="toc-list">${headings
    .filter((h) => h.level === 2)
    .map((h) => `<li><a href="#${h.id}">${esc(h.text)}</a></li>`)
    .join("")}</ol>`;
}

function wireTextSize() {
  const prose = body.querySelector(".prose");
  const down = document.getElementById("text-smaller");
  const up = document.getElementById("text-larger");
  let index = Math.min(SIZES.length - 1, Math.max(0, store.get(SIZE_KEY, 1)));
  const apply = () => {
    prose.style.setProperty("--reader-size", `${SIZES[index]}rem`);
    down.disabled = index === 0;
    up.disabled = index === SIZES.length - 1;
    store.set(SIZE_KEY, index);
  };
  down.addEventListener("click", () => {
    index = Math.max(0, index - 1);
    apply();
    announce("Text size decreased.");
  });
  up.addEventListener("click", () => {
    index = Math.min(SIZES.length - 1, index + 1);
    apply();
    announce("Text size increased.");
  });
  apply();
}

function wireProgressAndToc() {
  const bar = document.querySelector(".reading-progress");
  const article = body.querySelector(".prose");
  const onScroll = () => {
    const r = article.getBoundingClientRect();
    const total = r.height - window.innerHeight * 0.6;
    const p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 1;
    bar.style.setProperty("--progress", p.toFixed(3));
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const links = [...tocDesktop.querySelectorAll("a")];
  if (!("IntersectionObserver" in window) || !links.length) return;
  const byId = new Map(links.map((a) => [a.hash.slice(1), a]));
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((a) => {
          a.classList.remove("is-active");
          a.removeAttribute("aria-current");
        });
        const link = byId.get(entry.target.id);
        if (link) {
          link.classList.add("is-active");
          link.setAttribute("aria-current", "location");
        }
      });
    },
    { rootMargin: "-20% 0px -70% 0px" }
  );
  article.querySelectorAll("h2[id]").forEach((h) => io.observe(h));
}

async function boot({ retry = false } = {}) {
  if (!id) {
    showProblem({ symbol: "?", title: "No resource selected", text: "Choose a resource from the library to start reading." });
    return;
  }
  // Loading: a single skeleton where the header goes; the body stays empty so
  // nothing below it moves when the note arrives.
  head.innerHTML = '<div class="skeleton reader-skeleton" aria-hidden="true"></div>';
  body.innerHTML = "";
  body.setAttribute("aria-busy", "true");

  let catalog;
  let source;
  try {
    catalog = await loadCatalog({ retry });
  } catch (error) {
    console.warn("Notes Central: could not load the catalogue.", error);
    body.setAttribute("aria-busy", "false");
    showProblem({ symbol: "!", error: true, retry: true, title: "This resource couldn’t load", text: "Check your connection, then try again." });
    return;
  }

  const resource = catalog.byId.get(id);
  if (!resource) {
    body.setAttribute("aria-busy", "false");
    showProblem({
      symbol: "?", title: "Resource not found",
      text: "This link may be out of date, or the resource may have moved. Try searching the library instead.",
    });
    return;
  }

  try {
    const response = await fetch(resource.file);
    if (!response.ok) throw new Error(`Note request failed (${response.status})`);
    source = await response.text();
  } catch (error) {
    console.warn("Notes Central: could not load the note.", error);
    body.setAttribute("aria-busy", "false");
    showProblem({ symbol: "!", error: true, retry: true, title: "This resource couldn’t load", text: "The note file didn’t download. Check your connection, then try again." });
    return;
  }

  const s = resource.subjectInfo;
  const { html, headings } = renderMarkdown(source);
  document.title = `${resource.title} · ${s.title} — Notes Central`;
  document.querySelector('meta[name="description"]')?.setAttribute("content", resource.summary);

  crumbSubject.innerHTML = `<a href="${subjectUrl(s.id)}">${esc(s.title)}</a>`;
  crumbSubject.hidden = false;
  crumbTitle.textContent = resource.title;

  head.innerHTML = `<div class="hue-${esc(s.hue)}">
      <p class="resource-kicker"><span class="tag tag--hue">${esc(s.title)}</span><span class="tag">${esc(resource.type)}</span></p>
      <h1>${esc(resource.title)}</h1>
      <p class="reader-summary">${esc(resource.summary)}</p>
      <p class="reader-meta">
        <span>${icons.clock}${resource.minutes} min read</span>
        <span>Added <time datetime="${resource.added}">${formatDate(resource.added)}</time></span>
        <span>${plural(headings.filter((h) => h.level === 2).length, "section")}</span>
      </p>
      <div class="reader-actions">
        ${bookmarkButton(resource).replace('class="icon-btn bookmark-btn"', 'class="btn btn-ghost bookmark-btn"').replace(`aria-label="Save ${esc(resource.title)}">`, ">")}
        <a class="btn btn-ghost" href="${esc(resource.file)}" download="${esc(resource.id)}.md">${icons.download} Download <span class="sr-only">notes as Markdown</span><span aria-hidden="true">.md</span></a>
        <button class="btn btn-ghost" type="button" id="print-btn">${icons.print} Print or save as PDF</button>
        <div class="text-size" role="group" aria-label="Text size">
          <button type="button" id="text-smaller" aria-label="Decrease text size">A−</button>
          <button type="button" id="text-larger" aria-label="Increase text size">A+</button>
        </div>
      </div>
    </div>`;
  // The reader's bookmark button shows a visible label.
  const bm = head.querySelector(".bookmark-btn");
  bm.insertAdjacentHTML("beforeend", "<span>Save</span>");

  body.innerHTML = `<article class="prose hue-${esc(s.hue)}" aria-labelledby="reader-title">${html}</article>`;
  layout.hidden = false;
  head.querySelector("h1").id = "reader-title";
  body.setAttribute("aria-busy", "false");

  const toc = tocHtml(headings);
  tocDesktop.innerHTML = `<h2 id="toc-title">On this page</h2><nav aria-labelledby="toc-title">${toc}</nav>`;
  tocMobile.innerHTML = `<details class="accordion"><summary>On this page</summary><nav class="accordion-body" aria-label="On this page">${toc}</nav></details>`;
  tocDesktop.hidden = tocMobile.hidden = headings.length < 2;

  const siblings = catalog.resources.filter((r) => r.subject === s.id && r.id !== resource.id);
  related.innerHTML = `<div class="container">
      <div class="section-head"><div><span class="eyebrow">Keep going</span><h2>More from ${esc(s.title)}</h2></div>
        <a class="btn btn-ghost" href="${subjectUrl(s.id)}">${icons.arrowLeft} Back to ${esc(s.title)}</a></div>
      ${siblings.length
        ? `<ul class="resource-grid list-reset">${siblings.map((r) => `<li>${resourceCard(r)}</li>`).join("")}</ul>`
        : `<p class="muted">This is the only resource for ${esc(s.title)} so far. <a href="contact.html?subject=${encodeURIComponent(s.title)}">Request more</a>.</p>`}
    </div>`;
  related.hidden = false;

  document.getElementById("print-btn").addEventListener("click", () => {
    body.querySelectorAll("details").forEach((d) => (d.open = true)); // print answers too
    window.print();
  });
  wireTextSize();
  wireProgressAndToc();
  recordView(resource.id);
}

boot();
