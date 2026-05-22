#!/usr/bin/env bash
# claude-usage source-install bootstrap.
#
# Published at https://apt.indri.studio/install-claude-usage.sh — pair with
# the one-liner:
#
#     curl -fsSL https://apt.indri.studio/install-claude-usage.sh | bash
#
# Reads https://apt.indri.studio/sources/claude-usage-latest.json for the
# current version + tarball URL + sha256, downloads the tarball from the
# apt.indri.studio mirror, verifies the digest, and execs the upstream
# install.sh from inside the extracted tree. All flags pass through
# (e.g. `… | bash -s -- --uninstall`).
#
# Both the JSON pointer and the tarball are mirrored to R2 by the apt
# publish workflow (apt/scripts/publish-local.sh) so the source-of-truth
# GitHub repository is never named in this distributed script.
set -euo pipefail

MIRROR_BASE="https://apt.indri.studio/sources"
LATEST_URL="${MIRROR_BASE}/claude-usage-latest.json"

usage() {
    cat <<EOF
Usage: install-claude-usage.sh [--help|-h] [flags forwarded to upstream install.sh]

Bootstraps a claude-usage install on a GNOME desktop:
  1. Reads ${LATEST_URL}.
  2. Downloads the pinned source tarball from the apt.indri.studio mirror.
  3. Verifies sha256, extracts to a temp dir, and execs the upstream install.sh.

Forwarded flags (see upstream install.sh):
  --uninstall    Remove all installed files and services

Examples:
  curl -fsSL https://apt.indri.studio/install-claude-usage.sh | bash
  curl -fsSL https://apt.indri.studio/install-claude-usage.sh | bash -s -- --uninstall
EOF
}

[[ "${1:-}" == "-h" || "${1:-}" == "--help" ]] && { usage; exit 0; }

for cmd in curl tar python3 sha256sum; do
    command -v "$cmd" >/dev/null 2>&1 || {
        echo "install-claude-usage.sh: '$cmd' is required but not installed." >&2
        exit 1
    }
done

echo "Resolving latest pinned version from apt.indri.studio..."
LATEST_JSON=$(curl -fsSL "$LATEST_URL") || {
    echo "install-claude-usage.sh: could not fetch $LATEST_URL" >&2
    exit 1
}

read -r VERSION TARBALL_URL EXPECTED_SHA < <(
    python3 -c '
import json, sys
d = json.loads(sys.stdin.read())
print(d["version"], d["tarball"], d["sha256"])
' <<<"$LATEST_JSON"
)
if [[ -z "${VERSION:-}" || -z "${TARBALL_URL:-}" || -z "${EXPECTED_SHA:-}" ]]; then
    echo "install-claude-usage.sh: malformed JSON at $LATEST_URL" >&2
    echo "$LATEST_JSON" >&2
    exit 1
fi
echo "  ✓ version ${VERSION}"

WORKDIR=$(mktemp -d -t "claude-usage-install-XXXXXX")
# shellcheck disable=SC2064  # expand WORKDIR now so the trap captures the value
trap "rm -rf '$WORKDIR'" EXIT

echo "Downloading ${TARBALL_URL}..."
curl -fsSL -o "$WORKDIR/src.tar.gz" "$TARBALL_URL"

ACTUAL_SHA=$(sha256sum "$WORKDIR/src.tar.gz" | awk '{print $1}')
if [[ "$ACTUAL_SHA" != "$EXPECTED_SHA" ]]; then
    echo "install-claude-usage.sh: sha256 mismatch — refusing to proceed." >&2
    echo "  expected: $EXPECTED_SHA" >&2
    echo "  actual:   $ACTUAL_SHA" >&2
    exit 1
fi
echo "  ✓ sha256 ${EXPECTED_SHA:0:12}…"

tar -xzf "$WORKDIR/src.tar.gz" -C "$WORKDIR"
SRC_DIR=$(find "$WORKDIR" -mindepth 1 -maxdepth 1 -type d | head -1)
[[ -d "$SRC_DIR" && -x "$SRC_DIR/install.sh" ]] || {
    echo "install-claude-usage.sh: extracted tarball missing install.sh at $SRC_DIR" >&2
    exit 1
}

echo "Handing off to $(basename "$SRC_DIR")/install.sh..."
echo
# Tell install.sh we're a tempdir bootstrap so its "Next step" message points
# at the stable $XDG_DATA_HOME/claude-usage/chrome-extension copy rather than
# $REPO_DIR/chrome-extension (which is $SRC_DIR here — about to be rm -rf'd).
export CLAUDE_USAGE_BOOTSTRAP=1
exec bash "$SRC_DIR/install.sh" "$@"
