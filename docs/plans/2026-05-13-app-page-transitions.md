# Plan: App page transitions

## Context

App pages (`/apps/<slug>/`) form a small linked catalogue — every page carries a `prev` and `next` reference into the alphabetical ordering. The catalogue UX had two problems:

1. **Fixed-position side arrows** — the `<nav>` block at the bottom of `src/pages/apps/[...slug].astro` rendered chevrons at `position: fixed; top: 50%`. On mobile they crammed against the viewport edges and overlapped content like store badges (user screenshot 18:43, 2026-05-13).
2. **Instant page replacement** — clicking prev/next did a hard server-render swap. No visual cue that you were moving sideways through a catalogue vs. opening an unrelated page.

This plan folds the side arrows into the breadcrumb row and adds a directional view-transition between adjacent app pages.

## What landed

```
4394b35  Fold app prev/next nav into the breadcrumb row
2f82847  Slide-with-fade transition between app pages
a41d9f2  Swipe-to-navigate between app pages on touch
e48393f  Use asymmetric easing on the page-transition keyframes
655bf28  Prefetch the prev/next app pages
8eb60df  Skip swipe-nav for touches starting near a viewport edge
```

### Tried and rejected

- **1→0.96 scale on the slide** (d0ee1d7 → reverted in 4141dcb; re-attempted with `transform-origin: 50% 50%` in f99788e → reverted in 149ede2). The first attempt anchored at the pseudo-element default `transform-origin: 0 0`, so the article looked like it was falling diagonally toward the top-left as it shrank. The second attempt centred the origin to fix the falling, but the receding-depth feel still didn't read right against the flat slide-with-fade — the article felt like it was zooming out of a viewport rather than passing sideways through a catalogue. Dropped both attempts; current keyframes animate `translateX` + `opacity` only.

### Nav layout — `[...slug].astro`

The article opens with a three-cell flex row:

```
[ ‹ Previous: TITLE ]    [ apps · All apps ]    [ Next: TITLE › ]
```

All three cells share `side-nav-inline` styling — a rounded backdrop-blur pill with the same hover treatment the old fixed-position arrows had. The prev/next titles slide out from `max-width: 0` on hover at ≥768 px; the centre cell shows "All apps" inline beside a Material `apps` glyph. The standalone fixed-position `<nav aria-label="Catalogue navigation">` block at the foot of the article is removed; only the inline row remains.

### Transition mechanics

- **AppLayout** (`src/layouts/AppLayout.astro`) pulls in `<ClientRouter />` from `astro:transitions`. This scopes Astro's view-transition machinery to app pages — homepage→app and footer-link navigations still do regular full loads.
- **Base** (`src/layouts/Base.astro`) marks `<header>` and `<footer>` with `transition:persist` so the chrome stays anchored across navigations.
- **Article** carries an inline `style="view-transition-name: app-content"`. Lightning CSS strips `view-transition-name` from regular rules — it treated the declaration as unknown and eliminated the whole `.app-article {…}` block during minification — so the property has to live in an inline style or it silently no-ops.
- **Direction** is read from `<html data-nav-dir="prev|next">` set by the page's script before navigation. The view-transition CSS keys off `:root[data-nav-dir="…"]::view-transition-old(app-content)` to pick the matching keyframe.

The script:

```ts
let pendingDir = null;
const setDir = (dir) => {
  pendingDir = dir;
  document.documentElement.dataset.navDir = dir;
};

document.addEventListener('astro:before-preparation', () => {
  if (pendingDir) document.documentElement.dataset.navDir = pendingDir;
});
document.addEventListener('astro:after-swap', () => {
  if (pendingDir) document.documentElement.dataset.navDir = pendingDir;
});
document.addEventListener('astro:page-load', () => {
  setTimeout(() => {
    delete document.documentElement.dataset.navDir;
    pendingDir = null;
  }, 400);
});

document.addEventListener('click', (e) => {
  const a = e.target?.closest?.('a[aria-label^="Previous:"], a[aria-label^="Next:"]');
  if (!a) return;
  setDir(a.getAttribute('aria-label').startsWith('Previous') ? 'prev' : 'next');
}, /* capture */ true);
```

Two timing-critical details:

1. **Capture phase** on the click listener — ClientRouter installs its own delegated click handler. Without `capture: true`, my listener runs *after* ClientRouter's interceptor, which means the snapshot is taken before `data-nav-dir` is set and the CSS rule matches nothing.
2. **Re-apply at `astro:before-preparation` + `astro:after-swap`** — Astro's swap replaces `<html>` attributes mid-transition. Setting the attribute once on click and walking away gets it nuked before both pseudo-element animations have run.

### Keyframes — `<style is:global>` in `[...slug].astro`

```css
:root[data-nav-dir="next"]::view-transition-old(app-content) {
  animation: app-slide-out-left 280ms cubic-bezier(0.4, 0, 1, 1) both;
}
:root[data-nav-dir="next"]::view-transition-new(app-content) {
  animation: app-slide-in-right 280ms cubic-bezier(0, 0, 0.2, 1) both;
}
/* + matching prev pair */

@keyframes app-slide-out-left {
  from { opacity: 1; transform: translateX(0)     scale(1);    }
  to   { opacity: 0; transform: translateX(-100%) scale(0.96); }
}
@keyframes app-slide-in-right {
  from { opacity: 0; transform: translateX(100%)  scale(0.96); }
  to   { opacity: 1; transform: translateX(0)     scale(1);    }
}
```

Components: translate ±100 % + opacity 0↔1 + scale 1↔0.96, asymmetric easing (out: `(0.4, 0, 1, 1)` ease-in, in: `(0, 0, 0.2, 1)` ease-out), 280 ms. Plus an `animation: none` override on `::view-transition-old(root)` / `::view-transition-new(root)` to kill the default crossfade — without it the rest of the document still crossfades alongside the named transition.

### Swipe-to-navigate

Mobile and trackpad users get a horizontal swipe (≥ 60 px, ≤ 40 px off-axis drift) on the article that fires the same `setDir(…)` + `navigate(href)` path as a click — so swipe runs through the same view-transition. Passive listeners so we never block scroll.

A 24 px **edge guard** ignores touches starting within 24 px of either left or right viewport edge: iOS Safari interprets edge-swipes as system back/forward, and without the guard our 'prev' swipe would steal the gesture.

### Prefetch

`AppLayout` accepts `prevHref` / `nextHref` props and emits `<link rel="prefetch" href={…}/>` for each in `<head>`. The slug page wires both up from the existing `prev` / `next` collection entries. ClientRouter does its own on-hover prefetch on top of this; eager prefetch covers swipe / touch users who never hover.

## Files touched

```
src/layouts/AppLayout.astro      props: prevHref/nextHref, head: ClientRouter + prefetch
src/layouts/Base.astro           transition:persist on <header> and <footer>
src/pages/apps/[...slug].astro   three-cell nav row, inline view-transition-name,
                                 capture-phase click handler, swipe with edge guard,
                                 keyframes + asymmetric easing in <style is:global>
```

## Verification

1. **Three-cell nav row.** Visit `/apps/parking-space/`. Top of article shows `‹ prev | apps · All apps | next ›`. Hover prev or next on desktop: title slides out. No fixed-position arrows anywhere else on the page.

2. **Slide-with-fade fires.** Click `next`. Article slides left + fades out + scales to 0.96 while next article slides in from the right + fades in + scales up. Header and footer stay anchored. ~280 ms. Repeat with `prev` — opposite direction.

3. **Click round-trip works repeatedly.** Click next four times — every transition fires (not just the first). Click prev to wrap around.

4. **Swipe nav on touch.** On a phone or DevTools mobile mode: swipe left on the article body → next. Swipe right → prev. Swipe vertically → page scrolls normally, no nav.

5. **Edge guard.** Start a swipe within 20 px of the left viewport edge on iOS Safari → system back-gesture wins, no catalogue swipe. Start the same swipe at 40 px from the edge → catalogue 'prev' fires.

6. **Prefetch present.** `view-source:/apps/parking-space/` → head contains `<link rel="prefetch" href="/apps/<prev-id>/">` and `<link rel="prefetch" href="/apps/<next-id>/">`.

7. **Reduced motion.** `prefers-reduced-motion: reduce` → no slide / fade / scale; pages snap.

8. **Lightbox still owns arrow keys.** `/apps/claude-code-authoring-formats/` with the gallery lightbox open → ←/→ still cycle styles; ↑/↓ still cycle types. App pages no longer install a keydown handler at all, so the lightbox's keys aren't competing.

## Gotchas to remember

- **Lightning CSS strips `view-transition-name`** from regular CSS rules. Always set it inline on the element, or as an `@layer`-pinned declaration that minification will preserve.
- **Astro's `transition:name="foo"` directive does NOT emit `view-transition-name: foo`** — it generates a scoped `data-astro-transition-scope="astro-…"` token. CSS rules targeting the literal name you wrote will match nothing. If you need a stable name, set the property yourself.
- **Capture-phase listeners** are necessary to beat ClientRouter's own click interceptor. Bubble-phase listeners run after the snapshot is already in flight.
- **`<html>` attributes get nuked during swap.** Re-apply at `astro:before-preparation` and `astro:after-swap`, then clean up with a `setTimeout` that outlasts the keyframe.
- **`window.location.assign()` bypasses ClientRouter entirely** and triggers a full page load — view transitions never fire. Use `navigate()` from `astro:transitions/client` for any programmatic navigation that should animate.
- **Astro wraps `define:vars` scripts in an IIFE**, which makes ES `import` inside the script a syntax error. Read hrefs from the DOM at handler time instead.

## Context

This work was an iterative session, not a pre-planned drop — the plan is being recorded after the commits land. The intent of this file is to capture the design decisions and gotchas surfaced along the way, so the next time someone touches view transitions on this site (or wants to extend the pattern to non-app pages) they don't have to re-discover the Lightning-CSS / capture-phase / IIFE landmines from scratch.
