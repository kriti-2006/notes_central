// Quick find: a command palette (Ctrl/⌘ K or "/") for jumping to any subject,
// resource or common action. Built on <dialog> (focus trap + Escape for free)
// with the ARIA combobox + listbox pattern for arrow-key navigation.
import { loadCatalog, tokenize, scoreResource, scoreSubject, highlight } from "./catalog.js";
import { escapeHtml as esc, debounce } from "./util.js";
import { getLibrary } from "./library.js";
import { viewerUrl, subjectUrl } from "./ui.js";

let dialog, input, list, status, options = [], active = -1, catalog = null, actionsFor;

function option(item, i, tokens) {
  const title = highlight(esc(item.title), tokens);
  return `<div class="palette-option ${item.hue ? `hue-${esc(item.hue)}` : ""}" role="option" id="qf-opt-${i}" aria-selected="false" data-index="${i}">
    <span class="spine" aria-hidden="true"></span>
    <span><strong>${title}</strong><small>${esc(item.detail)}</small></span>
  </div>`;
}

function group(label, items, start, tokens) {
  if (!items.length) return "";
  const id = `qf-g-${start}`;
  return `<div role="group" aria-labelledby="${id}"><div class="palette-group" id="${id}" role="presentation">${esc(label)}</div>
    ${items.map((it, k) => option(it, start + k, tokens)).join("")}</div>`;
}

function render() {
  const query = input.value;
  const tokens = tokenize(query);
  const groups = [];

  if (catalog) {
    const resItem = (r) => ({ title: r.title, detail: `${r.subjectInfo.title} · ${r.type}`, hue: r.subjectInfo.hue, href: viewerUrl(r.id) });
    if (!tokens.length) {
      const recent = getLibrary().recent.map((e) => catalog.byId.get(e.id)).filter(Boolean).slice(0, 4);
      groups.push(["Recently viewed", recent.map(resItem)]);
      if (!recent.length) groups.push(["Featured", catalog.resources.filter((r) => r.featured).slice(0, 4).map(resItem)]);
    } else {
      const res = catalog.resources
        .map((r) => [r, scoreResource(r, tokens)])
        .filter(([, s]) => s > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 7)
        .map(([r]) => resItem(r));
      groups.push(["Resources", res]);
    }
    const subjects = catalog.subjects
      .filter((s) => scoreSubject(s, tokens) > 0)
      .slice(0, tokens.length ? 4 : 9)
      .map((s) => ({ title: s.title, detail: `Subject · ${catalog.countBySubject.get(s.id) || 0} resources`, hue: s.hue, href: subjectUrl(s.id) }));
    groups.push(["Subjects", subjects]);
  }
  const actions = actionsFor().filter((a) => !tokens.length || tokens.every((t) => a.title.toLowerCase().includes(t)));
  groups.push(["Actions", actions.map((a) => ({ ...a, detail: a.detail }))]);

  options = [];
  let html = "";
  groups.forEach(([label, items]) => {
    html += group(label, items, options.length, tokens);
    options.push(...items);
  });
  list.innerHTML = html || `<p class="palette-empty">No matches for “${esc(query)}”. Try a subject name or a short form like “OS”.</p>`;
  setActive(options.length ? 0 : -1);
  status.textContent = tokens.length ? `${options.length} results` : "";
}

function setActive(i) {
  active = i;
  list.querySelectorAll('[role="option"]').forEach((el) => el.setAttribute("aria-selected", String(Number(el.dataset.index) === i)));
  if (i >= 0) {
    input.setAttribute("aria-activedescendant", `qf-opt-${i}`);
    document.getElementById(`qf-opt-${i}`)?.scrollIntoView({ block: "nearest" });
  } else {
    input.removeAttribute("aria-activedescendant");
  }
}

function choose(i) {
  const item = options[i];
  if (!item) return;
  if (item.run) {
    dialog.close();
    item.run();
  } else {
    window.location.href = item.href;
  }
}

export function openPalette() {
  if (!dialog || dialog.open) return;
  input.value = "";
  dialog.showModal();
  input.focus();
  render();
  loadCatalog()
    .then((c) => {
      catalog = c;
      if (dialog.open) render();
    })
    .catch(() => {
      if (dialog.open) list.insertAdjacentHTML("afterbegin", '<p class="palette-empty">Couldn’t load the library. Actions are still available.</p>');
    });
}

/** `getActions` returns [{ title, detail, href? , run? }] — evaluated on each render. */
export function initPalette(getActions) {
  dialog = document.getElementById("quick-find");
  if (!dialog || typeof dialog.showModal !== "function") return;
  input = dialog.querySelector("#qf-input");
  list = dialog.querySelector("#qf-list");
  status = dialog.querySelector("#qf-status");
  actionsFor = getActions;

  input.addEventListener("input", debounce(render, 80));
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!options.length) return;
      const dir = e.key === "ArrowDown" ? 1 : -1;
      setActive((active + dir + options.length) % options.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(active);
    }
  });
  list.addEventListener("click", (e) => {
    const opt = e.target.closest('[role="option"]');
    if (opt) choose(Number(opt.dataset.index));
  });
  list.addEventListener("mousemove", (e) => {
    const opt = e.target.closest('[role="option"]');
    if (opt && Number(opt.dataset.index) !== active) setActive(Number(opt.dataset.index));
  });
  dialog.querySelector("[data-close-palette]").addEventListener("click", () => dialog.close());
  // Click on the backdrop closes the palette.
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close();
  });

  document.querySelectorAll("[data-open-palette]").forEach((b) => b.addEventListener("click", openPalette));
  document.addEventListener("keydown", (e) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
    if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (dialog.open) dialog.close();
      else openPalette();
    } else if (e.key === "/" && !typing && !dialog.open) {
      e.preventDefault();
      openPalette();
    }
  });
}
