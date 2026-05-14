# Animated `repeating-linear-gradient` segments on Chrome/Linux

## Context

The body's pinstripe background (`src/styles/global.css`, body's
`repeating-linear-gradient` animated via `stripe-drift` + `stripe-rotate`)
renders diagonal lines that **break into short segments (~4–10 px gaps along the
length of each line)** instead of continuous diagonals — but **only when
animated**. Disabling all `animation:` declarations renders the gradient
cleanly. The artifact is visible in still screenshots (not motion blur).
Symptom most noticeable on the left edge of the page; closer inspection shows
the break pattern reaches across the whole viewport but masking from the
ring-flare and content draws the eye to the left.

The artifact is **pre-existing**: present in commit `68d6c5f` (drift+rotate
only, opacity 0.04, 4 px line, 28 px gap). The 2026-05-13 attempt to add
`stripe-width` + `stripe-gap` animations (commits `89ce705`, `f2bd335`)
amplified it by widening lines and raising opacity, which is what surfaced it
visually — but those commits did not introduce it.

## Environment

- Chrome current stable, Linux (Ubuntu 24+)
- Astro 6 dev server (Vite), Tailwind v4 CSS-first config
- Default `chrome://flags` (hardware accel on, GPU rasterization auto)
- Body height exceeds viewport on every page (long content)

## What's been ruled out

| Hypothesis | Test | Result |
|---|---|---|
| Opacity / anti-aliasing | rgba alpha 0.04 → 0.10 | No change |
| Sub-pixel line width | 2 → 4 → 6 px line | No change |
| Tile-seam on body's huge raster | Moved gradient to `body::before { position: fixed; inset: 0; z-index: -1; pointer-events: none; will-change: transform; }` | Still segmented |
| GPU layer promotion | `will-change: background-position`, `will-change: transform`, `transform: translateZ(0)` | None changed it |
| Moiré | Direct observation; not periodic-interference shape | Ruled out |
| Animation count | Bug present with as few as 2 animations (drift+rotate) | Not count-dependent |

**Confirmed clean state:** body's gradient with `animation: none` — perfectly
continuous lines.

## Most likely root cause

**Asynchronous tile rasterization racing the per-frame paint invalidation
triggered by an animated `@property` value inside `background-image`.**

Pipeline:

1. Main thread runs animation tick → computes new `--stripe-angle` →
   recomputes resolved `background-image` → marks paint dirty.
2. Paint generates a new display list reflecting new gradient parameters.
3. CC (Chromium Compositor) invalidates the tiles intersecting the painted
   region.
4. A pool of raster workers asynchronously rasterizes each invalidated tile,
   sampling Skia's `SkGradientShader` per pixel.
5. The compositor presents using whichever tiles are ready. **Tiles that
   haven't finished rasterizing yet present from the previous frame.**

When parameters change every frame, every tile is invalidated every frame, but
they don't all finish before present. A presented frame can contain tiles
rasterized against frame N's parameters next to tiles from frame N−1. At those
boundaries the gradient lines don't quite match up — segmented-line signature.

The irregular (non-lattice) break positions are because which tiles are stale
this frame depends on which raster workers were slow this frame, and that
varies.

**Why this matches everything observed:**

- Bug only with animation → animation is the only thing causing per-frame
  raster invalidation.
- Bug in still screenshots → any given displayed frame can have mixed-vintage
  tiles.
- GPU promotion didn't help → rasterization happens *before* compositing, on
  raster workers; promoting to a layer doesn't change raster timing.
- Pseudo-element fixed at viewport size didn't help → Skia still tile-rasters
  even viewport-sized elements; tile size on Linux Chrome is typically 256×256
  or 512×512, well below 1080p viewport.
- Static fallback clean → single rasterization pass, no race.

**Secondary hypothesis (multiplier, not primary):** GPU fragment-shader
precision for `@property`-interpolated values on Linux Mesa stack. Doesn't
explain why static is clean (same precision applies) but may amplify the
visibility of the tile-race when it happens.

**No specific crbug references** — I would not cite numbers without verifying.
Search terms: `@property` gradient flicker / repeating-linear-gradient
animation tearing / tile raster async stale paint.

## Diagnostic experiments — DO THIS NEXT

### Experiment A (highest priority, ~30 seconds)

Isolate which animation triggers the segmentation. Run with `stripe-drift`
ONLY (comment out `stripe-rotate`). Then run with `stripe-rotate` ONLY (comment
out `stripe-drift`).

Predictions:

- **Drift-only clean, rotate-only broken** → `@property` animation specifically
  is the trigger. `background-position` benefits from a cached-raster + offset
  shortcut; `@property` doesn't. **Fix path: animate via `transform` on a
  static-gradient wrapper instead of via `@property`.**
- **Both individually clean** → bug needs combined invalidation pressure.
  Tile-race confirmed; threshold-driven.
- **Both individually broken** → more fundamental than property-animation
  interaction. Investigate GPU shader precision next.

### Experiment B

Add `contain: paint` to the gradient host element with explicit small
dimensions (e.g. `width: 1024px; height: 1024px`) and `transform: scale()` to
fill viewport.

Predictions:

- **Clean** → confirms tile race; smaller paint surface fits in worker pool.
  Fix path: split gradient into a transform-scaled element.
- **Still broken** → tile race isn't the cause; investigate GPU precision.

### Experiment C

Open the page in Firefox on the same Linux machine.

Predictions:

- **Clean in Firefox** → confirms Chromium-specific behaviour. Fix path will
  involve avoiding Chromium's hot path.
- **Broken in Firefox too** → more fundamental than Chromium's pipeline. Much
  harder to work around.

If a Chrome on macOS/Windows machine is available, test there too — Linux Mesa
stack is often the differentiator.

## CSS-only fixes (ranked)

### #1 — Animate `transform` on a static-gradient wrapper (high confidence)

Render the gradient with **fixed** stops on a wrapper. Animate `transform:
translate() rotate()` for the motion. Transforms run on the compositor thread
without rasterization — no paint invalidation, no tile race.

```css
.stripes-host {
  position: fixed;
  inset: -50%;            /* oversize so rotation doesn't expose corners */
  pointer-events: none;
  z-index: -1;
  background-image: repeating-linear-gradient(
    135deg,
    transparent 0 28px,
    rgba(143, 135, 128, 0.04) 28px 32px
  );
  animation: stripes-motion 180s linear infinite;
  will-change: transform;
}
@keyframes stripes-motion {
  0%   { transform: translate(0,0) rotate(0deg); }
  100% { transform: translate(32px,32px) rotate(360deg); }
}
```

Why it should work: gradient is rasterized exactly once; animation only updates
a transform matrix, applied without re-rasterizing the cached bitmap.

Tradeoff: lose true gradient-position drift in the gradient's own coordinate
space — you get translated stripes instead. Visually equivalent for subtle
motions.

### #2 — `contain: strict` on a small bounded element (medium confidence)

Combined with explicit dimensions, may push host into Chrome's "small layer"
single-tile synchronous raster path. Worth trying alongside #1.

### #3 — CSS Paint API (Houdini) `paint()` function (medium confidence)

```js
registerPaint('stripes', class {
  static get inputProperties() { return ['--stripe-angle','--stripe-gap','--stripe-width']; }
  paint(ctx, size, props) { /* draw stripes */ }
});
```

```css
background-image: paint(stripes);
```

Custom paint runs in its own pipeline that doesn't share CC tile invalidation
characteristics. **Caveat: Chrome-only** — not supported in Firefox or Safari.

## Bail-out

If fix #1 (transform-on-static-gradient wrapper) doesn't work, bail to **SVG
`<pattern>`** rather than Canvas. SVG patterns rasterize via a different Skia
path that doesn't share CC tile invalidation behaviour, and CSS animation
control is preserved:

```html
<svg style="position:fixed;inset:0;z-index:-1;pointer-events:none;width:100%;height:100%">
  <defs>
    <pattern id="stripes" width="32" height="32" patternUnits="userSpaceOnUse"
             patternTransform="rotate(var(--stripe-angle, 135))">
      <rect x="28" y="0" width="4" height="32" fill="rgba(143,135,128,0.04)"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#stripes)"/>
</svg>
```

Animate `--stripe-angle` on the `<svg>` element same as before — SVG
`patternTransform` accepting `var()` is supported.

**Do not** try further tweaks to opacity, line width, GPU promotion hints, or
pseudo-element placement. Those don't address the proximate cause; they just
shuffle the symptom.

## Next steps

1. Run **Experiment A** (drift-only vs rotate-only). 30 seconds, determines
   whether fix #1 is a 5-minute change or a deeper rabbit hole.
2. Based on A's outcome:
   - If `@property` is the trigger → implement fix #1.
   - If tile pressure is the trigger → try fix #2.
   - If neither animation alone is clean → run Experiment C (Firefox), then
     consider SVG bail-out.
3. After landing a fix, retry the original width/gap experiment from
   `docs/plans/2026-05-13-stripe-width-gap-pulse.md` — the new rendering
   approach may not exhibit the artifact.

## Resolution

Fix candidate #1 (static gradient, animate via `transform` only) was implemented
in commit `d36c7d5` (`Pinstripe BG: static gradient + transform animation — fixes
Chrome/Linux segmented-line bug`). The approach: gradient rasterised once on a
`body::before` pseudo-element; only `transform` (translate + rotate) is animated,
never the gradient coordinates. Chrome's tile-invalidation path is never triggered.

The fix landed cleanly; the segmentation artefact is gone on Chrome/Linux. The
`scale` breathing animation was added separately in `a674118` on the same static
pseudo-element and is clean too. `StripedGridMotion.astro` was later shelved to
`attic/` (`7204bb7`) since the body pinstripe fully replaces it.
