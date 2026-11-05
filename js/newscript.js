/*
 * Notes Central — contact form (contact.html).
 * Submits to Formspree in the background with inline, screen-reader-friendly
 * validation, and pre-fills the message when arriving from a "Request" link
 * (contact.html?subject=Python). Without JavaScript the form posts normally.
 */
import { validateForm, enableLiveValidation, setStatus } from "./forms.js";

const form = document.getElementById("contact-form");

if (form) {
  const status = document.getElementById("contact-status");
  const submitButton = form.querySelector('button[type="submit"]');
  enableLiveValidation(form);

  const subject = new URLSearchParams(location.search).get("subject");
  if (subject && !form.elements.message.value) {
    form.elements.message.value = `Hi! I’d like notes for ${subject.slice(0, 80)}.`;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const firstInvalid = validateForm(form);
    if (firstInvalid) {
      setStatus(status, "error", "Please fix the highlighted fields and try again.");
      firstInvalid.focus();
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Sending…";
    setStatus(status, "info", "Sending your message…");

    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      });
      if (response.ok) {
        form.reset();
        setStatus(status, "success", "Thanks! Your message has been sent. You’ll get a reply soon.");
      } else {
        const data = await response.json().catch(() => ({}));
        const detail = Array.isArray(data.errors) ? data.errors.map((e) => e.message).join(" ") : "";
        setStatus(status, "error", detail || "Sorry, your message couldn’t be sent. Please try again.");
      }
    } catch {
      setStatus(status, "error", "Couldn’t reach the server. Check your connection and try again.");
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Send message";
    }
  });
}
