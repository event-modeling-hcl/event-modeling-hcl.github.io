#!/usr/bin/env python3
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
CHECKER = ROOT / "scripts" / "check-copy.py"


class CopyCheckerTest(unittest.TestCase):
    def run_checker(self, files):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            for name, text in files.items():
                path = root / name
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text(text)
            return subprocess.run(
                [sys.executable, str(CHECKER), str(root)],
                capture_output=True,
                text=True,
                check=False,
            )

    def test_reports_hype_repetition_and_em_dashes_without_failing(self):
        result = self.run_checker(
            {
                "index.html": "production-ready real real real " + "—" * 31,
                "examples/canvas/generated.html": "revolutionary",
                "404.html": "guaranteed",
                "styleguide.html": "AI-native",
            }
        )

        self.assertEqual(result.returncode, 0)
        self.assertIn("index.html:1", result.stdout)
        self.assertIn("production-ready", result.stdout)
        self.assertIn("'real' appears 3 times", result.stdout)
        self.assertIn("31 em dashes", result.stdout)
        self.assertNotIn("revolutionary", result.stdout)
        self.assertNotIn("guaranteed", result.stdout)
        self.assertNotIn("AI-native", result.stdout)

    def test_neutral_copy_has_no_warnings(self):
        result = self.run_checker({"index.html": "Keep an Event Model in git."})

        self.assertEqual(result.returncode, 0)
        self.assertIn("No copy warnings.", result.stdout)


if __name__ == "__main__":
    unittest.main()
