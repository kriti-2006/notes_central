/*
 * Notes Central — sign in / sign up requests (login.html).
 * Talks to the Express API in server.js:
 *   POST /signup  { username, email, password }
 *   POST /login   { email, password }  → { message, token, user }
 * The API address comes from <meta name="notes-api-base">. No secrets live here.
 */
import { validateForm, enableLiveValidation, setStatus } from "./forms.js";
import { apiBase } from "./util.js";
import { saveSession } from "./auth.js";
import { mergeGuestIntoAccount, syncLibrary } from "./library.js";
import { showAuthTab } from "./login.js";

const signInForm = document.getElementById("signin-form");
const signUpForm = document.getElementById("signup-form");
const signInStatus = document.getElementById("signin-status");
const signUpStatus = document.getElementById("signup-status");

/** POSTs JSON and returns { ok, message, data }; never throws. */
async function postJson(path, payload) {
  try {
    const response = await fetch(`${apiBase()}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    return { ok: response.ok, message: data.message, data };
  } catch {
    return { ok: false, message: "Couldn’t reach the server. Please check your connection and try again." };
  }
}

function handleSubmit(form, status, busyLabel, request) {
  const button = form.querySelector('button[type="submit"]');
  const idleLabel = button.textContent;
  enableLiveValidation(form);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const firstInvalid = validateForm(form);
    if (firstInvalid) {
      setStatus(status, "error", "Please fix the highlighted fields and try again.");
      firstInvalid.focus();
      return;
    }
    button.disabled = true;
    button.textContent = busyLabel;
    setStatus(status, "info", busyLabel);
    try {
      await request();
    } finally {
      button.disabled = false;
      button.textContent = idleLabel;
    }
  });
}

if (signInForm && signUpForm) {
  handleSubmit(signUpForm, signUpStatus, "Creating your account…", async () => {
    const username = signUpForm.elements.username.value.trim();
    const email = signUpForm.elements.email.value.trim();
    const password = signUpForm.elements.password.value;

    const result = await postJson("/signup", { username, email, password });
    if (!result.ok) {
      setStatus(signUpStatus, "error", result.message || "Sorry, your account couldn’t be created. Please try again.");
      return;
    }
    signUpForm.reset();
    setStatus(signUpStatus, "info", "");
    signInForm.elements.email.value = email;
    showAuthTab("tab-signin");
    setStatus(signInStatus, "success", `${result.message || "Account created"}. Enter your password to sign in.`);
    signInForm.elements.password.focus();
  });

  handleSubmit(signInForm, signInStatus, "Signing in…", async () => {
    const email = signInForm.elements.email.value.trim();
    const password = signInForm.elements.password.value;

    const result = await postJson("/login", { email, password });
    if (!result.ok || !result.data.token) {
      setStatus(signInStatus, "error", result.message || "Sign in failed. Please check your details and try again.");
      return;
    }
    if (!saveSession(result.data.token, result.data.user || { email })) {
      setStatus(signInStatus, "error", "Your browser is blocking storage, so you can’t stay signed in. Allow site data and try again.");
      return;
    }
    mergeGuestIntoAccount();
    await syncLibrary();
    setStatus(signInStatus, "success", "Signed in! Opening your library…");
    const next = new URLSearchParams(location.search).get("next");
    setTimeout(() => {
      window.location.href = next && /^[a-z]+\.html(\?[\w=&%.-]*)?$/.test(next) ? next : "dashboard.html";
    }, 700);
  });
}
