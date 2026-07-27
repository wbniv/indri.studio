#!/usr/bin/env bash
set -euo pipefail

# sync-llvm-mos-emulator.sh — vendor the SNES player ENGINE (app.js + cores/*)
# from the installed @wbniv/bsnes-jg-player npm package into
# public/apps/llvm-mos-65816/play/, via the package's own CLI.
#
# This replaced the old dist-bundle copy from a sibling bsnes-jg-wasm checkout
# (2026-07-27): the engine is now versioned + drift-stamped (ENGINE_VERSION), and
# CI verifies `sync --check` so a hand-edited site copy can't ship. ROMs,
# manifest, and previews are site content — the CLI never touches them.

usage() {
  cat <<EOF
Usage: scripts/sync-llvm-mos-emulator.sh

Syncs the engine from node_modules/@wbniv/bsnes-jg-player into
public/apps/llvm-mos-65816/play/ (run 'pnpm install' first; bump the dep to
pick up a newer engine).
EOF
}
[ "${1:-}" = "-h" ] || [ "${1:-}" = "--help" ] && { usage; exit 0; }

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SYNC="$ROOT/node_modules/@wbniv/bsnes-jg-player/bin/sync.mjs"
[ -f "$SYNC" ] || { echo "ERROR: @wbniv/bsnes-jg-player not installed — pnpm add @wbniv/bsnes-jg-player" >&2; exit 1; }

node "$SYNC" sync "$ROOT/public/apps/llvm-mos-65816/play"
