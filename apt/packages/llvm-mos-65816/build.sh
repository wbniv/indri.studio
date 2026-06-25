#!/usr/bin/env bash
# Build the llvm-mos-65816 .deb by repacking the relocatable toolchain tarball
# produced by the llvm-mos-65816 repo (dev/package-release.sh / `task package`).
#
# The toolchain is a ~200 MB prebuilt LLVM tree, so this is a binary repack
# (dpkg-deb --build) rather than a from-source dpkg-buildpackage: the tarball is
# already stripped and self-contained. The relocatable tree lands at
#   /usr/lib/llvm-mos-65816/
# and ONLY the namespaced mos-* drivers go on PATH (/usr/bin) — the tree also
# carries clang/ld.lld/llvm-* but exposing those would shadow a system LLVM, so
# they stay inside the prefix and the drivers reach them via relative paths.
#
# Source of the tarball:
#   - normal/CI:  fetched from the apt.indri.studio /sources mirror, sha256-pinned
#                 (set LLVM_MOS_VERSION + LLVM_MOS_SHA256 below at release time).
#   - local test: set LLVM_MOS_TARBALL=/path/to/llvm-mos-65816-<stamp>-linux-x86_64.tar.xz
#                 (version is then derived from the filename; sha check optional).
set -euo pipefail

NAME="llvm-mos-65816"
MAINTAINER="Will Norris <wbnorris@gmail.com>"

# --- release pins (set when the clean tarball is uploaded to /sources) --------
VERSION="${LLVM_MOS_VERSION:-0.0.0+UNSET}"
EXPECTED_SHA="${LLVM_MOS_SHA256:-}"
SOURCE_URL="${LLVM_MOS_SOURCE_URL:-https://apt.indri.studio/sources/${NAME}_${VERSION}.orig.tar.xz}"
LOCAL_TARBALL="${LLVM_MOS_TARBALL:-}"

PKG_DIR="$(cd "$(dirname "$0")" && pwd)"
APT_ROOT="$(cd "$PKG_DIR/../.." && pwd)"
DIST="$APT_ROOT/dist"
mkdir -p "$DIST"

WORK="$(mktemp -d -t "${NAME}-build-XXXXXX")"
# shellcheck disable=SC2064
trap "rm -rf '$WORK'" EXIT

# --- 1. obtain the tarball --------------------------------------------------
if [ -n "$LOCAL_TARBALL" ]; then
  echo "[$NAME] local tarball: $LOCAL_TARBALL"
  cp "$LOCAL_TARBALL" "$WORK/src.tar.xz"
  if [ "$VERSION" = "0.0.0+UNSET" ]; then
    stamp="$(basename "$LOCAL_TARBALL" | sed -E 's/^'"$NAME"'-(.+)-linux-x86_64\.tar\.xz$/\1/')"
    VERSION="0.0.0+git$(printf '%s' "$stamp" | sed -E 's/-dirty$//; s/-/./')"
    echo "[$NAME] derived version: $VERSION"
  fi
else
  [ "$VERSION" != "0.0.0+UNSET" ] || { echo "FATAL: set LLVM_MOS_VERSION (+ LLVM_MOS_SHA256) or LLVM_MOS_TARBALL" >&2; exit 1; }
  echo "[$NAME] fetching $SOURCE_URL"
  curl -fsSL -o "$WORK/src.tar.xz" "$SOURCE_URL"
fi

if [ -n "$EXPECTED_SHA" ]; then
  actual="$(sha256sum "$WORK/src.tar.xz" | awk '{print $1}')"
  [ "$actual" = "$EXPECTED_SHA" ] || { echo "FATAL: sha256 mismatch ($actual != $EXPECTED_SHA)" >&2; exit 1; }
  echo "[$NAME] sha256 OK"
elif [ -z "$LOCAL_TARBALL" ]; then
  echo "[$NAME] WARNING: no LLVM_MOS_SHA256 pin — fetching unverified" >&2
fi

# --- 2. lay out the package tree --------------------------------------------
PKG="$WORK/pkg"
PREFIX="$PKG/usr/lib/$NAME"
mkdir -p "$PREFIX" "$PKG/usr/bin" "$PKG/DEBIAN"

tar -xJf "$WORK/src.tar.xz" -C "$WORK"
TOP="$(find "$WORK" -mindepth 1 -maxdepth 1 -type d -name "${NAME}-*-linux-x86_64" | head -1)"
[ -d "$TOP" ] || { echo "FATAL: extracted top-level dir not found" >&2; exit 1; }
cp -a "$TOP"/. "$PREFIX/"

# Namespaced drivers only — NEVER bare clang/ld.lld/llvm-* (would clash with system LLVM).
for d in mos-clang mos-clang++ mos-clang-cpp \
         mos-snes-clang mos-snes-clang++ mos-snes-clang-cpp \
         mos-snes-far-clang mos-snes-far-clang++ mos-snes-far-clang-cpp; do
  [ -e "$PREFIX/bin/$d" ] && ln -s "../lib/$NAME/bin/$d" "$PKG/usr/bin/$d"
done

# --- 3. control -------------------------------------------------------------
INSTALLED_KB="$(du -sk "$PKG/usr" | awk '{print $1}')"
cat > "$PKG/DEBIAN/control" <<CTRL
Package: $NAME
Version: $VERSION
Architecture: amd64
Maintainer: $MAINTAINER
Section: devel
Priority: optional
Installed-Size: $INSTALLED_KB
Depends: libc6, libgcc-s1, libstdc++6
Homepage: https://indri.studio/apps/llvm-mos-65816/
Description: Optimizing C cross-compiler for the WDC 65816 (Super Nintendo)
 An LLVM/clang-based C cross-compiler for the WDC 65816, built on llvm-mos with
 24-bit far-pointer and native 16-bit-register codegen, plus a complete SNES SDK
 (memory map, ROM header, I/O registers, C runtime). Turns C into a bootable
 .sfc ROM. Drivers on PATH: mos-snes-clang, mos-snes-far-clang, mos-clang.
 .
 Interim preview build, published while the codegen patches are upstreamed into
 llvm-mos. Linux x86-64; installs under /usr/lib/llvm-mos-65816 and exposes only
 the namespaced mos-* drivers, so it never shadows a system LLVM/clang.
CTRL

# --- 4. build the .deb ------------------------------------------------------
DEB="$DIST/${NAME}_${VERSION}_amd64.deb"
dpkg-deb --root-owner-group --build "$PKG" "$DEB"
echo "OK   dist/$(basename "$DEB")  ($(du -h "$DEB" | cut -f1))"
