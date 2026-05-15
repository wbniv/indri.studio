---
type: plan
title: Persist header breathe + pinstripe animations across page transitions
date: 2026-05-15
---

## Context

Two CSS `@keyframe` animations visibly reset on every page navigation:

1. **`header::after` breathe** — `header-breathe` (2.5 s ease-in-out alternate), the Phosphor radial pulse on the sticky header. The header is `transition:persist` so the element survives DOM swap, but `ClientRouter` re-applies all inlined `<style>` tags on each nav, which restarts the animation from `t=0`.

2. **`body::before` pinstripe** — three concurrent animations (stripes-translate 60 s / stripes-rotate 175 s / stripes-scale 95 s). Same root cause: CSS re-application on each swap restarts all three from 0.

worldfoundry.org solved the same problem (commit `107cc9c`) using the Web Animations API: save each animation's `currentTime` in `astro:before-preparation`, restore it in `astro:page-load` after the new CSS has been applied and animations are running again from 0.

## Approach

Add a second `<script>` block to `Base.astro` (after the existing scroll-shrink block). Use `document.getAnimations()` filtered by `pseudoElement` + `target` to precisely identify the animations, save their times before nav, and restore them after page-load.

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

## Files changed

- `src/layouts/Base.astro` — new `<script>` block added after scroll-shrink block
- `/home/will/.claude/skills/cloudflare-static-site/SKILL.md` — new "Persist CSS animations" section added

## Verification

1. `task dev` — open http://localhost:4321
2. Navigate: home → any app page → back → another app page
3. **Header breathe:** Phosphor glow should not flash or restart on nav
4. **Pinstripes:** background stripes flow continuously — no visible jump or phase reset on nav
5. DevTools → Animations panel: `body::before` animations show monotonically increasing `currentTime` across navigations
6. DevTools → Rendering → emulate `prefers-reduced-motion` → no animations at all (existing behaviour unchanged)
