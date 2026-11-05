// Session handling for the Node API's JSON Web Tokens.
// The token is stored under "token" (as before); the user profile under "nc:user".
import { store } from "./util.js";

const TOKEN_KEY = "token";
const USER_KEY = "nc:user";

function readToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/** Decodes a JWT payload without verifying it (the server verifies). */
function decode(token) {
  try {
    const part = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(part));
  } catch {
    return null;
  }
}

/** Returns { token, user } for a valid, unexpired session, otherwise null. */
export function getSession() {
  const token = readToken();
  if (!token) return null;
  const payload = decode(token);
  if (!payload || (payload.exp && payload.exp * 1000 < Date.now())) {
    signOut();
    return null;
  }
  const user = store.get(USER_KEY, null) || { id: payload.id };
  return { token, user: { ...user, id: payload.id ?? user.id } };
}

export function saveSession(token, user) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    return false;
  }
  if (user) store.set(USER_KEY, user);
  window.dispatchEvent(new CustomEvent("nc:session"));
  return true;
}

export function signOut() {
  store.remove(TOKEN_KEY);
  store.remove(USER_KEY);
  window.dispatchEvent(new CustomEvent("nc:session"));
}

export const displayName = (session) =>
  (session && (session.user.username || (session.user.email || "").split("@")[0])) || "Student";
