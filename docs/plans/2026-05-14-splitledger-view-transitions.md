# SplitLedger 99 → 100: replace Astro `<ClientRouter />` with native cross-document View Transitions

## Context

Pass-3 Lighthouse (devtools throttling, 3-run median) puts `/apps/splitledger/` at **Perf 99 / 100 / 99**. The single-point gap is the `unused-javascript` audit: Astro's `<ClientRouter />` SPA-runtime ships ~9 KB to every route, and Lighthouse classes most of it as unused at first paint (the swap/history/fetch code only runs on a subsequent navigation).

The runtime IS being used — `transition:persist` on header/footer (Base.astro), `view-transition-name: app-content` on the article (`[...slug].astro`), and prev/next slide animations gated on `<html data-nav-dir>`. So removing `<ClientRouter />` outright would lose visible polish — unless we replace it with the **native cross-document View Transitions API** (Chrome ≥ 126, Edge ≥ 126, Safari 18.2+). That API gives us the same slide+fade animations via CSS and the `pageswap` / `pagereveal` events, with zero framework runtime. Firefox and older browsers fall back to plain full-page navigation (graceful — same fallback they got before for any non-VT-capable transition).

Outcome: bundle drops ~9 KB on every route, `unused-javascript` audit clears, `/apps/splitledger/` reaches **100**. Animations remain identical on supported browsers. User picked this approach explicitly over the alternatives (disable on /apps/\* only, disable site-wide, or accept the 99).

## Approach

Three files change. No new dependencies, no Astro config change. CSS-driven transitions with a tiny inline script for direction state.

### 1. `src/styles/global.css` — opt the site into cross-document VT

Insert after the existing `@property --header-shrink` block (around line 38), at top level (not inside `@layer`):

```css
/* Native cross-document View Transitions. Spec requires the rule on
 * both outgoing and incoming documents — global.css is inlined into
 * every HTML response (build.inlineStylesheets: "always" in
 * astro.config.mjs), so the rule lands on every page automatically. */
@view-transition {
    navigation: auto;
}
```

### 2. `src/layouts/Base.astro` — drop ClientRouter and Astro-lifecycle hooks

**Remove:**

- Line 4: `import { ClientRouter } from "astro:transitions";`
- Line 67: `<ClientRouter />`
- Lines 68–95: the `astro:before-preparation` / `astro:after-swap` scroll-fix block (was compensating for `moveBefore()` anchor shift on `transition:persist` footer — N/A once we leave full-page nav to the browser). The browser's native scroll restoration handles back/forward; new navigations land at scrollY=0 by default.
- Line 163: `transition:persist` attribute on `<header>`.
- Line 181: `transition:persist` attribute on `<footer>`.

**Simplify** the scroll-shrink block (lines 111–156) — drop the `inTransition` gate and the `astro:before-preparation` / `astro:page-load` listeners. Cross-doc nav means a fresh document each time; no in-flight swap to gate against. Keep the Rec #7 first-paint forced-reflow avoidance (skip-if-zero, defer-to-idle-if-scrolled). Replacement script body:

```js
// Scroll-shrink: --header-shrink ramps 0 → 1 as scrollY goes 0 → half a
// viewport. Each page is a fresh document under cross-doc VT, so no
// transition gating is needed.
if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
    let pending = false;
    const update = () => {
        pending = false;
        const raw = Math.min(1, window.scrollY / (window.innerHeight / 2));
        const eased = 1 - (1 - raw) * (1 - raw);
        document.documentElement.style.setProperty("--header-shrink", eased.toFixed(3));
    };
    const tick = () => {
        if (pending) return;
        pending = true;
        requestAnimationFrame(update);
    };
    window.addEventListener("scroll", tick, { passive: true });
    window.addEventListener("resize", tick, { passive: true });
    // First-paint reflow avoidance (Rec #7): zero scrollY means CSS
    // default is correct, skip the read entirely. If we landed scrolled
    // (hash anchor), defer to idle.
    if (window.scrollY !== 0) {
        const run = () => requestAnimationFrame(update);
        if ("requestIdleCallback" in window) {
            requestIdleCallback(run, { timeout: 250 });
        } else {
            setTimeout(run, 0);
        }
    }
}
```

**Header/footer "persistence":** the existing root-animation suppression in `[...slug].astro` (`::view-transition-old(root), ::view-transition-new(root) { animation: none }`, lines 409–412) means the root snapshot doesn't crossfade. Since `<header>` and `<footer>` have identical content + position across `/apps/<slug>/` pages, the swap is visually a no-op — they appear still during the article slide. No new VT names needed on header/footer.

### 3. `src/pages/apps/[...slug].astro` — swap Astro lifecycle for `pagereveal`

**Replace** the `<script>` block (lines 131–201) with the version below. Add `is:inline` so the script inlines into HTML head and runs synchronously during parse — the `pagereveal` listener must register before that event fires:

```html
<script is:inline>
    // Cross-document view transitions for prev/next app navigation.
    // Direction crosses the navigation boundary via sessionStorage:
    //   - click on prev/next link → write 'prev'|'next' before nav
    //   - on new page's `pagereveal` (fires before first frame of the
    //     cross-doc VT) → read storage, apply data-nav-dir, clear
    //   - on viewTransition.finished → drop the attribute so a stale
    //     dir doesn't leak into a later reload / browser-back

    const DIR_KEY = 'indri:nav-dir';

    document.addEventListener('click', (e) => {
        const a = e.target?.closest?.('a[aria-label^="Previous:"], a[aria-label^="Next:"]');
        if (!a) return;
        const dir = a.getAttribute('aria-label').startsWith('Previous') ? 'prev' : 'next';
        sessionStorage.setItem(DIR_KEY, dir);
    }, true);

    window.addEventListener('pagereveal', (e) => {
        if (!e.viewTransition) return;
        const dir = sessionStorage.getItem(DIR_KEY);
        if (!dir) return;
        document.documentElement.dataset.navDir = dir;
        sessionStorage.removeItem(DIR_KEY);
        e.viewTransition.finished.finally(() => {
            delete document.documentElement.dataset.navDir;
        });
    });

    // Touch swipe: ≥60 px horizontal pan on the article navigates
    // prev/next; vertical scrolls and edge-guard touches are ignored.
    // location.href triggers a real cross-doc navigation; the browser
    // fires the VT itself.
    const SWIPE_MIN = 60;
    const SWIPE_MAX_OFF_AXIS = 40;
    const EDGE_GUARD = 24;
    let touchStart = null;

    document.addEventListener('touchstart', (e) => {
        if (e.touches.length !== 1) return;
        const article = e.target?.closest?.('article');
        if (!article) return;
        const t = e.touches[0];
        if (t.clientX < EDGE_GUARD || t.clientX > window.innerWidth - EDGE_GUARD) return;
        touchStart = { x: t.clientX, y: t.clientY };
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
        if (!touchStart) return;
        const t = e.changedTouches[0];
        const dx = t.clientX - touchStart.x;
        const dy = t.clientY - touchStart.y;
        touchStart = null;
        if (Math.abs(dy) > SWIPE_MAX_OFF_AXIS) return;
        if (Math.abs(dx) < SWIPE_MIN) return;
        const dir = dx > 0 ? 'prev' : 'next';
        const label = dir === 'prev' ? 'Previous' : 'Next';
        const a = document.querySelector(`a[aria-label^="${label}:"]`);
        const href = a?.getAttribute('href');
        if (!href) return;
        sessionStorage.setItem(DIR_KEY, dir);
        location.href = href;
    }, { passive: true });
</script>
```

**Add** a no-direction fallback inside the existing `<style is:global>` (insert before the `@media (prefers-reduced-motion: no-preference)` block at line 414):

```css
/* Fallback for nav with no recorded direction (back/forward, deep
 * link, home → app). Without this, the unsuffixed app-content pair
 * picks up the UA default fade — usually fine, but pinning it
 * explicitly keeps the behavior stable across future browser changes. */
@media (prefers-reduced-motion: no-preference) {
    :root:not([data-nav-dir])::view-transition-old(app-content) {
        animation: app-fade-out 200ms linear both;
    }
    :root:not([data-nav-dir])::view-transition-new(app-content) {
        animation: app-fade-in 200ms linear both;
    }
}
```

**Add** an explicit reduced-motion suppression below the existing `prefers-reduced-motion: no-preference` block:

```css
@media (prefers-reduced-motion: reduce) {
    ::view-transition-old(app-content),
    ::view-transition-new(app-content) {
        animation: none;
    }
}
```

The cross-doc VT spec doesn't mandate reduced-motion respect — that's the author's responsibility. The current `no-preference` gate handles slide animations; this suppresses the UA-default fade for reduced-motion users too, so the app↔app swap is instant under that preference.

**Keep unchanged:** `view-transition-name: app-content` on the article (line 48), the root-animation suppression (lines 409–412), the existing direction-specific rules and keyframes (lines 421–448).

### 4. `src/pages/colophon.astro` — copy fix

Lines ~297–298 namecheck "ClientRouter" in the live-tech writeup. Update copy to reference native cross-document View Transitions (MDN: `@view-transition`). Not blocking the perf goal; in-scope for consistency.

## Critical files

- `src/styles/global.css` — add `@view-transition { navigation: auto; }`
- `src/layouts/Base.astro` — remove ClientRouter import + render, remove `transition:persist` directives, strip Astro lifecycle listeners from the inline script
- `src/pages/apps/[...slug].astro` — replace the `<script>` block (add `is:inline`), drop `navigate()` import, add no-dir fallback + reduced-motion CSS
- `src/pages/colophon.astro` — copy update (ClientRouter → cross-document View Transitions)

## Project workflow

Per CLAUDE.md plan-first convention: also write `docs/plans/2026-05-14-splitledger-99-to-100.md` (a project-side mirror of this plan) and add a `TODO.md` active entry pointing to it before implementing. Update `docs/investigations/2026-05-13-lighthouse-audit.md` Pass-3 section after verification with a Pass-4 result row.

## Verification

Run each step, paste raw output below it, mark PASS/FAIL per the project's plan-verification format.

1. **Build succeeds with no transition runtime in the bundle.**
   ```bash
   task build
   ls dist/_astro/*.js
   grep -l 'astro:transitions\|ClientRouter\|navigate' dist/_astro/*.js 2>/dev/null; echo "exit=$?"
   ```
   Expect: no `ClientRouter.*.js` / `router.*.js` files; grep exits 1 (no matches).

2. **Manual click-through, Chrome ≥ 126, devtools throttling off.**
   - `/apps/splitledger/` → click next chevron → article slides right-to-left, header/footer visually still.
   - Click previous → article slides left-to-right.
   - Browser back → fallback cross-fade (no directional slide).
   - DevTools → Rendering → emulate `prefers-reduced-motion: reduce` → next/prev swaps instantly.
   - Mobile emulation → swipe-left on article → next nav with slide.

3. **Safari / Firefox smoke.** Open `/apps/splitledger/`, click next. Expect full-page navigation completes, no console errors, no transition animation (graceful degradation).

4. **Lighthouse pass 4** under canonical `task lighthouse` (devtools throttling, 3-run median, same config as Pass-3 in `docs/investigations/2026-05-13-lighthouse-audit.md`).
   ```bash
   task lighthouse -- https://indri.studio/apps/splitledger/
   ```
   Targets:
   - `/apps/splitledger/` Perf **100** (was 99)
   - `unused-javascript` audit: 0 ms wasted (was ~120 ms / ~9 KB)
   - No regression on FCP / LCP / SI / TBT / CLS / TTI vs Pass-3 baseline (1.4 s / 1.4 s / 1.7 s / 0 ms / 0.058 / 2.4 s)
   - `/` and `/colophon/` Perf scores unchanged (≥ Pass-3 medians: 100 / 100)

5. **Cleanup.** After all of the above PASS:
   - Move new TODO entry to done section, ~120–150 char one-liner.
   - Append a Pass-4 row to the audit doc's recommendation-status table; resolve the "Optional pass-4 candidates" bullet for unused-JS.
