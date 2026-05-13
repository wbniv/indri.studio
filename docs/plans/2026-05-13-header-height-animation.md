# Animate header height changes (ease-in-out)

## Context

The sticky header on every page shrinks as the user scrolls down and grows back as they scroll up. When the scroll position changes *abruptly* — clicking an in-page link that jumps to top, pressing `Home`/`End`, or any programmatic scroll without smooth-behavior — the header height snaps between its shrunk and full sizes in a single frame. Visually it pops.

The fix should be intrinsic to the header itself: animate every height change with ease-in-out, regardless of *why* the height is changing. No assumption about scroll behavior, no dependence on a particular call path.

## Root cause

The header's vertical padding is driven by a CSS custom property `--header-shrink` that's recomputed every animation frame from `window.scrollY`.

**`src/layouts/Base.astro:54-77`** — inline script in `<head>`:

```js
const update = () => {
    pending = false;
    const raw = Math.min(1, window.scrollY / (window.innerHeight / 2));
    const eased = 1 - (1 - raw) * (1 - raw);
    document.documentElement.style.setProperty("--header-shrink", eased.toFixed(3));
};
```

rAF-batched, listens for `scroll` and `resize`. The script's `eased` curve gives a nice ramp during *continuous* scroll, but when `scrollY` jumps from large to 0 in one frame, `eased` also jumps from ~1 to 0 in one frame.

**`src/styles/global.css:299-302`** — the property consumer:

```css
.header-fx > div {
    padding-top:    calc(1.125rem - 1rem * var(--header-shrink, 0));
    padding-bottom: calc(1.125rem - 1rem * var(--header-shrink, 0));
}
```

No `transition` declared, so the computed padding is applied instantly when the variable updates. That's the pop.

## Fix

Add a CSS transition on the padding properties. Modern browsers transition the computed value of `padding-*`; when the variable updates and the computed value changes, the transition fires — regardless of whether the change came from scroll, a click handler, a resize, or `prefers-reduced-motion` flipping at runtime.

```css
.header-fx > div {
    padding-top:    calc(1.125rem - 1rem * var(--header-shrink, 0));
    padding-bottom: calc(1.125rem - 1rem * var(--header-shrink, 0));
    transition: padding-top 220ms ease-in-out, padding-bottom 220ms ease-in-out;
}
```

### Why this works under continuous scroll too

Every animation frame, the JS sets a new target value for `--header-shrink`. The browser starts a fresh transition toward that target from the *current* intermediate value (transitions don't restart from zero — they ease toward the new endpoint from wherever the property currently is). With a 220 ms duration and ~16 ms scroll updates, the result reads as smooth continuous motion that lags scroll by ~100 ms — perceptible only if you stare for it, and pleasantly weighty in practice.

If the lag turns out to feel rubbery during fast trackpad scrolls, drop to 150 ms. If it feels too snappy on click-to-top, go to 280 ms. 220 ms is the safe middle.

### Easing

`ease-in-out` per the request.

### Reduced motion

The existing inline JS already no-ops under `prefers-reduced-motion: reduce` — the listener block is gated by `if (!matchMedia(...).matches)`. So `--header-shrink` stays at its fallback value (`0`) and the header stays full-size. Add a matching transition guard so the property doesn't animate on initial paint or other state changes:

```css
@media (prefers-reduced-motion: reduce) {
    .header-fx > div {
        transition: none;
    }
}
```

There's already a `prefers-reduced-motion` block at `global.css:341-345` covering `.header-fx::after`. Extend it rather than adding a second.

## Cleanup — merge conflict in the same file

`src/styles/global.css:305-309` has unresolved git conflict markers in a comment:

```css
/* Header motion FX — Phosphor breathe, a slow screen-blended radial
<<<<<<< Updated upstream
 * glow that pulses across the purple header. Always on. */
=======
 * glow that pulses across the purple header. Runs on every page. */
>>>>>>> Stashed changes
```

Both branches say the same thing. Resolve in favor of "Always on." (shorter) as part of the same commit since it's adjacent to the code being edited.

## Files to change

| File | Change |
|---|---|
| `src/styles/global.css` | Add transition to `.header-fx > div` (lines 299-302). Add `transition: none` for `.header-fx > div` inside the existing `@media (prefers-reduced-motion: reduce)` block (lines 341-345). Resolve merge conflict at lines 305-309. |
| `src/layouts/Base.astro` | **No change.** Scroll script keeps doing exactly what it does. |

## Verification

`task dev` is running on `localhost:4321`.

1. **Reproduce the jump first.** Open `/apps/claude-code-authoring-formats/`, scroll near the bottom, click anything that returns to the top of a page (the `INDRI` wordmark in the header is a clean test — links to `/`). Observe header pops between sizes.
2. **Apply the fix.** Save `global.css`. Astro HMR injects without a full reload.
3. **Click-to-top.** Same page, scroll down, click the wordmark. Header should ease from shrunk → full over ~220 ms.
4. **Same-page anchor.** From the homepage scrolled to "the team", click the wordmark. Header should ease, not snap.
5. **Manual scroll.** Slowly scroll down and back up. The header should progressively shrink/grow without feeling laggy or rubbery on continuous input.
6. **Keyboard jump.** Press `End` then `Home`. Header should ease both directions, not snap.
7. **Reduced motion.** Chrome devtools → Rendering → "Emulate CSS media feature prefers-reduced-motion" → "reduce". Reload. Header stays full-size regardless of scroll position; no transition fires on any state change.
8. **Visual regression.** Header background, breathe pulse, and `INDRI` wordmark layout all unchanged.
9. **No conflict markers left.** `grep -rn '<<<<<<<\|=======\|>>>>>>>' src/ docs/` returns empty.

After all pass, commit the CSS change and this plan together.
