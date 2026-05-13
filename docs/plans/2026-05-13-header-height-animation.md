# Animate header height changes (ease-in-out)

## Context

The sticky header on every page shrinks as the user scrolls down and grows back as they scroll up. When the scroll position changed *abruptly* — clicking the `INDRI` wordmark to go to `/`, pressing `Home`/`End`, or any programmatic jump — the header height snapped between its shrunk and full sizes in a single frame.

The fix should be intrinsic to the header: animate every height change with ease-in-out, regardless of *why* the height is changing — including cross-page navigation.

## Root cause (in three layers)

The header's vertical padding is driven by a CSS custom property `--header-shrink`, recomputed every animation frame from `window.scrollY` by an inline script in `Base.astro:54-77`.

### Layer 1 — no transition declared on the consumer property

`src/styles/global.css:299-302` interpolated `padding-top/bottom` from `--header-shrink` via `calc()`, but had no `transition`. The padding changed instantly whenever the variable did.

### Layer 2 — the variable wasn't registered with `@property`

Even adding `transition: padding-top 220ms ease-in-out` doesn't work reliably in Chrome when the property value comes from `calc(var(...))`. Browsers don't consistently treat changes to *unregistered* custom properties as transition triggers for their dependents. Registered (`@property`) custom properties with typed `syntax` solve this: the variable itself becomes animatable, and `transition: --header-shrink <duration>` interpolates it smoothly. Everything derived from it (the `padding-top` calc) follows for free.

### Layer 3 — cross-layout navigation was a full page reload

`<ClientRouter />` (Astro's view-transition router) was only mounted in `AppLayout.astro`. Navigating from an app page back to the homepage (`Base.astro`) — including the `INDRI` wordmark click — fell back to a normal browser navigation because the destination didn't have ClientRouter. Full page reload → all inline state wiped → `--header-shrink` reset to its `@property` initial-value (0) on the new page → no "old value" for the transition to ease *from* → user sees a snap.

### Bonus: the gate

Even with `ClientRouter` site-wide, scrollY resets to 0 on the new page *during* the view transition. The scroll listener fires and would set `--header-shrink` to 0 before the new-page snapshot is captured — making both snapshots show a full header and leaving the fade with no size delta. An `inTransition` gate suppresses `update()` during the navigation, then `astro:page-load` lifts the gate and re-runs `update()` *after* the swap, so the CSS transition fires on the now-visible new page.

## Fix

Three changes, applied together:

**1. Register `--header-shrink` with `@property`** (top-level — not allowed inside `@layer`), alongside the existing `--stripe-angle` registration:

```css
@property --header-shrink {
    syntax: "<number>";
    inherits: true;
    initial-value: 0;
}

html {
    transition: --header-shrink 220ms ease-in-out;
}

@media (prefers-reduced-motion: reduce) {
    html {
        transition: none;
    }
}
```

The `.header-fx > div` rule inside `@layer components` keeps its `calc(1.125rem - 1rem * var(--header-shrink, 0))` and gets no transition of its own — it follows the smoothly-interpolating variable.

**2. Mount `<ClientRouter />` in `Base.astro`** (and remove it from `AppLayout.astro` so it's not double-mounted, since AppLayout wraps Base). This makes every navigation use Astro view transitions, eliminating full reloads.

**3. Gate `update()` during view transitions** in the inline script:

```js
let inTransition = false;
// ... update() returns early if inTransition is true ...
document.addEventListener("astro:before-preparation", () => { inTransition = true; });
document.addEventListener("astro:page-load", () => {
    inTransition = false;
    requestAnimationFrame(update);
});
```

The script's initial-call-at-script-execution is removed; `astro:page-load` covers both first load and every navigation.

### Duration & easing

`220ms ease-in-out`. Long enough to read as motion, short enough not to feel rubbery during continuous scroll. If it feels rubbery on fast trackpad scrolls, drop to 150ms; if it feels too snappy on click-to-top, go to 280ms.

### Reduced motion

The existing inline JS already no-ops under `prefers-reduced-motion: reduce` (the listener block is gated by `if (!matchMedia(...).matches)`), so `--header-shrink` stays at its initial-value (0) and the header stays full-size. A matching `transition: none` on `html` ensures no animation fires on initial paint or any state change.

## Files changed

| File | Change |
|---|---|
| `src/styles/global.css` | **Top-level:** registered `@property --header-shrink`, added `html { transition: --header-shrink 220ms ease-in-out; }` and matching `prefers-reduced-motion` block. **Inside `@layer components`:** resolved leftover merge-conflict markers; `.header-fx > div` calc unchanged. |
| `src/layouts/Base.astro` | Imported and mounted `<ClientRouter />`. Rewrote inline script: added `inTransition` gate, `astro:before-preparation` + `astro:page-load` listeners, removed eager `update()` at script-execution time. |
| `src/layouts/AppLayout.astro` | Removed `<ClientRouter />` and its import (now provided by Base, since AppLayout wraps Base — would have been double-mounted otherwise). |

## Verification

`task dev` running on `localhost:4321`. From a fresh hard-refresh on each test:

1. **Reproduce the original snap.** (Optional — only meaningful before the fix lands.) Open `/apps/claude-code-authoring-formats/`, scroll near the bottom, click the `INDRI` wordmark. Observe header pops between sizes.
2. **Click-to-top, cross-page.** With the fix applied: open `/apps/foo/`, scroll down so the header is clearly shrunk, click `INDRI`. The cross-page view transition runs; after it lands on `/`, the header should ease from shrunk → full over ~220ms.
3. **Continuous scroll.** Slowly scroll down and back up. Header progressively shrinks/grows without feeling laggy or rubbery on continuous input.
4. **Keyboard jump.** Press `End` then `Home`. Header eases both directions; no snap.
5. **Same-page anchor.** From the homepage with scroll past `the team`, click `INDRI`. Header eases from shrunk → full.
6. **Reduced motion.** Chrome devtools → Rendering → "Emulate CSS media feature prefers-reduced-motion" → "reduce". Reload. Header stays full-size regardless of scroll position; no transition fires.
7. **Visual regression.** Header background, breathe pulse, and `INDRI` wordmark layout all unchanged.
8. **No conflict markers.** `grep -rn '<<<<<<<\|=======\|>>>>>>>' src/` returns empty.
9. **Single ClientRouter.** `curl -s http://localhost:4321/ | grep -c "@view-transition"` returns `1`. Same on `/apps/foo/`.

After all pass, commit.
