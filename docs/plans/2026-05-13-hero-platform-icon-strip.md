# Hero — platform-icon strip under tagline

## Context

The studio homepage hero (`src/pages/index.astro:21–38`) ran the "SOFTWARE / for everyone." display headline plus a single tagline line, then dropped into ~400 px of empty space before the apps grid. The buildout plan's hero rhythm hinted at richer content under the tagline, and `CLAUDE.md` already committed Indri to a canonical platform set: **phones, tablets, consoles, TVs, and the web** (TVs added during this change).

This change ships a horizontal strip of platform glyphs immediately below the tagline — inside the same purple-bordered column — that names those five platforms, threaded together by a hairline, with a slow sequential Phosphor glow that loops across the row and a small caption trailing the row.

It also ships the long-planned `PlatformIcon.astro` component (referenced at `docs/plans/2026-05-13-initial-buildout.md:722`) as a one-icon-at-a-time primitive that can be reused on per-app pages later. No content-collection schema change. The strip uses a hardcoded studio canonical list; if/when the per-app `platforms` enum (`docs/plans/2026-05-13-initial-buildout.md:628–636`) lands, this component is the renderer.

## Approach

### 1. New component: `src/components/PlatformIcon.astro`

Single-icon primitive. Props: `platform: "phone" | "tablet" | "console" | "tv" | "web"`, optional `class`. Renders one `<span class="material-symbols-outlined" role="img" aria-label={label}>{symbol}</span>`. Material Symbols Outlined is preloaded in `src/layouts/Base.astro:53–58`, so no new font load.

| Platform | Symbol | aria-label |
|---|---|---|
| `phone` | `smartphone` | "Phone" |
| `tablet` | `tablet` | "Tablet" |
| `console` | `sports_esports` | "Console" |
| `tv` | `cast` | "TV" |
| `web` | `public` | "Web" |

`tv` is the generic key (covers Chromecast, Apple TV, Fire TV, Google TV, smart-TV apps); the `cast` Material Symbol is the chromecast-style glyph.

### 2. Hero markup

Wrapped the tagline `<p>` and the new strip in a shared bordered `<div>` so they read as one column. Strip + caption sit in an outer flex row.

```astro
<div class="max-w-xl mt-10 border-l-2 border-primary-container pl-6">
  <p class="font-body text-body-lg text-on-surface-variant">
    We build apps people use every day — coloring, bookkeeping, parking, play.
  </p>

  <div class="flex items-center gap-6 md:gap-8 mt-6 flex-wrap">
    <ul class="platform-strip flex items-center gap-6 md:gap-8 list-none p-0">
      <li><PlatformIcon platform="phone"   /></li>
      <li><PlatformIcon platform="tablet"  /></li>
      <li><PlatformIcon platform="console" /></li>
      <li><PlatformIcon platform="tv"      /></li>
      <li><PlatformIcon platform="web"     /></li>
    </ul>
    <span class="platform-caption font-display uppercase tracking-[0.2em] text-[10px] text-on-surface-variant">
      On every screen you own
    </span>
  </div>
</div>
```

Icon size and colour are set in CSS (not Tailwind utilities) — see point 4.

### 3. Sequential glow loop

Each icon ramps from `opacity: 0.35` to `1` with a neon `text-shadow: 0 0 16px var(--color-primary-container)` for the peak, 1.2 s apart in a 6 s cycle, via `@keyframes platform-glow` and per-`nth-child` `animation-delay`. Reduced-motion: animation off, static at opacity 0.5.

### 4. Hairline + hover lift + sizes (in `src/styles/global.css`)

- **Hairline** — `background: linear-gradient(to right, transparent, color-mix(in srgb, var(--color-primary-container) 20%, transparent) 4% 96%, transparent); background-size: 100% 1px; background-position: center; background-repeat: no-repeat;` on `.platform-strip`. 1 px threads through the icon midline; fades at both ends.
- **Hover lift** — `transition: transform 0.2s ease-out` on icons + `.platform-strip li:hover .material-symbols-outlined { transform: translateY(-3px) scale(1.08); }`. Transform is independent of the keyframe (which only touches opacity + text-shadow) so the two don't fight. Reduced-motion: no transform.
- **Icon sizes** — `font-size: 40px` mobile, `48px` at min-width 768 px, set on the `.platform-strip .material-symbols-outlined` two-class selector. **Why not Tailwind `text-[Npx]`:** Google's Material Symbols stylesheet sets `.material-symbols-outlined { font-size: 24px }` and loads via `preload + onload-swap`, so it can land late in the cascade. Single-class Tailwind utilities (`.text-[48px]`) lose to it; the two-class selector wins by specificity. Debug: dev-mode CSS showed `font-size: 48px` rule present but icons rendered at 24 px until specificity was raised.

### 5. `CLAUDE.md`

Canonical platform list updated: "phones, tablets, consoles, TVs, and the web" (added TVs to match the strip).

### Out of scope (deliberate)

- StripedGridMotion in the hero zone — separate decision.
- Pulling platforms from app frontmatter — schema doesn't have the field yet; hardcoded studio list is honest for v1.

## Critical files

| File | Change |
|---|---|
| `src/components/PlatformIcon.astro` | **new** — single-icon primitive |
| `src/pages/index.astro` | hero block: import component, wrap tagline in bordered column, add flex row containing the icon `<ul>` + caption `<span>` |
| `src/styles/global.css` | add `.platform-strip` block: hairline gradient, glow keyframes, icon sizes (specificity-raised), hover transform, reduced-motion overrides |
| `CLAUDE.md` | canonical platforms list: add "TVs" |

## Verification

1. **`task build`** — clean.

   ```
   23:12:05 [build] ✓ Completed in 1.38s.
   23:12:05 [build] 11 page(s) built in 1.85s
   23:12:05 [build] Complete!
   ```
   **PASS**

2. **All five icons + caption present in `dist/index.html`.**

   ```
   $ grep -o 'aria-label="[^"]*"' dist/index.html | head
   aria-label="Phone"
   aria-label="Tablet"
   aria-label="Console"
   aria-label="TV"
   aria-label="Web"
   aria-label="Email Indri"

   $ grep -oE 'On every screen you own|platform-caption' dist/index.html | sort -u
   On every screen you own
   platform-caption
   ```
   **PASS**

3. **Built CSS bundle contains hairline + hover + size rules.**

   ```
   $ grep -oE 'platform-strip\{[^}]+\}|platform-strip li:hover[^}]+\}' dist/_astro/Base.*.css
   platform-strip{background:linear-gradient(90deg,#0000,#b026ff33 4% 96%,#0000)}
   platform-strip li:hover .material-symbols-outlined{transform:translateY(-3px)scale(1.08)}
   ```
   **PASS**

4. **Live dev server (`task dev` → http://localhost:4321/):** icons render at 48 px on desktop / 40 px mobile (after CSS specificity fix), glow cycle runs left-to-right, hover lifts each icon, caption sits trailing the row. Confirmed visually by user after hard-reload.
   **PASS**

5. **`prefers-reduced-motion: reduce`** — animation off, hover transform disabled. **PASS** by inspection (CSS media-query block present).
