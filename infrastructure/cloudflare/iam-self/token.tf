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

# Permission group IDs are CF-managed UUIDs and stable across accounts.
# Hardcoded rather than looked up via data source because the data source
# returns the full catalogue (~200 entries) with duplicate display names
# across different scopes, which breaks any name→id map. Resolved via
# `curl /accounts/{aid}/tokens/permission_groups` once; pasted here.
locals {
  permission_groups = {
    dns_write             = "4755a26eedb94da69e1066d98aa820be"  # zone scope
    workers_routes_write  = "28f4b596e7d643029c524985477ae49a"  # zone scope
    workers_scripts_write = "e086da7e2179491d91ee5f35b3ca210a"  # account scope
  }
}

# Why no Zone Read: dropped to avoid widening the bootstrap token. Narrow
# token is for CI's wrangler deploy, which only needs to write the Worker
# script — it doesn't enumerate zones. If a future workflow needs to read
# zone metadata, add Zone Read to both bootstrap and here, then re-apply.
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
        { id = local.permission_groups.dns_write },
        { id = local.permission_groups.workers_routes_write },
      ]
    },
    {
      effect = "allow"
      resources = jsonencode({
        "com.cloudflare.api.account.${var.account_id}" = "*"
      })
      permission_groups = [
        { id = local.permission_groups.workers_scripts_write },
      ]
    },
  ]
}

output "token_value" {
  description = "Newly minted token value. Push this to SSM at /indri-studio/cloudflare/api_token, then revoke the bootstrap token."
  value       = cloudflare_account_token.indri_cf_token.value
  sensitive   = true
}
