# event-modeling-hcl.github.io

The teaching and marketing site for [`event-modeling-hcl`](https://github.com/event-modeling-hcl/eventmodeling-hcl) —
a native HCL language for Event Modeling, plus a validator and renderer that
turns a model into a hosted, interactive diagram right beside your code.

Plain HTML/CSS/JS. No build framework, no bundler. The only generated
artifacts are the example canvases under `examples/canvas/`, produced at
deploy time by running the real `eventmodeling-hcl diagram` command over the
vendored models in `examples/models/`.

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
- [ ] Stage 1 — design system & shared page shell
- [ ] Stage 2 — landing page
- [ ] Stage 3 — why HCL / comparison page
- [ ] Stage 4 — learn section
- [ ] Stage 5 — examples gallery & canvas pipeline
- [ ] Stage 6 — author-with-AI, get-started, reference pages
- [ ] Stage 7 — polish & launch
