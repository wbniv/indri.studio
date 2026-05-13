# Cloudflare Email Routing for indri.studio.
#
# Four resources cover the full setup:
#
#   1. settings — flip Email Routing on for the zone.
#   2. dns      — auto-create the MX (route1/2/3.mx.cloudflare.net) and
#                 SPF TXT (_spf.mx.cloudflare.net) records. Cloudflare
#                 picks priorities; we don't hardcode them.
#   3. address  — register wbnorris@gmail.com as a destination. One
#                 manual step on first apply: Cloudflare emails a
#                 verification link to that inbox, click it. The
#                 destination won't actually receive forwarded mail
#                 until verified (visible in the dashboard).
#   4. rule     — forward hello@indri.studio → wbnorris@gmail.com.
#
# The address resource is account-scoped (one verified destination
# can back rules in any zone on the account); the others are
# zone-scoped to indri.studio.

resource "cloudflare_email_routing_settings" "indri_studio" {
  zone_id = cloudflare_zone.indri_studio.id
}

resource "cloudflare_email_routing_dns" "indri_studio" {
  zone_id = cloudflare_zone.indri_studio.id
  # `name` is for routing on a SUBDOMAIN (e.g. mail.indri.studio).
  # For the zone apex, omit it — Cloudflare auto-derives it.

  depends_on = [cloudflare_email_routing_settings.indri_studio]
}

resource "cloudflare_email_routing_address" "wbnorris_gmail" {
  account_id = var.account_id
  email      = "wbnorris@gmail.com"
}

resource "cloudflare_email_routing_rule" "hello" {
  zone_id  = cloudflare_zone.indri_studio.id
  name     = "Forward hello@ to wbnorris@gmail.com"
  enabled  = true
  priority = 0

  matchers = [{
    type  = "literal"
    field = "to"
    value = "hello@${var.domain}"
  }]

  actions = [{
    type  = "forward"
    value = ["wbnorris@gmail.com"]
  }]

  depends_on = [
    cloudflare_email_routing_settings.indri_studio,
    cloudflare_email_routing_address.wbnorris_gmail,
  ]
}
