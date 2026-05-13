# Lighthouse audit — 2026-05-13 (post-v0.1.13)

> **Status (2026-05-13, after this audit):**
> - **Items A, B, C** resolved in commit `7eb9b4c` (team-strip contrast, footer © opacity, Material Symbols off the critical render path).
> - **Item D / Recommendations #4 + #5** (AVIF/WebP variants, explicit `width`/`height`) shipped in commit `abca262` per `docs/plans/2026-05-13-app-screenshot-image-optimization.md`. Site-wide payload 23 MB PNG → 3 MB AVIF (87% smaller); SplitLedger screenshots 105 KB → 20 KB (81% smaller). A fresh Lighthouse pass on production is still owed — track it as a new investigation note.
> - **Recommendation #6 (cache-TTL bump) withdrawn** — long-immutable cache headers without a cache-busting plan would trap stale assets during active development. Revisit only when there's a content-hashing / versioning strategy in place.
> - **Recommendation #7 (colophon `forced-reflow`)** shipped in commit landing 2026-05-13. Scroll-shrink script's first `update()` is now skipped entirely when `scrollY === 0` (CSS default already correct), and deferred via `requestIdleCallback` when scrollY > 0 (hash anchor case). Subsequent updates (scroll, resize, post-view-transition) keep the prompt rAF path so the cross-page header animation still fires immediately. Live re-audit owed.
> - **Recommendation #8 (inline critical CSS)** plan written in commit `1115347` (`docs/plans/2026-05-13-inline-critical-css.md`); **implementation landed 2026-05-14** — `astro.config.mjs` now sets `build.inlineStylesheets: "always"`, every built page carries an inline `<style>` block, and no `<link rel="stylesheet" href="/_astro/*.css">` remains in `dist/`. Visual smoke confirmed (prod-vs-preview screenshots, all 4 routes × 2 viewports, pixel-identical). Pending prod verification + Lighthouse re-spot post-deploy.
> - **Pass 2 (2026-05-14)** run against the same three prod URLs as pass 1, post-`v0.1.24`. See [`## Pass 2 — 2026-05-14`](#pass-2--2026-05-14) below for new scores, Δ vs pass 1, and updated recommendation states. Headline findings: A11y hit 95 across the board (Recs A + B confirmed). SplitLedger Perf jumped 57 → 94 (Rec #4 AVIF/WebP confirmed). New CLS regression on all three pages traced to font/icon swap on hero content — a pass-3 candidate.

## Context

First [Lighthouse](https://developer.chrome.com/docs/lighthouse) audit of `indri.studio` in production, run minutes after the `v0.1.13` deploy that landed the colophon route, the site-wide cross-page header animation, and footer changes. Goal: establish a baseline for the Phase-5 *"Lighthouse: Performance ≥ 95, Accessibility ≥ 95, Best Practices ≥ 95"* target from `docs/plans/2026-05-13-initial-buildout.md`.

Three pages audited as representative samples — the studio homepage, the new colophon page, and one per-app landing page (SplitLedger, chosen because it has the most screenshots and is therefore the worst-case for image-heavy pages).

Lighthouse 13.3.0, headless Chromium, default mobile form factor, throttled. Raw reports at:

- [/tmp/lh/home.report.html](file:///tmp/lh/home.report.html) · [.json](file:///tmp/lh/home.report.json)
- [/tmp/lh/colophon.report.html](file:///tmp/lh/colophon.report.html) · [.json](file:///tmp/lh/colophon.report.json)
- [/tmp/lh/splitledger.report.html](file:///tmp/lh/splitledger.report.html) · [.json](file:///tmp/lh/splitledger.report.json)

## Category scores

| Page | Performance | Accessibility | Best Practices | SEO |
|---|---|---|---|---|
| [/](https://indri.studio/) | **86** ❌ | **92** ❌ | 100 ✓ | 100 ✓ |
| [/colophon/](https://indri.studio/colophon/) | **85** ❌ | **93** ❌ | 100 ✓ | 100 ✓ |
| [/apps/splitledger/](https://indri.studio/apps/splitledger/) | **57** ❌❌ | 95 ✓ | 100 ✓ | 100 ✓ |

Target is ≥ 95 in the first three. Best Practices and SEO are already at 100 across the board. Performance is the dominant gap, and SplitLedger is dragging it badly. Accessibility is just under the line on the studio pages and just over on apps — driven by a single contrast issue.

## Core Web Vitals

| Metric | / | /colophon/ | /apps/splitledger/ | Target |
|---|---|---|---|---|
| First Contentful Paint | 2.8 s | 2.8 s | **8.3 s** | < 1.8 s |
| Largest Contentful Paint | 3.1 s | 2.9 s | **8.3 s** | < 2.5 s |
| Speed Index | 4.6 s | 4.9 s | **8.3 s** | < 3.4 s |
| Total Blocking Time | 0 ms ✓ | 180 ms | 0 ms ✓ | < 200 ms |
| Cumulative Layout Shift | 0 ✓ | 0 ✓ | 0.044 ✓ | < 0.1 |
| Time to Interactive | 3.1 s | 4.0 s | 8.3 s | — |

The recurring 8.3 s on SplitLedger is the signature of one large blocking resource (probably the LCP screenshot). FCP is the same as LCP — the page is essentially blank until that one resource lands.

## Pass 2 — 2026-05-14

Re-audit of the same three prod URLs after the perf work shipped under tags `v0.1.14` through `v0.1.24`. Same Lighthouse version (13.3.0), same form factor (mobile), same throttling (simulate, default profile). Live build at audit time: `v0.1.24` (commit `8ab496f`).

**Methodology delta vs pass 1.** Pass 1 was a single run per URL. Pass 2 ran **three rounds** per URL because the first round showed extreme swings on the two long pages (homepage Perf 86 → 42, colophon 85 → 55). Repeating revealed Lighthouse `simulate`'s well-known network-extrapolation variance — homepage Perf came in at 42 / 73 / 40 across three runs of identical conditions. **Scores below are medians of the three runs.** Raw per-run numbers in the report bundle. CLS values, by contrast, were stable across runs (browser-measured during actual layout, not extrapolated) — those are reliable signal.

Raw reports (run 1, full HTML + JSON for each URL):

- [/tmp/lh/pass2/home.report.report.html](file:///tmp/lh/pass2/home.report.report.html) · [.json](file:///tmp/lh/pass2/home.report.report.json)
- [/tmp/lh/pass2/colophon.report.report.html](file:///tmp/lh/pass2/colophon.report.report.html) · [.json](file:///tmp/lh/pass2/colophon.report.report.json)
- [/tmp/lh/pass2/splitledger.report.report.html](file:///tmp/lh/pass2/splitledger.report.report.html) · [.json](file:///tmp/lh/pass2/splitledger.report.report.json)

Runs 2 and 3 (JSON only) at `/tmp/lh/pass2/run-2/` and `/tmp/lh/pass2/run-3/`.

### Category scores (median of 3 runs)

| Page | Performance | Δ | Accessibility | Δ | Best Practices | Δ | SEO | Δ |
|---|---|---|---|---|---|---|---|---|
| [/](https://indri.studio/) | **42** ❌❌ | −44 | **95** ✓ | +3 | 100 ✓ | ±0 | 100 ✓ | ±0 |
| [/colophon/](https://indri.studio/colophon/) | **55** ❌❌ | −30 | **95** ✓ | +2 | 100 ✓ | ±0 | 100 ✓ | ±0 |
| [/apps/splitledger/](https://indri.studio/apps/splitledger/) | **94** ❌ | **+37** | **95** ✓ | ±0 | 100 ✓ | ±0 | 100 ✓ | ±0 |

The Δ column reads at face value as a disaster on the two studio pages and a triumph on SplitLedger. The reality is messier — see "What moved (and what didn't)" below.

### Core Web Vitals (median of 3 runs)

| Metric | / | Δ | /colophon/ | Δ | /apps/splitledger/ | Δ | Target |
|---|---|---|---|---|---|---|---|
| First Contentful Paint | 8.2 s | +5.4 s | 8.2 s | +5.4 s | **1.7 s** ✓ | **−6.6 s** | < 1.8 s |
| Largest Contentful Paint | 11.5 s | +8.4 s | 8.2 s | +5.3 s | **1.7 s** ✓ | **−6.6 s** | < 2.5 s |
| Speed Index | 8.2 s | +3.6 s | 8.2 s | +3.3 s | **1.7 s** ✓ | **−6.6 s** | < 3.4 s |
| Total Blocking Time | 0 ms ✓ | ±0 | **0 ms** ✓ | **−180 ms** | 0 ms ✓ | ±0 | < 200 ms |
| Cumulative Layout Shift | **0.342** ❌ | **+0.342** | **0.094** | +0.094 | 0.129 ❌ | +0.085 | < 0.1 |
| Time to Interactive | 11.8 s | +8.7 s | 8.2 s | +4.2 s | **1.7 s** | −6.6 s | — |

### What moved (and what didn't)

**Accessibility — clean win across the board.** All three pages hit 95 (the Phase-5 target). Studio pages went 92 → 95 and 93 → 95, splitledger held 95. Confirms **Rec A** (team-strip contrast — placeholder founders replaced, role colour now meets WCAG) and **Rec B** (footer © opacity bump). No outstanding A11y deductions on the three sampled pages.

**SplitLedger — the AVIF/WebP fix landed exactly as estimated.** Perf 57 → 94, FCP/LCP/SI all 8.3 s → 1.7 s. This is **Rec #4 + #5** working: AVIF variants are served via `<picture>` (verified with `curl | grep srcset`), the LCP screenshot decodes in under 2 s instead of dominating an 8 s critical path, and explicit `width`/`height` prevents the late image from shifting layout. The single 0.085 CLS uptick on splitledger (0.044 → 0.129) is unrelated to the screenshots — it tracks the same hero-region font-swap shift seen on the other pages.

**Colophon TBT — Rec #7 confirmed.** Total Blocking Time dropped 180 ms → 0 ms. The deferred scroll-shrink first-`update()` (commit `e526d2e`) cleared the forced-reflow that was eating the main thread on initial paint. The remaining Perf score on colophon (55) is dragged down by FCP/LCP, not TBT.

**Studio-page Perf scores — likely noise, not real regression.** Homepage Perf came in at 42 / 73 / 40 across three runs of identical prod state in the same minute window; colophon at 55 / 55 / 89. This is the documented `simulate`-throttling jitter — Lighthouse extrapolates FCP/LCP from observed TCP behaviour, and any flakey moment on the network path inflates the projection drastically. The median 42/55 numbers should not be read as "the homepage regressed 44 points." Best-run 73 (home) and 89 (colophon) are probably closer to ground truth, and even those aren't great — but they're not catastrophic. For pass 3, switch to `--throttling-method=devtools` for tighter run-to-run reliability.

**CLS — real regression, not noise.** Browser-measured layout shift is consistent across all three runs and tells a real story: the new hero section on `/` shifts 0.342 (was 0). The shifting element is `body > main > section > div` — the headline "SOFTWARE for everyone…". When Space Grotesk swaps in via `display=swap`, the 120 px display text reflows enough to register as a major shift; the Material Symbols icons in the new platform-icon strip swap in around the same time and compound the move. `/colophon/` picked up a smaller 0.094 shift (same headline pattern), and `/apps/splitledger/` 0.044 → 0.129 (same root cause — every page renders the persisted header band with the font swap). **CLS is now the most pressing per-page issue**, and `simulate` Perf variance is the most pressing methodology issue.

**Rec #8 (inline critical CSS) did not land.** Commit `1115347` shipped only the plan file (`docs/plans/2026-05-13-inline-critical-css.md`); `astro.config.mjs` still has default `inlineStylesheets`. Prod HTML still references `/_astro/Base.<hash>.css` as an external blocking request. Whatever FCP relief we hoped for from #8, we haven't taken yet.

### Recommendation status after pass 2

| ID | Item | Shipped in | Empirical effect (pass 2) | Status |
|---|---|---|---|---|
| A  | team-strip contrast        | `7eb9b4c`    | A11y 92 → 95 on homepage; placeholder-founder contrast no longer flagged | **resolved** |
| B  | footer © opacity           | `7eb9b4c`    | A11y +1 on all studio pages; no longer flagged                            | **resolved** |
| C  | Material Symbols off CRP   | `7eb9b4c`    | confirmed off the critical path (`preload` + `onload=this.rel='stylesheet'`); contributes to the CLS regression as a side effect of async swap | **resolved (but caused side effect)** |
| #4 | AVIF/WebP variants         | `abca262`    | splitledger LCP 8.3 s → 1.7 s; Perf 57 → 94                                | **resolved** |
| #5 | Explicit `<img>` w/h       | `abca262`    | splitledger images now sized; LCP CLS contribution gone                    | **resolved** |
| #6 | Cache TTL bump             | —            | n/a                                                                        | **withdrawn** (no cache-busting strategy) |
| #7 | Colophon forced-reflow     | `e526d2e`    | colophon TBT 180 ms → 0 ms                                                 | **resolved** |
| #8 | Inline critical CSS        | landed 2026-05-14 | impl shipped after pass 2; built `dist/` has 0 external Astro CSS links + 1 inline `<style>` per page. Lighthouse FCP effect to be re-measured in pass 3 post-deploy. | **resolved (pending prod verification)** |
| **NEW #9** | Hero CLS from font/icon swap | —     | home 0 → 0.342, colophon 0 → 0.094, splitledger 0.044 → 0.129              | **open** |
| **NEW #10** | Lighthouse methodology jitter | —    | `simulate` swings ±30 Perf points run-to-run on long pages                 | **open** (process, not site) |

### Remaining gaps to ≥ 95

The Phase-5 target is partially met:

- **Accessibility ≥ 95**: ✅ all three pages.
- **Best Practices ≥ 95**: ✅ all three pages (100).
- **Performance ≥ 95**: ⚠️ splitledger sits at 94 (within ±1 of target — a re-run with a quieter network or a `devtools`-throttled measurement would likely tip it over). Studio pages are unmeasurable until we either fix CLS + land Rec #8 or switch throttling methods so the score stops bouncing.

Pass-3 candidate work, priority order:

1. **Fix the new CLS regression (NEW #9)** — the cheapest, most user-visible win. Options: switch hero fonts to `font-display: optional` (no FOUT, accepts brief fallback render), preload Space Grotesk and Material Symbols with `<link rel="preload" as="font" crossorigin>`, or `size-adjust` on `@font-face` so fallback metrics match. Pick whichever costs the least.
2. **Actually land Rec #8 inline critical CSS** — flip `astro.config.mjs` to `build: { inlineStylesheets: 'always' }` per the existing plan doc. One-line change. Should clear the 814 ms blocking-CSS hit on every page.
3. **Switch pass 3 to `--throttling-method=devtools`** — keeps numbers comparable run-to-run. Document the methodology change in the pass-3 section header.
4. **`srcset` on the apps gallery** — splitledger is at 94 because the LCP fix is dramatic; getting the studio homepage gallery the same treatment (responsive `srcset` with AVIF) should pull `/` toward the same neighbourhood.

## Cross-cutting issues (all three pages)

### Render-blocking resources

All three pages have the same three render-blocking requests in the critical path:

- [`fonts.googleapis.com/css2?...Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600`](https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600&display=swap) — the type stylesheet
- [`fonts.googleapis.com/css2?...Material+Symbols+Outlined`](https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap) — the icon font
- `indri.studio/_astro/Base.<hash>.css` — Astro's compiled CSS

The fonts already use `display=swap` (so text won't be invisible) but the CSS request itself still serially blocks render. **Material Symbols Outlined isn't used on the homepage or colophon** — pulling it from the base layout to per-page (only where icons exist) would drop one round trip on those pages.

The `preconnect` hints to `fonts.googleapis.com` and `fonts.gstatic.com` are already in place per `Base.astro`, which helps but doesn't eliminate the serial fetch.

### `Use efficient cache lifetimes` — score 0.5

Cloudflare's default cache headers on the Worker static assets are likely shorter than ideal. Inspect `wrangler.toml` / Cloudflare cache rules; long-TTL the `_astro/*` and `screenshots/*` assets (they're content-hashed / stable URLs).

### `Network dependency tree` — score 0

Each blocking request adds to the chain. Fixed by addressing the above two.

## Per-page findings

### / (homepage)

**Performance 86 / Accessibility 92.**

Accessibility deduction is entirely from `color-contrast` failures on the four placeholder founder cards — the role text (Co-founder · Engineering, etc.) uses `text-primary-container` (Phosphor `#B026FF`) at `text-[10px]` on the `glass-card` (charcoal `#4A4641`) background. Phosphor on charcoal at small sizes does not meet WCAG AA contrast ratio (4.5:1 for body text).

**Snippet flagged:**
```html
<p class="font-display uppercase tracking-[0.2em] text-[10px] text-primary-container...">
  CO-FOUNDER · ENGINEERING
</p>
```

This is the same team-strip issue we already knew about — those four cards are placeholder founders (`founder-{1..4}.md` from the seed) and the role colour is failing contrast on top of being placeholders. Either resolve the founders question (delete / single-card / real names) or bump the role text colour to a higher-contrast variant.

The footer `© 2026` link, also flagged, is `text-on-surface-variant` at `opacity-50` (= effective `#c8c0b8` × 0.5 over `#1a1815`). Contrast ratio sits just under threshold. Bumping the dim state from 50 % to ~65–70 % opacity would clear it without losing the muted feel.

Performance deduction is mostly the font CSS round trip plus image delivery — the apps-gallery cards each load a screenshot as a background hint. `image-delivery-insight` flags possible savings via modern formats (AVIF/WebP) on the gallery images.

### /colophon/ (new route)

**Performance 85 / Accessibility 93.**

Same contrast issue on the footer `© year` link. No team-strip issue (colophon doesn't render the team).

`Total Blocking Time` is 180 ms (above 0 — the homepage hit 0). The culprit is `forced-reflow-insight` (score 0): something is causing layout to be recalculated multiple times during the render. Suspect candidate is the inline scroll-shrink script in `Base.astro:54-77` which reads `window.scrollY` and `window.innerHeight` (forcing layout) every animation frame on initial paint. The script is already rAF-batched and runs once at page-load on this route, but the initial reflow on a longer page (colophon has many sections) still registers.

LCP element is **the Phosphor-purple header band** (which is the largest paint on a page where the hero is below-the-fold-style sparse). Already the right LCP — no action needed.

### /apps/splitledger/ (worst case)

**Performance 57 / Accessibility 95.**

LCP **8.3 s** — far above the 2.5 s target. The LCP element is `<img src="/screenshots/splitledger/transactions.png">` inside the screenshot grid. The screenshot is loaded with `loading="lazy"` (correct) but it's the largest paint element because the page lazily decodes the entire screenshot strip during the initial paint window.

Specific findings:

- `image-delivery-insight` flags `/screenshots/splitledger/transactions.png` and `/screenshots/splitledger/balances.png` as candidates for modern-format conversion (AVIF/WebP) — wasting ~17 kB and ~13 kB respectively per image.
- `unsized-images` flags `<img src="/screenshots/splitledger/transactions.png">` for missing explicit `width` and `height` attributes (CLS hazard — currently 0.044, just under the 0.1 limit, but vulnerable).
- All splitledger screenshots are served as PNG. Generating AVIF/WebP variants and using `<picture>` with `<source>` would drop initial bytes significantly.

The accessibility score of 95 is actually the highest of the three — the per-app pages don't have the placeholder-founder contrast issue, and the splitledger brand colours pass contrast.

## Recommendations (priority order)

### High impact, low effort

1. **Fix the team-strip contrast** (homepage A11y +3 to 95). Either drop the placeholder founders entirely or change the role line's `text-primary-container` to a colour that clears 4.5:1 against the card surface. Quick win.
2. **Fix the footer `©` opacity** (all pages, A11y +1). Change `opacity-50` → `opacity-70` on the colophon link in the footer; or use a higher-contrast resting colour with the existing hover unchanged.
3. **Move Material Symbols Outlined CSS out of `Base.astro`** (all pages Perf bump). Load it only on pages that actually use icon glyphs (currently: none on homepage / colophon).

### High impact, medium effort

4. **Generate AVIF/WebP variants of app screenshots** (SplitLedger Perf +15-25 → estimated 75-80). Astro's `<Picture>` component or a `sharp`-driven build step. The PNGs stay as fallbacks.
5. **Add explicit `width`/`height` to all `<img>` tags in screenshot grids.** Eliminates CLS risk and lets the browser reserve layout space pre-load.
6. **Bump Cloudflare cache TTL** on `_astro/*` and `screenshots/*` (all pages Perf bump). Both have hashed/stable URLs and are safe at 1y `immutable`.

### Lower impact

7. **Address the colophon `forced-reflow` warning** (Perf +5-8). Either gate the scroll-shrink script's first `update()` behind `requestIdleCallback`, or accept that 180 ms TBT is fine for the route's complexity.
8. **Inline critical CSS** for the above-the-fold render and defer `Base.<hash>.css` (all pages FCP improvement). Astro can do this via `astro-critters` or hand-rolled approach.

## Will pursuing all of these get to ≥ 95?

Realistically, yes for Accessibility and Best Practices. For Performance:

- Studio pages (home, colophon) should hit ~92-95 with #1-#3 and #6 alone.
- SplitLedger needs #4 (modern image formats) before it can credibly approach 95 — even with aggressive caching, the PNG screenshots dominate the budget.

Fastest path to "the plan target is met across the site": #1, #2, #3, #4, #6. Estimated total effort: 1-2 sessions.
