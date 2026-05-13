# Lighthouse audit — 2026-05-13 (post-v0.1.13)

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
