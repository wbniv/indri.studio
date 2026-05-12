# Canonical-host policy: www.indri.studio 301-redirects to indri.studio (apex).
#
# Without this, both hostnames would serve the same content under different
# URLs — duplicate-content SEO hit, and split analytics. This rule fires at
# the Cloudflare edge before the request ever reaches the Worker.
#
# Note: http → https is handled separately by the Always-Use-HTTPS zone
# setting in zone.tf. This file is just for hostname canonicalisation.

resource "cloudflare_ruleset" "www_to_apex" {
  zone_id     = cloudflare_zone.indri_studio.id
  name        = "Redirect www.indri.studio to apex"
  description = "301 redirect www.${var.domain} → ${var.domain}"
  kind        = "zone"
  phase       = "http_request_dynamic_redirect"

  rules = [
    {
      action      = "redirect"
      expression  = "(http.host eq \"www.${var.domain}\")"
      description = "www → apex 301"
      enabled     = true

      action_parameters = {
        from_value = {
          status_code = 301
          target_url = {
            expression = "concat(\"https://${var.domain}\", http.request.uri.path)"
          }
          preserve_query_string = true
        }
      }
    }
  ]
}
