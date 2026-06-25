#!/usr/bin/env bash
# release-upload.sh — upload a llvm-mos-65816 release tarball to the
# apt.indri.studio /sources mirror (r2://indri-apt/sources/) as the Debian
# orig tarball that apt/packages/llvm-mos-65816/build.sh fetches.
#
# The repo's own /sources mirror (publish-local.sh) only promotes *.tar.gz, so
# the .tar.xz toolchain tarball is uploaded straight to R2 here. Prints the
# VERSION + SHA256 to pin in build.sh.
#
# Auth: CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID (Taskfile loads .env via
# `task secrets-pull`). This PUBLISHES to R2 — run deliberately.
set -euo pipefail

TARBALL="${1:-${TARBALL:-}}"
[ -n "$TARBALL" ] && [ -f "$TARBALL" ] || {
  echo "usage: release-upload.sh <llvm-mos-65816-<stamp>-linux-x86_64.tar.xz>" >&2; exit 1; }

NAME=llvm-mos-65816
BUCKET="${APT_BUCKET:-indri-apt}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

stamp="$(basename "$TARBALL" | sed -E 's/^'"$NAME"'-(.+)-linux-x86_64\.tar\.xz$/\1/')"
VERSION="0.0.0+git$(printf '%s' "$stamp" | sed -E 's/-dirty$//; s/-/./')"
KEY="sources/${NAME}_${VERSION}.orig.tar.xz"
SHA="$(sha256sum "$TARBALL" | awk '{print $1}')"

echo "==> uploading $(basename "$TARBALL") ($(du -h "$TARBALL" | cut -f1))"
echo "    -> r2://$BUCKET/$KEY"
( cd "$ROOT" && pnpm exec wrangler r2 object put "$BUCKET/$KEY" --file="$TARBALL" --remote )

echo
echo "==> live at: https://apt.indri.studio/$KEY"
echo "==> pin these in apt/packages/llvm-mos-65816/build.sh (or pass as env):"
echo "      LLVM_MOS_VERSION=$VERSION"
echo "      LLVM_MOS_SHA256=$SHA"
