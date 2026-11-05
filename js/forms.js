// Accessible form validation helpers shared by the login and contact forms.
// Each validated field has an id, a data-label (e.g. "email address") and an
// empty <p id="{field id}-error"> referenced by its aria-describedby.

function messageFor(input) {
  const label = input.dataset.label || "this field";
  const v = input.validity;
  if (v.valueMissing) return `Enter your ${label}.`;
  if (v.typeMismatch && input.type === "email") return "Enter a valid email address, like name@example.com.";
  if (v.tooShort) return `Your ${label} must be at least ${input.minLength} characters.`;
  if (v.tooLong) return `Your ${label} must be ${input.maxLength} characters or fewer.`;
  if (v.patternMismatch && input.title) return input.title;
  return input.validationMessage;
}

function setFieldError(input, message) {
  const error = document.getElementById(`${input.id}-error`);
  if (message) input.setAttribute("aria-invalid", "true");
  else input.removeAttribute("aria-invalid");
  if (error) error.textContent = message || "";
}

/** Shows inline errors and returns the first invalid field (or null). */
export function validateForm(form) {
  let firstInvalid = null;
  form.querySelectorAll("[data-label]").forEach((input) => {
    const valid = input.checkValidity();
    setFieldError(input, valid ? "" : messageFor(input));
    if (!valid && !firstInvalid) firstInvalid = input;
  });
  return firstInvalid;
}

/** Replaces browser tooltips with inline messages that clear once fixed. */
export function enableLiveValidation(form) {
  form.noValidate = true;
  form.addEventListener("input", (event) => {
    const input = event.target;
    if (input.getAttribute("aria-invalid") === "true" && input.checkValidity()) setFieldError(input, "");
  });
}

/** Writes into a role="status" region; type: success | error | info. */
export function setStatus(region, type, message) {
  if (!region) return;
  region.className = `form-status form-status--${type}`;
  region.textContent = message;
}
