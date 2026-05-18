#!/usr/bin/env bash
# Print a formatted Lighthouse score table from existing JSON report(s).
#
# Usage:
#   lh-report.sh                  # reads /tmp/lh/latest/*.run-1.report.json
#   lh-report.sh v0.0.29          # reads public/lh/v0.0.29/*.run-1.report.json
#   lh-report.sh path/to/file.json # reads one specific report file
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: lh-report.sh [SOURCE]

SOURCE:
  (none)           /tmp/lh/latest/*.run-1.report.json  (most recent task lighthouse run)
  v<tag>           public/lh/<tag>/*.run-1.report.json   (archived CI bundle)
  <file.json>      a specific Lighthouse JSON report file

Options:
  -h, --help    Show this help and exit 0.
EOF
}

case "${1:-}" in
  -h|--help) usage; exit 0 ;;
esac

ARG="${1:-}"

# Resolve the set of report files to read.
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
  echo "error: '$ARG' is not a tag (v*), a file, or empty (for /tmp/lh/latest/)" >&2
  echo "Run with --help for usage." >&2
  exit 1
fi

if [[ -n "$REPORT_DIR" ]]; then
  shopt -s nullglob
  reports=( "$REPORT_DIR"/*.run-1.report.json )
  if [[ ${#reports[@]} -eq 0 ]]; then
    echo "error: no *.run-1.report.json files found in $REPORT_DIR" >&2
    exit 2
  fi
else
  reports=( "$ARG" )
fi

echo "=== Lighthouse report — $LABEL ==="

for f in "${reports[@]}"; do
  slug=$(basename "$f" .run-1.report.json)

  # Pull all values in one jq call.
  read -r url fetch_ts perf a11y bp seo fcp lcp tbt cls_disp cls_num < <(jq -r '
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
      .audits["cumulative-layout-shift"].displayValue,
      (.audits["cumulative-layout-shift"].numericValue | . * 1000 | round / 1000 | tostring)
    ] | @tsv' "$f")

  echo
  printf "  page    %s\n" "$slug"
  printf "  url     %s\n" "$url"
  printf "  run     %s\n" "$fetch_ts"
  echo
  printf "  %-6s %-6s %-6s %-6s\n" "perf" "a11y" "bp" "seo"
  printf "  %-6s %-6s %-6s %-6s\n" "$perf" "$a11y" "$bp" "$seo"
  echo
  printf "  fcp  %s\n" "$fcp"
  printf "  lcp  %s\n" "$lcp"
  printf "  tbt  %s\n" "$tbt"
  printf "  cls  %s\n" "$cls_num"
done
