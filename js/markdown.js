// Minimal, safe Markdown renderer for the notes in notes/*.md.
// All text is HTML-escaped first; only a fixed set of tags is produced.
//
// Supported: ## / ### headings, paragraphs, - and 1. lists, > callouts,
// ``` code blocks, | tables |, **bold**, *italic*, `code`, [links](url),
// and practice questions:   ?? Question text
//                           Answer lines (until a blank line)
import { escapeHtml } from "./util.js";

function inline(text) {
  const codes = [];
  let out = escapeHtml(text).replace(/`([^`]+)`/g, (_, code) => {
    codes.push(code);
    return `\u0000${codes.length - 1}\u0000`;
  });
  out = out
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*\w])\*(?!\s)([^*]+?)\*(?!\w)/g, "$1<em>$2</em>")
    .replace(/\[([^\]]+)\]\(((?:https?:\/\/|\/|\.\/|[a-z0-9-]+\.html)[^)\s]*)\)/gi, '<a href="$2">$1</a>');
  return out.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${codes[i]}</code>`);
}

const slugify = (text) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "section";

const splitRow = (line) =>
  line.trim().replace(/^\||\|$/g, "").replace(/\\\|/g, "\u0001").split("|").map((c) => c.replace(/\u0001/g, "|").trim());

function renderBlocks(lines, ctx) {
  const html = [];
  let i = 0;
  const isBlank = (l) => !l || !l.trim();

  while (i < lines.length) {
    const line = lines[i];

    if (isBlank(line)) {
      i += 1;
      continue;
    }

    // Fenced code block
    if (line.startsWith("```")) {
      const code = [];
      i += 1;
      while (i < lines.length && !lines[i].startsWith("```")) code.push(lines[i++]);
      i += 1;
      html.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
      continue;
    }

    // Headings
    const heading = /^(#{2,3})\s+(.*)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      const text = heading[2].trim();
      let id = slugify(text);
      while (ctx.ids.has(id)) id += "-x";
      ctx.ids.add(id);
      ctx.headings.push({ id, text, level });
      html.push(`<h${level} id="${id}">${inline(text)}</h${level}>`);
      i += 1;
      continue;
    }

    // Practice question → accordion
    if (line.startsWith("?? ")) {
      ctx.question += 1;
      const question = line.slice(3).trim();
      const answer = [];
      i += 1;
      let inFence = false;
      while (i < lines.length && (inFence || !isBlank(lines[i])) && !(!inFence && lines[i].startsWith("?? "))) {
        if (lines[i].startsWith("```")) inFence = !inFence;
        answer.push(lines[i++]);
      }
      html.push(`<details class="accordion practice"><summary><span><span class="q-num">Q${ctx.question}.</span>${inline(question)}</span></summary>
        <div class="accordion-body">${renderBlocks(answer, ctx)}</div></details>`);
      continue;
    }

    // Table
    if (line.trim().startsWith("|") && lines[i + 1] && /^\s*\|?\s*:?-{3,}/.test(lines[i + 1])) {
      const head = splitRow(line);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) rows.push(splitRow(lines[i++]));
      html.push(`<div class="table-wrap" tabindex="0" role="region" aria-label="Table: ${escapeHtml(head.join(", "))}"><table>
        <thead><tr>${head.map((c) => `<th scope="col">${inline(c)}</th>`).join("")}</tr></thead>
        <tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`).join("")}</tbody>
      </table></div>`);
      continue;
    }

    // Callout
    if (line.startsWith(">")) {
      const quote = [];
      while (i < lines.length && lines[i].startsWith(">")) quote.push(lines[i++].replace(/^>\s?/, ""));
      html.push(`<blockquote>${renderBlocks(quote, ctx)}</blockquote>`);
      continue;
    }

    // Lists
    const listType = /^\s*-\s+/.test(line) ? "ul" : /^\s*\d+\.\s+/.test(line) ? "ol" : null;
    if (listType) {
      const marker = listType === "ul" ? /^\s*-\s+/ : /^\s*\d+\.\s+/;
      const items = [];
      while (i < lines.length && marker.test(lines[i])) items.push(lines[i++].replace(marker, ""));
      html.push(`<${listType}>${items.map((it) => `<li>${inline(it)}</li>`).join("")}</${listType}>`);
      continue;
    }

    // Paragraph
    const para = [];
    while (
      i < lines.length && !isBlank(lines[i]) &&
      !/^(#{2,3}\s|```|\?\? |>|\s*-\s+|\s*\d+\.\s+)/.test(lines[i]) &&
      !(lines[i].trim().startsWith("|") && lines[i + 1] && /^\s*\|?\s*:?-{3,}/.test(lines[i + 1]))
    ) {
      para.push(lines[i++].trim());
    }
    html.push(`<p>${inline(para.join(" "))}</p>`);
  }
  return html.join("\n");
}

/** Returns { html, headings: [{ id, text, level }], words }. */
export function renderMarkdown(source) {
  const ctx = { ids: new Set(), headings: [], question: 0 };
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  return { html: renderBlocks(lines, ctx), headings: ctx.headings, words: (source.match(/\w+/g) || []).length };
}
