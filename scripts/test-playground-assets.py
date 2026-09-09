#!/usr/bin/env python3
"""Check the tracked route and deployment contract for the WASM playground."""

from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]


class PlaygroundAssetsTest(unittest.TestCase):
    def test_playground_uses_directory_route_and_copies_shared_assets(self):
        page = (ROOT / "playground" / "index.html").read_text()
        redirect = (ROOT / "playground.html").read_text()
        nav = (ROOT / "assets" / "site.js").read_text()
        sitemap = (ROOT / "sitemap.xml").read_text()
        deploy = (ROOT / ".github" / "workflows" / "deploy.yml").read_text()

        self.assertIn('{ href: "/playground/", label: "Playground" }', nav)
        self.assertIn("/playground/", sitemap)
        self.assertIn('url=/playground/', redirect)
        self.assertIn("/playground/", page)
        for asset in ("seed.js", "editor.js", "loader.js", "eventmodeling-hcl.wasm", "wasm_exec.js"):
            self.assertIn(asset, deploy)

    def test_playground_is_a_full_page_editor_app(self):
        page = (ROOT / "playground" / "index.html").read_text()

        self.assertIn("codemirror.min.css", page)
        self.assertIn("codemirror.min.js", page)
        self.assertIn('/playground/app.js', page)
        self.assertIn('class="pg-appbar"', page)
        self.assertIn('id="resize-handle"', page)
        self.assertIn('id="btn-zoom-in"', page)
        self.assertIn('id="console-body"', page)
        self.assertNotIn("<site-nav>", page)
        self.assertNotIn("<site-footer>", page)


if __name__ == "__main__":
    unittest.main()
