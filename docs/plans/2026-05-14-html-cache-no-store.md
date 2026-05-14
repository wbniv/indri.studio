# HTML cache: explicit `no-store` fallback

> Status: **complete — landed in this commit.**

## Context

`public/_headers` had no rule for HTML pages, leaving them on WSA's
implicit default (`public, max-age=0, must-revalidate`). A `curl` check
showed `cf-cache-status: HIT` on every HTML response — Cloudflare's edge
was caching pages.

The risk: if Cloudflare's Tiered Cache ever serves a stale HTML response
after a `wrangler deploy`, that HTML references old `/_astro/<hash>.js`
URLs that no longer exist in the new bundle → broken page (404 on JS),
not just stale content.

Comparison with parking-space: its Caddyfile sets explicit
`no-cache, must-revalidate` + ETag on entry points. We don't need the
`?v=BUILD_VERSION` URL-stamping (Astro content-hashes `_astro/*`
filenames), but the missing explicit HTML rule is a real gap.

`_headers` uses **last-match-wins** semantics (Cloudflare docs: "only the
headers from the last matching path are applied"). Adding `/*` at the top
means every more-specific rule later in the file still overrides it.

## Change

`public/_headers` — add `/*: no-store` block at the top:

```
/*
  Cache-Control: no-store
```

`no-store` over `no-cache` because WSA emits no ETag, so `no-cache`
can't buy 304 savings — `no-store` is cleaner and removes the
`cf-cache-status: HIT` ambiguity entirely.

## Verification

1. `task build` — exits 0; `dist/_headers` contains `/*` block at top.
2. Deploy (tag `v*`).
3. After deploy:

```sh
curl -sI https://indri.studio/ | grep -i 'cache-control\|cf-cache-status'
# cache-control: no-store
# cf-cache-status: BYPASS or MISS (not HIT)

curl -sI https://indri.studio/apps/parking-space/ | grep -i cache-control
# cache-control: no-store

curl -sI https://indri.studio/_astro/gallery.R36HMGw__2vgLmQ.avif | grep -i cache-control
# cache-control: public, max-age=31536000, immutable  ← unchanged

curl -sI https://indri.studio/favicon.ico | grep -i cache-control
# cache-control: public, max-age=86400, stale-while-revalidate=604800  ← unchanged
```
