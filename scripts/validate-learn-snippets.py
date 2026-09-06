#!/usr/bin/env python3
"""Validate every <code-block lang="hcl"> on the Learn pages against the
real `eventmodeling-hcl validate` — the site's rule that nothing taught here
is "a syntax that only looks right".

Each block must be either:
  - a complete, standalone-valid .em.hcl document, or
  - a deliberate negative example listed in NEGATIVE_MARKERS below, which
    must fail with its documented EMxxx diagnostic code(s).

Usage:
    TOOL_BIN=/path/to/eventmodeling-hcl scripts/validate-learn-snippets.py

Re-run this after editing any file under learn/. TOOL_BIN defaults to
"eventmodeling-hcl" on PATH; build it from the tool repo if you don't have
a release installed:
    go build -o /tmp/eventmodeling-hcl ./cmd/eventmodeling-hcl   # in the tool checkout
    TOOL_BIN=/tmp/eventmodeling-hcl scripts/validate-learn-snippets.py
"""
import html
import os
import re
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LEARN_DIR = os.path.join(ROOT, "learn")
TOOL_BIN = os.environ.get("TOOL_BIN", "eventmodeling-hcl")

BLOCK_RE = re.compile(r'<code-block lang="hcl">(.*?)</code-block>', re.DOTALL)

# Deliberately INVALID examples, identified by a distinctive substring (not
# by position) so an unrelated edit elsewhere on the page can't silently
# stop checking them. Each must fail, with the documented diagnostic code(s).
NEGATIVE_MARKERS = [
    ("from = [screen.form]", ["EM201"]),
    ("when { readmodel = readmodel.pets }", ["EM301", "EM303"]),
]


def dedent(text):
    # Mirrors assets/site.js's <code-block> dedent logic exactly, so what's
    # checked here is what a viewer's browser actually renders.
    text = re.sub(r"^\n", "", text)
    text = re.sub(r"\s+$", "", text)
    lines = text.split("\n")
    indents = [len(l) - len(l.lstrip(" ")) for l in lines if l.strip()]
    min_indent = min(indents) if indents else 0
    return "\n".join(l[min_indent:] if len(l) >= min_indent else l for l in lines)


def negative_expectation(code):
    for marker, expected_codes in NEGATIVE_MARKERS:
        if marker in code:
            return expected_codes
    return None


def main():
    total = 0
    failures = []

    with tempfile.TemporaryDirectory() as tmp_dir:
        for fname in sorted(os.listdir(LEARN_DIR)):
            if not fname.endswith(".html"):
                continue
            with open(os.path.join(LEARN_DIR, fname)) as f:
                content = f.read()

            for i, raw in enumerate(BLOCK_RE.findall(content)):
                total += 1
                code = html.unescape(dedent(raw))
                tmp_path = os.path.join(tmp_dir, f"{fname}.{i}.em.hcl")
                with open(tmp_path, "w") as f:
                    f.write(code)

                result = subprocess.run(
                    [TOOL_BIN, "validate", tmp_path], capture_output=True, text=True
                )
                output = result.stdout + result.stderr
                expected_codes = negative_expectation(code)

                if expected_codes is not None:
                    missing = [c for c in expected_codes if c not in output]
                    if result.returncode == 0 or missing:
                        status = "FAIL"
                        failures.append(
                            (fname, i, f"expected failure with {expected_codes}, "
                             f"got exit={result.returncode}\n{output}")
                        )
                    else:
                        status = "OK (expected-invalid)"
                else:
                    status = "OK" if result.returncode == 0 else "FAIL"
                    if result.returncode != 0:
                        failures.append((fname, i, output))

                print(f"[{status}] {fname} block #{i}")

    print(f"\n{total} HCL code-blocks checked, {len(failures)} failed.\n")
    for fname, i, output in failures:
        print(f"=== FAILURE: {fname} block #{i} ===")
        print(output)
        print()

    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
