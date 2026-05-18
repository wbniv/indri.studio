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
  (none)            /tmp/lh/latest/*.run-1.report.json  (most recent task lighthouse run)
  v<tag>            public/lh/<tag>/*.run-1.report.json   (archived CI bundle)
  <file.json>       a specific Lighthouse JSON report file

Options:
  -h, --help    Show this help and exit 0.
EOF
}

case "${1:-}" in
  -h|--help) usage; exit 0 ;;
esac

# ── Colour helpers ────────────────────────────────────────────────────────────
c()  { printf '\e[38;2;%s;%s;%sm' "$1" "$2" "$3"; }
RST=$'\e[0m'; BOLD=$'\e[1m'; DIM=$'\e[2m'
GREEN=$(c 80 200 120); YELLOW=$(c 255 190 60); RED=$(c 255 90 90)
CYAN=$(c 90 200 220); WHITE=$(c 220 220 220); GREY=$(c 130 130 130)

score_color() {
  local s=$1
  if   [[ $s -ge 95 ]]; then printf '%s' "$GREEN"
  elif [[ $s -ge 80 ]]; then printf '%s' "$YELLOW"
  else                        printf '%s' "$RED"
  fi
}

score_badge() {
  local s=$1
  local col; col=$(score_color "$s")
  if [[ $s -ge 95 ]]; then
    printf '%s%s%3d ✓%s' "$col" "$BOLD" "$s" "$RST"
  elif [[ $s -ge 80 ]]; then
    printf '%s%s%3d ~%s' "$col" "$BOLD" "$s" "$RST"
  else
    printf '%s%s%3d ✗%s' "$col" "$BOLD" "$s" "$RST"
  fi
}

# ── Input resolution ──────────────────────────────────────────────────────────
ARG="${1:-}"

if [[ -z "$ARG" ]]; then
  REPORT_DIR=/tmp/lh/latest
  LABEL="$REPORT_DIR"
elif [[ "$ARG" == v* ]]; then
  REPORT_DIR="public/lh/$ARG"
  LABEL="$REPORT_DIR"
elif [[ -f "$ARG" ]]; then
  REPORT_DIR=""
  LABEL="$ARG"
else
  printf '%sError:%s %q is not a tag (v*), a file, or empty (for /tmp/lh/latest/)\n' \
    "$RED" "$RST" "$ARG" >&2
  echo "Run with --help for usage." >&2
  exit 1
fi

if [[ -n "$REPORT_DIR" ]]; then
  shopt -s nullglob
  reports=( "$REPORT_DIR"/*.run-1.report.json )
  if [[ ${#reports[@]} -eq 0 ]]; then
    printf '%sError:%s no *.run-1.report.json files found in %s\n' \
      "$RED" "$RST" "$REPORT_DIR" >&2
    exit 2
  fi
else
  reports=( "$ARG" )
fi

# ── Header ────────────────────────────────────────────────────────────────────
W=62
printf '%s╔%s╗%s\n' "$CYAN" "$(printf '═%.0s' $(seq 1 $W))" "$RST"
printf '%s║%s  Lighthouse Report%-*s%s║%s\n' \
  "$CYAN" "$RST$BOLD" $((W - 18)) "" "$RST$CYAN" "$RST"
printf '%s║%s  %s%-*s%s║%s\n' \
  "$CYAN" "$RST$DIM" "$LABEL" $((W - 2 - ${#LABEL})) "" "$RST$CYAN" "$RST"
printf '%s╚%s╝%s\n' "$CYAN" "$(printf '═%.0s' $(seq 1 $W))" "$RST"

# ── Per-report ────────────────────────────────────────────────────────────────
for f in "${reports[@]}"; do
  slug=$(basename "$f" .run-1.report.json)

  read -r url fetch_ts perf a11y bp seo fcp lcp tbt cls_num < <(jq -r '
    [
      .finalUrl,
      .fetchTime,
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

  # Normalise timestamp: drop sub-seconds
  ts="${fetch_ts%%.*}Z"

  echo
  printf '  %s▶%s %s%s%s\n' "$CYAN" "$RST" "$BOLD" "$slug" "$RST"
  printf '  %s%s%s\n' "$DIM" "$url" "$RST"
  printf '  %s%s%s\n' "$GREY" "$ts" "$RST"

  # ── Scores table ──────────────────────────────────────────────────────────
  echo
  printf '  %s┌────────────────────────────────── Scores ─────────────────────────────────┐%s\n' "$WHITE" "$RST"
  printf '  %s│%s  %-15s  %-15s  %-15s  %-15s%s│%s\n' \
    "$WHITE" "$RST" "Performance" "Accessibility" "Best Practices" "SEO" "$WHITE" "$RST"
  printf '  %s│%s  %-11s      %-11s      %-11s      %-11s  %s│%s\n' \
    "$WHITE" "$RST" \
    "$(score_badge "$perf")" \
    "$(score_badge "$a11y")" \
    "$(score_badge "$bp")" \
    "$(score_badge "$seo")" \
    "$WHITE" "$RST"
  printf '  %s│%s  %sthreshold ≥ 95%s  ·  ✓ pass  ~  warn (≥80)  ✗ fail%s%*s%s│%s\n' \
    "$WHITE" "$RST" "$GREY" "$RST" "$GREY" 14 "" "$RST$WHITE" "$RST"
  printf '  %s└────────────────────────────────────────────────────────────────────────────┘%s\n' "$WHITE" "$RST"

  # ── Core Web Vitals table ─────────────────────────────────────────────────
  echo
  printf '  %s┌──────────────────────────── Core Web Vitals ──────────────────────────────┐%s\n' "$WHITE" "$RST"
  printf '  %s│%s\n' "$WHITE" "$RST"

  cwv_row() {
    local abbr="$1" val="$2" label="$3" hint="$4"
    printf '  %s│%s  %s%-4s%s  %s%-10s%s  %-28s  %s%s%s  %s│%s\n' \
      "$WHITE" "$RST" \
      "$BOLD$CYAN" "$abbr" "$RST" \
      "$BOLD$WHITE" "$val" "$RST" \
      "$label" \
      "$GREY" "$hint" "$RST" \
      "$WHITE" "$RST"
  }

  cwv_row "FCP" "$fcp"    "First Contentful Paint"    "time to first text or image"
  cwv_row "LCP" "$lcp"    "Largest Contentful Paint"  "time to largest visible element"
  cwv_row "TBT" "$tbt"    "Total Blocking Time"        "main-thread block (good: 0 ms)"
  cwv_row "CLS" "$cls_num" "Cumulative Layout Shift"   "visual stability  (good: 0)"

  printf '  %s│%s\n' "$WHITE" "$RST"
  printf '  %s└────────────────────────────────────────────────────────────────────────────┘%s\n' "$WHITE" "$RST"
done
echo
