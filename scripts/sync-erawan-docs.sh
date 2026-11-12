#!/usr/bin/env bash
# sync-erawan-docs.sh — snapshot the Erawan Quick Start and landing-page assets into this site.
#
# Writes:
#   src/content/docs/erawan-quick-start.md   frontmatter + body (leading H1 stripped; the page
#                                            renders the title from frontmatter) -> /docs/erawan-quick-start/
#   public/apps/erawan/quick-start/*         the images the Quick Start references
#   public/apps/erawan/*.svg                 the three interface excerpts used on the landing page
#   public/apps/erawan/erawan-a4.pdf         the two-page A4 overview
#
# Sources live in the sibling Erawan repo (default ../erawan). Re-run after the source docs change.
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: scripts/sync-erawan-docs.sh [-h|--help]

Snapshot the Erawan Quick Start, its images, the landing-page interface
excerpts and the A4 overview from the Erawan repo into this site.

Environment:
  ERAWAN_REPO   path to the Erawan checkout (default: ../erawan)
EOF
}

case "${1:-}" in
  -h|--help) usage; exit 0 ;;
  "") ;;
  *) echo "unknown argument: $1" >&2; usage >&2; exit 2 ;;
esac

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO="${ERAWAN_REPO:-$ROOT/../erawan}"
SRC_DOC="$REPO/docs/quick-start.md"
SRC_IMG="$REPO/docs/images/quick-start"
SRC_EXCERPTS="$REPO/docs/plans/2026-11-12-erawan-landing-page"
SRC_A4="$REPO/docs/one-sheet/erawan-a4.pdf"
CONTENT="$ROOT/src/content/docs/erawan-quick-start.md"
PUBLIC="$ROOT/public/apps/erawan"

[ -d "$REPO/.git" ] || { echo "FATAL: Erawan repo not found at $REPO (set ERAWAN_REPO)" >&2; exit 1; }
for f in "$SRC_DOC" "$SRC_A4" "$SRC_EXCERPTS/watch-detail.svg" \
         "$SRC_EXCERPTS/verification-excerpt.svg" "$SRC_EXCERPTS/wizard-choices.svg"; do
  [ -f "$f" ] || { echo "FATAL: missing source $f" >&2; exit 1; }
done

# Provenance: the commit the checkout is on, flagged when the doc has local edits.
commit="$(git -C "$REPO" rev-parse --short HEAD)"
if ! git -C "$REPO" diff --quiet HEAD -- docs/quick-start.md docs/images/quick-start \
   || [ -n "$(git -C "$REPO" ls-files --others --exclude-standard docs/images/quick-start)" ]; then
  commit="${commit}+uncommitted"
fi

mkdir -p "$PUBLIC/quick-start" "$(dirname "$CONTENT")"

# Only the images the Quick Start actually references are published.
refs="$(grep -o -E 'images/quick-start/[A-Za-z0-9_.-]+' "$SRC_DOC" | sort -u || true)"
[ -n "$refs" ] || { echo "FATAL: no images referenced by the Quick Start" >&2; exit 1; }
find "$PUBLIC/quick-start" -type f -delete
while IFS= read -r ref; do
  name="${ref#images/quick-start/}"
  [ -f "$SRC_IMG/$name" ] || { echo "FATAL: Quick Start references missing image $name" >&2; exit 1; }
  cp "$SRC_IMG/$name" "$PUBLIC/quick-start/$name"
done <<< "$refs"

cp "$SRC_EXCERPTS/watch-detail.svg" "$SRC_EXCERPTS/verification-excerpt.svg" \
   "$SRC_EXCERPTS/wizard-choices.svg" "$PUBLIC/"
cp "$SRC_A4" "$PUBLIC/erawan-a4.pdf"

# Rewrite the body: images -> published paths; links into unpublished repo
# files -> plain text, so the page has no dead clicks. Fenced blocks are left alone.
REWRITER="$(mktemp --suffix=.py)"
trap 'rm -f "$REWRITER"' EXIT
cat > "$REWRITER" <<'PY'
import re, sys

IMG = re.compile(r'\]\(images/quick-start/([^)]+)\)')
LINK = re.compile(r'(?<!!)\[([^\]]+)\]\(([^)]+)\)')

def link(m):
    text, target = m.group(1), m.group(2).strip()
    if target.startswith(('http://', 'https://', '#', '/', 'mailto:')):
        return m.group(0)
    return text  # repo-relative link to a file this site does not publish

out, fenced, h1_dropped = [], False, False
for line in sys.stdin.read().split('\n'):
    s = line.lstrip()
    if s.startswith('```') or s.startswith('~~~'):
        fenced = not fenced
        out.append(line)
        continue
    if fenced:
        out.append(line)
        continue
    if not h1_dropped and line.startswith('# '):
        h1_dropped = True
        continue
    line = IMG.sub(r'](/apps/erawan/quick-start/\1)', line)
    line = LINK.sub(link, line)
    out.append(line)
sys.stdout.write('\n'.join(out))
PY

{
  cat <<EOF
---
title: "Erawan Quick Start"
summary: "Watch a backup copy and verify, bring selected folders together, and find repeated files — each with a preview before anything changes."
app: "erawan"
sourceRepo: "erawan"
sourceCommit: "$commit"
license: "MIT"
downloads: false
order: 1
---
EOF
  python3 -I "$REWRITER" < "$SRC_DOC"
} > "$CONTENT"

echo "synced Erawan Quick Start @ $commit"
echo "  $CONTENT"
echo "  $PUBLIC ($(find "$PUBLIC" -type f | wc -l) files)"
