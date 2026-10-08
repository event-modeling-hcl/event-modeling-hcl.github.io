# event-modeling-hcl.github.io

The documentation site for [`emhcl`](https://github.com/event-modeling-hcl/eventmodeling-hcl),
an HCL language for Event Modeling with a validator, formatter, and HTML
renderer.

Plain HTML/CSS/JS. No build framework, no bundler. The only generated
artifacts are the example canvases under `examples/canvas/`, produced at
deploy time by running the real `emhcl diagram` command over the
vendored models in `examples/models/`.

## Design system

`assets/site.css` and `assets/site.js` hold every shared token and component:
the color, type, and spacing tokens, `<site-nav>`, `<site-footer>`,
`<code-block>`, `callout`, and the light/dark/system theme toggle.
`assets/hcl-highlight.js` is a small HCL syntax highlighter without
dependencies. `<code-block lang="hcl">` uses it.

The design is a research-journal style. Pages use warm ivory paper and
near-black ink. One clay accent marks eyebrows, rules, and the primary button.
Emphasis comes from type and underlines. The design uses no shadows and no
rounded corners, except the rounded bottom of the primary button. The class
`section-dark` gives a near-black section with serif headings. The element
colors (`--event`, `--command`, and the others) match the diagram canvases, so
do not change them on their own.

The `--radius-primary` token controls the bottom corners of primary actions.
Secondary actions and tool controls stay square. Focus outlines do not change
the shape of a control. Disabled controls do not respond to hover.

All copy follows plain English rules based on ASD-STE100: short sentences,
active voice, no em dashes, no contractions, and no "should" or "may".

IBM Plex Sans and IBM Plex Mono are self-hosted under `assets/fonts/` under the
OFL (see `assets/fonts/OFL.txt`). Serif headings use the system serif fonts.

[`styleguide.html`](styleguide.html) shows every shared component on one page.
Navigation does not link to it. Use it to examine a design change in both
themes before the change goes to a real page.

`assets/img/hero-canvas.png` is a real screenshot of
`emhcl diagram examples/minimal.em.hcl`, not a mockup — captured
with `chromium --headless --screenshot` and cropped to the canvas card. If the
tool's rendered output changes, regenerate it the same way rather than editing
the PNG by hand.

The website documents Event Modeling HCL Specification v0.4.0 and emhcl v0.9.0.
Use the [published specification](https://github.com/event-modeling-hcl/spec/blob/main/eventmodeling.hclspec.md)
for language rules. Use the [v0.9.0 tool changelog](https://github.com/event-modeling-hcl/eventmodeling-hcl/blob/v0.9.0/CHANGELOG.md)
for released tool behavior.

Use the [methodology guide](https://github.com/event-modeling-hcl/spec/blob/main/guides/EVENT_MODELING_METHODOLOGY.md)
for business discovery and model review. The guide describes concepts that HCL
does not encode directly. Keep method advice separate from grammar rules.
If they differ, the specification defines legal HCL.

Every `<code-block lang="hcl">` on a Learn page is a complete `.em.hcl` document
or a deliberate invalid example with an expected `EMxxx` diagnostic.
`scripts/validate-learn-snippets.py` runs `emhcl validate` on each block.
CI runs this script on every deploy.
After you edit a Learn page, run the script with the real CLI:

```bash
go build -o /tmp/emhcl ./cmd/emhcl   # in the tool checkout
TOOL_BIN=/tmp/emhcl scripts/validate-learn-snippets.py
```

## Adding a page

Every page shares the same `<head>` boilerplate — copy it from a similar
existing page rather than retyping it, and keep all of it:

1. The inline theme-restoring `<script>` (must come before the stylesheet, or
   the wrong theme flashes on load).
2. `title`, `meta description`, `og:*`, `twitter:card`.
3. Favicon links, `<link rel="canonical" href="https://event-modeling-hcl.github.io/…">`
   (the live production URL, even in local preview — omit this on a page you
   don't want indexed, and add `<meta name="robots" content="noindex">`
   instead, as `styleguide.html` and `404.html` do).
4. `<link rel="stylesheet" href="/assets/site.css">`.
5. `<site-nav>` / `<site-footer>` and the `hcl-highlight.js` + `site.js`
   `<script defer>` pair at the end of `<body>`.

Then add the page to `sitemap.xml`, and to `assets/site.js`'s `NAV_LINKS` (top
nav — reserve this for primary sections) or `FOOTER_LINKS` (secondary/utility
pages) **only once the page exists** — never link a page from shared chrome
before it's shipped, so the live site never carries a dead link mid-build.
`isCurrentPage` in `site.js` treats a nav entry pointing at a section hub
(e.g. `/learn/index.html`) as current for every page under that path too.

The nav also carries one CTA button (`Get Started`, styled via `.nav-cta`,
distinct from the plain links) — keep it to at most one, or it stops reading
as a call to action. The hamburger breakpoint is 960px, not the more typical
780px, specifically because that CTA button needs the extra room.

## Local preview

Run the local server with Python 3. It uses only the Python standard library.

```bash
make serve
```

Open <http://127.0.0.1:8000/> in a browser. Set `PORT` to use another port:

```bash
make serve PORT=8080
```

By default, the server accepts connections only from this computer. To open it from another device on your network, run:

```bash
make serve HOST=0.0.0.0
```

Open the computer's network address on port `8000` from the other device.

## Deploy

Pushes to `main` run [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml),
which checks out the tool's immutable `v0.9.0` tag, builds the `emhcl` CLI,
renders the example canvases, and publishes to GitHub Pages. An example in
`examples/models/` is a `.em.hcl` file or a folder of `.em.hcl` files (a folder
model). Both render to `examples/canvas/<name>.html`. One-time repo
setting required: **Settings → Pages → Build and deployment → Source: GitHub
Actions**.

The same workflow also runs `make build-wasm` in the tool checkout and copies
its output — `emhcl.wasm`, `wasm_exec.js`, `seed.js`, `editor.js`, and
`loader.js` — into `/playground/`. `playground/index.html` loads those shared assets
unmodified. They are one shared source the tool repo owns (`web/playground/`), not a
reimplementation, so a change to the tool's WASM API (function names, the
`{html, diagnostics}` shape) or to that DOM contract breaks both call sites
together, on purpose, rather than silently drifting apart. The WASM module is
~2.2&nbsp;MB gzipped and loads once, only on `/playground/`, then stays
browser-cached — the rest of the site never pays for it. These generated files are
`.gitignore`d here, the same way `examples/canvas/` is.

The full-page playground loads CodeMirror 5 from cdnjs for source editing,
line numbers, and folding. The editor stores its draft, profile, pane width,
and preview zoom in the browser's local storage.

## SEO and crawling

`sitemap.xml` and `robots.txt` live at the repo root. `robots.txt` disallows
`/examples/canvas/` because those files are the CLI's raw diagram output. Their
generated `<head>` is outside this site's control, and they are not intended to
rank. The per-example detail pages in `/examples/*.html` should be indexed
instead. Keep `sitemap.xml` in sync when adding or removing a page.

## Custom domain

Not configured — the site serves from the default
`event-modeling-hcl.github.io`. To add one later: create a `CNAME` file at
the repo root containing just the domain, point its DNS at GitHub Pages, then
update every `rel="canonical"` href, `sitemap.xml`, and `robots.txt`'s
`Sitemap:` line from `event-modeling-hcl.github.io` to the new domain.

## Browser QA coverage

All manual QA in this project's history was done in one Chromium-based
browser (light/dark, mobile through desktop widths, keyboard focus, real
console/network inspection). Nothing here has been checked in Firefox or
Safari — if you have access to either, a pass over the shared components in
`styleguide.html` would close that gap fastest.

## Status

All seven planned stages are built and locally verified. What's not yet
confirmed: a real deploy — every commit through Stage 7 was pushed manually
per stage except the last few, which were intentionally left committed but
unpushed (see git log). Push `main` and confirm the Actions run goes green
before considering this actually launched. Built stage by stage:

- [x] Stage 0 — scaffold & deploy pipeline
- [x] Stage 1 — design system & shared page shell
- [x] Stage 2 — landing page
- [x] Stage 3 — why HCL / comparison page
- [x] Stage 4 — learn section
- [x] Stage 5 — examples gallery & canvas pipeline
- [x] Stage 6 — author-with-AI, get-started, reference pages
- [x] Stage 7 — polish & launch
