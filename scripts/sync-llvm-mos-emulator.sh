#!/usr/bin/env bash
set -euo pipefail

# sync-llvm-mos-emulator.sh — pull the bsnes-jg-wasm single-program bundle into
# public/ so the SNES C Compiler app page can embed the live emulator.
#
# The bundle (cores/*.wasm+js, app.js, mandel-display.sfc, manifest, provenance)
# is produced by bsnes-jg-wasm's `deploy-bundle.sh`. We snapshot it under
# public/apps/llvm-mos-65816/play/; Astro copies public/ → dist/ verbatim, so it
# serves at /apps/llvm-mos-65816/play/ and the embed loads it by absolute URL.

usage() {
  cat <<EOF
Usage: scripts/sync-llvm-mos-emulator.sh [BUNDLE_DIR]

Copies the emulator bundle into public/apps/llvm-mos-65816/play/.

  BUNDLE_DIR   path to bsnes-jg-wasm's dist-bundle
               (DEFAULT: ../bsnes-jg-wasm/dist-bundle; built on demand if absent)
EOF
}
[ "${1:-}" = "-h" ] || [ "${1:-}" = "--help" ] && { usage; exit 0; }

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="${1:-$ROOT/../bsnes-jg-wasm/dist-bundle}"
DEST="$ROOT/public/apps/llvm-mos-65816/play"
log() { echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $*"; }

# Build the bundle if it isn't there yet.
if [ ! -f "$SRC/cores/bsnes_jg.wasm" ]; then
  BUILDER="$(dirname "$SRC")/deploy-bundle.sh"
  [ -x "$BUILDER" ] || { echo "ERROR: no bundle at $SRC and no deploy-bundle.sh next to it" >&2; exit 1; }
  log "bundle missing — building via $BUILDER"
  "$BUILDER"
fi

log "syncing $SRC → $DEST"
rm -rf "$DEST"
mkdir -p "$DEST"
cp -R "$SRC/." "$DEST/"

log "done:"
( cd "$DEST" && find . -type f | sort | sed 's/^/  /' )
echo
echo "Core: $(grep -o '\"version\"[^,]*' "$DEST/cores/PROVENANCE.json" 2>/dev/null || echo '?')"
