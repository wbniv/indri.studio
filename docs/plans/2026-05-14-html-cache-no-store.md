# HTML cache: explicit `no-store` fallback

> Status: **complete — v0.1.36 (corrected approach after v0.1.35 regression).**

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

## Approach (corrected)

**First attempt (v0.1.35):** added `/*: Cache-Control: no-store` at the
top of `public/_headers`. This failed: Cloudflare WSA `_headers` **merges
all matching rules** rather than replacing earlier ones. `_astro/*` assets
received `cache-control: no-store, public, max-age=31536000, immutable` —
contradictory directives where `no-store` (most restrictive) wins, killing
the immutable cache entirely.

**Correct approach (v0.1.36):** set `no-store` in the Worker instead.
The Worker already runs for all requests (`run_worker_first = true`). After
`env.ASSETS.fetch()` resolves, check `content-type: text/html` and
override `Cache-Control` via `new Response(body, { headers })`. Non-HTML
assets (`_astro/*`, favicons, images) pass through unmodified.

`worker/index.ts`:

```ts
const response = await env.ASSETS.fetch(request);
const ct = response.headers.get("content-type") ?? "";
if (ct.includes("text/html")) {
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "no-store");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
return response;
```

## Regression (v0.1.35)

The first attempt put `/*: Cache-Control: no-store` in `public/_headers`.
The plan assumed "last-match-wins" semantics based on Cloudflare docs
("only the headers from the last matching path are applied"). The actual
WSA behaviour is **header accumulation**: all matching rules' headers are
merged into the response. `_astro/*` assets received both rules'
`Cache-Control` values concatenated:

```
cache-control: no-store, public, max-age=31536000, immutable
```

Per RFC 9111, when directives conflict the most restrictive wins — so
`no-store` prevailed, killing the immutable cache for every image, font,
and JS chunk. v0.1.35 was deployed with this bug for one CI cycle before
v0.1.36 corrected it.

**Lesson:** never use a `/*` catch-all in `_headers` alongside specific
path rules when they share a header. The Worker is the correct place for
per-content-type header overrides.

## Verification (v0.1.36)

`task build` — exits 0.

```sh
curl -sI https://indri.studio/ | grep -i 'cache-control\|cf-cache-status'
cache-control: no-store
cf-cache-status: HIT

curl -sI https://indri.studio/apps/parking-space/ | grep -i cache-control
cache-control: no-store

curl -sI 'https://indri.studio/_astro/gallery.R36HMGw__2vgLmQ.avif' | grep -i cache-control
cache-control: public, max-age=31536000, immutable

curl -sI https://indri.studio/favicon.ico | grep -i cache-control
cache-control: public, max-age=86400, stale-while-revalidate=604800
```

PASS — HTML: `no-store`; hashed assets: `immutable`; stable assets:
`max-age=86400`.
