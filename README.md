# event-modeling-hcl.github.io

The documentation site for [`event-modeling-hcl`](https://github.com/event-modeling-hcl/eventmodeling-hcl),
an HCL language for Event Modeling with a validator, formatter, and HTML
renderer.

Plain HTML/CSS/JS. No build framework, no bundler. The only generated
artifacts are the example canvases under `examples/canvas/`, produced at
deploy time by running the real `eventmodeling-hcl diagram` command over the
vendored models in `examples/models/`.

## Design system

`assets/site.css` and `assets/site.js` hold every shared token and component —
color/type/spacing tokens, `<site-nav>`, `<site-footer>`, `<code-block>`,
`callout`, and the light/dark/system theme toggle. `assets/hcl-highlight.js`
is a small dependency-free HCL syntax highlighter used by `<code-block lang="hcl">`.
Fonts (IBM Plex Sans / Sans Condensed / Mono) are self-hosted under
`assets/fonts/` under the OFL (see `assets/fonts/OFL.txt`).

[`styleguide.html`](styleguide.html) renders every shared component on one
page — not linked from navigation, but the place to check a design-system
change in both themes before it ships to a real page.

`assets/img/hero-canvas.png` is a real screenshot of
`eventmodeling-hcl diagram examples/minimal.em.hcl`, not a mockup — captured
with `chromium --headless --screenshot` and cropped to the canvas card. If the
tool's rendered output changes, regenerate it the same way rather than editing
the PNG by hand.

**Content accuracy:** when porting language/spec content onto this site,
always pull from the currently *published* source
(`github.com/event-modeling-hcl/spec`, and the tool repo's own `main`), never
from a locally cached copy — both have moved since this site started (the
spec went from draft to v0.3.0; the tool repo reached `v0.4.0` on `main`),
and a stale copy will teach
constructs the current validator rejects. Every `<code-block lang="hcl">` on
the Learn pages is a complete, independently valid `.em.hcl` document (or a
deliberate negative example, verified to fail with its expected `EMxxx`
code). `scripts/validate-learn-snippets.py` checks this by extracting every
such block and running the real CLI's `validate` against it — CI runs it on
every deploy, but re-run it yourself after editing any Learn page:

```bash
go build -o /tmp/eventmodeling-hcl ./cmd/eventmodeling-hcl   # in the tool checkout
TOOL_BIN=/tmp/eventmodeling-hcl scripts/validate-learn-snippets.py
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

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000/>.

## Deploy

Pushes to `main` run [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml),
which builds the `eventmodeling-hcl` CLI from its own repo, renders the example
canvases, and publishes to GitHub Pages. One-time repo setting required:
**Settings → Pages → Build and deployment → Source: GitHub Actions**.

The same workflow also runs `make build-wasm` in the tool checkout and copies
its output — `eventmodeling-hcl.wasm`, `wasm_exec.js`, `seed.js`, `editor.js`, and
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
