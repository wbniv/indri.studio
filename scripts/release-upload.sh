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
# Auth: the R2 S3 API via rclone — LEAST PRIVILEGE. Use an R2 API token scoped to
#   Object Read & Write on JUST the `indri-apt` bucket (Cloudflare R2 -> Manage R2
#   API Tokens), which yields an Access Key ID + Secret. Export them as the rclone
#   `R2` remote (same convention as apt/.github/workflows/publish.yml), e.g. in .env:
#     RCLONE_CONFIG_R2_TYPE=s3  RCLONE_CONFIG_R2_PROVIDER=Cloudflare  RCLONE_CONFIG_R2_REGION=auto
#     RCLONE_CONFIG_R2_ACCESS_KEY_ID=…  RCLONE_CONFIG_R2_SECRET_ACCESS_KEY=…
#     RCLONE_CONFIG_R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
#   (We intentionally do NOT use a Cloudflare *API token* via `wrangler r2 object
#   put`: that path only honours the account-wide "Workers R2 Storage" permission,
#   which over-grants. The bucket-scoped S3 keys are the least-privilege fit.)
#   This PUBLISHES to R2 — run deliberately.
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

command -v rclone >/dev/null || { echo "FATAL: rclone not installed" >&2; exit 1; }
if ! rclone listremotes 2>/dev/null | grep -qx 'R2:' && [ -z "${RCLONE_CONFIG_R2_ACCESS_KEY_ID:-}" ]; then
  echo "FATAL: no 'R2' rclone remote. Export RCLONE_CONFIG_R2_* (bucket-scoped indri-apt" >&2
  echo "  R2 API token: Access Key ID / Secret / ENDPOINT) — see the header comment." >&2
  exit 1
fi

put() {  # put <localfile> <r2-key>
  echo "    -> r2:$BUCKET/$2"
  rclone copyto --s3-no-check-bucket "$1" "R2:$BUCKET/$2"
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
