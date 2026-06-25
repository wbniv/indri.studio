#!/usr/bin/env bash
set -euo pipefail
#
# scripts/secrets-set-r2.sh
#
# Store a bucket-scoped R2 API token's S3 credentials in SSM, so secrets-pull
# renders the rclone `R2` remote into .env and `task release-upload` can publish
# to r2://indri-apt/sources/ (the product-page download links).
#
#     /indri-studio/cloudflare/r2_access_key_id     (SecureString)
#     /indri-studio/cloudflare/r2_secret_access_key (SecureString)
#     /indri-studio/cloudflare/r2_endpoint          (String)
#
# Idempotent: skips if already set; pass --force to rotate. The secret is read
# hidden, PROBE-VALIDATED against the bucket before it's stored, and handed to
# AWS via a 0600 file (never argv) — it never touches your shell history or repo.
#
# One-time setup the user does manually:
#   1. Cloudflare → R2 → Manage R2 API Tokens:
#        https://dash.cloudflare.com/<account-id>/r2/api-tokens
#   2. "Create Account API token" → Permission: Object Read & Write →
#      Specify bucket: indri-apt → Create. Copy the Access Key ID + Secret
#      Access Key (shown once). Do NOT roll indri-apt-ci — the apt CI uses it.
#
# Usage:
#     ./scripts/secrets-set-r2.sh             # interactive prompts, then secrets-pull
#     ./scripts/secrets-set-r2.sh --force     # overwrite/rotate existing SSM values
#     R2_ACCESS_KEY_ID=… R2_SECRET_ACCESS_KEY=… ./scripts/secrets-set-r2.sh   # non-interactive
#     ./scripts/secrets-set-r2.sh -h | --help

usage() { awk '/^[^#]/ && s{exit} /^#( |$)/{s=1; sub(/^# ?/,""); print}' "$0"; exit 0; }
case "${1:-}" in -h|--help) usage ;; esac

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "$SCRIPT_DIR/../../python-tui-lib/scripts/cleanup-stack.sh"
umask 077

PROFILE="${INDRI_AWS_PROFILE:-indri-terraform}"
REGION="${INDRI_AWS_REGION:-us-west-2}"
BUCKET="${APT_BUCKET:-indri-apt}"
P_AK=/indri-studio/cloudflare/r2_access_key_id
P_SK=/indri-studio/cloudflare/r2_secret_access_key
P_EP=/indri-studio/cloudflare/r2_endpoint
FORCE="${1:-}"

command -v rclone >/dev/null || { echo "ERROR: rclone not installed (needed to probe the keys)." >&2; exit 1; }
aws sts get-caller-identity --profile "$PROFILE" --region "$REGION" >/dev/null 2>&1 \
  || { echo "ERROR: aws creds for profile '$PROFILE' (region $REGION) don't work." >&2; exit 1; }

# Account id (for the endpoint default), from the param secrets-bootstrap set.
CF_ACCOUNT_ID="$(aws ssm get-parameter --profile "$PROFILE" --region "$REGION" \
  --name /indri-studio/cloudflare/account_id --query Parameter.Value --output text 2>/dev/null || true)"

# Idempotency: don't clobber existing keys unless asked.
if [[ "$FORCE" != "--force" ]] \
   && aws ssm get-parameter --profile "$PROFILE" --region "$REGION" --name "$P_AK" >/dev/null 2>&1; then
  echo "✓ R2 keys already in SSM ($P_AK). Pass --force to rotate."
  exit 0
fi

# ── Gather the keys ──────────────────────────────────────────────────────
AK="${R2_ACCESS_KEY_ID:-}"
SK="${R2_SECRET_ACCESS_KEY:-}"
EP="${R2_ENDPOINT:-}"
DEF_EP="https://${CF_ACCOUNT_ID:-<account-id>}.r2.cloudflarestorage.com"
if [[ -z "$AK" || -z "$SK" ]]; then
  cat <<EOF

  A bucket-scoped R2 API token's S3 keys, for uploads to r2://$BUCKET/.
  Get them in the Cloudflare dashboard:
    R2 → Manage R2 API Tokens → https://dash.cloudflare.com/${CF_ACCOUNT_ID:-<account-id>}/r2/api-tokens
    → "Create Account API token" → Token name: anything (e.g. indri-apt-upload)
    → Permission: Object Read & Write → Specify bucket: $BUCKET
    → Create, then copy the Access Key ID + Secret Access Key it shows once.
    (Reuse indri-apt-ci's keys if you saved them; do NOT roll it — the apt CI uses it.)
  The secret is read hidden, validated, then stored in SSM — not echoed, not saved here.

EOF
  [[ -n "$AK" ]] || read -rp  "  Access Key ID: " AK
  [[ -n "$SK" ]] || { read -rsp "  Secret Access Key (hidden): " SK; echo; }
fi
[[ -n "$AK" && -n "$SK" ]] || { echo "ERROR: both Access Key ID and Secret are required." >&2; exit 1; }
[[ -n "$EP" ]] || EP="$DEF_EP"
case "$EP" in https://*.r2.cloudflarestorage.com) ;; *) echo "WARN: '$EP' doesn't look like an R2 S3 endpoint." >&2 ;; esac

# ── Validate: a real auth'd op against the bucket, before we store anything ──
echo "Validating the keys against r2://$BUCKET …"
PROBE_ERR=$(mktemp); push_cleanup 'rm -f "$PROBE_ERR"'
if ( export RCLONE_CONFIG_R2_TYPE=s3 RCLONE_CONFIG_R2_PROVIDER=Cloudflare RCLONE_CONFIG_R2_REGION=auto \
            RCLONE_CONFIG_R2_ACCESS_KEY_ID="$AK" RCLONE_CONFIG_R2_SECRET_ACCESS_KEY="$SK" \
            RCLONE_CONFIG_R2_ENDPOINT="$EP"
     rclone lsf "R2:$BUCKET" --max-depth 1 ) >/dev/null 2>"$PROBE_ERR"; then
  echo "✓ Authenticated to r2://$BUCKET."
else
  echo "ERROR: the keys can't access r2://$BUCKET:" >&2
  sed 's/^/    /' "$PROBE_ERR" >&2
  echo "  Common causes: wrong Access Key ID / Secret, token not scoped to bucket '$BUCKET'," >&2
  echo "  or not 'Object Read & Write'. Re-create the token and try again." >&2
  exit 1
fi

# ── Store in SSM via 0600 files (keep the secret out of argv / /proc) ─────
echo "Writing to SSM (profile=$PROFILE region=$REGION):"
AKF=$(mktemp); SKF=$(mktemp); push_cleanup 'rm -f "$AKF" "$SKF"'
printf '%s' "$AK" >"$AKF"; printf '%s' "$SK" >"$SKF"
aws ssm put-parameter --profile "$PROFILE" --region "$REGION" \
    --name "$P_AK" --type SecureString --value "file://$AKF" --overwrite --no-cli-pager >/dev/null; echo "  + $P_AK"
aws ssm put-parameter --profile "$PROFILE" --region "$REGION" \
    --name "$P_SK" --type SecureString --value "file://$SKF" --overwrite --no-cli-pager >/dev/null; echo "  + $P_SK"
aws ssm put-parameter --profile "$PROFILE" --region "$REGION" \
    --name "$P_EP" --type String --value "$EP" --overwrite --no-cli-pager >/dev/null; echo "  + $P_EP"

# ── Render .env from SSM ─────────────────────────────────────────────────
echo "Rendering .env from SSM …"
bash "$SCRIPT_DIR/secrets-pull.sh"
echo ""
echo "✓ Done — RCLONE_CONFIG_R2_* is in .env. Next:  task release-upload -- <artifacts>"
