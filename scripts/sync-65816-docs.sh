#!/usr/bin/env bash
# sync-65816-docs.sh — snapshot the llvm-mos-65816 reader docs into this site.
#
# For each doc it writes THREE artifacts:
#   src/content/docs/<slug>.md   — frontmatter + body (leading H1 stripped; the
#                                  page renders the title from frontmatter) -> /docs/<slug>/
#   public/docs/<slug>.md        — the raw source markdown, for download
#   public/docs/<slug>.pdf       — a print-rendered PDF (md-to-html.sh + headless Chrome)
#
# Sources live across two branches of the sibling repo (default ../llvm-mos-65816):
# the refs/ docs are on wt/321-snes-hwref, the howtos on main. This is an interim
# publish (until #320/#321 land upstream); re-run after the source docs change.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO="${LLVM_MOS_REPO:-$ROOT/../llvm-mos-65816}"
MD2HTML="${MD2HTML:-$ROOT/../python-tui-lib/scripts/md-to-html.sh}"
CONTENT="$ROOT/src/content/docs"
PUBLIC="$ROOT/public/docs"

[ -d "$REPO/.git" ] || { echo "FATAL: llvm-mos-65816 repo not found at $REPO (set LLVM_MOS_REPO)" >&2; exit 1; }

CHROME=""
for c in google-chrome-stable google-chrome chromium chromium-browser; do
  command -v "$c" >/dev/null 2>&1 && { CHROME="$c"; break; }
done

mkdir -p "$CONTENT" "$PUBLIC"

# slug | ref | path | order | title | summary
DOCS=$(cat <<'TSV'
65816-opcodes|wt/321-snes-hwref|docs/refs/65816/65816-reference.md|1|65816 opcode reference|The 65816 instruction set as the llvm-mos backend encodes it — every opcode, addressing mode, and byte count, cross-checked against a canonical matrix.
snes-hardware|wt/321-snes-hwref|docs/refs/snes-hardware/snes-hardware-summary.md|2|SNES hardware summary|A compact tour of the Super Nintendo hardware the compiler targets — CPU, PPU, memory map, DMA, and the boot environment.
snes-registers|wt/321-snes-hwref|docs/refs/snes-hardware/snes-register-map.md|3|SNES register map|The CPU-visible SNES register map — every memory-mapped I/O register, what it does, and how to drive it from C.
oop-in-c|main|docs/investigations/object-oriented-c-and-assembly.md|4|Object-oriented C and assembly|Vtables, inheritance, and polymorphism in plain C (and assembly) on a 3.58 MHz 65816 — with measured codegen.
emulator-screenshots|main|docs/investigations/snes-emulator-screenshots.md|5|Capturing SNES screenshots, headless|Getting a true, PPU-rendered PNG of the SNES screen out of MAME and bsnes-jg with no window or GPU — for CI.
snes-bootup|main|docs/snes-bootup-sequence.md|6|SNES bootup sequence|What happens between power-on and main() on the SNES — reset vector, native-mode switch, and crt0 init.
TSV
)

esc() { printf '%s' "$1" | sed 's/"/\\"/g'; }            # escape for a YAML double-quoted scalar
strip_h1() { sed '0,/^# /{/^# /d;}'; }                    # drop the first leading "# ..." line

# Rewrite the source docs' repo-relative links so the published page has no
# dead clicks: cross-references among THIS doc set -> /docs/<slug>/; every other
# relative link (repo source files, unpublished internal docs) -> plain text.
# Skips fenced code blocks and inline code spans so e.g. `table[i](x)` is safe.
# NB: the program lives in a temp FILE, not `python3 - <<'PY'` — otherwise the
# heredoc becomes python's stdin and the piped markdown is silently discarded.
REWRITER_PY="$(mktemp --suffix=.py)"
trap 'rm -f "$REWRITER_PY"' EXIT
cat > "$REWRITER_PY" <<'PY'
import re, sys
M = {
  '65816-reference.md': '/docs/65816-opcodes/',
  '65816-opcode-audit.md': '/docs/65816-opcodes/',
  'snes-register-map.md': '/docs/snes-registers/',
  'snes-hardware-summary.md': '/docs/snes-hardware/',
  'object-oriented-c-and-assembly.md': '/docs/oop-in-c/',
  'snes-emulator-screenshots.md': '/docs/emulator-screenshots/',
  'snes-bootup-sequence.md': '/docs/snes-bootup/',
}
def repl(m):
    text, target = m.group(1), m.group(2).strip()
    if target.startswith(('http://','https://','#','/docs/','mailto:','/')):
        return m.group(0)
    base = target.split('#',1)[0].split('/')[-1]
    if base in M:
        frag = '#'+target.split('#',1)[1] if '#' in target else ''
        return '[%s](%s%s)' % (text, M[base], frag)
    return text  # neutralize a dead repo-relative link to its text
LINK = re.compile(r'\[([^\]]+)\]\(([^)]+)\)')
out, in_fence = [], False
for line in sys.stdin.read().split('\n'):
    s = line.lstrip()
    if s.startswith('```') or s.startswith('~~~'):
        in_fence = not in_fence; out.append(line); continue
    if in_fence:
        out.append(line); continue
    # Only fenced blocks are guarded. No inline-code guard: verified no body
    # inline-code span contains "](", and links whose TEXT is a code span
    # (e.g. [`crt0.c`](...)) must still be rewritten/neutralized.
    out.append(LINK.sub(repl, line))
sys.stdout.write('\n'.join(out))
PY
rewrite_links() { python3 "$REWRITER_PY"; }

# Read the table on FD 3 so inner commands (chrome, md-to-html) can't consume it.
while IFS='|' read -r slug ref path order title summary <&3; do
  [ -n "$slug" ] || continue
  echo "==> $slug  ($ref:$path)"
  raw="$(git -C "$REPO" show "$ref:$path")"
  commit="$(git -C "$REPO" log -1 --format=%h "$ref" -- "$path")"

  # The opcode reference ships its short audit as an appendix.
  if [ "$slug" = "65816-opcodes" ]; then
    audit="$(git -C "$REPO" show "$ref:docs/refs/65816/65816-opcode-audit.md")"
    raw="$raw"$'\n\n---\n\n'"$audit"
  fi

  # 1. raw markdown for download
  printf '%s\n' "$raw" > "$PUBLIC/$slug.md"

  # 2. content-collection entry: frontmatter + body (H1 stripped)
  {
    printf -- '---\n'
    printf 'title: "%s"\n'   "$(esc "$title")"
    printf 'summary: "%s"\n' "$(esc "$summary")"
    printf 'app: "llvm-mos-65816"\n'
    printf 'sourceRepo: "llvm-mos-65816"\n'
    printf 'sourceCommit: "%s"\n' "$commit"
    printf 'order: %s\n' "$order"
    printf -- '---\n\n'
    printf '%s\n' "$raw" | strip_h1 | rewrite_links
  } > "$CONTENT/$slug.md"

  # 3. PDF (best-effort: needs md-to-html.sh + headless Chrome)
  if [ -n "$CHROME" ] && [ -x "$MD2HTML" ]; then
    # MD_TO_PDF_NO_OPEN: produce the HTML but don't pop a browser tab per doc.
    MD_TO_PDF_NO_OPEN=1 bash "$MD2HTML" "$PUBLIC/$slug.md" >/dev/null 2>&1 || true
    html="$HOME/tmp/$slug.html"
    if [ -f "$html" ]; then
      "$CHROME" --headless=new --no-sandbox --disable-gpu --no-pdf-header-footer \
        --print-to-pdf="$PUBLIC/$slug.pdf" "file://$html" >/dev/null 2>&1 \
        && echo "    pdf: $(du -h "$PUBLIC/$slug.pdf" | cut -f1)" \
        || echo "    WARN: chrome failed to render $slug.pdf" >&2
    else
      echo "    WARN: md-to-html produced no HTML for $slug" >&2
    fi
  else
    echo "    WARN: no Chrome or md-to-html.sh — skipping $slug.pdf" >&2
  fi
done 3<<< "$DOCS"

echo "==> done: $(ls "$CONTENT"/*.md | wc -l) doc pages, $(ls "$PUBLIC"/*.pdf 2>/dev/null | wc -l) PDFs"
