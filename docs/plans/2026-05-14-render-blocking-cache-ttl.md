# Render-blocking resources + cache TTL cleanup

## Context

Lighthouse (canonical `task lighthouse` / `devtools` configuration) still flags two diagnostics across all three audited URLs (`/`, `/colophon/`, `/apps/splitledger/`):

1. **Render-blocking resources** — three CSS requests listed in the critical path:
   - `fonts.googleapis.com/css2?...Space+Grotesk...Inter...` — the type stylesheet
   - `fonts.googleapis.com/css2?...Material+Symbols+Outlined` — the icon font
   - `indri.studio/_astro/Base.<hash>.css` — Astro's compiled CSS

2. **Use efficient cache lifetimes** — score 0.5. `_astro/*` (content-hashed) and `screenshots/*` (stable image URLs) currently inherit the Cloudflare Workers + Static Assets default cache headers, which are short. They should be year-long-immutable.

Two of the three render-blocking items are **already handled in the repo but the audit predates redeploy** — they'll fall off after the next `task deploy`:
- Astro CSS: `inlineStylesheets: "always"` shipped in commit 2db6163 (`astro.config.mjs:14`).
- Material Symbols Outlined: preload + onload-swap pattern in `Base.astro:53–64`.

So the genuinely outstanding work is:
- Eliminate the Space Grotesk + Inter render-blocking CSS link.
- Pull Material Symbols out of the base layout so the colophon stops requesting an icon font it has no use for. (Homepage *does* use it — `PlatformIcon` renders Material Symbols glyphs in the hero — so the icon font stays loaded there.)
- Set long-TTL cache headers on `_astro/*` and `screenshots/*` via Cloudflare Cache Rules in Terraform.

Lighthouse scores under `devtools` are already 100/100/99 — this is opportunity cleanup, not a regression. Treated as Pass 4 after pass-3 (which was methodology only).

## Approach

### 1. Preload + onload-swap the Space Grotesk + Inter stylesheet

Mirror the Material Symbols pattern. The type stylesheet stops blocking paint; fonts stay on Google's CDN; `display=optional` already prevents invisible-text. `<noscript>` fallback covers JS-disabled.

Drop-in replacement for `Base.astro:45–48`:

```astro
<link
  rel="preload"
  as="style"
  href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600&display=optional"
  onload="this.onload=null; this.rel='stylesheet'"
/>
<noscript>
  <link
    rel="stylesheet"
    href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600&display=optional"
  />
</noscript>
```

The existing metric-matched `@font-face` fallbacks in `src/styles/global.css:10–25` already absorb the swap with zero CLS — no other change needed.

### 2. Lift Material Symbols out of Base.astro; load per-page where actually used

Material Symbols use sites (grep-confirmed, four files):
- `src/components/PlatformIcon.astro` — **homepage hero** platform glyphs.
- `src/pages/404.astro` — home + apps icons.
- `src/pages/apps/[...slug].astro` — chevrons, apps link, hourglass.
- `src/layouts/Base.astro:201` — **footer email icon** (every page).

The footer email icon is the only Material Symbols use that drags the font onto *every* page including the colophon. Replace it with a unicode envelope glyph `✉` (works in any system font, no font request, matches the small-caps display style of the rest of the footer):

```astro
<a href="mailto:hello@indri.studio" …>
  <span aria-hidden="true" style="font-size: 14px;">✉</span>
</a>
```

Then move the Material Symbols `<link rel="preload">` + `<noscript>` block from `Base.astro:53–64` into a named `<slot name="head">` injection on pages that actually use icons. The cleanest home is a small `<MaterialSymbols />` component pages drop into Base's head slot:

```astro
---
// src/components/MaterialSymbols.astro
---
<link
  rel="preload"
  as="style"
  href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=block"
  onload="this.onload=null; this.rel='stylesheet'"
/>
<noscript>
  <link
    rel="stylesheet"
    href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=block"
  />
</noscript>
```

Used on `/` and `/404` via:

```astro
<Base title="…">
  <MaterialSymbols slot="head" />
  …
</Base>
```

Per-app pages route through `AppLayout`, which already manages Base's `head` slot via a `<Fragment slot="head">` block (`AppLayout.astro:43–53`) — so the cleanest place to inject `<MaterialSymbols />` for *all* per-app pages is inside AppLayout's head Fragment, not per-page in `[...slug].astro`.

Result:
- Colophon: zero icon-font request.
- Homepage / 404 / per-app pages: same non-blocking icon load as today, just declared at the page level.

### 3. Long-TTL cache headers via Cloudflare Cache Rules in Terraform

Create `infrastructure/cloudflare/global/cache.tf`. Two rules in a single `http_request_cache_settings` zone-phase ruleset:

| Path pattern | Edge TTL | Browser TTL | Reason |
|---|---|---|---|
| `^/_astro/` | `31536000` (1y) | `31536000` (1y) | Astro content-hashes filenames; safe to mark immutable |
| `^/screenshots/` | `31536000` (1y) | `31536000` (1y) | App screenshots are stable URLs |

HTML responses untouched — they keep the default short TTL so deploys flush promptly.

## Files to change

| File | Change |
|---|---|
| `src/layouts/Base.astro` | Swap type-stylesheet link for preload+onload pattern. Remove Material Symbols preload block. Replace footer `<span class="material-symbols-outlined">mail</span>` with `<span>✉</span>`. |
| `src/components/MaterialSymbols.astro` | **New.** Encapsulates the Material Symbols preload + noscript pair. |
| `src/pages/index.astro` | Add `<MaterialSymbols slot="head" />` inside `<Base>`. |
| `src/pages/404.astro` | Add `<MaterialSymbols slot="head" />`. |
| `src/layouts/AppLayout.astro` | Add `<MaterialSymbols />` inside the existing `<Fragment slot="head">`. |
| `infrastructure/cloudflare/global/cache.tf` | **New.** Single `cloudflare_ruleset` for `_astro/*` + `screenshots/*` 1y immutable. |
| `TODO.md` | Add entry pointing at this plan; mark `[verify]` once Lighthouse re-run confirms. |
| `docs/investigations/2026-05-13-lighthouse-audit.md` | Append `## Pass 4` section after verification; update Rec #6 and the render-blocking row to **resolved**. (Deferred — done after the post-deploy Lighthouse run.) |

## Existing utilities to reuse

- **Metric-matched font fallbacks** — `src/styles/global.css:10–25`. Already cover the optional-swap window for both type fonts.
- **Astro `<slot name="head">`** — declared in `src/layouts/Base.astro:65`. AppLayout already uses it via `<Fragment slot="head">` at lines 43–53.
- **`task lighthouse`** — codified `devtools`-throttled 3-run-median Lighthouse recipe from pass 3.
- **`task deploy` / `task tf-plan` / `task tf-apply`** — existing Wrangler + Terraform workflow.

## Verification

Per SRC `CLAUDE.md` plan-verification format — keep numbered steps verbatim; below each, paste raw output in a fenced block and add PASS/FAIL.

1. **Local build produces HTML with the preload-swap pattern for type fonts and no bare `<link rel="stylesheet">` for Google Fonts CSS.**
   ```bash
   task build
   grep -E 'fonts\.googleapis\.com' dist/index.html
   ```
   Expect: only `rel="preload"` + `<noscript>` references; no bare `rel="stylesheet"` outside `<noscript>`.

2. **Colophon HTML contains no Material Symbols request.**
   ```bash
   grep -E 'Material\+Symbols' dist/colophon/index.html || echo "NONE"
   ```
   Expect: `NONE`.

3. **Homepage, 404, and per-app pages still contain the Material Symbols preload block.**
   ```bash
   for f in dist/index.html dist/404.html dist/apps/splitledger/index.html; do
     printf "%s: " "$f"
     grep -c 'Material+Symbols' "$f"
   done
   ```
   Expect: each line ends in a count ≥ 1.

4. **Footer email link renders ✉ glyph, not the word "mail".**
   ```bash
   grep -oE '<span[^>]*aria-hidden="true"[^>]*>(✉|mail)</span>' dist/index.html
   ```
   Expect: `✉`, not `mail`.

5. **Terraform plan for cache rules is clean and additive.**
   ```bash
   task tf-plan
   ```
   Expect: `1 to add, 0 to change, 0 to destroy`. The single addition is `cloudflare_ruleset.cache_immutable`.

6. **After `task tf-apply` + `task deploy`, edge serves long-TTL Cache-Control for `_astro/*` and `screenshots/*`.**
   ```bash
   ASTRO_URL=$(curl -s https://indri.studio/ | grep -oE '/_astro/[^"]+\.(css|js)' | head -1)
   curl -sI "https://indri.studio${ASTRO_URL}" | grep -iE '^(cache-control|cf-cache-status):'
   curl -sI "https://indri.studio/screenshots/splitledger-hero.webp" | grep -iE '^(cache-control|cf-cache-status):'
   ```
   Expect: `cache-control: public, max-age=31536000` (or includes `immutable`); `cf-cache-status: HIT` on warm requests.

7. **HTML cache headers unaffected (short TTL preserved for deploy flush).**
   ```bash
   curl -sI https://indri.studio/ | grep -iE '^cache-control:'
   ```
   Expect: short max-age or `no-cache` — definitely *not* `max-age=31536000`.

8. **`task lighthouse` re-baseline: render-blocking + cache-TTL findings drop off, Perf scores hold ≥ 99.**
   ```bash
   task lighthouse
   jq -r '.audits["render-blocking-resources"].score, .audits["uses-long-cache-ttl"].score' \
     /tmp/lh/latest/home.run-2.report.json
   ```
   Expect: median Perf ≥ 99 on all three URLs; both audit scores print `1` (or `null` if no longer applicable).

9. **Markdown preview of the audit-doc Pass 4 section renders cleanly.**
   ```bash
   task md -- docs/investigations/2026-05-13-lighthouse-audit.md
   ```
   Expect: browser opens; Pass 4 section renders with aligned tables; in-page anchors work.

## Verification — results (2026-05-14)

1. **Local build produces HTML with the preload-swap pattern for type fonts and no bare `<link rel="stylesheet">` for Google Fonts CSS.**
   ```
   <link rel="preconnect" href="https://fonts.googleapis.com">
   <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
   <link rel="preload" as="style"
     href=".../css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600&display=optional"
     onload="this.onload=null; this.rel='stylesheet'">
   <noscript><link rel="stylesheet" href=".../css2?family=Space+Grotesk..."></noscript>
   <link rel="preload" as="style"
     href=".../css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=block"
     onload="this.onload=null; this.rel='stylesheet'">
   <noscript><link rel="stylesheet" href=".../css2?family=Material+Symbols+Outlined..."></noscript>
   ```
   **PASS** — both Google Fonts CSS hrefs sit on `rel="preload"` + `<noscript>` only; no bare blocking link outside `<noscript>`.

2. **Colophon HTML contains no Material Symbols request.**
   ```
   NONE
   ```
   **PASS** — `grep -E 'Material\+Symbols' dist/colophon/index.html` exits 1; the explicit `NONE` branch fires.

3. **Homepage, 404, and per-app pages still contain the Material Symbols preload block.**
   ```
   dist/index.html: 1
   dist/404.html: 1
   dist/apps/splitledger/index.html: 1
   ```
   **PASS** — each icon-using page carries exactly one `Material+Symbols` reference (the preload link; `<noscript>` is inlined on the same line in the minified HTML, hence count 1 per page).

4. **Footer email link renders ✉ glyph, not the word "mail".**
   ```
   <span aria-hidden="true" style="font-size: 14px;">✉</span>
   ```
   **PASS** — only `✉` matches; no `mail` text leaks through.

5. **Terraform plan for cache rules is clean and additive.**
   ```
   # cloudflare_ruleset.cache_immutable will be created
     + resource "cloudflare_ruleset" "cache_immutable" {
         + name        = "indri-studio cache immutable hashed assets"
         + kind        = "zone"
         + phase       = "http_request_cache_settings"
         + rules       = [
             + { action = "set_cache_settings", expression = "(starts_with(http.request.uri.path, \"/_astro/\"))",
                 action_parameters = { cache = true, edge_ttl = { mode = "override_origin", default = 31536000 },
                                       browser_ttl = { mode = "override_origin", default = 31536000 } } },
             + { action = "set_cache_settings", expression = "(starts_with(http.request.uri.path, \"/screenshots/\"))",
                 action_parameters = { cache = true, edge_ttl = { mode = "override_origin", default = 31536000 },
                                       browser_ttl = { mode = "override_origin", default = 31536000 } } },
           ]
         + zone_id     = "7e4eca114304080627a70387382dede7"
       }
   Plan: 1 to add, 0 to change, 0 to destroy.
   ```
   **PASS** — exactly one additive resource, both rules well-formed, no destructive changes. The Free-plan ruleset permission concern from `TODO.md` (which applies to dynamic-redirect phase) did not trip the `http_request_cache_settings` phase plan.

6. **After `task tf-apply` + `task deploy`, edge serves long-TTL Cache-Control for `_astro/*` and `screenshots/*`.**
   Pending — run after tf-apply + deploy.

7. **HTML cache headers unaffected (short TTL preserved for deploy flush).**
   Pending — run after tf-apply + deploy.

8. **`task lighthouse` re-baseline: render-blocking + cache-TTL findings drop off, Perf scores hold ≥ 99.**
   Pending — run after tf-apply + deploy.

9. **Markdown preview of the audit-doc Pass 4 section renders cleanly.**
   Pending — section gets appended after Lighthouse re-baseline.

## Out of scope

- Self-hosting WOFF2 files for Space Grotesk / Inter. Preload-swap is sufficient and preserves Google's edge cache benefits.
- HTML-level Cache-Control headers (the diagnostic isn't flagging them).
- CI-integrated Lighthouse (still a later decision per pass-3 out-of-scope).
- Removing the footer email link entirely. The unicode envelope `✉` keeps the visual cue without a font request.
