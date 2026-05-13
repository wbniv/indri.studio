# indri-cf-token: the narrow, project-scoped Cloudflare API token used by both
# the global/ Terraform config and the CI deploy workflow.
#
# Scope: indri.studio zone only, Workers Scripts edit, DNS edit, Workers
# Routes edit, Zone read. Nothing else. If a future workflow needs more
# permission, add it here explicitly — never broaden to account-wide.

variable "project" {
  description = "Project slug — used in token name."
  type        = string
  default     = "indri-studio"
}

variable "account_id" {
  description = "Cloudflare account ID — sourced from SSM /indri-studio/cloudflare/account_id."
  type        = string
  # TODO: set the actual account ID before first apply
  default = ""
}

variable "zone_id" {
  description = "indri.studio zone ID. Read from `global/` output after first apply, or set manually."
  type        = string
  # TODO: populate from global/ output
  default = ""
}

# Permission groups for CI deploys. CF v5 uses cloudflare_account_token
# (Account API token, not user-tied). Two policies for clean scope split:
#   - Zone-scoped: DNS Write + Workers Routes Write + Zone Read
#     (custom-domain bindings touch DNS records and routes)
#   - Account-scoped: Workers Scripts Write
#     (deploy = upload script to account)
data "cloudflare_account_api_token_permission_groups_list" "all" {
  account_id = var.account_id
}

locals {
  pg = {
    for p in data.cloudflare_account_api_token_permission_groups_list.all.result :
    p.name => p.id
  }
}

resource "cloudflare_account_token" "indri_cf_token" {
  account_id = var.account_id
  name       = "indri-cf-token"

  policies = [
    {
      effect = "allow"
      resources = jsonencode({
        "com.cloudflare.api.account.zone.${var.zone_id}" = "*"
      })
      permission_groups = [
        { id = local.pg["DNS Write"] },
        { id = local.pg["Workers Routes Write"] },
        { id = local.pg["Zone Read"] },
      ]
    },
    {
      effect = "allow"
      resources = jsonencode({
        "com.cloudflare.api.account.${var.account_id}" = "*"
      })
      permission_groups = [
        { id = local.pg["Workers Scripts Write"] },
      ]
    },
  ]
}

output "token_value" {
  description = "Newly minted token value. Push this to SSM at /indri-studio/cloudflare/api_token, then revoke the bootstrap token."
  value       = cloudflare_account_token.indri_cf_token.value
  sensitive   = true
}
