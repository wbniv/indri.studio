# Cache-busting gap: explicit `no-store` for HTML pages

## Context

**The question**: are we doing actual cache busting, compared to parking-space?

### What `curl` revealed

```
# HTML page
cache-control: public, max-age=0, must-revalidate
cf-cache-status: HIT

# _astro hashed asset
cache-control: public, max-age=31536000, immutable
cf-cache-status: HIT
```

`cf-cache-status: HIT` on HTML pages means Cloudflare's edge is caching them. The current `max-age=0, must-revalidate` comes from WSA's **default** — there is no explicit rule for HTML in `public/_headers`. Cloudflare's WSA docs say `_headers` uses **last-matching-path-wins** semantics; since no rule matches `/`, WSA falls back to its own default.

### What parking-space does differently

parking-space (Caddy + Dart backend, no CDN) explicitly sets:
- `Cache-Control: no-cache, must-revalidate` + ETag on `index.html` and `flutter_bootstrap.js`
- This enables 304 bandwidth savings that indri.studio doesn't have
- It also uses build-time `?v=BUILD_VERSION` stamps because Flutter doesn't content-hash filenames

indri.studio doesn't need the `?v=` stamps (Astro content-hashes `_astro/*` filenames), but the **missing explicit HTML rule** is a real gap.

### Why it matters

`public, max-age=0, must-revalidate` on HTML + `cf-cache-status: HIT` is ambiguous:
- With `run_worker_first = true` the Worker always runs, so `env.ASSETS.fetch()` serves the current bundle — deploying a new bundle immediately serves new HTML.
- BUT if Cloudflare's Tiered/Smart Cache ever short-circuits the Worker for stale responses, users could get old HTML referencing old `/_astro/<hash>.js` URLs that no longer exist in the current deploy bundle — a broken page, not just stale content.
- Even if WSA behaviour is safe today, relying on an implicit default is fragile.

## What to change

One rule added to the top of `public/_headers`.

**`_headers` semantics (last-matching-path wins):** putting `/*` at the top means every more-specific rule that appears later in the file overrides it for its own paths. `/*` then acts as a catch-all fallback for HTML pages that no specific rule matches.

### `public/_headers` — add `/*` catch-all at the top

```
# HTML pages and anything else not explicitly matched below:
# never cache. Serves directly from the WSA bundle on every request.
/*
  Cache-Control: no-store

# [existing rules follow unchanged — they override /* via last-match-wins]
/_astro/*
  Cache-Control: public, max-age=31536000, immutable
...
```

`no-store` (not `no-cache`) because:
- No ETag is emitted by WSA, so `no-cache` can't buy 304 savings anyway
- `no-store` removes the `cf-cache-status: HIT` ambiguity entirely — Cloudflare won't cache HTML at the edge at all
- Cleaner semantics: "don't cache this" vs "cache but revalidate"

## Critical file

- `public/_headers` — add one `/*` block at the top, before the `/_astro/*` rule

## Verification

1. Build: `task build` → exits 0; `dist/_headers` has `/*` block at top
2. Deploy: `git tag v0.1.34 && git push origin main v0.1.34`
3. After deploy:
   ```sh
   curl -sI https://indri.studio/ | grep -i 'cache-control\|cf-cache-status'
   # expect: cache-control: no-store
   # expect: cf-cache-status: BYPASS (or MISS, not HIT)

   curl -sI https://indri.studio/apps/parking-space/ | grep -i cache-control
   # expect: cache-control: no-store

   curl -sI "https://indri.studio/_astro/gallery.R36HMGw__2vgLmQ.avif" | grep -i cache-control
   # expect: cache-control: public, max-age=31536000, immutable  ← unchanged

   curl -sI https://indri.studio/favicon.ico | grep -i cache-control
   # expect: cache-control: public, max-age=86400, stale-while-revalidate=604800  ← unchanged
   ```
