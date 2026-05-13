# Fix hero CLS from font/icon swap (NEW #9)

**Date:** 2026-05-14
**Status:** Drafted, awaiting approval

## Context

The 2026-05-14 Lighthouse pass-2 against prod (`v0.1.24`) surfaced a fresh CLS regression on three pages:

| Page | Pass 1 | Pass 2 | Δ |
|------|--------|--------|---|
| `/` (home) | 0 | **0.342** | +0.342 |
| `/colophon` | 0 | **0.094** | +0.094 |
| `/apps/splitledger` | 0.044 | **0.129** | +0.085 |

Audit notes (`docs/investigations/2026-05-13-lighthouse-audit.md`) identified the shifting element as the hero `body > main > section > div` containing the headline "SOFTWARE for everyone…". Root cause:

1. **Space Grotesk swaps in via `display=swap`.** At 120 px the headline reflows enough on swap to register as a major shift on `/`. Smaller-amplitude version of the same shift hits every page that renders the headline-style text (colophon + persisted header band → splitledger).
2. **Material Symbols icons in the new `.platform-strip` compound the move.** Five icons render their ligature *names* ("phone_iphone", "tablet_mac", …) as literal text before the font loads, then collapse to ~40 px glyphs when it arrives — a horizontal layout pop in the middle of the hero.

The platform-icon strip landed in commit `a63b989` and the regression appears immediately after, so the strip is the proximate trigger; the underlying font-swap behavior was always there but only became measurable when the strip introduced more shiftable content.

## Approach

Three-part fix, all stylesheet + markup. No new dependencies, no self-hosting.

### A. Metric-matched fallback for Space Grotesk

Add an `@font-face` rule that defines a "Space Grotesk Fallback" pointing at `local('Arial')` (or Helvetica on macOS) with `size-adjust` / `ascent-override` / `descent-override` / `line-gap-override` tuned so the fallback occupies the same line box as Space Grotesk. Put the fallback in the font-family stack between Space Grotesk and `sans-serif`:

```css
@font-face {
  font-family: "Space Grotesk Fallback";
  src: local("Arial"), local("Helvetica");
  size-adjust: 95.5%;
  ascent-override: 96%;
  descent-override: 27%;
  line-gap-override: 0%;
}
:root { --font-display: "Space Grotesk", "Space Grotesk Fallback", sans-serif; }
```

(Final numeric values to be confirmed at implementation time using fontaine.dev or capsizecss.com against Space Grotesk's actual metrics — the values above are approximate.)

With this in place, fallback metrics match the loaded font's metrics, so the swap — if any — moves zero pixels.

### B. Change `font-display` strategy in the Google Fonts URLs

- **Space Grotesk + Inter URL** (`Base.astro` ~line 48): `display=swap` → `display=optional`. With (A) in place, the brief fallback render is metrically identical to Space Grotesk; if the font misses the ~100 ms optional window, fallback stays for that pageload (no CLS), and the brand font appears on the next visit from cache.
- **Material Symbols URL** (`Base.astro` ~line 56): `display=swap` → `display=block`. For icon fonts, "invisible until ready" is the right trade — showing literal ligature names ("phone_iphone") is worse than briefly blank icons.

### C. Reserve icon dimensions explicitly

Currently `.material-symbols-outlined` has `font-size: 40px/48px !important` (vertical reservation), but no `width` lock. Before the font loads, the ligature text has near-zero width, then jumps to ~40-48 px when the glyph paints — a horizontal pop in the strip.

Set explicit `width` and `height` on `.platform-strip li > span.material-symbols-outlined` (or the `li` itself) at the same 40 px / 48 px dimensions used for `font-size`. Combined with `display=block` on the font (text invisible until ready), the box is reserved at full dimensions from first paint.

## Files

| File | Change |
|------|--------|
| `src/styles/global.css` | Add `@font-face` metric-matched fallback. Update `--font-display` stack to include fallback. Reserve `.platform-strip li` (or its icon span) `width` and `height` explicitly at 40 px / 48 px. |
| `src/layouts/Base.astro` | Change Google Fonts URL display params: Space Grotesk + Inter `display=swap` → `display=optional`; Material Symbols `display=swap` → `display=block`. |

No JS, no new components, no markup changes to hero or platform-icon strip.

## Existing context this builds on

- The Material Symbols `font-size: 40px/48px !important` rule lives in `global.css` lines 415-443. The new `width`/`height` rules go alongside it.
- The Google Fonts loading pattern in `Base.astro` (preconnect + stylesheet for Space Grotesk/Inter; preload-style + onload-swap for Material Symbols) stays — only the `display=` query string changes.
- `--font-display` and `--font-body` CSS custom properties already gate font-family resolution site-wide; the fallback only needs to be added in one place.
- Rec #8 (inline critical CSS via `inlineStylesheets: "always"` in `astro.config.mjs`) has just landed alongside this work; the inlined CSS makes the metric-matched fallback declarations available on first paint with no extra round-trip, which is the optimal condition for this fix.

## Verification

1. **Build clean.** `task build` completes without errors.
2. **Visual: hero headline doesn't reflow on hard reload.** Open `/` in an incognito window with DevTools → Network → "Slow 4G". Hard reload. Watch the 120 px headline during first paint — it should render once at its final position, no horizontal/vertical pop. PASS: zero visible jump.
3. **Visual: platform-icon strip doesn't show ligature names.** Same slow network, watch the strip just under the tagline. Expected: empty boxes for ~50–500 ms, then glyphs appear in place. Failure mode: literal "phone_iphone" / "tablet_mac" / etc. text briefly visible. PASS: no literal text.
4. **DevTools Performance Insights → Layout Shifts.** Record a slow-network reload. Filter to layout shifts. PASS: no shifts attributable to the hero `<section>` or `.platform-strip`.
5. **Lighthouse re-run.** Run Lighthouse against the new build on `/`, `/colophon`, `/apps/splitledger`. PASS: CLS ≤ 0.05 on all three (back to pass-1 levels).
6. **Cached behavior.** Reload the page after step 2. Space Grotesk should now render immediately (cached). Check that the layout is identical to the fallback render — confirms metric matching is correct. PASS: no visible shift between cached and first-load renders.

## Out of scope

- **Self-hosting fonts.** Would give full `@font-face` control and remove the Google Fonts DNS hop, but bigger move; revisit if perf budget tightens.
- **Converting `.platform-strip` icons to inline SVG.** Eliminates the font-load category entirely, but a separate refactor and unnecessary if (A)+(B)+(C) lands the numbers.
