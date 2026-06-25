#!/usr/bin/env bash
# release-upload.sh — upload llvm-mos-65816 release artifact(s) to the
# apt.indri.studio /sources mirror (r2://indri-apt/sources/).
#
#   linux-x86_64  *.tar.xz  ->  <name>_<version>.orig.tar.xz
#       the Debian orig tarball apt/packages/llvm-mos-65816/build.sh fetches;
#       prints the VERSION + SHA256 to pin there. (Unchanged behaviour.)
#   linux-aarch64 *.tar.xz  ->  <name>_<version>_linux-aarch64.tar.xz  (+ .sha256)
#   windows-x86_64 *.zip    ->  <name>_<version>_windows-x86_64.zip    (+ .sha256)
#       the cross "Other platforms" downloads — keys match the product-page
#       links in src/content/apps/llvm-mos-65816.mdx exactly.
#
# Accepts one or more artifacts (e.g. the linux-aarch64 .tar.xz and the
# windows-x86_64 .zip from the llvm-mos-65816 repo's dist/).
#
# Auth: an R2-capable Cloudflare token — CLOUDFLARE_API_TOKEN with
#   **Workers R2 Storage: Edit** on bucket indri-apt — plus CLOUDFLARE_ACCOUNT_ID.
#   IMPORTANT: the default token from `task secrets-pull` is the *Pages deploy*
#   token and is NOT R2-scoped (wrangler r2 object put -> 403). Either broaden the
#   SSM /indri-studio/cloudflare/api_token to add R2 Edit, or export an R2 token
#   for this run. This PUBLISHES to R2 — run deliberately.
set -euo pipefail

[ "$#" -ge 1 ] || {
  echo "usage: release-upload.sh <artifact> [<artifact>...]" >&2
  echo "  artifacts: llvm-mos-65816-<stamp>-{linux-x86_64.tar.xz,linux-aarch64.tar.xz,windows-x86_64.zip}" >&2
  exit 1
}

NAME=llvm-mos-65816
BUCKET="${APT_BUCKET:-indri-apt}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ARCHTAGS="linux-x86_64 linux-aarch64 windows-x86_64"

put() {  # put <localfile> <r2-key>
  echo "    -> r2://$BUCKET/$2"
  ( cd "$ROOT" && pnpm exec wrangler r2 object put "$BUCKET/$2" --file="$1" --remote )
}

for ART in "$@"; do
  [ -f "$ART" ] || { echo "skip (not a file): $ART" >&2; continue; }
  base="$(basename "$ART")"
  ext="zip"; [[ "$base" == *.tar.xz ]] && ext="tar.xz"

  archtag=""
  for at in $ARCHTAGS; do [[ "$base" == ${NAME}-*-${at}.${ext} ]] && { archtag="$at"; break; }; done
  [ -n "$archtag" ] || { echo "skip (unrecognized name '$base' — want ${NAME}-<stamp>-<archtag>.<ext>)" >&2; continue; }

  # <stamp> = everything between "<name>-" and "-<archtag>.<ext>"; turn it into
  # the Debian-ish version 0.0.0+git<date>.<sha> (first '-' -> '.', drop -dirty).
  stamp="$(sed -E "s/^${NAME}-(.+)-${archtag}\.${ext//./\\.}\$/\\1/" <<<"$base")"
  VERSION="0.0.0+git$(printf '%s' "$stamp" | sed -E 's/-dirty$//; s/-/./')"
  SHA="$(sha256sum "$ART" | awk '{print $1}')"
  echo "==> $base  ($(du -h "$ART" | cut -f1))  version=$VERSION"

  if [ "$archtag" = "linux-x86_64" ]; then
    KEY="sources/${NAME}_${VERSION}.orig.tar.xz"
    put "$ART" "$KEY"
    echo "==> live: https://apt.indri.studio/$KEY"
    echo "==> pin in apt/packages/${NAME}/build.sh (or pass as env):"
    echo "      LLVM_MOS_VERSION=$VERSION"
    echo "      LLVM_MOS_SHA256=$SHA"
  else
    KEY="sources/${NAME}_${VERSION}_${archtag}.${ext}"
    put "$ART" "$KEY"
    # a .sha256 sidecar naming the uploaded key (matches the product-page link)
    tmp="$(mktemp)"; printf '%s  %s\n' "$SHA" "$(basename "$KEY")" > "$tmp"
    put "$tmp" "${KEY}.sha256"; rm -f "$tmp"
    echo "==> live: https://apt.indri.studio/$KEY"
  fi
  echo
done
