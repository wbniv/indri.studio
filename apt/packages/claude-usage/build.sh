#!/usr/bin/env bash
# Build the claude-usage .deb by fetching the GitHub tag tarball and
# delegating to the upstream's own packaging/build-deb.sh.
#
# claude-usage is a multi-component package (GNOME extension + Python
# server + Chrome extension + systemd unit + icons) whose install logic
# lives in packaging/build-deb.sh in the source repo. Replicating that
# logic in a debian/rules port is a larger task — for now we wrap the
# upstream's script and stage the .deb produced into apt/dist/.
#
# Migration target: canonical debian/{control,changelog,rules,install}
# layout so dpkg-buildpackage works and we get a real .dsc source package.
# Tracked in docs/plans/2026-05-21-apt-indri-studio-bootstrap.md.

set -euo pipefail

NAME="claude-usage"
UPSTREAM_OWNER="wbniv"
UPSTREAM_REPO="claude-usage"
TAG="v0.11.21"
EXPECTED_SHA="fe51d47bf0078d2ec70f5307cdb7d381841cd13c29a12a02aa4e58adec6ed67a"

PKG_DIR="$(cd "$(dirname "$0")" && pwd)"
APT_ROOT="$(cd "$PKG_DIR/../.." && pwd)"
DIST="$APT_ROOT/dist"
mkdir -p "$DIST"

UPSTREAM_URL="https://codeload.github.com/${UPSTREAM_OWNER}/${UPSTREAM_REPO}/tar.gz/refs/tags/${TAG}"

WORKDIR=$(mktemp -d -t "${NAME}-build-XXXXXX")
# shellcheck disable=SC2064  # expand $WORKDIR now so the trap captures the value
trap "rm -rf '$WORKDIR'" EXIT

echo "[claude-usage] fetching ${UPSTREAM_URL}"
curl -fsSL -o "$WORKDIR/src.tar.gz" "$UPSTREAM_URL"

actual_sha=$(sha256sum "$WORKDIR/src.tar.gz" | awk '{print $1}')
if [[ "$actual_sha" != "$EXPECTED_SHA" ]]; then
    echo "ERROR: sha256 mismatch for ${TAG}" >&2
    echo "  expected: $EXPECTED_SHA" >&2
    echo "  actual:   $actual_sha"   >&2
    exit 1
fi

mkdir -p "$WORKDIR/src"
tar -xzf "$WORKDIR/src.tar.gz" -C "$WORKDIR/src"
SRC_DIR=$(find "$WORKDIR/src" -mindepth 1 -maxdepth 1 -type d | head -1)
[[ -d "$SRC_DIR" ]] || { echo "ERROR: extracted source dir not found in $WORKDIR/src" >&2; exit 1; }

echo "[claude-usage] running packaging/build-deb.sh"
bash "$SRC_DIR/packaging/build-deb.sh"

# build-deb.sh writes to <SRC_DIR>/dist/. Move every artifact into apt/dist/.
shopt -s nullglob
debs=("$SRC_DIR"/dist/*.deb)
shopt -u nullglob
if [[ ${#debs[@]} -eq 0 ]]; then
    echo "ERROR: no .deb produced by upstream build-deb.sh" >&2
    exit 1
fi
for deb in "${debs[@]}"; do
    mv "$deb" "$DIST/"
    echo "OK   dist/$(basename "$deb")  ($(stat -c%s "$DIST/$(basename "$deb")") bytes)"
done
