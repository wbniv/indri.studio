#!/usr/bin/env bash
# claude-usage source-install bootstrap.
#
# Published at https://apt.indri.studio/install-claude-usage.sh — pair with
# the one-liner:
#
#     curl -fsSL https://apt.indri.studio/install-claude-usage.sh | bash
#
# Resolves the latest claude-usage GitHub release tag, downloads the tarball,
# and execs the upstream packaging/install.sh from inside the extracted tree.
# All flags pass through (e.g. `… | bash -s -- --uninstall`).
#
# This script is intentionally thin — the install logic itself lives upstream
# in claude-usage/install.sh. Dependency pre-flight checks are upstream too
# (glib-compile-schemas / systemctl --user / gnome-shell version).
set -euo pipefail

usage() {
    cat <<'EOF'
Usage: install-claude-usage.sh [--help|-h] [flags forwarded to upstream install.sh]

Bootstraps a claude-usage install on a GNOME desktop:
  1. Resolves the latest release tag from the GitHub API.
  2. Downloads the source tarball to a temp dir.
  3. Execs the upstream install.sh from inside the extracted tree.

Forwarded flags (see upstream install.sh):
  --uninstall    Remove all installed files and services

Examples:
  curl -fsSL https://apt.indri.studio/install-claude-usage.sh | bash
  curl -fsSL https://apt.indri.studio/install-claude-usage.sh | bash -s -- --uninstall
EOF
}

[[ "${1:-}" == "-h" || "${1:-}" == "--help" ]] && { usage; exit 0; }

OWNER="wbniv"
REPO="claude-usage"

for cmd in curl tar python3; do
    command -v "$cmd" >/dev/null 2>&1 || {
        echo "install-claude-usage.sh: '$cmd' is required but not installed." >&2
        exit 1
    }
done

echo "Resolving latest ${REPO} release..."
TAG=$(curl -fsSL "https://api.github.com/repos/${OWNER}/${REPO}/releases/latest" \
      | python3 -c 'import json,sys; print(json.load(sys.stdin)["tag_name"])')
if [[ -z "$TAG" ]]; then
    echo "install-claude-usage.sh: could not resolve latest release tag." >&2
    exit 1
fi
echo "  ✓ ${TAG}"

WORKDIR=$(mktemp -d -t "${REPO}-install-XXXXXX")
# shellcheck disable=SC2064  # expand WORKDIR now so the trap captures the value
trap "rm -rf '$WORKDIR'" EXIT

echo "Downloading ${OWNER}/${REPO}@${TAG} tarball..."
curl -fsSL "https://codeload.github.com/${OWNER}/${REPO}/tar.gz/refs/tags/${TAG}" \
    | tar -xz -C "$WORKDIR"

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
