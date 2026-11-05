// Small shared helpers: safe storage, HTML escaping, icons, formatting.

/** localStorage wrapper that never throws (private mode, blocked storage…). */
export const store = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* storage unavailable */
    }
  },
};

const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ESCAPES[c]);

export const debounce = (fn, ms = 200) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
};

export const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** "just now", "5 min ago", "yesterday", "3 Nov" */
export function relativeTime(timestamp, now = Date.now()) {
  const diff = Math.max(0, now - timestamp);
  const min = Math.round(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const hours = Math.round(min / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(timestamp).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export const formatDate = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

export const plural = (n, word, many = `${word}s`) => `${n} ${n === 1 ? word : many}`;

/** Reads the API base URL from <meta name="notes-api-base">. */
export function apiBase() {
  const meta = document.querySelector('meta[name="notes-api-base"]');
  return ((meta && meta.content) || "http://localhost:5000").replace(/\/$/, "");
}

// Stroke icons (24×24). Always decorative: the control carries the label.
const svg = (body, extra = "") =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"${extra}>${body}</svg>`;

export const icons = {
  bookmark: svg('<path d="M6 3.5h12v17l-6-4.2-6 4.2z"/>'),
  star: svg('<path d="M12 3.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8-4.2-4.1 5.9-.9z"/>'),
  arrow: svg('<path d="M5 12h14M13 6l6 6-6 6"/>', ' class="btn-arrow"'),
  arrowLeft: svg('<path d="M19 12H5M11 6l-6 6 6 6"/>'),
  close: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
  clock: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  download: svg('<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>'),
  print: svg('<path d="M7 9V3.5h10V9M7 17H4.5v-7.5h15V17H17"/><path d="M7 14h10v6.5H7z"/>'),
  library: svg('<path d="M4 4.5h4v15H4zM10 4.5h4v15h-4zM16.2 5.2l3.8-1 3 14.6-3.8 1z"/>'),
  logout: svg('<path d="M15 4.5h3.5v15H15M10 8l-4 4 4 4M6 12h10"/>'),
  cloud: svg('<path d="M7 18.5h10a4 4 0 0 0 .6-8 6 6 0 0 0-11.4 1.6A3.3 3.3 0 0 0 7 18.5z"/>'),
  device: svg('<rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M11 18.5h2"/>'),
};
