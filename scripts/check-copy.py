#!/usr/bin/env python3
"""Report promotional language in authored site copy without failing CI."""

import os
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
EXCLUDED_NAMES = {"404.html", "styleguide.html"}
STRONG_TERMS = (
    "best",
    "highest",
    "superior",
    "revolutionary",
    "production-ready",
    "ai-native",
    "correctly on the first try",
    "never",
    "guaranteed",
)
SOFT_TERMS = ("honestly", "genuinely", "deliberately", "exactly", "real", "actual")
SOFT_LIMIT = 2
EM_DASH_LIMIT = 30


def html_files(inputs):
    for raw in inputs or [ROOT]:
        path = Path(raw).resolve()
        candidates = [path] if path.is_file() else sorted(path.rglob("*.html"))
        for candidate in candidates:
            relative = candidate.relative_to(path) if path.is_dir() else Path(candidate.name)
            if candidate.name in EXCLUDED_NAMES or relative.parts[:2] == ("examples", "canvas"):
                continue
            yield candidate, relative


def github_warning(relative, line, message):
    if os.environ.get("GITHUB_ACTIONS") == "true":
        print(f"::warning file={relative},line={line}::{message}")


def main(argv):
    strong = []
    soft_counts = Counter()
    soft_locations = defaultdict(list)
    dash_count = 0

    for path, relative in html_files(argv):
        for line_number, line in enumerate(path.read_text().splitlines(), 1):
            lowered = line.lower()
            for term in STRONG_TERMS:
                if re.search(rf"(?<![\w-]){re.escape(term)}(?![\w-])", lowered):
                    strong.append((relative, line_number, term))
            for term in SOFT_TERMS:
                matches = re.findall(rf"(?<![\w-]){re.escape(term)}(?![\w-])", lowered)
                if matches:
                    soft_counts[term] += len(matches)
                    soft_locations[term].append((relative, line_number))
            dash_count += line.count("\N{EM DASH}")

    warnings = 0
    for relative, line_number, term in strong:
        message = f"review promotional or absolute wording: {term}"
        print(f"{relative}:{line_number}: {message}")
        github_warning(relative, line_number, message)
        warnings += 1

    for term in SOFT_TERMS:
        count = soft_counts[term]
        if count <= SOFT_LIMIT:
            continue
        relative, line_number = soft_locations[term][0]
        message = f"'{term}' appears {count} times; review repeated tone"
        print(f"{relative}:{line_number}: {message}")
        github_warning(relative, line_number, message)
        warnings += 1

    if dash_count > EM_DASH_LIMIT:
        message = f"site copy contains {dash_count} em dashes; review sentence rhythm"
        print(message)
        if os.environ.get("GITHUB_ACTIONS") == "true":
            print(f"::warning::{message}")
        warnings += 1

    if warnings == 0:
        print("No copy warnings.")
    else:
        print(f"{warnings} copy warning(s). This check is advisory.")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
