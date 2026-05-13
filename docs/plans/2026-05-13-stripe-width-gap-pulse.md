# Pinstripe width + gap pulse

## Context

The body pinstripes in `src/styles/global.css` already drift (60s) and rotate (180s) on independent timelines. The stripe geometry — 4px lines with 28px gaps — was hardcoded in the `repeating-linear-gradient` color stops.

This change makes the geometry animatable too, so the field of lines can also breathe (wider/narrower) and crowd/spread (denser/sparser). Four independent timelines (60 / 180 / 95 / 140s) are pairwise non-divisible, so the combined loop is multi-hour and the pattern never visibly repeats.

## Changes

`src/styles/global.css`:

1. Two new top-level `@property` registrations next to `--stripe-angle`:
   - `--stripe-width` `<length>`, initial `4px`
   - `--stripe-gap`   `<length>`, initial `28px`
2. Body gradient rewritten to read `var(--stripe-gap)` and `calc(var(--stripe-gap) + var(--stripe-width))` instead of hardcoded `28px 32px`.
3. Two new `@keyframes` blocks (`stripe-width`, `stripe-gap`) with non-uniform reversing stops in the same aesthetic as `stripe-rotate` / `stripe-drift`.
4. `body { animation: … }` shorthand extended with `stripe-width 95s linear infinite, stripe-gap 140s linear infinite`.

`prefers-reduced-motion` already disables the whole `body` animation shorthand, so the new properties freeze at their registered initial values (4px, 28px) — no extra rule needed.

## Tunable knobs

- Periods (95s / 140s) — try 30–240s.
- Width keyframe values (2–12px) — try 1–24px.
- Gap keyframe values (16–60px) — try 8–120px.
- Number of keyframe stops (5 each) — fewer = simpler rhythm, more = busier.

If width × gap resolve too dense (e.g. gap 8px / width 12px in opposite phases) and the page reads as grey wash, tame the extremes.

## Verification

1. `task dev` → open `localhost:4321`. Watch ~3 minutes:
   - Line thickness visibly breathes on its own cycle.
   - Inter-line spacing visibly opens/closes on a different cycle.
   - Drift + rotation unchanged.
2. DevTools rendering panel → "Reduce motion" → stripes freeze at 4px/28px.
3. `task build` → no CSS errors or warnings.
