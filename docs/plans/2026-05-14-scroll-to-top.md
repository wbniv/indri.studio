# Scroll-to-top affordance — app pages only, tall pages only

**Date:** 2026-05-14
**Status:** Approved, in implementation

## Context

Per-app pages on indri.studio vary widely in length: most are 1–2 viewports, but a few (notably `claude-code-authoring-formats` with its 15-image lightbox grid) run several screens tall. After scrolling deep into screenshots, users have no quick way back to the prev/next/all-apps controls at the top of the page — the sticky header lets them re-navigate, but doesn't return them to the current page's nav row.

A small floating "scroll to top" button (^ chevron, bottom-right) fixes that — **only for app pages that actually exceed one viewport at render time**, so it stays out of the way on short app pages like `pinball-construction-set`.

Scope per user: app pages only. Not homepage, not colophon.

## Approach

New `src/components/ScrollToTop.astro` component, rendered inside `AppLayout.astro`. Component is always in the DOM on app pages; visibility is gated at runtime by two conditions:

1. **Eligibility** — measured once per page-load: page must be taller than `1 × innerHeight` (with a small fudge, e.g. `+ 100 px`, so a ~1.05× page that barely needs scrolling doesn't qualify). If ineligible, button stays hidden the whole page.
2. **Visibility** — once eligible, the button fades in after `scrollY > innerHeight × 0.5` (half a screen scrolled). Fades out below that.

Click handler: `window.scrollTo({ top: 0, behavior: 'smooth' })`. Under `prefers-reduced-motion: reduce`, swap to `behavior: 'auto'` and skip the fade transition.

### Why these specific thresholds

- Eligibility at `scrollHeight > innerHeight + 100`: literal ">1 screen" with a buffer so 1.0–1.05× pages don't qualify (button wouldn't be useful on a page where one swipe gets you back).
- Visibility at `scrollY > innerHeight × 0.5`: button appears as soon as the user is meaningfully into the content, not waiting for a full viewport like a typical implementation. Faster value, but skips the "still in the hero" zone.

### Styling

- Fixed bottom-right: `bottom: 1.5rem; right: 1.5rem` (matches the lightbox close button position on `claude-code-authoring-formats`).
- Size: 2.75 rem (44 px), matching the touch-target minimum and the lightbox `.fm-close` button exactly.
- z-index: `40` — under the sticky header (`z-50` in `Base.astro:162`), above page content.
- Background: theme-aware via CSS vars — `color-mix(in srgb, var(--color-on-surface) 10%, transparent)` with `backdrop-filter: blur(8px)` (mirrors the header's blurred-translucent treatment, adapts to per-app theme).
- Border: `1px solid color-mix(in srgb, var(--color-on-surface) 25%, transparent)`.
- Icon: inline SVG chevron-up, currentColor.
- Transition: `opacity` + `translate` (subtle 8 px slide-in), 200 ms ease-out.
- `aria-label="Scroll to top"`, `type="button"`.

### Script architecture (mirrors the existing `Base.astro` scroll-shrink pattern)

Inline `<script is:inline>` inside `ScrollToTop.astro`:

- Single module-scope state: `eligible: boolean`, `pending: boolean`.
- `astro:page-load` listener: re-measures eligibility (page height changes between apps).
- **First-load forced-reflow guard** (per `feedback-forced-reflow-first-paint.md`): on initial page-load, defer the `scrollHeight`/`innerHeight` read to `requestIdleCallback` (with 250 ms timeout fallback). Subsequent page-loads (after view transitions) can measure in `rAF` — the user already paid the cost.
- `scroll` listener (passive): toggles `data-visible` attribute on button when `scrollY` crosses the half-viewport threshold and `eligible` is true. Throttled via `rAF` flag like the existing scroll-shrink (`Base.astro:122-126`).
- `astro:before-preparation`: reset eligibility for the next page.
- Click handler attached once on the button via event listener inside the page-load handler (button is re-rendered per app page).

### Reduced-motion handling

- Skip the opacity/transform transition (instant show/hide via CSS `prefers-reduced-motion` media query).
- Use `behavior: 'auto'` for `scrollTo`.
- Gate the scroll-behavior swap via `matchMedia("(prefers-reduced-motion: reduce)").matches`, same pattern as `Base.astro:111`.

## Files

| File | Change |
|------|--------|
| `src/components/ScrollToTop.astro` | **New.** Button + inline style + inline script. |
| `src/layouts/AppLayout.astro` | Import and render `<ScrollToTop />` inside the `.app-theme` wrapper (line 53–55). |

No changes to `Base.astro`, no changes to `[...slug].astro`, no changes to content schema.

## Existing patterns reused

- **Forced-reflow-aware first-paint pattern** — `src/layouts/Base.astro:132-156` (the scroll-shrink first-load idle-callback dance). Copy the structure exactly: `firstLoad` flag, `requestIdleCallback` with `setTimeout` fallback.
- **View-transition lifecycle** — `astro:before-preparation` + `astro:page-load`, same as `Base.astro:79-95` and `:129-155`.
- **Passive `rAF`-throttled scroll listener** — `Base.astro:122-127`.
- **`z-40` slot** — currently unused; sits below sticky header at `z-50` (`Base.astro:162-164`) and above page content / RingFlare (`z-0`).
- **Lightbox close button style** — `src/content/apps/claude-code-authoring-formats.md` lines 39–47, for visual consistency on the one page where both elements coexist.

## Verification

1. **Short page — button never appears.** `task dev`, visit `/apps/pinball-construction-set/`. Scroll to bottom. Button should remain hidden the entire time (page is shorter than one viewport).
   - PASS criterion: button never visible at any scroll position; no horizontal-scroll or layout shift introduced.

2. **Long page — button appears mid-scroll.** Visit `/apps/claude-code-authoring-formats/`. At top, button hidden. Scroll past half-viewport. Button fades in bottom-right. Click it. Page smooth-scrolls to top. Button fades out.
   - PASS criterion: appears at `scrollY ≈ 0.5 × innerHeight`, smooth-scrolls to 0 on click, fades out near top.

3. **View-transition reset.** From `/apps/claude-code-authoring-formats/`, click the prev/next nav. New app page loads. If new page is short → button stays hidden. If new page is long → button is hidden at top of new page, becomes available after scrolling.
   - PASS criterion: eligibility re-measured per page, no stale state from the previous app.

4. **Reduced-motion.** Toggle `prefers-reduced-motion: reduce` (Chrome DevTools → Rendering → Emulate CSS media features). Behavior on the long page: button appears/disappears instantly (no fade), click scrolls instantly to top (no smooth scroll).
   - PASS criterion: no animation/fade observed; instant scroll.

5. **No forced reflow on first paint.** Open DevTools Performance, record a page load on `/apps/claude-code-authoring-formats/`. Look for "Forced reflow" warnings during the initial paint frames.
   - PASS criterion: no new forced-reflow warning attributable to the scroll-to-top script (existing warnings on third-party fonts are fine).

6. **Keyboard / a11y.** Tab to the button (should reach it via Tab order from the page content). Press Enter — page scrolls. Screen reader announces "Scroll to top, button".
   - PASS criterion: focusable, focus ring visible, Enter triggers scroll, aria-label read correctly.

7. **Header non-collision.** On a long page scrolled to bottom-right, verify the button visually sits below the sticky header (z-index correct) and doesn't overlap the footer.
   - PASS criterion: button visible at `bottom: 1.5 rem, right: 1.5 rem`, no z-stacking glitch.

## Out of scope

- Homepage and colophon — user scoped this to app pages.
- Build-time eligibility (computing page length from Markdown) — runtime is the only correct measure since CSS/fonts/viewport vary.
- Sticky table-of-contents / section anchors — different problem.
