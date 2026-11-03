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
    "api-screens",
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
    "api-screens": ("api-screens", "api-screens"),
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
        folders = {path.name for path in MODELS.iterdir() if path.is_dir()}
        self.assertEqual(folders, {"pet-clinic"})

    def test_every_vendored_model_has_published_links(self):
        gallery = (EXAMPLES / "index.html").read_text()
        sitemap = SITEMAP.read_text()

        for model, (detail_name, canvas_name) in PUBLISHED_EXAMPLES.items():
            detail_url = f"/examples/{detail_name}.html"
            source_url = f"/examples/models/{model}.em.hcl"
            canvas_url = f"/examples/canvas/{canvas_name}.html"
            detail_path = EXAMPLES / f"{detail_name}.html"

            self.assertTrue(detail_path.is_file(), detail_path)
            detail_text = detail_path.read_text()
            self.assertIn(source_url, gallery)
            self.assertIn(f'href="{canvas_url}"', gallery)
            self.assertIn(detail_url, sitemap)
            self.assertIn(f'href="{canvas_url}"', detail_text)
            if model == "course_subscriptions":
                self.assertIn(source_url, detail_text)

    def test_homepage_features_course_subscriptions(self):
        homepage = (ROOT / "index.html").read_text()
        self.assertIn('/examples/course-subscriptions.html', homepage)

    def test_install_page_uses_the_current_release(self):
        start = (ROOT / "start.html").read_text()
        self.assertIn("emhcl_0.16.0_linux_amd64.tar.gz", start)
        self.assertIn("go install github.com/event-modeling-hcl/eventmodeling-hcl/cmd/emhcl@v0.16.0", start)
        self.assertIn("emhcl version", start)
        self.assertNotIn("eventmodeling-hcl_0.5.0_linux_amd64.tar.gz", start)

    def test_inline_sources_match_their_vendored_models(self):
        for model, (detail_name, _) in PUBLISHED_EXAMPLES.items():
            if model == "course_subscriptions":
                continue
            self.assertEqual(
                code_block(EXAMPLES / f"{detail_name}.html"),
                (MODELS / f"{model}.em.hcl").read_text(),
                detail_name,
            )

    def test_folder_model_page_shows_every_member_file(self):
        page_path = EXAMPLES / "pet-clinic.html"
        page = page_path.read_text()
        gallery = (EXAMPLES / "index.html").read_text()
        members = sorted((MODELS / "pet-clinic").glob("*.em.hcl"))
        blocks = [
            textwrap.dedent(html.unescape(block)).strip() + "\n"
            for block in re.findall(
                r'<code-block lang="hcl">(.*?)</code-block>', page, re.DOTALL
            )
        ]

        self.assertEqual(blocks, [member.read_text() for member in members])
        for member in members:
            self.assertIn(f'href="/examples/models/pet-clinic/{member.name}"', page)
        self.assertIn('href="/examples/canvas/pet-clinic.html"', page)
        self.assertIn('href="/examples/canvas/pet-clinic.html"', gallery)
        self.assertIn('href="/examples/pet-clinic.html"', gallery)
        self.assertIn("/examples/pet-clinic.html", SITEMAP.read_text())


if __name__ == "__main__":
    unittest.main()
