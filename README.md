# event-modeling-hcl.github.io

The teaching and marketing site for [`event-modeling-hcl`](https://github.com/event-modeling-hcl/eventmodeling-hcl) —
a native HCL language for Event Modeling, plus a validator and renderer that
turns a model into a hosted, interactive diagram right beside your code.

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
spec went from draft to final v0.2.0; the tool repo went from `v0.2.0-rc.1`
on a feature branch to `v0.3.0` on `main`), and a stale copy will teach
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

## Status

Under construction, built stage by stage:

- [x] Stage 0 — scaffold & deploy pipeline
- [x] Stage 1 — design system & shared page shell
- [x] Stage 2 — landing page
- [x] Stage 3 — why HCL / comparison page
- [x] Stage 4 — learn section
- [x] Stage 5 — examples gallery & canvas pipeline
- [x] Stage 6 — author-with-AI, get-started, reference pages
- [ ] Stage 7 — polish & launch
