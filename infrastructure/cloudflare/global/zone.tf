# The Cloudflare zone for indri.studio.
#
# Two patterns are possible:
#   1. Resource-managed (cloudflare_zone): TF creates and owns the zone.
#      Cleaner but requires Cloudflare to allow zone creation via API for
#      this account (and the registrar's nameservers must be pointed at
#      Cloudflare's first, otherwise activation stalls).
#   2. Data-referenced: zone is created once via the dashboard (or
#      Cloudflare Registrar), then TF references it as a data source.
#      Less elegant but matches the SETUP.md one-time bootstrap flow.
#
# We use pattern 1 with `lifecycle.prevent_destroy = true` so an accidental
# `terraform destroy` can't wipe the zone. If the zone is registered through
# Cloudflare Registrar, switching to pattern 2 is a `terraform import` away.

resource "cloudflare_zone" "indri_studio" {
  zone       = var.domain
  account_id = var.account_id
  plan       = "free"
  type       = "full"

  lifecycle {
    prevent_destroy = true
  }
}

# Always-Use-HTTPS — every http:// request 301s to https://. Survives any
# manual UI toggle because TF will revert drift on the next apply.
resource "cloudflare_zone_setting" "always_use_https" {
  zone_id    = cloudflare_zone.indri_studio.id
  setting_id = "always_use_https"
  value      = "on"
}

# Belt-and-braces: also turn on Automatic HTTPS Rewrites, so any http://
# subresources in HTML get rewritten to https:// at the edge.
resource "cloudflare_zone_setting" "automatic_https_rewrites" {
  zone_id    = cloudflare_zone.indri_studio.id
  setting_id = "automatic_https_rewrites"
  value      = "on"
}
