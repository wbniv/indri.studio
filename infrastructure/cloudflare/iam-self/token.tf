# is-cf-token: the narrow, project-scoped Cloudflare API token used by both
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

# Permission group IDs are stable Cloudflare-side. These four cover everything
# the global/ TF and CI deploy need:
#   - Workers Scripts:Edit       (deploy + bind the Worker)
#   - DNS:Edit                   (custom-domain bindings touch DNS)
#   - Workers Routes:Edit        (custom-domain bindings touch routes)
#   - Zone:Read                  (provider needs to enumerate the zone)
data "cloudflare_api_token_permission_groups_list" "all" {}

resource "cloudflare_api_token" "is_cf_token" {
  name = "${var.project}-cf-token"

  policies = [
    {
      effect = "allow"

      resources = {
        "com.cloudflare.api.account.zone.${var.zone_id}" = "*"
      }

      permission_groups = [
        # Filter to the four permission groups by name. Names are stable;
        # IDs are stable but opaque. Use names for readability.
        # Adjust this list when extending scope — never just remove the filter.
        for pg in data.cloudflare_api_token_permission_groups_list.all.result :
        { id = pg.id }
        if contains([
          "Workers Scripts Write",
          "DNS Write",
          "Workers Routes Write",
          "Zone Read",
        ], pg.name)
      ]
    }
  ]
}

output "token_value" {
  description = "Newly minted token value. Push this to SSM at /indri-studio/cloudflare/api_token, then revoke the bootstrap token."
  value       = cloudflare_api_token.is_cf_token.value
  sensitive   = true
}
