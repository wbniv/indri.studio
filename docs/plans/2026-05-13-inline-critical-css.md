# Inline critical CSS (Lighthouse audit #8)

## Context

The first production Lighthouse audit (2026-05-13, `docs/investigations/2026-05-13-lighthouse-audit.md`) identified three render-blocking requests on every page:

1. Google Fonts `Space+Grotesk` + `Inter` CSS — already mitigated via preconnect; can't easily inline (font CSS imports remote `.woff2`).
2. Google Fonts `Material+Symbols+Outlined` — already taken off the critical path in commit `7eb9b4c` (preload + onload-swap pattern).
3. **The compiled Astro `Base.<hash>.css`** — still a `<link rel="stylesheet">` near the end of `<head>`, blocks first paint until the round trip completes.

Recommendation #8 in the audit: "Inline critical CSS for the above-the-fold render and defer `Base.<hash>.css` (all pages FCP improvement). Astro can do this via `astro-critters` or hand-rolled approach."

For the indri.studio profile, *all* of the compiled CSS is critical:

- Tailwind preflight, design tokens (`@theme` block), `@layer components` (`.glass-card`, `.pill-purple`, `.header-fx`, `.section-label`, etc.), and the utility classes actually used on every page (`flex`, `min-h-screen`, `bg-surface`, `text-on-surface`, etc.).
- The body stripe animation, header breathe, ring-flare, `@property` declarations, and Astro view-transition keyframes — all run on initial paint of every route.

There is no meaningful "above the fold" subset to split out. Critters / `beasties` (the maintained fork) gain very little vs. just inlining the whole sheet here. And the compiled sheet is small after compression:

| File | Raw | Gzipped |
|---|---:|---:|
| `_astro/Base.<hash>.css` | 35 KB | **7.3 KB** |
| `_astro/_..<hash>.css` (per-app slug CSS, only on `/apps/*`) | 6 KB | **1.5 KB** |

Inlining 7–8 KB into each HTML response in exchange for eliminating one render-blocking round trip is clearly net-positive for FCP — that's the metric the audit measures.

## Approach

Set Astro's built-in `build.inlineStylesheets: "always"` in `astro.config.mjs`. The mechanism is already part of Astro and well-tested; no plugin install, no custom build step, no maintenance burden.

Astro 6 default is `"auto"`, which only inlines stylesheets below Vite's `assetsInlineLimit` (4 KB by default). Both of our compiled CSS files are over that threshold, so `"auto"` leaves both as external — that's why the current build still has render-blocking `<link>` tags.

With `"always"`, every page's compiled CSS lands as a `<style>` block in `<head>`. No external CSS request. No `<link rel="stylesheet">` for the Astro-compiled output. The Google Fonts `<link>` tags stay where they are — this change is scoped to the local compiled output only.

### Trade-off considered

- **Bytes per HTML page grow** by ~7 KB gzipped (Base.css) plus ~1.5 KB on `/apps/*` (slug CSS). Across 11 pages, that's ~85 KB of extra HTML payload on the server, but each page is only served once per visit, and the CDN already caches HTML.
- **Cross-page caching of external CSS is lost.** With ClientRouter / view transitions, subsequent navigations within a session fetch fresh HTML containing the inlined CSS. For a typical 1–3 page session this is a wash; for power users navigating the full app catalogue it's a small repeat cost (~7 KB × N navigations).
- **First-load FCP wins.** Lighthouse measures first-load. Eliminating the render-blocking round trip is the explicit goal.

### Out of scope

- **No `Critters`/`beasties` install.** They split critical from non-critical per page; the indri.studio CSS has no meaningful split worth their complexity.
- **No changes to Google Fonts loading.** Those are already optimized (preconnect + display=swap on the main fonts; preload+onload-swap on Material Symbols).
- **No changes to the per-app slug CSS scoping** — Astro already scopes that to `/apps/*` pages, and `"always"` continues to apply it only where needed.

## Files

| File | Change |
|---|---|
| `astro.config.mjs` | Add `build: { inlineStylesheets: "always" }` to the `defineConfig` call. |

That's the only code change. Everything else is verification.

## Verification

1. **Config takes effect.** `task build` succeeds. After the build, every `dist/**/*.html` should contain inline `<style>` for the previously-external CSS, and no `<link rel="stylesheet" href="/_astro/*.css">` should remain.

   ```
   # Before: every page has a link to the compiled sheet.
   $ grep -c 'href="/_astro/.*\.css"' dist/index.html dist/colophon/index.html dist/apps/splitledger/index.html dist/404.html
   # expect 1+ per page now → expect 0 per page after the change

   # After: no external Astro CSS links remain.
   $ grep -rcE 'href="/_astro/[^"]+\.css"' dist/ | grep -v ':0' || echo "all pages: no external Astro CSS"

   # And every page should now carry an inline <style> block.
   $ grep -c '<style>' dist/index.html dist/colophon/index.html dist/apps/splitledger/index.html dist/404.html
   # expect 1+ per page
   ```

2. **Visual smoke.** `task dev` and visit `/`, `/colophon/`, `/apps/splitledger/`, and a bogus URL (`/this-does-not-exist`) at desktop and mobile widths. Confirm:
   - Header, footer, ring-flare, body stripe, page typography all render identically to pre-change.
   - View transitions between routes still animate (header height transition, app prev/next slide).
   - Reduced-motion (DevTools Rendering pane) still gates the body stripe and header breathe.

3. **No external Astro CSS in flight.** DevTools Network tab during a `/colophon/` load — filter by `.css`. The only CSS requests should be to `fonts.googleapis.com`; nothing from the site origin.

4. **Production smoke (post-deploy).** After the next tagged release lands on Cloudflare:
   ```
   $ curl -s https://indri.studio/colophon/ | grep -c 'href="/_astro/.*\.css"'
   0
   $ curl -s https://indri.studio/colophon/ | grep -c '<style>'
   # ≥1
   ```

5. **Live Lighthouse re-audit.** Re-run Lighthouse on `/`, `/colophon/`, `/apps/splitledger/`. Record the FCP and Performance-score deltas in a new investigation note. Pending #8's effect plus the deltas from previously-shipped #4/#5/#7. This is the same re-audit owed for those earlier items; one pass covers all.

## Followups (not part of this plan)

- Fresh Lighthouse re-audit covering #4, #5, #7, and #8 in one pass (separate investigation note when run).
- If the per-page HTML bloat ever becomes a concern (it won't at the current site size), revisit with `beasties` or a hand-rolled per-page critical-CSS extraction — but only if there's measured evidence it matters.
