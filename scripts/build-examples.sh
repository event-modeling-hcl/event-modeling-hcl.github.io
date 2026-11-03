#!/usr/bin/env bash
# Renders every vendored example into a self-contained interactive canvas
# using the real `emhcl diagram` command, so the examples gallery only ever
# shows output the tool actually produced.
#
# Usage: TOOL_BIN=/path/to/emhcl scripts/build-examples.sh
#
# Reads:  examples/models/*.em.hcl   (one-file models)
#         examples/models/*/         (folder models)
# Needs:  emhcl v0.16.0 or newer (Event Modeling HCL Specification v0.7.0)
# Writes: examples/canvas/<name>.html (git-ignored build artifacts)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MODELS_DIR="$ROOT/examples/models"
CANVAS_DIR="$ROOT/examples/canvas"
TOOL_BIN="${TOOL_BIN:-emhcl}"

if [ ! -d "$MODELS_DIR" ]; then
  echo "build-examples: no $MODELS_DIR yet, nothing to render."
  exit 0
fi

shopt -s nullglob
models=("$MODELS_DIR"/*.em.hcl "$MODELS_DIR"/*/)
shopt -u nullglob

if [ "${#models[@]}" -eq 0 ]; then
  echo "build-examples: $MODELS_DIR is empty, nothing to render."
  exit 0
fi

if ! command -v "$TOOL_BIN" >/dev/null 2>&1; then
  echo "build-examples: '$TOOL_BIN' not found on PATH (set TOOL_BIN)." >&2
  exit 1
fi

mkdir -p "$CANVAS_DIR"

for model in "${models[@]}"; do
  model="${model%/}"
  name="$(basename "$model" .em.hcl)"
  out="$CANVAS_DIR/$name.html"
  echo "build-examples: $model -> $out"
  "$TOOL_BIN" diagram "$model" -o "$out"
done

echo "build-examples: rendered ${#models[@]} example(s)."
