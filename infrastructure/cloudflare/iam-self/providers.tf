# Self-narrow the indri-studio Cloudflare API token.
#
# This config manages the narrow `indri-cf-token` (cloudflare_account_token).
# To run terraform plan/apply against this module, CLOUDFLARE_API_TOKEN must
# point at a *bootstrap* token with `Account → Account API Tokens: Edit`
# (account-scoped) plus `User → API Tokens: Edit` if you also need to
# revoke the previous user-scope bootstrap. The narrow token itself
# deliberately CAN'T manage other tokens, so every rotation needs a fresh
# bootstrap minted in the dashboard for the duration of the apply.
#
# Mirrors the iam-self pattern in ~/SRC/finding-your-way/infrastructure/aws/iam-self/
# — the Cloudflare equivalent of the AWS terraform-user self-narrowing.
#
# See ../README.md "First-apply order" and "Token rotation" for the full flow.

terraform {
  required_version = ">= 1.5"

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.0"
    }
  }
}

provider "cloudflare" {
  # bootstrap token from CLOUDFLARE_API_TOKEN env var
}
