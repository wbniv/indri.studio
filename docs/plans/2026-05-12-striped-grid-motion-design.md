# Plan: StripedGridMotion component for indri.studio hero

## Context

The indri.studio project plan (canonical at `~/SRC/indri.studio/docs/plans/2026-05-13-initial-buildout.md`) calls for **subtle ringtail-stripe motion in 1–2 zones of the homepage hero**. The scaffold currently has a placeholder comment at `src/pages/index.astro:35-36`:

```
<!-- Hero background. The body's purple dot grid shows through; the
     ringtail-stripe motion module will land here later (plan §Motion). -->
```

This sub-plan builds that module — the signature visual element of the studio's brand. The component is responsible for the homepage's distinctive feel; everything else is structural / typographic.

Source of design intent (canonical plan, §"Subtle motion"):
- "Pixel grid in faint accent colour on dark — cells (~16–24 px) in 5–15 % accent-tinted dark, individual cells slowly drift through opacity / tint on staggered timers."
- "Confined to hero zone and one interior strip."
- "Pure CSS where possible; minimal canvas only if needed."
- "Respect `prefers-reduced-motion: reduce` (static when set)."

Source of stripe intent (canonical plan, §"Indri studio brand"):
- "Stripes are a recurring motif (section dividers, **pixel-grid motion bands**, hover treatments) — the lemur's tail showing up in the UI furniture."
- "Pixel-grid motion arranged in **horizontal stripe rows** — alternate cell density / opacity between rows; occasional neon-purple cells flicker across as accents."

Source of mockup (canonical plan, §"Mockups", studio homepage):
The hero is bracketed by two motion stripes — one above the headline, one below the tagline.

## Approach

**Pure CSS, build-time-randomised, server-rendered Astro component.** No runtime JS, no canvas, no client hydration. Cells are `<span>` elements in a CSS grid; each gets a randomized animation `delay` and `duration` injected as inline custom properties at build time. The randomisation breaks the gridded marching-band look without shipping any JS.

Alternatives considered and rejected:
- **Canvas + JS** — more control, but ships JS for a purely decorative element. Overkill at this cell count (a few hundred).
- **SVG `<animate>`** — declarative but heavier per-element runtime than CSS animations.
- **Hard-coded modulo delays** — easy to write, but the repeating pattern is visible to the eye.

## Files

### New
- `src/components/StripedGridMotion.astro` — the component (~80 LOC including styles)

### Modified
- `src/pages/index.astro` — replace the placeholder comment (lines 35–36) with two `<StripedGridMotion />` instances bracketing the hero content. Add the import.

## Component shape

```astro
---
// StripedGridMotion.astro
interface Props {
  rows?: number;        // default 4
  cols?: number;        // default 60
  cellSize?: number;    // default 18 (px)
  flickerRate?: number; // default 0.03 (fraction of cells that pulse purple)
  class?: string;       // wrapper classes for positioning (absolute, top, etc.)
}

const { rows = 4, cols = 60, cellSize = 18, flickerRate = 0.03, class: extraClass = "" } = Astro.props;

// Per-cell randomized timing, generated at build time so each render is stable
// but the pattern doesn't look gridded.
const cells = Array.from({ length: rows * cols }, (_, i) => {
  const row = Math.floor(i / cols);
  const dense = row % 2 === 0;             // alternating stripe density
  const delay = (Math.random() * 6).toFixed(2);
  const duration = (3 + Math.random() * 4).toFixed(2);
  const flicker = Math.random() < flickerRate;
  return { dense, delay, duration, flicker };
});
---

<div class={`stripe-grid ${extraClass}`} aria-hidden="true">
  {cells.map((c) => (
    <span
      class:list={["cell", c.dense ? "dense" : "sparse", c.flicker && "flicker"]}
      style={`--d:${c.delay}s; --t:${c.duration}s;`}
    />
  ))}
</div>

<style define:vars={{ rows, cols, cellSize: `${cellSize}px` }}>
  .stripe-grid {
    display: grid;
    grid-template-columns: repeat(var(--cols), var(--cellSize));
    grid-auto-rows: var(--cellSize);
    width: 100%;
    overflow: hidden;
    pointer-events: none;
    /* Fade horizontal edges so the grid doesn't hard-cut */
    mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
  }
  .cell {
    background: var(--color-grey-700);
    opacity: 0;
    animation: pulse-dense var(--t) ease-in-out var(--d) infinite alternate;
  }
  .cell.sparse {
    animation: pulse-sparse calc(var(--t) * 1.5) ease-in-out var(--d) infinite alternate;
  }
  .cell.flicker {
    background: var(--color-primary-container);
    animation: pulse-flicker calc(var(--t) * 0.8) ease-in-out var(--d) infinite alternate;
  }
  @keyframes pulse-dense {
    0%   { opacity: 0;    }
    100% { opacity: 0.14; }
  }
  @keyframes pulse-sparse {
    0%   { opacity: 0;    }
    100% { opacity: 0.06; }
  }
  @keyframes pulse-flicker {
    0%   { opacity: 0;    }
    50%  { opacity: 0.40; }
    100% { opacity: 0;    }
  }
  @media (prefers-reduced-motion: reduce) {
    .cell          { animation: none; opacity: 0.05; }
    .cell.flicker  { animation: none; opacity: 0.25; }
  }
</style>
```

## Hero integration

In `src/pages/index.astro`:

1. Add import after the existing Astro content imports:
   ```ts
   import StripedGridMotion from "../components/StripedGridMotion.astro";
   ```
2. Replace the placeholder comment with two instances, absolutely positioned above and below the hero content. Hero content gets explicit `z-10` to sit on top.
3. Hero `<section>` already has `relative overflow-hidden`, so absolute positioning works without extra wrapping.

Final hero structure (conceptual):
```html
<section class="relative overflow-hidden ... min-h-[600px]">
  <StripedGridMotion class="absolute left-0 right-0 top-6 z-0" />
  <div class="relative z-10 ...">
    <!-- pill + h1 + tagline (unchanged) -->
  </div>
  <StripedGridMotion class="absolute left-0 right-0 bottom-6 z-0" />
</section>
```

## Cell count + performance budget

- Default: 4 rows × 60 cols × 2 instances = **480 cells** total.
- Pure-CSS `opacity` animation — compositor-only, no layout / paint cost. Easily handles 1000+ cells on a modern phone.
- If FPS measurably drops on low-end mobile (verify via Chrome DevTools → Performance), reduce `cols` to ~40.

## Tokens used

From `src/styles/global.css` (already defined, no new tokens needed):
- `--color-grey-700` (`#3D3833`) — non-flicker cell base
- `--color-primary-container` (`#B026FF`) — flicker cell

## Verification

1. **Build clean.** `pnpm build` produces no warnings; output still 7 pages.
2. **Dev preview.** `pnpm dev` (already running); `http://localhost:4321/` shows two stripe bands bracketing the "indri" headline. Subtle — no eye-grabbing motion, no harsh edges (mask fade visible at viewport sides).
3. **Stripe motif visible.** Open DevTools, inspect a `.cell.dense` vs `.cell.sparse` — confirm alternating row classes. Eye test: dense rows brighter than sparse rows.
4. **Purple flicker.** Watch 30 s of the hero; verify roughly 14 cells (3 % of 480) cycle through purple at any time.
5. **Reduced-motion.** macOS System Settings → Accessibility → "Reduce motion" ON. Reload. Animation stops; cells settle to static `opacity: 0.05` (and flicker cells to `0.25`). Confirm via DevTools Computed styles.
6. **Mobile.** Open `http://<lan-ip>:4321/` on phone (run `pnpm dev --host` if needed). No horizontal scrollbar; mask fade renders correctly on narrow viewports.
7. **No JS shipped.** View page source — confirm no `<script>` tag added for the component. Astro `.astro` components without `client:*` directives are server-only HTML+CSS.

## Out of scope

- The **second** "interior strip" zone mentioned in the canonical plan (between sections of the homepage). This sub-plan only covers the two hero bands. Same component, future placement.
- Per-app motion variations (some apps might want their own motion style on landing pages). Future per-app theming work.
- Light-mode variant — Indri studio site is dark-only, so no need.

## Reuse notes

The component is **self-contained** and accepts placement props. The same component (different `class` props) will be used for the future interior-strip placement without modification.

If a per-app landing page wants its own motion later (e.g., a different color flicker), the cleanest path is to **pass a CSS variable override via the `class` prop** rather than fork the component — `.my-app-motion .cell.flicker { background: var(--color-app-accent); }`.
