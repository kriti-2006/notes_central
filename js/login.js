/*
 * Notes Central — login page UI (login.html).
 *  - "Sign in" / "Create account" tabs (WAI-ARIA tabs: arrow keys, Home, End)
 *  - login.html#signup opens the "Create account" tab directly
 *  - Show / hide password buttons
 * Form submission is handled by notesscript.js.
 */
const tabs = Array.from(document.querySelectorAll('.auth-tabs [role="tab"]'));
const panelFor = (tab) => document.getElementById(tab.getAttribute("aria-controls"));

function selectTab(tab, { focusTab = false, updateHash = true } = {}) {
  tabs.forEach((t) => {
    const selected = t === tab;
    t.setAttribute("aria-selected", String(selected));
    t.tabIndex = selected ? 0 : -1;
    panelFor(t).hidden = !selected;
  });
  if (focusTab) tab.focus();
  if (updateHash) {
    const hash = tab.dataset.hash ? `#${tab.dataset.hash}` : "";
    history.replaceState(null, "", `${location.pathname}${location.search}${hash}`);
  }
}

/** Switches tab and moves focus to the first field of the new panel. */
export function showAuthTab(tabId) {
  const tab = document.getElementById(tabId);
  if (!tab) return;
  selectTab(tab);
  panelFor(tab).querySelector("input")?.focus();
}

if (tabs.length) {
  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => selectTab(tab));
    tab.addEventListener("keydown", (event) => {
      const last = tabs.length - 1;
      const next = { ArrowRight: i === last ? 0 : i + 1, ArrowLeft: i === 0 ? last : i - 1, Home: 0, End: last }[event.key];
      if (next === undefined) return;
      event.preventDefault();
      selectTab(tabs[next], { focusTab: true });
    });
  });

  document.querySelectorAll("[data-switch-to]").forEach((button) =>
    button.addEventListener("click", () => showAuthTab(button.dataset.switchTo))
  );

  const syncWithHash = () => {
    const tab = tabs.find((t) => t.dataset.hash && `#${t.dataset.hash}` === location.hash) || tabs[0];
    selectTab(tab, { updateHash: false });
  };
  syncWithHash();
  window.addEventListener("hashchange", syncWithHash);

  document.querySelectorAll(".password-toggle").forEach((button) => {
    const input = document.getElementById(button.getAttribute("aria-controls"));
    const label = button.firstChild; // visible "Show" / "Hide" text
    button.addEventListener("click", () => {
      const reveal = input.type === "password";
      input.type = reveal ? "text" : "password";
      label.textContent = reveal ? "Hide" : "Show";
    });
  });
}
