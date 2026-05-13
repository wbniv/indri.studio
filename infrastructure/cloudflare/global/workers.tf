# Bind the indri-studio Worker to both indri.studio (canonical apex) and
# www.indri.studio (which a redirect rule below will 301 to apex).
#
# `cloudflare_workers_custom_domain` is the modern primitive — it auto-creates
# the DNS record and the TLS cert binding in one resource. Wrangler must NOT
# also declare a [[routes]] block in wrangler.toml (it doesn't) so there's no
# fight over ownership.

resource "cloudflare_workers_custom_domain" "apex" {
  account_id = var.account_id
  zone_id    = cloudflare_zone.indri_studio.id
  hostname   = var.domain
  service    = var.worker_name
}

resource "cloudflare_workers_custom_domain" "www" {
  account_id = var.account_id
  zone_id    = cloudflare_zone.indri_studio.id
  hostname   = "www.${var.domain}"
  service    = var.worker_name
}
