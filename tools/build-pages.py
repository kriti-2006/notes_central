"""Assemble the static HTML pages from tools/templates/.

Shared partials (head, header + quick-find palette, footer) are written once and
injected into every page. Counts and subject chips come from data/resources.json,
so run tools/build-catalog.py first when notes change.

    python3 tools/build-pages.py

Edit the templates, not the generated *.html files in the project root.
"""
import html
import json
import pathlib
import re
import urllib.parse

ROOT = pathlib.Path(__file__).resolve().parent.parent
T = ROOT / "tools" / "templates"

PAGES = {  # output file: nav key
    "index.html": "home", "notess.html": "explore", "subjects.html": "subjects",
    "dashboard.html": "library", "viewer.html": "", "about.html": "about",
    "contact.html": "contact", "login.html": "login",
}
NAV_KEYS = ["home", "explore", "subjects", "library", "about", "contact", "login"]

def svg(body, cls=""):
    c = f' class="{cls}"' if cls else ""
    return (f'<svg{c} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">{body}</svg>')

ICONS = {
    "search": svg('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>'),
    "arrow": svg('<path d="M5 12h14M13 6l6 6-6 6"/>', "btn-arrow"),
    "close": svg('<path d="M6 6l12 12M18 6L6 18"/>'),
    "close-x": svg('<path d="M6 6l12 12M18 6L6 18"/>', "icon-close"),
    "menu": svg('<path d="M4 7h16M4 12h16M4 17h16"/>', "icon-open"),
    "moon": svg('<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>', "icon-moon"),
    "sun": svg('<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4"/>', "icon-sun"),
    "filter": svg('<path d="M4 6h16M7 12h10M10 18h4"/>'),
    "bookmark": svg('<path d="M6 3.5h12v17l-6-4.2-6 4.2z"/>'),
    "history": svg('<path d="M3.5 12a8.5 8.5 0 1 0 2.5-6"/><path d="M3.5 4.5V9H8M12 8v4.5l3 1.8"/>'),
    "book": svg('<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>'),
    "grid": svg('<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>'),
    "mail": svg('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5l8.5 6 8.5-6"/>'),
    "plus": svg('<path d="M12 5v14M5 12h14"/>'),
    "alert": svg('<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>'),
    "keyboard": svg('<rect x="2.5" y="6" width="19" height="12" rx="2"/><path d="M6.5 10h1M10 10h1M13.5 10h1M17 10h.5M7 14h10"/>'),
    "device": svg('<rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M11 18.5h2"/>'),
    "contrast": svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v17a8.5 8.5 0 0 0 0-17z" fill="currentColor"/>'),
}

def main():
    catalog = json.loads((ROOT / "data" / "resources.json").read_text(encoding="utf-8"))
    counts = {}
    for r in catalog["resources"]:
        counts[r["subject"]] = counts.get(r["subject"], 0) + 1
    plural = lambda n, w: f"{n} {w}" + ("" if n == 1 else "s")
    chips = "\n".join(
        f'              <li><a class="chip hue-{s["hue"]}" href="notess.html?subject={urllib.parse.quote(s["id"])}">'
        f'<span class="chip-dot" aria-hidden="true"></span>{html.escape(s["title"])}'
        f'<span class="count"><span class="sr-only">, </span>{plural(counts.get(s["id"], 0), "resource")}</span></a></li>'
        for s in catalog["subjects"]
    )
    tokens = {
        "{{N_SUBJECTS}}": str(len(catalog["subjects"])),
        "{{N_RESOURCES}}": str(len(catalog["resources"])),
        "{{SUBJECT_CHIPS}}": chips,
    }

    mark = (T / "_mark.html").read_text().strip()
    head = (T / "_head.html").read_text().rstrip()
    header = (T / "_header.html").read_text().rstrip().replace("{{MARK}}", mark)
    footer = (T / "_footer.html").read_text().rstrip().replace("{{MARK}}", mark)

    for name, key in PAGES.items():
        page = (T / name).read_text()
        h = header
        for k in NAV_KEYS:
            h = h.replace("{{CUR_%s}}" % k, ' aria-current="page"' if k == key else "")
        out = page.replace("{{HEAD}}", head).replace("{{HEADER}}", h).replace("{{FOOTER}}", footer)
        for t, v in tokens.items():
            out = out.replace(t, v)
        out = re.sub(r"\{\{ICON:([a-z-]+)\}\}", lambda m: ICONS[m.group(1)], out)
        leftover = re.findall(r"\{\{[^}]+\}\}", out)
        assert not leftover, (name, leftover)
        (ROOT / name).write_text(out, encoding="utf-8")
        print("built", name)


if __name__ == "__main__":
    main()
