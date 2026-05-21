---
type: plan
title: Persist pinstripe animation across page transitions
date: 2026-05-15
---

## Context

Two CSS `@keyframe` animations on indri.studio visibly reset on every page navigation:

1. **`header::after` breathe** — `header-breathe` (2.5 s ease-in-out alternate), a screen-blended Phosphor radial pulse on the sticky header. The header is `transition:persist` so it survives DOM swap, but `ClientRouter` re-applies `<head>` (and all inlined `<style>` tags) on each nav, which restarts the animation from `t=0`.

2. **`body::before` pinstripe** — three concurrent animations (stripes-translate 60 s / stripes-rotate 175 s / stripes-scale 95 s) on the fixed background pseudo-element. Same root cause: CSS re-application on each swap restarts all three from 0.

worldfoundry.org solved the same problem (commit `107cc9c`) using the Web Animations API: save each animation's `currentTime` in `astro:before-preparation`, restore it in `astro:page-load` after the new CSS has been applied.

The cloudflare-static-site skill covers the `inTransition` gate pattern but not this technique — it needs the same addition.

---

## Implementation

### 1. `src/layouts/Base.astro` — add a second `<script>` block

Add immediately after the existing `</script>` at line 155, before `</head>`:

```astro
<script>
  // Persist header::after breathe + body::before stripe animations across
  // page transitions. ClientRouter re-applies inlined <style> on each swap,
  // restarting CSS @keyframe animations from 0 even on transition:persist
  // elements. Save currentTime before nav; restore after page-load.
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
    let savedBreathe: number[] = [];
    let savedStripe: number[] = [];

    const getBreatheAnims = () =>
      document.getAnimations().filter((a) => {
        const fx = a.effect as KeyframeEffect | null;
        return fx?.pseudoElement === "::after" &&
          (fx?.target as Element)?.matches?.(".header-fx");
      });

    const getStripeAnims = () =>
      document.getAnimations().filter((a) => {
        const fx = a.effect as KeyframeEffect | null;
        return fx?.pseudoElement === "::before" && fx?.target === document.body;
      });

    document.addEventListener("astro:before-preparation", () => {
      savedBreathe = getBreatheAnims().map((a) => (a.currentTime as number) ?? 0);
      savedStripe  = getStripeAnims().map((a)  => (a.currentTime as number) ?? 0);
    });

    document.addEventListener("astro:page-load", () => {
      getBreatheAnims().forEach((anim, i) => {
        if (savedBreathe[i] != null) anim.currentTime = savedBreathe[i];
      });
      getStripeAnims().forEach((anim, i) => {
        if (savedStripe[i] != null) anim.currentTime = savedStripe[i];
      });
      savedBreathe = [];
      savedStripe  = [];
    });
  }
</script>
```

**Why `document.getAnimations()` + filter:** pseudo-element animations are not reachable via `element.getAnimations()` without `{subtree:true}` (which sweeps the whole page). Filtering by `pseudoElement` + `target` is precise — exactly one animation matches for breathe, exactly three for stripe.

**Why `astro:page-load` not `astro:after-swap`:** CSS is re-applied during swap; `page-load` fires after the new animations are running from 0, which is when `currentTime` assignment takes effect.

**No early-exit guard on `savedX.length`:** if the save captured 0 items (e.g. first load, or reduced-motion toggled mid-session), `forEach` on an empty array is a no-op — no guard needed.

---

### 2. `/home/will/.claude/skills/cloudflare-static-site/SKILL.md` — add new section

After the "Cross-page header animation" section (after its closing `---`), insert:

```markdown
## Persist background CSS animations across page transitions

`ClientRouter` re-applies inlined `<style>` tags on every page swap, restarting CSS `@keyframe` animations from 0. Animations on `body::before` (pinstripe, etc.) visibly jump. Fix with the Web Animations API: save `currentTime` before nav, restore it after the new CSS is live.

### `Base.astro`

\`\`\`astro
<script>
  // Save/restore body::before animation times across ClientRouter swaps.
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
    let savedTimes: number[] = [];

    const getStripeAnims = () =>
      document.getAnimations().filter((a) => {
        const fx = a.effect as KeyframeEffect | null;
        return fx?.pseudoElement === "::before" && fx?.target === document.body;
      });

    document.addEventListener("astro:before-preparation", () => {
      savedTimes = getStripeAnims().map((a) => (a.currentTime as number) ?? 0);
    });

    document.addEventListener("astro:page-load", () => {
      if (!savedTimes.length) return;
      getStripeAnims().forEach((anim, i) => {
        if (savedTimes[i] != null) anim.currentTime = savedTimes[i];
      });
      savedTimes = [];
    });
  }
</script>
\`\`\`

For non-pseudo-element targets (e.g. grid cells): use `element.getAnimations()` and save per-element as a `number[][]`, indexed by DOM position (stable across swaps for server-rendered elements). See worldfoundry.org commit `107cc9c` for the cell-grid variant.
```

---

## Critical files

- `src/layouts/Base.astro` — insert new `<script>` block after line 155
- `/home/will/.claude/skills/cloudflare-static-site/SKILL.md` — append new section after line ~281

---

## Verification

1. `task dev` — open http://localhost:4321
2. Navigate: home → any app page → back → another app page
3. **Header breathe:** watch the Phosphor glow on the header — it should not flash/restart on nav
4. **Pinstripes:** the background stripes should flow continuously — no visible jump or phase reset
5. DevTools → Animations panel: confirm the `body::before` animations show monotonically increasing `currentTime` across navigations (not resetting to 0)
6. DevTools → Rendering → Emulate `prefers-reduced-motion` → confirm no animations play at all (existing behaviour unchanged)
