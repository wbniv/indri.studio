# Fix Lighthouse audit findings (post-v0.1.13)

## Context

First production [Lighthouse](https://developer.chrome.com/docs/lighthouse) run on `indri.studio` after the v0.1.13 deploy flagged four real issues (full details in `docs/investigations/2026-05-13-lighthouse-audit.md`). The cache-TTL recommendation was withdrawn — we're still actively developing the site and don't have a cache-busting plan, so long-immutable cache headers would trap users on stale assets.

The four remaining fixes:

| # | Issue | File(s) | Notes |
|---|---|---|---|
| A | Phosphor purple role text on team cards fails WCAG AA contrast on charcoal card surface | `src/pages/index.astro` | Foreground/background are both mid-luminance; impossible to clear at any size while keeping Phosphor accent — drop the accent on the tiny role line |
| B | Footer `©` link `opacity-50` is too dim for contrast | `src/layouts/Base.astro` | Bump to `opacity-70` |
| C | `Material Symbols Outlined` CSS is render-blocking on every page even though only `404.astro` and `apps/[...slug].astro` use it | `src/layouts/Base.astro` | Switch from blocking `<link rel="stylesheet">` to non-blocking *preload-then-swap* — keeps icons available everywhere without paying the render-blocking cost |
| D | SplitLedger LCP 8.3 s from unoptimized PNG screenshots | `src/pages/apps/[...slug].astro` (currently modified by another agent) | **Deferred.** Write a follow-up plan; don't touch the slug file mid-edit |

## Fixes

### A — Team role contrast (`src/pages/index.astro`)

Current (failing):

```astro
<p class="font-display uppercase tracking-[0.2em] text-[10px] text-primary-container mb-4">
  {member.data.role}
</p>
```

Phosphor `#B026FF` on charcoal `#4A4641` computes to a contrast ratio of ~1.96:1 (well below WCAG AA's 4.5:1). Both colours sit in the mid-luminance band; no size bump can rescue them.

Change `text-primary-container` → `text-on-surface-variant` (cream-grey `#C8C0B8`). That matches the existing app-card summary line on the homepage (which already uses `text-on-surface-variant` and passes contrast), unifying the small-text accent treatment across the two homepage card grids. Loses a tiny bit of Phosphor "pop" on the team strip; the brand accent still lives on the team-card name and the placeholder bio's framing.

### B — Footer `©` link opacity (`src/layouts/Base.astro`)

Current (failing — effective rgba over near-black footer base computes to ~3.58:1 contrast):

```astro
<a href="/colophon" class="opacity-50 hover:opacity-100 hover:text-primary-container ...">
  © {new Date().getFullYear()}
</a>
```

Change `opacity-50` → `opacity-70`. At 0.7 the effective colour lands around `#9C9893` on `#1A1815`, contrast ratio ~5.97:1 — comfortably above 4.5:1 with margin to spare. Still visibly muted; hover state (`opacity-100`) continues to pop.

### C — Non-blocking Material Symbols Outlined (`src/layouts/Base.astro`)

Three pages currently reference the icon font:

- `src/pages/404.astro` — home / apps icons (decorative, `aria-hidden`)
- `src/pages/apps/[...slug].astro` — prev/next chevrons, "apps" grid icon, hourglass for upcoming releases
- *colophon.astro* mentions the font *by name* in copy but doesn't use any `material-symbols-outlined` glyphs

Removing the `<link rel="stylesheet">` from Base would break icon rendering on 404 and app pages. Moving it to only those pages would require touching `[...slug].astro` (currently in-flight by another agent) and `404.astro` (untracked, not mine to commit).

**Use the preload-then-swap pattern instead** — fetches the CSS asynchronously, applies it once loaded, never blocks render:

```astro
<link
  rel="preload"
  href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
  as="style"
  onload="this.onload=null; this.rel='stylesheet'"
/>
<noscript>
  <link
    rel="stylesheet"
    href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
  />
</noscript>
```

Effect:
- Browsers fetch the CSS without blocking render.
- `onload` flips `rel` to `stylesheet`, applying the rules.
- `<noscript>` fallback preserves icons for the (vanishingly few) JS-disabled users.
- On pages that don't use the font (`/` and `/colophon`), the CSS still downloads but in the background — zero render-blocking cost.
- On pages that do (404, apps): icons may briefly appear as their textual ligatures ("home", "apps", "chevron_left") before the font activates. Since they're `aria-hidden` decorative glyphs, this FOUT is acceptable and short (~100 ms on a fast connection).

Keep the Space Grotesk + Inter `<link>` as-is — those are the primary fonts and a visible FOUT on body copy would be much more disruptive than the icon-font FOUT. They already use `display=swap` so missing-font fallback to system serifs/sans is bounded.

### D — SplitLedger image optimization (deferred)

The slug page (`src/pages/apps/[...slug].astro`) is currently modified by another agent. Touching it risks conflicting with their in-flight work. Writing a separate plan instead: `docs/plans/2026-05-13-app-screenshot-image-optimization.md` (new) — describes the approach (sharp-driven build step generating AVIF + WebP variants alongside the source PNGs in `public/screenshots/<slug>/`, swap `<img>` → `<picture>` in the rendering component) without implementing. The owner of the slug file can pick it up after their current changes land.

## Files to change

| File | Change |
|---|---|
| `src/pages/index.astro` | Team-strip role text: `text-primary-container` → `text-on-surface-variant` (single class swap on the `<p>` for `member.data.role`) |
| `src/layouts/Base.astro` | (a) Footer `©` link: `opacity-50` → `opacity-70`. (b) Replace `<link rel="stylesheet">` for Material Symbols with `<link rel="preload" ... onload>` + `<noscript>` fallback |
| `docs/plans/2026-05-13-app-screenshot-image-optimization.md` | **New plan.** Describes the AVIF/WebP variant build step + `<picture>` rendering approach for SplitLedger (and all other) app screenshots. Not implemented in this change |
| `docs/investigations/2026-05-13-lighthouse-audit.md` | Mark items A/B/C as **resolved** with the commit hash; leave D as **deferred per follow-up plan** |

## Verification

`task dev` running on [localhost:4321](http://localhost:4321). After landing:

1. **A — Team contrast.** Open [the homepage](http://localhost:4321/), scroll to the team section. Role text (`Co-founder · Engineering` etc.) renders in soft cream-grey instead of Phosphor purple. Visually consistent with the app-card summary lines above.
2. **B — Footer link.** Footer `©` link sits at 70 % opacity. Hover still pops to full Phosphor purple.
3. **C — Non-blocking icons.** Open Chrome DevTools → Network. Reload [the homepage](http://localhost:4321/). The Material Symbols CSS request should *not* be in the critical render path (no longer flagged in Performance audit). Reload [/404](http://localhost:4321/404) (or [an apps page](http://localhost:4321/apps/splitledger/)) — icons render correctly after a brief moment (the FOUT, which is acceptable for `aria-hidden` decorative glyphs).
4. **C — JS disabled.** Disable JavaScript in DevTools. Reload an icon-using page. The `<noscript>` fallback `<link rel="stylesheet">` activates and icons render normally (synchronously).
5. **Re-run Lighthouse on production after deploy:**
   - Homepage Accessibility should hit ≥ 95 (was 92) — both contrast failures resolved.
   - All-pages Performance should bump by 3–8 points each from removing Material Symbols from the critical path.
   - SplitLedger Performance remains poor (~57) — addressed by D in a follow-up.

## Commit

One commit covering A + B + C + the new follow-up plan + investigation-doc resolution annotations.
