# Zone-phase cache-settings ruleset. Mark content-hashed and stable-URL
# asset paths immutable (1y edge + browser TTL). Closes the Lighthouse
# "Use efficient cache lifetimes" diagnostic (Rec #6) — see
# docs/plans/2026-05-14-render-blocking-cache-ttl.md.
#
# HTML responses are intentionally left untouched so deploys flush
# promptly. Cache Rules are a Free-plan feature; ruleset *redirects*
# previously hit API-token permission limits on this zone (TODO.md), but
# the http_request_cache_settings phase is the documented vehicle for
# Cache Rules and is expected to manage cleanly via the same token. If
# tf-apply fails here, fall back to a public/_headers file in the
# Worker static-assets bundle.

resource "cloudflare_ruleset" "cache_immutable" {
  zone_id     = cloudflare_zone.indri_studio.id
  name        = "indri-studio cache immutable hashed assets"
  description = "1y immutable cache on content-hashed /_astro/* and stable /screenshots/*"
  kind        = "zone"
  phase       = "http_request_cache_settings"

  rules = [
    {
      action      = "set_cache_settings"
      description = "1y immutable cache on /_astro/*"
      enabled     = true
      expression  = "(starts_with(http.request.uri.path, \"/_astro/\"))"
      action_parameters = {
        cache = true
        edge_ttl = {
          mode    = "override_origin"
          default = 31536000
        }
        browser_ttl = {
          mode    = "override_origin"
          default = 31536000
        }
      }
    },
    {
      action      = "set_cache_settings"
      description = "1y immutable cache on /screenshots/*"
      enabled     = true
      expression  = "(starts_with(http.request.uri.path, \"/screenshots/\"))"
      action_parameters = {
        cache = true
        edge_ttl = {
          mode    = "override_origin"
          default = 31536000
        }
        browser_ttl = {
          mode    = "override_origin"
          default = 31536000
        }
      }
    },
  ]
}
