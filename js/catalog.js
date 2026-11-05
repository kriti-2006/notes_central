// Loads the resource catalogue (data/resources.json) and provides search.

let catalogPromise = null;

/** Fetches the catalogue once per page; rejects on network or parse errors. */
export function loadCatalog({ retry = false } = {}) {
  if (!catalogPromise || retry) {
    catalogPromise = fetch("data/resources.json", { cache: "no-cache" })
      .then((response) => {
        if (!response.ok) throw new Error(`Catalogue request failed (${response.status})`);
        return response.json();
      })
      .then(indexCatalog)
      .catch((error) => {
        catalogPromise = null; // allow a retry
        throw error;
      });
  }
  return catalogPromise;
}

function indexCatalog(data) {
  const subjects = new Map(data.subjects.map((s) => [s.id, s]));
  const resources = data.resources.map((r) => ({ ...r, subjectInfo: subjects.get(r.subject) }));
  const byId = new Map(resources.map((r) => [r.id, r]));
  const countBySubject = new Map();
  resources.forEach((r) => countBySubject.set(r.subject, (countBySubject.get(r.subject) || 0) + 1));
  const types = [...new Set(resources.map((r) => r.type))];
  const categories = [...new Set(data.subjects.map((s) => s.category))];
  return { ...data, subjects: data.subjects, subjectMap: subjects, resources, byId, countBySubject, types, categories };
}

/* ---- Search ------------------------------------------------------------- */
const normalize = (text) =>
  String(text || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[’'`]/g, "")
    .replace(/[^a-z0-9+#]+/g, " ")
    .trim();

export const tokenize = (query) => normalize(query).split(" ").filter(Boolean);

// Short tokens ("os", "ds") must start a word; longer ones may appear anywhere.
function fieldMatches(field, token) {
  if (token.length <= 3) return (` ${field}`).includes(` ${token}`);
  return field.includes(token);
}

const fieldsCache = new WeakMap();
function fieldsFor(resource) {
  let f = fieldsCache.get(resource);
  if (!f) {
    const s = resource.subjectInfo || {};
    f = [
      [normalize(resource.title), 6],
      [normalize(`${s.title} ${s.short} ${s.keywords}`), 4],
      [normalize(resource.topics.join(" ")), 3],
      [normalize(`${resource.type} ${s.category}`), 2],
      [normalize(resource.summary), 1],
    ];
    fieldsCache.set(resource, f);
  }
  return f;
}

/** Scores a resource against query tokens. Every token must match somewhere. */
export function scoreResource(resource, tokens) {
  if (!tokens.length) return 1;
  const fields = fieldsFor(resource);
  let score = 0;
  for (const token of tokens) {
    let best = 0;
    for (const [text, weight] of fields) if (weight > best && fieldMatches(text, token)) best = weight;
    if (!best) return 0;
    score += best;
  }
  if (fields[0][0].startsWith(tokens.join(" "))) score += 5;
  return score;
}

export function scoreSubject(subject, tokens) {
  if (!tokens.length) return 1;
  const text = normalize(`${subject.title} ${subject.short} ${subject.keywords} ${subject.category}`);
  return tokens.every((t) => fieldMatches(text, t)) ? 1 + (normalize(subject.title).startsWith(tokens[0]) ? 2 : 0) : 0;
}

/** Wraps query matches in <mark>. Input must already be HTML-escaped plain text. */
export function highlight(escapedText, tokens) {
  const usable = tokens.filter((t) => t.length > 1);
  if (!usable.length) return escapedText;
  const pattern = new RegExp(`(${usable.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  return escapedText.replace(pattern, "<mark>$1</mark>");
}
