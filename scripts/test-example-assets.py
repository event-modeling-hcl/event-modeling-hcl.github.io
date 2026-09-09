#!/usr/bin/env python3
"""Check that published example source assets, pages, and sitemap stay aligned."""

import html
import re
import textwrap
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
MODELS = ROOT / "examples" / "models"
EXAMPLES = ROOT / "examples"
SITEMAP = ROOT / "sitemap.xml"

EXPECTED_MODELS = {
    "minimal",
    "complete",
    "pet-management-detailed",
    "appointment-weather-patterns",
    "course_subscriptions",
}

PUBLISHED_EXAMPLES = {
    "minimal": ("minimal", "minimal"),
    "complete": ("complete", "complete"),
    "pet-management-detailed": ("pet-management", "pet-management-detailed"),
    "appointment-weather-patterns": (
        "appointments-and-weather",
        "appointment-weather-patterns",
    ),
    "course_subscriptions": ("course-subscriptions", "course_subscriptions"),
}


def code_block(path):
    match = re.search(
        r'<code-block lang="hcl">(.*?)</code-block>', path.read_text(), re.DOTALL
    )
    if not match:
        return None
    return textwrap.dedent(html.unescape(match.group(1))).strip() + "\n"


class ExampleAssetsTest(unittest.TestCase):
    def test_vendored_models_are_the_published_set(self):
        names = {path.stem.removesuffix(".em") for path in MODELS.glob("*.em.hcl")}
        self.assertEqual(names, EXPECTED_MODELS)

    def test_every_vendored_model_has_published_links(self):
        gallery = (EXAMPLES / "index.html").read_text()
        sitemap = SITEMAP.read_text()

        for model, (detail_name, canvas_name) in PUBLISHED_EXAMPLES.items():
            detail_url = f"/examples/{detail_name}.html"
            source_url = f"/examples/models/{model}.em.hcl"
            canvas_url = f"/examples/canvas/{canvas_name}.html"
            detail_path = EXAMPLES / f"{detail_name}.html"

            self.assertTrue(detail_path.is_file(), detail_path)
            self.assertIn(source_url, gallery)
            self.assertIn(detail_url, sitemap)
            self.assertIn(canvas_url, detail_path.read_text())
            if model == "course_subscriptions":
                self.assertIn(source_url, detail_path.read_text())

    def test_homepage_features_course_subscriptions(self):
        homepage = (ROOT / "index.html").read_text()
        self.assertIn('/examples/course-subscriptions.html', homepage)

    def test_install_page_uses_the_current_release_archive(self):
        start = (ROOT / "start.html").read_text()
        self.assertIn("eventmodeling-hcl_0.4.0_linux_amd64.tar.gz", start)
        self.assertNotIn("eventmodeling-hcl_0.3.0_linux_amd64.tar.gz", start)

    def test_inline_sources_match_their_vendored_models(self):
        for model, (detail_name, _) in PUBLISHED_EXAMPLES.items():
            if model == "course_subscriptions":
                continue
            self.assertEqual(
                code_block(EXAMPLES / f"{detail_name}.html"),
                (MODELS / f"{model}.em.hcl").read_text(),
                detail_name,
            )


if __name__ == "__main__":
    unittest.main()
