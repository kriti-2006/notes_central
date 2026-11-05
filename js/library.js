// Personal library: bookmarks, recently viewed resources and favourite subjects.
//
// Local-first: everything is saved to localStorage straight away, under a
// separate key per signed-in user (or "guest"). When signed in, the library is
// also synced to the account through server.js (GET/PUT /library) so it
// follows the user across devices. If the API is unreachable, changes stay on
// the device and are pushed on the next successful sync.
import { store, apiBase, debounce } from "./util.js";
import { getSession, signOut } from "./auth.js";

const MAX_RECENT = 20;
const events = new EventTarget();
const empty = () => ({ bookmarks: [], recent: [], favourites: [], updatedAt: 0 });

let status = "guest"; // guest | syncing | synced | offline
const keyFor = (session) => `nc:library:${session ? session.user.id : "guest"}`;

function sanitize(raw) {
  const lib = empty();
  if (!raw || typeof raw !== "object") return lib;
  const isId = (v) => typeof v === "string" && /^[a-z0-9-]{1,80}$/.test(v);
  const entries = (list) =>
    (Array.isArray(list) ? list : [])
      .filter((e) => e && isId(e.id) && Number.isFinite(e.at))
      .map((e) => ({ id: e.id, at: e.at }));
  lib.bookmarks = entries(raw.bookmarks);
  lib.recent = entries(raw.recent).slice(0, MAX_RECENT);
  lib.favourites = (Array.isArray(raw.favourites) ? raw.favourites : []).filter(isId);
  lib.updatedAt = Number.isFinite(raw.updatedAt) ? raw.updatedAt : 0;
  return lib;
}

const read = () => sanitize(store.get(keyFor(getSession())));

function write(lib, { touch = true, push = true } = {}) {
  if (touch) lib.updatedAt = Date.now();
  store.set(keyFor(getSession()), lib);
  events.dispatchEvent(new CustomEvent("change", { detail: lib }));
  if (push && getSession()) schedulePush();
  return lib;
}

/* ---- Public API ---------------------------------------------------------- */
export const getLibrary = read;
export const getSyncStatus = () => status;

export function onLibraryChange(fn) {
  const handler = (e) => fn(e.detail || read());
  events.addEventListener("change", handler);
  events.addEventListener("status", handler);
  return () => {
    events.removeEventListener("change", handler);
    events.removeEventListener("status", handler);
  };
}

export const isBookmarked = (id) => read().bookmarks.some((b) => b.id === id);

/** Adds or removes a bookmark; returns the new saved state. */
export function toggleBookmark(id) {
  const lib = read();
  const saved = lib.bookmarks.some((b) => b.id === id);
  lib.bookmarks = saved ? lib.bookmarks.filter((b) => b.id !== id) : [{ id, at: Date.now() }, ...lib.bookmarks];
  write(lib);
  return !saved;
}

export function recordView(id) {
  const lib = read();
  lib.recent = [{ id, at: Date.now() }, ...lib.recent.filter((r) => r.id !== id)].slice(0, MAX_RECENT);
  write(lib);
}

export function clearRecent() {
  const lib = read();
  lib.recent = [];
  write(lib);
}

export const isFavourite = (subjectId) => read().favourites.includes(subjectId);

export function toggleFavourite(subjectId) {
  const lib = read();
  const fav = lib.favourites.includes(subjectId);
  lib.favourites = fav ? lib.favourites.filter((s) => s !== subjectId) : [...lib.favourites, subjectId];
  write(lib);
  return !fav;
}

/** After sign-in: fold anything saved as a guest into the account's library. */
export function mergeGuestIntoAccount() {
  const session = getSession();
  if (!session) return;
  const guest = sanitize(store.get(keyFor(null)));
  const mine = read();
  const union = (a, b) => {
    const map = new Map();
    [...a, ...b].forEach((e) => {
      if (!map.has(e.id) || map.get(e.id).at < e.at) map.set(e.id, e);
    });
    return [...map.values()].sort((x, y) => y.at - x.at);
  };
  mine.bookmarks = union(mine.bookmarks, guest.bookmarks);
  mine.recent = union(mine.recent, guest.recent).slice(0, MAX_RECENT);
  mine.favourites = [...new Set([...mine.favourites, ...guest.favourites])];
  store.remove(keyFor(null));
  write(mine);
}

/* ---- Server sync ------------------------------------------------------------ */
function setStatus(next) {
  status = next;
  events.dispatchEvent(new CustomEvent("status"));
}

async function request(method, body) {
  const session = getSession();
  if (!session) return null;
  const response = await fetch(`${apiBase()}/library`, {
    method,
    headers: { Authorization: `Bearer ${session.token}`, ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (response.status === 401) {
    signOut(); // token rejected by the server
    throw new Error("Session expired");
  }
  if (!response.ok) throw new Error(`Library sync failed (${response.status})`);
  return response.json();
}

const push = async () => {
  if (!getSession()) return;
  setStatus("syncing");
  try {
    await request("PUT", read());
    setStatus("synced");
  } catch {
    setStatus(getSession() ? "offline" : "guest");
  }
};
const schedulePush = debounce(push, 600);

/** Pulls the account library; the most recently updated copy wins. */
export async function syncLibrary() {
  if (!getSession()) {
    setStatus("guest");
    return;
  }
  setStatus("syncing");
  try {
    const remote = sanitize((await request("GET")) || {});
    const local = read();
    if (remote.updatedAt > local.updatedAt) {
      write(remote, { touch: false, push: false });
    } else if (local.updatedAt > remote.updatedAt) {
      await request("PUT", local);
    }
    setStatus("synced");
  } catch {
    setStatus(getSession() ? "offline" : "guest");
  }
}

// Keep tabs in step with each other.
window.addEventListener("storage", (e) => {
  if (e.key && e.key.startsWith("nc:library:")) events.dispatchEvent(new CustomEvent("change", { detail: read() }));
});
