# Self-narrow the indri-studio Cloudflare API token.
#
# Bootstrap flow:
#   1. Create a temporary, broad-scope "bootstrap" token in the Cloudflare
#      dashboard. Export it as CLOUDFLARE_API_TOKEN.
#   2. Run `terraform apply` here to mint a narrow `indri-cf-token` with only
#      the permissions the global/ config and CI deploys need.
#   3. Store the narrow token value in SSM at /indri-studio/cloudflare/api_token.
#   4. Revoke the bootstrap token in the Cloudflare dashboard.
#
# After step 4, only the narrowed token exists — the global/ config and CI
# deploys both use it. Mirrors the iam-self pattern in
# ~/SRC/finding-your-way/infrastructure/aws/iam-self/.

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
