#!/usr/bin/env bash
#
# scripts/secrets-set-r2.sh
#
# Collect a bucket-scoped R2 API token's S3 credentials (Access Key ID + Secret)
# and store them in SSM, so `secrets-pull` renders the rclone `R2` remote into
# .env and `task release-upload` can publish to r2://indri-apt/sources/.
#
#     R2_ACCESS_KEY_ID     → /indri-studio/cloudflare/r2_access_key_id     (SecureString)
#     R2_SECRET_ACCESS_KEY → /indri-studio/cloudflare/r2_secret_access_key (SecureString)
#     R2_ENDPOINT          → /indri-studio/cloudflare/r2_endpoint          (String)
#
# Where the keys come from: Cloudflare → R2 → Manage R2 API Tokens. Reuse/roll
# the `indri-apt-ci` token (Object Read & Write on bucket indri-apt) or "Create
# Account API token" like it. Creating/rolling shows the Access Key ID + Secret
# once — paste them at the prompts below (the secret is read hidden, never echoed,
# and goes straight to SSM — not your shell history, not this repo).
#
# Usage:
#     scripts/secrets-set-r2.sh                 # interactive prompts, then secrets-pull
#     R2_ACCESS_KEY_ID=… R2_SECRET_ACCESS_KEY=… scripts/secrets-set-r2.sh   # non-interactive
#     scripts/secrets-set-r2.sh -h | --help     # this help
set -euo pipefail

case "${1:-}" in -h|--help) sed -n '3,/^$/p' "$0" | sed 's|^# \{0,1\}||'; exit 0 ;; esac

PROFILE="${INDRI_AWS_PROFILE:-indri-terraform}"
REGION="${INDRI_AWS_REGION:-us-west-2}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

aws sts get-caller-identity --profile "$PROFILE" --region "$REGION" >/dev/null 2>&1 \
  || { echo "ERR: aws creds for profile '$PROFILE' (region $REGION) don't work." >&2; exit 1; }

# Default the S3 endpoint from the account id already in SSM.
ACCT="$(aws ssm get-parameter --profile "$PROFILE" --region "$REGION" \
        --name /indri-studio/cloudflare/account_id \
        --query Parameter.Value --output text 2>/dev/null || true)"

AK="${R2_ACCESS_KEY_ID:-}"
SK="${R2_SECRET_ACCESS_KEY:-}"
EP="${R2_ENDPOINT:-}"
[ -n "$AK" ] || read -rp  "R2 Access Key ID: " AK
[ -n "$SK" ] || { read -rsp "R2 Secret Access Key: " SK; echo; }
if [ -z "$EP" ]; then
  def="https://${ACCT:-<account-id>}.r2.cloudflarestorage.com"
  read -rp "R2 S3 endpoint [$def]: " EP; EP="${EP:-$def}"
fi
[ -n "$AK" ] && [ -n "$SK" ] || { echo "ERR: Access Key ID and Secret are both required." >&2; exit 1; }
case "$EP" in https://*.r2.cloudflarestorage.com) ;; *) echo "WARN: endpoint '$EP' doesn't look like an R2 S3 endpoint" >&2 ;; esac

put() { # put <name> <type> <value>
  aws ssm put-parameter --profile "$PROFILE" --region "$REGION" \
      --name "$1" --type "$2" --value "$3" --overwrite >/dev/null
  echo "  + $1"
}
echo "Writing R2 creds to SSM (profile=$PROFILE region=$REGION):"
put /indri-studio/cloudflare/r2_access_key_id     SecureString "$AK"
put /indri-studio/cloudflare/r2_secret_access_key SecureString "$SK"
put /indri-studio/cloudflare/r2_endpoint          String       "$EP"

echo "Rendering .env from SSM…"
bash "$HERE/secrets-pull.sh"
echo "Done. RCLONE_CONFIG_R2_* is now in .env — run:  task release-upload -- <artifacts>"
