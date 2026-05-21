# Normalize the three breadcrumb-row buttons

## Context

On each app page (`/apps/<slug>/`) the catalogue-navigation row at the top contains three buttons: **prev** (chevron + collapsible label), **All apps** (caret + always-visible label), and **next** (collapsible label + chevron). All three share the `.side-nav-inline` base class, so on paper they have identical padding (`0.5rem 0.75rem` default, `0.5rem 1rem` on hover). In practice the rendered heights and internal spacing differ because the icons inside the three buttons are different sizes and the "All apps" caret carries an extra inline margin.

User wants the three buttons normalized to the *bigger* of the current sizes — i.e. match the 28 px chevron height. The padding rules are already uniform; only the inner icon sizing and one stray margin need to change.

## What's wrong (in `src/pages/apps/[...slug].astro`)

| Issue | Location | Current | Target |
|---|---|---|---|
| Caret is smaller than chevrons | line 293 (`.side-nav-caret`) | `font-size: 22px` | `font-size: 28px` |
| Caret has extra margin (breaks gap symmetry with prev/next) | line 297 (`.side-nav-caret`) | `margin-right: 0.4rem` | removed — rely on the flex `gap: 0.5rem` from `.side-nav-inline` |
| Mobile breakpoint scales arrows but not caret | line 351 (`@media (max-width: 480px)`) | only `.side-nav-arrow` scaled to `24px` | add `.side-nav-caret` rule scaling to `24px` to match |

Padding (`0.5rem 0.75rem` default, `0.5rem 1rem` on hover) is already shared across all three buttons via `.side-nav-inline` / `.side-nav-inline:hover` — no change needed there.

Label visibility behaviour (prev/next hide-then-expand-on-hover vs. All apps always-visible) is **left alone** — the original question was about heights and padding, and bumping the caret to 28 px is sufficient to equalize button heights without touching label behaviour. (The stacked prev/next label, even when collapsed via `max-width: 0`, has an intrinsic content height of ~27.5 px — eyebrow ~12 px + title ~15.5 px — which is effectively the same as a 28 px chevron.)

## Changes

**File:** `src/pages/apps/[...slug].astro`

### 1. `.side-nav-caret` (≈ lines 291–298)

```css
.side-nav-caret {
    font-family: var(--font-display);
    font-size: 28px;            /* was 22px — match .side-nav-arrow */
    line-height: 1;
    font-weight: 700;
    color: var(--color-primary-container);
    /* margin-right removed — rely on flex gap: 0.5rem from .side-nav-inline */
}
```

### 2. Mobile override at `@media (max-width: 480px)` (≈ lines 344–354)

Add a `.side-nav-caret` block alongside the existing `.side-nav-arrow` block:

```css
@media (max-width: 480px) {
    .side-nav-inline      { padding: 0.35rem 0.55rem; }
    .side-nav-inline:hover{ padding: 0.35rem 0.7rem; }
    .side-nav-arrow       { font-size: 24px !important; }
    .side-nav-caret       { font-size: 24px; }  /* new — match arrow */
}
```

That's the entire diff — three small edits in one file.

## Verification

1. **Dev server.** `task dev`, open `http://localhost:4321/apps/<any-slug>/` in a browser.
2. **Visual height check.** Inspect each of the three buttons in DevTools at desktop width (≥768 px). Confirm `outerHeight` matches across all three (expected ≈ 44 px = 28 px icon + 0.5 rem × 2 padding).
3. **Visual height check (mobile).** Resize to <480 px. Confirm all three buttons remain the same height (expected ≈ 36 px = 24 px icon + 0.35 rem × 2 padding).
4. **Gap symmetry.** On the "All apps" button, confirm the gap between `^` and "All apps" looks the same as the gap between the chevron and the (hover-revealed) label on prev/next — both should now be the flex `gap: 0.5rem`.
5. **Hover behaviour intact.** Hover prev → label slides out and button widens slightly; hover All apps → button widens slightly (no label change); hover next → label slides out on the left and button widens. All three should grow horizontally by the same amount on hover.
6. **No regressions on per-app theming.** Spot-check a coloured app page (e.g. SplitLedger, Finding Your Way) to confirm the caret still picks up `--color-primary-container` from the app theme just like the chevrons do.
