#!/usr/bin/env bash
set -euo pipefail

# Bootstrap Cloudflare Workers AI credentials in SSM for indri-studio.
#
# The Workers AI token is a SEPARATE Cloudflare token from the deploy
# token (CLOUDFLARE_API_TOKEN) — different scope, different blast radius.
# This script validates the supplied token against Workers AI with a tiny
# probe call, then pushes it to AWS SSM at:
#
#     /indri-studio/cloudflare/workers_ai_token   (SecureString)
#
# The account ID is reused from the existing parameter at
# /indri-studio/cloudflare/account_id (populated by secrets-bootstrap.sh).
# We don't duplicate it.
#
# Idempotent: re-running with the same token is a no-op apart from the
# probe call. Pass --force to overwrite an existing param (use after
# rotating the token).
#
# Usage:
#     ./scripts/setup-workers-ai.sh
#     ./scripts/setup-workers-ai.sh --force
#     CF_WORKERS_AI_TOKEN=<token> ./scripts/setup-workers-ai.sh
#
# Env var CF_WORKERS_AI_TOKEN, if set, skips the interactive prompt
# (useful for automation). The token is treated as secret — passed via
# stdin to AWS, never echoed.
#
# One-time setup the user does manually:
#   1. Generate API token at https://dash.cloudflare.com/profile/api-tokens
#      using the "Workers AI" template (or custom: Account → Workers AI →
#      Read). Confusingly, "Read" IS the run-AI permission in
#      Cloudflare's UI.
#   2. Account ID is already in SSM from secrets-bootstrap.sh — no
#      action needed.

usage() {
  awk '
    /^[^#]/ && started { exit }
    /^#( |$)/ {
      started = 1
      sub(/^# ?/, "")
      print
    }
  ' "$0"
  exit 0
}

case "${1:-}" in
  -h|--help) usage ;;
esac

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "$SCRIPT_DIR/../../python-tui-lib/scripts/cleanup-stack.sh"

umask 077

PROFILE="${INDRI_AWS_PROFILE:-indri-terraform}"
REGION="${INDRI_AWS_REGION:-us-west-2}"
PARAM_ACCOUNT="/indri-studio/cloudflare/account_id"
PARAM_TOKEN="/indri-studio/cloudflare/workers_ai_token"
FORCE="${1:-}"

# ── Read account ID from existing SSM entry ──────────────────────────────
if ! CF_ACCOUNT_ID=$(aws --profile "$PROFILE" --region "$REGION" \
    ssm get-parameter --name "$PARAM_ACCOUNT" \
    --with-decryption --query 'Parameter.Value' --output text 2>/dev/null); then
  echo "ERROR: $PARAM_ACCOUNT not found in SSM." >&2
  echo "       Run 'task secrets-bootstrap' first to populate Cloudflare creds." >&2
  exit 1
fi
[[ -n "$CF_ACCOUNT_ID" ]] || { echo "ERROR: empty account ID in SSM" >&2; exit 1; }

# ── Skip if token already populated, unless --force ──────────────────────
if [[ "$FORCE" != "--force" ]]; then
  if aws --profile "$PROFILE" --region "$REGION" \
       ssm get-parameter --name "$PARAM_TOKEN" >/dev/null 2>&1; then
    echo "✓ Workers AI token already in SSM ($PARAM_TOKEN)."
    echo "  Pass --force to overwrite (e.g. after rotating the token)."
    exit 0
  fi
fi

# ── Gather token ─────────────────────────────────────────────────────────
CF_WORKERS_AI_TOKEN="${CF_WORKERS_AI_TOKEN:-}"
if [[ -z "$CF_WORKERS_AI_TOKEN" ]]; then
  echo ""
  echo "Generate a Workers AI token at:"
  echo "    https://dash.cloudflare.com/profile/api-tokens"
  echo ""
  echo "Use the 'Workers AI' template, or custom: Account → Workers AI → Read."
  echo "('Read' is the run-AI permission — Cloudflare's UI label is misleading.)"
  echo ""
  read -r -s -p "Cloudflare API token (Workers AI:Read): " CF_WORKERS_AI_TOKEN
  echo
fi
[[ -n "$CF_WORKERS_AI_TOKEN" ]] || { echo "ERROR: token required" >&2; exit 1; }

# ── Validate via a tiny Workers AI probe ─────────────────────────────────
# Calls @cf/baai/bge-base-en-v1.5 (text-embedding model, cheap + fast)
# rather than an image-gen model — confirms the token's scope without
# spending real neurons.
echo "Validating token + account against Workers AI…"
PROBE_OUT=$(mktemp -t cf-probe.XXXXXX.json)
push_cleanup 'rm -f "$PROBE_OUT"'
HTTP_CODE=$(curl -sS -o "$PROBE_OUT" -w '%{http_code}' \
  -X POST "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/ai/run/@cf/baai/bge-base-en-v1.5" \
  -H "Authorization: Bearer $CF_WORKERS_AI_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text": "probe"}' || true)

if [[ "$HTTP_CODE" != "200" ]]; then
  echo "ERROR: validation failed (HTTP $HTTP_CODE)" >&2
  echo "       response body:" >&2
  sed 's/^/         /' "$PROBE_OUT" >&2
  echo "" >&2
  echo "Common causes:" >&2
  echo "  - wrong account ID in SSM" >&2
  echo "  - token missing 'Workers AI:Read' scope" >&2
  echo "  - token revoked or never created" >&2
  exit 1
fi
echo "✓ Validation passed."

# ── Push to SSM ──────────────────────────────────────────────────────────
echo "Pushing to SSM at $PARAM_TOKEN…"
# Spool the token to a 0600 mktemp file (umask 077 above) and feed AWS
# CLI via `--value file://`. Avoids the token landing in argv /
# /proc/<pid>/cmdline.
TOKEN_FILE=$(mktemp -t cf-token.XXXXXX)
push_cleanup 'rm -f "$TOKEN_FILE"'
printf '%s' "$CF_WORKERS_AI_TOKEN" > "$TOKEN_FILE"
aws --profile "$PROFILE" --region "$REGION" ssm put-parameter \
  --name "$PARAM_TOKEN" --type SecureString \
  --value "file://$TOKEN_FILE" --overwrite --no-cli-pager >/dev/null

echo ""
echo "✓ Done. Workers AI is ready for asset generation."
echo "  Account ID:  $PARAM_ACCOUNT"
echo "  Token:       $PARAM_TOKEN"
