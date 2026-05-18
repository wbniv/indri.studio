#!/usr/bin/env bash
# Print a rich Lighthouse score report from existing JSON report(s).
#
# Usage:
#   lh-report.sh                   # reads /tmp/lh/latest/*.run-1.report.json
#   lh-report.sh v0.0.29           # reads public/lh/v0.0.29/*.run-1.report.json
#   lh-report.sh path/to/file.json # reads one specific report file
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: lh-report.sh [SOURCE]

SOURCE:
  (none)            /tmp/lh/latest/*.run-1.report.json  (most recent run)
  v<tag>            public/lh/<tag>/*.run-1.report.json   (archived CI bundle)
  <file.json>       a specific Lighthouse JSON report file

Options:
  -h, --help    Show this help and exit 0.
EOF
}

case "${1:-}" in -h|--help) usage; exit 0 ;; esac

# ── Colours ───────────────────────────────────────────────────────────────────
c()  { printf '\e[38;2;%s;%s;%sm' "$1" "$2" "$3"; }
RST=$'\e[0m'; BOLD=$'\e[1m'; DIM=$'\e[2m'
GREEN=$(c 80 200 120); YELLOW=$(c 255 190 60); RED=$(c 255 90 90)
CYAN=$(c 90 200 220); WHITE=$(c 220 220 220); GREY=$(c 130 130 130)

score_color() {
  [[ $1 -ge 95 ]] && printf '%s' "$GREEN" && return
  [[ $1 -ge 80 ]] && printf '%s' "$YELLOW" && return
  printf '%s' "$RED"
}

# Always 5 visible chars: "NNN S" (e.g. " 95 ✓", "100 ~", " 72 ✗")
score_badge() {
  local s=$1 sym col
  col=$(score_color "$s")
  [[ $s -ge 95 ]] && sym="✓" || { [[ $s -ge 80 ]] && sym="~" || sym="✗"; }
  printf '%s%s%3d %s%s' "$col" "$BOLD" "$s" "$sym" "$RST"
}

# ── Box drawing (W = inner width between │ chars) ────────────────────────────
W=74

hbar() { printf '%.0s─' $(seq 1 "$1"); }
ebar() { printf '%.0s═' $(seq 1 "$1"); }

box_top() { printf '  %s╔%s╗%s\n' "$CYAN" "$(ebar $W)" "$RST"; }
box_bot() { printf '  %s╚%s╝%s\n' "$CYAN" "$(ebar $W)" "$RST"; }
box_hrow() {  # row with ║ borders (header box)
  local content="$1"
  local vl; vl=$(printf '%s' "$content" | sed 's/\x1b\[[0-9;]*m//g' | wc -m | tr -d ' \n')
  local pad=$(( W - 2 - vl )); [[ $pad -lt 0 ]] && pad=0
  printf '  %s║%s %s%*s %s║%s\n' "$CYAN" "$RST" "$content" "$pad" "" "$CYAN" "$RST"
}

sbox_top()   { printf '  %s┌%s┐%s\n' "$WHITE" "$(hbar $W)" "$RST"; }
sbox_bot()   { printf '  %s└%s┘%s\n' "$WHITE" "$(hbar $W)" "$RST"; }
sbox_blank() { printf '  %s│%*s│%s\n' "$WHITE" $W "" "$RST"; }
sbox_row() {  # row with │ borders; strips ANSI to measure visible width
  local content="$1"
  local vl; vl=$(printf '%s' "$content" | sed 's/\x1b\[[0-9;]*m//g' | wc -m | tr -d ' \n')
  local pad=$(( W - 2 - vl )); [[ $pad -lt 0 ]] && pad=0
  printf '  %s│%s %s%*s %s│%s\n' "$WHITE" "$RST" "$content" "$pad" "" "$WHITE" "$RST"
}

# ── Input resolution ──────────────────────────────────────────────────────────
ARG="${1:-}"
if   [[ -z "$ARG" ]];        then REPORT_DIR=/tmp/lh/latest; LABEL="$REPORT_DIR"
elif [[ "$ARG" == v* ]];     then REPORT_DIR="public/lh/$ARG";  LABEL="$REPORT_DIR"
elif [[ -f "$ARG" ]];        then REPORT_DIR="";               LABEL="$ARG"
else
  printf '%sError:%s %q is not a tag (v*), a file, or empty\n' "$RED" "$RST" "$ARG" >&2
  echo "Run with --help for usage." >&2; exit 1
fi

if [[ -n "$REPORT_DIR" ]]; then
  shopt -s nullglob
  reports=( "$REPORT_DIR"/*.run-1.report.json )
  [[ ${#reports[@]} -eq 0 ]] && {
    printf '%sError:%s no *.run-1.report.json files in %s\n' "$RED" "$RST" "$REPORT_DIR" >&2; exit 2; }
else
  reports=( "$ARG" )
fi

# ── Header ────────────────────────────────────────────────────────────────────
echo
box_top
box_hrow "${BOLD}Lighthouse Report${RST}"
box_hrow "${DIM}${LABEL}${RST}"
box_bot

# ── Per-report ────────────────────────────────────────────────────────────────
for f in "${reports[@]}"; do
  slug=$(basename "$f" .run-1.report.json)

  read -r url fetch_ts perf a11y bp seo fcp lcp tbt cls_num < <(jq -r '
    [
      .finalUrl, .fetchTime,
      (.categories.performance.score * 100 | round),
      (.categories.accessibility.score * 100 | round),
      (.categories["best-practices"].score * 100 | round),
      (.categories.seo.score * 100 | round),
      .audits["first-contentful-paint"].displayValue,
      .audits["largest-contentful-paint"].displayValue,
      .audits["total-blocking-time"].displayValue,
      (.audits["cumulative-layout-shift"].numericValue
        | . * 1000 | round / 1000 | tostring)
    ] | @tsv' "$f")

  ts="${fetch_ts%%.*}Z"

  echo
  printf '  %s▶%s %s%s%s\n' "$CYAN" "$RST" "$BOLD" "$slug" "$RST"
  printf '  %s%s%s  %s%s%s\n' "$DIM" "$url" "$RST" "$GREY" "$ts" "$RST"

  # ── Scores ────────────────────────────────────────────────────────────────
  # Each column is 17 visible chars. Badges are always 5 visible chars.
  # Padding is handled by sbox_row (strips ANSI to measure), not printf width specs.
  S12=$(printf '%12s' "")   # 12 spaces between badges  (5 + 12 = 17 per column)
  echo
  sbox_top
  sbox_row "$(printf '%-17s%-17s%-17s%s' "Performance" "Accessibility" "Best Practices" "SEO")"
  sbox_row "$(score_badge $perf)${S12}$(score_badge $a11y)${S12}$(score_badge $bp)${S12}$(score_badge $seo)"
  sbox_row "${GREY}threshold ≥ 95  ·  ${GREEN}✓${GREY} pass  ${YELLOW}~${GREY} warn (≥80)  ${RED}✗${GREY} fail${RST}"
  sbox_bot

  # ── Core Web Vitals ───────────────────────────────────────────────────────
  # Columns: abbr(3) + 2sp + val(8) + 2sp + label(24) + 2sp + hint
  cwv_row() {
    local abbr="$1" val="$2" label="$3" hint="$4"
    sbox_row "${BOLD}${CYAN}${abbr}${RST}  ${BOLD}${WHITE}$(printf '%-8s' "$val")${RST}  $(printf '%-24s' "$label")  ${GREY}${hint}${RST}"
  }
  echo
  sbox_top
  sbox_blank
  cwv_row "FCP" "$fcp"     "First Contentful Paint"    "first text or image"
  cwv_row "LCP" "$lcp"     "Largest Contentful Paint"  "largest visible element"
  cwv_row "TBT" "$tbt"     "Total Blocking Time"        "main-thread blocking time"
  cwv_row "CLS" "$cls_num" "Cumulative Layout Shift"    "visual stability (good: 0)"
  sbox_blank
  sbox_bot
done
echo
