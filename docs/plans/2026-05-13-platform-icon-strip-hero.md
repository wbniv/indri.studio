# Plan: Platform-icon strip under hero tagline — final shipped state

## Context

The studio homepage hero (`src/pages/index.astro:21–38`) ran the "SOFTWARE / for everyone." display headline plus a single tagline line, then dropped into ~400 px of empty space before the apps grid. This change ships a small horizontal strip of platform glyphs immediately below the tagline — inside the same purple-bordered column — that names the studio's canonical platforms, with a slow sequential Phosphor-purple glow that loops across the row.

Two iterations on top of the original plan landed during the work:
- **TV added** alongside phone / tablet / console / web (user pointed out Chromecast was missing). Generic `tv` platform key, `cast` Material Symbol, "TV" aria-label. `CLAUDE.md` updated to match.
- **Sequential glow loop** replaced the originally-planned static row after the user asked to "juzsh it up". Each icon ramps from opacity 0.35 → 1.0 with a neon `text-shadow`, 1.2 s apart, 6 s total cycle. Reduced-motion: static at opacity 0.5.

## What shipped

### `src/components/PlatformIcon.astro` (new)
Single-icon primitive. Props: `platform: "phone" | "tablet" | "console" | "tv" | "web"`, `class?: string`. Renders a `<span class="material-symbols-outlined" role="img" aria-label={label}>{symbol}</span>`. Symbol map:

| Platform | Symbol | aria-label |
|---|---|---|
| `phone` | `smartphone` | "Phone" |
| `tablet` | `tablet` | "Tablet" |
| `console` | `sports_esports` | "Console" |
| `tv` | `cast` | "TV" |
| `web` | `public` | "Web" |

Material Symbols Outlined is already preloaded in `src/layouts/Base.astro:53–58`, so no new font load.

### `src/pages/index.astro` (edit)
- Imported `PlatformIcon`.
- Wrapped the tagline `<p>` and the new `<ul>` in a shared `<div class="max-w-xl mt-10 border-l-2 border-primary-container pl-6">` so they read as one bordered column.
- `<ul class="platform-strip flex items-center gap-6 md:gap-8 mt-6 list-none p-0">` containing five `<li><PlatformIcon … class="text-[28px] md:text-[32px]" /></li>` in order: phone, tablet, console, tv, web.

### `src/styles/global.css` (edit, inside `@layer components`)
- `.platform-strip .material-symbols-outlined` — sets `color: var(--color-primary-container)`, `opacity: 0.35`, `animation: platform-glow 6s ease-in-out infinite`.
- `nth-child(2..5)` selectors set `animation-delay` to 1.2 / 2.4 / 3.6 / 4.8 s.
- `@keyframes platform-glow` — 0%/20%/100% at faint baseline; 10% at full opacity + `text-shadow: 0 0 16px var(--color-primary-container)` for the neon flash.
- `@media (prefers-reduced-motion: reduce)` — disables animation, sets opacity 0.5.

### `CLAUDE.md` (edit)
Line 5: canonical platform list now reads "phones, tablets, consoles, TVs, and the web" (added TVs).

### `docs/plans/2026-05-13-hero-platform-icon-strip.md` (new)
In-repo plan capturing the design + verification, per project convention.

### `TODO.md` (edit)
Marked done, moved to the done section, linked to the in-repo plan.

## Verification

1. **`task build`** — clean.
   ```
   22:55:45 [build] ✓ Completed in 1.23s.
   22:55:45 [build] 11 page(s) built in 1.62s
   22:55:45 [build] Complete!
   ```
   **PASS**

2. **`dist/index.html` contains all five platform icons in order.**
   ```
   $ grep -o 'aria-label="[^"]*"' dist/index.html | head
   aria-label="Phone"
   aria-label="Tablet"
   aria-label="Console"
   aria-label="TV"
   aria-label="Web"
   aria-label="Email Indri"
   ```
   **PASS**

3. **Built CSS bundle includes the keyframes + selectors.**
   ```
   $ grep -o 'platform-glow[^}]*}' dist/_astro/Base.*.css | head
   platform-glow}
   platform-glow{0%,20%,to{opacity:.35;text-shadow:0 0 #0000}
   ```
   **PASS**

4. **Visual checks in `task dev` (http://localhost:4322/):** strip renders in the bordered column; each icon briefly glows full Phosphor + neon shadow then returns to faint, traversing left-to-right on a 6 s loop. _Deferred to user visual confirmation — user signed off ("commit this") after the juzsh iteration._

5. **`prefers-reduced-motion: reduce`** — animation disabled; row stays at opacity 0.5. **PASS** by inspection (CSS media-query block present and tested via standard pattern used elsewhere in `global.css`).

## Second juzsh pass (in progress)

User reviewed and pushed for more. Picked, layering on top of the glow loop:

- **Bigger icons**: `text-[28px] md:text-[32px]` → `text-[40px] md:text-[48px]` (≈ +50 % at desktop).
- **Hairline behind the row** (#6): 1 px line in `color-mix(in srgb, var(--color-primary-container) 20%, transparent)` runs horizontally through the icon midline, fading slightly at both ends. Implementation: `background: linear-gradient(...)` on `.platform-strip` with `background-size: 100% 1px; background-position: center; background-repeat: no-repeat` — avoids pseudo-element + z-index dance.
- **Trailing caption** (#7): `ON EVERY SCREEN YOU OWN`, in `font-display uppercase tracking-[0.2em] text-[10px] text-on-surface-variant` (same recipe as the team-card role labels). Structural change: wrap the `<ul>` + caption in a flex container so they sit on one row, vertically centred.
- **Hover lift** (#5): each icon lifts `translateY(-3px) scale(1.08)` on `li:hover` with a 0.2 s ease-out transition on `transform`. Keyframes only touch `opacity` and `text-shadow`, so the glow loop and hover live on different properties — no fighting.

Rejected: tracked caps under each icon (#1), tinted-square cards (#2), cards + labels combo (#4).

Files to edit:
- `src/pages/index.astro` — bump icon sizes; wrap `<ul>` + new `<span class="platform-caption">…</span>` in an outer flex `<div>`; keep tagline structure as is.
- `src/styles/global.css` (inside `@layer components`) — add `background: linear-gradient(...)` to `.platform-strip`; add `transition: transform 0.2s ease-out` on `.platform-strip .material-symbols-outlined`; add `.platform-strip li:hover .material-symbols-outlined { transform: translateY(-3px) scale(1.08); }`; reduced-motion override disables the transform too.

## Closing step

After this pass: rebuild, eyeball at http://localhost:4322/, then commit if user signs off. Staged files (only mine; Taskfile.yml + other untracked files in the working tree belong to another in-flight task and stay unstaged):

```
CLAUDE.md
TODO.md
docs/plans/2026-05-13-hero-platform-icon-strip.md
src/components/PlatformIcon.astro
src/pages/index.astro
src/styles/global.css
```

Commit message: `Hero: platform-icon strip with sequential Phosphor glow loop`.
