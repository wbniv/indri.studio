# indri.studio — Design Reference

> Living design document. When tokens, components, or decisions change, update this file in the same commit.

---

## Philosophy

Two lenses shape every decision.

**Hoox-inspired structure.** Dark background, single bold accent, content-rich sectional rhythm, bold sans-serif typography. Pages breathe: a section earns whitespace, not a filler section.

**Ringtail-lemur palette.** The ring-tailed lemur's warm-grey body and black-and-white banded tail map directly to the site's grey scale. The Phosphor neon purple is the flash of eye-catch — used for the iris, the glow, the moment of hover — not spread across every surface.

---

## Color

All values live in [`src/styles/global.css`](src/styles/global.css). Never hardcode hex in components — use the tokens.

### Grey scale (warm-tinted)

| Token | Hex | Role |
|-------|-----|------|
| `--color-grey-50` | `#f5f0e8` | High-emphasis text, cream |
| `--color-grey-200` | `#c8c0b8` | Secondary text, muted UI |
| `--color-grey-400` | `#8e8780` | Low-contrast dividers, outlines |
| `--color-grey-700` | `#4a4641` | Card surfaces |
| `--color-grey-900` | `#3d3833` | Page background |
| `--color-grey-1000` | `#0a0908` | Footer / deepest UI |

<div style="display:flex;gap:10px;flex-wrap:wrap;margin:10px 0 20px;align-items:flex-end">
<div style="text-align:center">
<div style="width:48px;height:48px;background:#f5f0e8;border-radius:4px;border:1px solid rgba(0,0,0,0.15);margin-bottom:4px">
</div>
<code style="font-size:10px;color:#888">grey-50</code>
</div>
<div style="text-align:center">
<div style="width:48px;height:48px;background:#c8c0b8;border-radius:4px;border:1px solid rgba(0,0,0,0.15);margin-bottom:4px">
</div>
<code style="font-size:10px;color:#888">grey-200</code>
</div>
<div style="text-align:center">
<div style="width:48px;height:48px;background:#8e8780;border-radius:4px;border:1px solid rgba(0,0,0,0.15);margin-bottom:4px">
</div>
<code style="font-size:10px;color:#888">grey-400</code>
</div>
<div style="text-align:center">
<div style="width:48px;height:48px;background:#4a4641;border-radius:4px;border:1px solid rgba(0,0,0,0.15);margin-bottom:4px">
</div>
<code style="font-size:10px;color:#888">grey-700</code>
</div>
<div style="text-align:center">
<div style="width:48px;height:48px;background:#3d3833;border-radius:4px;border:1px solid rgba(255,255,255,0.12);margin-bottom:4px">
</div>
<code style="font-size:10px;color:#888">grey-900</code>
</div>
<div style="text-align:center">
<div style="width:48px;height:48px;background:#0a0908;border-radius:4px;border:1px solid rgba(255,255,255,0.12);margin-bottom:4px">
</div>
<code style="font-size:10px;color:#888">grey-1000</code>
</div>
</div>

### Semantic surface tokens

| Token | Maps to | Role |
|-------|---------|------|
| `--color-surface` | grey-900 | Page background |
| `--color-surface-container` | grey-700 | Card background |
| `--color-surface-container-high` | `#5b5650` | Elevated card on hover |
| `--color-surface-container-lowest` | grey-1000 | Footer base |
| `--color-on-surface` | grey-50 | Body text on dark |
| `--color-on-surface-variant` | grey-200 | Secondary text |
| `--color-outline` | grey-400 | Borders, dividers |
| `--color-outline-variant` | grey-900 | Subtle separators |

### Accent — Phosphor neon purple

| Token | Value | Role |
|-------|-------|------|
| `--color-primary-container` | `#b026ff` | **Main accent** — buttons, active states, glow centre |
| `--color-primary` | `#ddb3ff` | Lighter accent — links, secondary highlights |
| `--color-on-primary-container` | `#1a002b` | Text on filled accent |

<div style="display:flex;gap:10px;flex-wrap:wrap;margin:10px 0 20px;align-items:flex-end">
<div style="text-align:center">
<div style="width:48px;height:48px;background:#b026ff;border-radius:4px;box-shadow:0 0 16px rgba(176,38,255,0.5);margin-bottom:4px">
</div>
<code style="font-size:10px;color:#888">primary-container</code>
</div>
<div style="text-align:center">
<div style="width:48px;height:48px;background:#ddb3ff;border-radius:4px;border:1px solid rgba(0,0,0,0.1);margin-bottom:4px">
</div>
<code style="font-size:10px;color:#888">primary</code>
</div>
<div style="text-align:center">
<div style="width:48px;height:48px;background:#1a002b;border-radius:4px;border:1px solid rgba(255,255,255,0.12);margin-bottom:4px">
</div>
<code style="font-size:10px;color:#888">on-primary-container</code>
</div>
</div>

### Tertiary & error

| Token | Value | Role |
|-------|-------|------|
| `--color-tertiary` | `#f4ecff` | Pale lavender — lightest tint |
| `--color-tertiary-container` | `#d4c6e8` | Lavender mid |
| `--color-error` | `#ffb4ab` | Error text |
| `--color-error-container` | `#93000a` | Error background |

<div style="display:flex;gap:10px;flex-wrap:wrap;margin:10px 0 20px;align-items:flex-end">
<div style="text-align:center">
<div style="width:48px;height:48px;background:#f4ecff;border-radius:4px;border:1px solid rgba(0,0,0,0.1);margin-bottom:4px">
</div>
<code style="font-size:10px;color:#888">tertiary</code>
</div>
<div style="text-align:center">
<div style="width:48px;height:48px;background:#d4c6e8;border-radius:4px;border:1px solid rgba(0,0,0,0.1);margin-bottom:4px">
</div>
<code style="font-size:10px;color:#888">tertiary-container</code>
</div>
<div style="text-align:center">
<div style="width:48px;height:48px;background:#ffb4ab;border-radius:4px;border:1px solid rgba(0,0,0,0.1);margin-bottom:4px">
</div>
<code style="font-size:10px;color:#888">error</code>
</div>
<div style="text-align:center">
<div style="width:48px;height:48px;background:#93000a;border-radius:4px;border:1px solid rgba(255,255,255,0.12);margin-bottom:4px">
</div>
<code style="font-size:10px;color:#888">error-container</code>
</div>
</div>

### Usage rules

- **One accent per viewport.** The Phosphor purple is the focal point. Don't apply it to more than one element in the same layout region without a clear visual hierarchy reason.
- **Borders use the accent at low opacity.** Cards use `1px solid rgba(176, 38, 255, 0.18)`, not a grey outline.
- **No blur or drop-shadow on surfaces.** Glow effects are reserved for hover states and ambient motion only.

---

## Typography

Fonts are self-hosted via Astro Fonts API — no cross-origin font requests at runtime.

### Typefaces

| Role | Family | Weights | Variable |
|------|--------|---------|----------|
| **Display** | Space Grotesk | 300–700 | `--font-display` |
| **Body / UI** | Inter | 300–600 | `--font-body`, `--font-sans` |
| **Monospace** | System stack | — | `--font-mono` |
| **Icons** | Material Symbols Outlined | 100–700 (wght), 0–1 (FILL) | lazy-loaded |

Font loading uses `display: optional` — no flash of unstyled text (FOUT), no layout shift (CLS). Metric-matched fallback faces are computed at build time from the downloaded woff2 files.

<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;600;700&family=Inter:wght@300;400;500;600&display=swap">
<div style="background:#3d3833;border-radius:8px;padding:24px 28px;margin:16px 0 24px;border:1px solid rgba(176,38,255,0.18)">
<div style="font-family:'Space Grotesk',system-ui,sans-serif;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#8e8780;margin-bottom:16px">Space Grotesk — display</div>
<div style="font-family:'Space Grotesk',system-ui,sans-serif;font-size:48px;font-weight:700;line-height:1.1;letter-spacing:-0.02em;color:#f5f0e8;margin-bottom:4px">SOFTWARE for everyone</div>
<div style="font-family:'Space Grotesk',system-ui,sans-serif;font-size:32px;font-weight:600;line-height:1.2;letter-spacing:-0.01em;color:#f5f0e8;margin-bottom:4px">Section Heading</div>
<div style="font-family:'Space Grotesk',system-ui,sans-serif;font-size:24px;font-weight:600;line-height:1.3;color:#f5f0e8;margin-bottom:4px">Card Title / Sub-heading</div>
<div style="font-family:'Space Grotesk',system-ui,sans-serif;font-size:14px;font-weight:500;letter-spacing:0.05em;text-transform:uppercase;color:#c8c0b8">BADGE LABEL</div>
</div>
<div style="background:#3d3833;border-radius:8px;padding:24px 28px;margin:0 0 24px;border:1px solid rgba(176,38,255,0.18)">
<div style="font-family:'Inter',system-ui,sans-serif;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#8e8780;margin-bottom:16px">Inter — body / UI</div>
<div style="font-family:'Inter',system-ui,sans-serif;font-size:18px;font-weight:400;line-height:1.6;color:#f5f0e8;margin-bottom:8px">Lead paragraph: If it should exist and we'd use it, we build it. Indri doesn't pick a vertical — it picks problems worth solving.</div>
<div style="font-family:'Inter',system-ui,sans-serif;font-size:16px;font-weight:400;line-height:1.6;color:#c8c0b8;margin-bottom:8px">Body copy at 16px: Split bills, settle accounts. Across currencies, across continents. SplitLedger handles the math so friendships survive the trip.</div>
<div style="font-family:'Inter',system-ui,sans-serif;font-size:16px;font-weight:300;line-height:1.6;color:#c8c0b8">Light 300 — supporting text, captions, secondary metadata.</div>
</div>

### Scale

| Token | Size | Line height | Letter spacing | Weight | Use |
|-------|------|-------------|----------------|--------|-----|
| `--text-headline-lg` | 48px | 1.1 | −0.02em | 700 | Hero statements |
| `--text-headline-md` | 32px | 1.2 | −0.01em | 600 | Section headings |
| `--text-headline-sm` | 24px | 1.3 | 0 | 600 | Card titles, sub-headings |
| `--text-body-lg` | 18px | 1.6 | 0 | 400 | Lead paragraphs |
| `--text-body-md` | 16px | 1.6 | 0 | 400 | Standard body copy |
| `--text-label-md` | 14px | 1.0 | +0.05em | 500 | Badges, labels, nav items |

### Rules

- Display headings: Space Grotesk, tight leading (1.0–1.1 for hero, 1.2 for section heads).
- Body: Inter, generous leading (1.6+).
- All-caps labels: Space Grotesk or Inter at label-md, +0.05em tracking.
- Never mix more than two weights in the same paragraph block.

---

## Spacing & layout

| Token | Value | Role |
|-------|-------|------|
| `--spacing-unit` | 4px | Base unit for all spacing |
| `--spacing-gutter` | 24px | Horizontal page margins |
| `--spacing-margin` | 32px | Vertical section separation |
| `--container-max` | 1280px | Max content width |

### Responsive breakpoints (Tailwind v4 defaults)

| Name | Width |
|------|-------|
| `sm` | 640px |
| `md` | 768px |
| `lg` | 1024px |
| `xl` | 1280px |
| `2xl` | 1536px |

### Layout patterns

**Page padding:** `px-6` → `md:px-8` → `lg:px-[var(--spacing-margin)]`

**App gallery grid:** `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`

**Screenshot gallery:** `grid-cols-1 sm:grid-cols-2`

**Hero height:** `min-h-[640px]` → `md:min-h-[760px]`

### Border radius

| Token | Value | Use |
|-------|-------|-----|
| `--radius-DEFAULT` | 0.125rem | Cards (hard, barely rounded) |
| `--radius-lg` | 0.25rem | Buttons |
| `--radius-xl` | 0.5rem | Dialogs |
| `--radius-full` | 0.75rem | Badges, pills |

The site reads as sharp-edged and precise. Avoid rounding that reads as "friendly app UI" — the cards are industrial.

---

## Components

All components are Astro `.astro` files — server-side rendered, zero JS unless explicitly needed.

### Layouts

**`Base.astro`** — Root layout. Owns: sticky header (purple band, shrinks on scroll), footer, pinstripe background animation, `ClientRouter` for view transitions, inline critical CSS, font preloads.

**`AppLayout.astro`** — Wraps `Base` for per-app pages. Accepts `theme` frontmatter and writes it as CSS custom properties on a wrapper `div`. The entire app subtree inherits via cascade.

### UI components

| Component | File | Purpose |
|-----------|------|---------|
| MaterialSymbols | `components/MaterialSymbols.astro` | Lazy-loads Material Symbols icon font (print → screen swap) |
| RingFlare | `components/RingFlare.astro` | 10 ambient Phosphor rings with staggered animations |
| PlatformIcon | `components/PlatformIcon.astro` | Named platform → Material Symbol icon |
| Screenshot | `components/Screenshot.astro` | Responsive `<picture>` serving AVIF/WebP at 4 widths |
| StoreBadges | `components/StoreBadges.astro` | Platform badge row (App Store, Google Play, Steam, Blender Extensions, GitHub) |
| ScrollToTop | `components/ScrollToTop.astro` | Fixed button, appears past 50% scroll, lifts above footer |

### Planned components (not yet wired)

- `AppGallery` — reads `getCollection('apps')`, renders the card grid.
- `ScreenshotGallery` — shape-aware screenshot grid for per-app pages.
- `TeamStrip` — homepage strip of `featured: true` team members.

---

## Iconography

**Material Symbols Outlined** — the only icon set used. Variable font; `wght` 100–700, `FILL` 0–1. Loaded lazily (not on pages that don't need icons, not render-blocking).

Platform icon mapping:

<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0">
<style>.ms{font-family:'Material Symbols Outlined';font-size:28px;line-height:1;color:#b026ff;display:block;margin-bottom:6px}.icon-label{font-family:monospace;font-size:11px;color:#8e8780}</style>
<div style="display:flex;gap:0;flex-wrap:wrap;background:#3d3833;border-radius:8px;border:1px solid rgba(176,38,255,0.18);margin:12px 0 20px;overflow:hidden">
<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px 24px;border-right:1px solid rgba(176,38,255,0.12);min-width:90px">
<span class="ms">smartphone</span>
<span class="icon-label">Phone</span>
</div>
<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px 24px;border-right:1px solid rgba(176,38,255,0.12);min-width:90px">
<span class="ms">tablet</span>
<span class="icon-label">Tablet</span>
</div>
<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px 24px;border-right:1px solid rgba(176,38,255,0.12);min-width:90px">
<span class="ms">sports_esports</span>
<span class="icon-label">Console</span>
</div>
<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px 24px;border-right:1px solid rgba(176,38,255,0.12);min-width:90px">
<span class="ms">cast</span>
<span class="icon-label">TV</span>
</div>
<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px 24px;border-right:1px solid rgba(176,38,255,0.12);min-width:90px">
<span class="ms">public</span>
<span class="icon-label">Web</span>
</div>
<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px 24px;border-right:1px solid rgba(176,38,255,0.12);min-width:90px">
<span class="ms">chevron_left</span>
<span class="icon-label">Prev</span>
</div>
<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px 24px;border-right:1px solid rgba(176,38,255,0.12);min-width:90px">
<span class="ms">chevron_right</span>
<span class="icon-label">Next</span>
</div>
<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px 24px;border-right:1px solid rgba(176,38,255,0.12);min-width:90px">
<span class="ms">apps</span>
<span class="icon-label">Gallery</span>
</div>
<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px 24px;min-width:90px">
<span class="ms">rocket_launch</span>
<span class="icon-label">Soon</span>
</div>
</div>

**App gallery card accent:** a 12×12 px Phosphor-tinted square in the top-left corner of each card, generated in CSS via gradient.

---

## Motion

All animations respect `prefers-reduced-motion: reduce` by either disabling or substituting a static equivalent.

### Background pinstripe (global)

Three concurrent transform animations on `body::before`:

| Animation | Duration | Effect |
|-----------|----------|--------|
| `stripes-translate` | 60 s linear | Translates the cached gradient (avoids rasterization) |
| `stripes-rotate` | 175 s linear | Sweeps stripe angle |
| `stripes-scale` | 95 s linear | Breathes stripe period |

Pattern: `repeating-linear-gradient` at 135°, transparent 28px → Phosphor-tinted 28–32px hairline. The three prime-coprime durations combine into an ~11-hour repeat cycle before the pattern recurs.

### Header breathe (scroll-driven)

`--header-shrink` (0 → 1) is written by a `scroll` event listener as `scrollY` goes from 0 to half the viewport height. Drives header `padding` (1.125rem → 0.125rem) over 220ms. A `::after` radial pulse on the purple band oscillates opacity 0.4 → 1.0 on a 2.5 s ease-in-out alternate loop.

### Ring flare (studio homepage only)

10 rings scattered across the viewport. Each assigned a prime-numbered duration (29–67 s). Spends ~95% of its cycle invisible; flares briefly as `scale 0.15 → 0.25 → 20` with opacity fade. Animation delay randomised per-visit (JS writes a random `animation-delay` offset on mount). Box-shadow: 4-layer Phosphor glow matching the card hover state.

### App card hover glow

On `.glass-card-hover:hover`, the card title shifts to `--color-primary-container` over 180 ms and gains a 4-layer text-shadow:

```
0 0   4px rgba(255, 230, 255, 0.95)   — white-pink tight core
0 0  12px rgba(221, 179, 255, 0.85)   — lavender middle
0 0  24px rgba(176,  38, 255, 0.75)   — saturated purple
0 0  48px rgba(176,  38, 255, 0.45)   — soft outer halo
```

### Lemur mascot idle

7 s ease-in-out infinite. Asymmetric keyframes at 0%, 22%, 46%, 64%, 82%, 100% combining `translateY` + `rotate` + `scale` for an organic sway. Transform-origin `50% 92%` (near base).

### View transitions (per-app navigation)

Prev/next navigation between app pages: `<html data-nav-dir="prev|next">` directs the slide direction. Outgoing: 280 ms cubic-ease-accelerate slide + 160 ms fade. Incoming: 280 ms cubic-ease-decelerate slide + 280 ms linear fade. Root pseudo-elements suppress animation so header/footer stay still.

### Scroll-to-top

Appears when scrolled past 50% of viewport height. On click: smooth cubic-ease scroll, duration scales with distance. Abortable by user input (wheel, touch, pointer, keyboard). Cleared in `astro:before-preparation`.

---

## Stripe motif

The ring-tailed lemur's banded tail is the recurring visual signature.

**`.stripe-divider`** — horizontal banding between sections. Alternating grey-900 ↔ grey-700 bands. Use sparingly — it's flavour, not structure.

Motif applications (aspirational / in-progress):
- Section dividers
- App-gallery card hover: thin accent line along bottom edge
- Loading indicators: ringtail-tail-inspired alternating dashes

---

## Per-app theming

Every app can declare its own brand kit in frontmatter. `AppLayout.astro` writes these as CSS custom properties on a wrapper `div`; the entire subtree inherits via cascade.

```yaml
theme:
  primary: "#b026ff"        # --color-primary-container
  secondary: "#ddb3ff"      # --color-primary
  background: "#3d3833"     # --color-surface
  text: "#f5f0e8"           # --color-on-surface
  fontDisplay: "Space Grotesk, system-ui, sans-serif"
  fontBody: "Inter, system-ui, sans-serif"
  fontImports:
    - "https://fonts.googleapis.com/css2?family=..."
```

Each app is expected to have a distinct visual identity — not just colour-swapped Indri purple. Examples:

| App | Aesthetic intent |
|-----|-----------------|
| SplitLedger | Warm fintech: amber + slate |
| World Foundry | Red-on-black industrial |
| Finding Your Way | Parchment serif, earthy browns |
| Gusto's Colores | Saturated primary school |
| Pinball Construction Set | Chrome + neon, arcade cabinet |

Until per-app pages are wired, all pages inherit the studio grey + purple palette.

---

## Content collections

### `apps` — `src/content/apps/<slug>.md`

Key fields: `title`, `date`, `summary`, `draft`, `logo`, `screenshots[]`, `cardImages[]`, `storeLinks{}`, `theme{}`.

- `date` in the future → "Launching Soon" pill on the card.
- `draft: true` → excluded from production build.
- `screenshots` → fed to `Screenshot.astro`, which outputs AVIF/WebP `<picture>` elements.
- `storeLinks` → fed to `StoreBadges.astro`.
- `theme` → consumed exclusively by `AppLayout.astro`.

### `team` — `src/content/team/<slug>.md`

Key fields: `name`, `role`, `bio` (1–3 sentences), `order`, `featured`, `socials{}`.

- `featured: true` → appears in the homepage team strip.
- `order` → sort order on `/about`.

---

## Homepage sectional rhythm

1. **Hero statement** — bold display text ("SOFTWARE for everyone").
2. **Platform strip** — phone / tablet / console / TV / web icon row.
3. **App gallery** — card grid; centrepiece of the page.
4. **Studio statement** — short paragraph + tagline.
5. **Footer / CTA strip** — contact + colophon link.

---

## Brand voice

Lead line: *"If it should exist and we'd use it, we build it."*

Backup lines:
- "Indri doesn't pick a vertical. Indri picks problems."
- "Tools that don't grow up to be unicorns."
- "Lemurs hold on. So do our apps."

Tone: direct, maker-confident, dry. No startup enthusiasm, no adjective inflation. State outcomes, not features.

---

## Assets

```
src/assets/
  mascot-lemur.png          # 3.3 MB full-colour Pixar-style illustration
  lemur.png                 # 984 KB variant
  store-badges/
    app-store.svg
    google-play.svg
    steam.svg
    blender-extensions.svg
    github.svg
  screenshots/
    splitledger/            # balances, transactions, contacts, settings
    world-foundry/          # logo, blender-house render, UV seams
    …                       # one folder per app slug

public/
  favicon.svg               # Phosphor purple recolour
  favicon.ico
  apple-touch-icon.png
  icon-192.png
  icon-512.png
  site.webmanifest
  robots.txt
  _headers                  # Cloudflare security headers
```

**Mascot illustration style:** 3D Pixar-render aesthetic, not flat vector. The mascot is photorealistic-ish with depth and rim lighting — contrast with the flat brand geometry of the UI.

---

## Performance notes

- **All CSS inlined.** `build.inlineStylesheets: "always"` in `astro.config.mjs` — no render-blocking stylesheets.
- **Self-hosted fonts.** Astro Fonts API downloads at build time; no runtime cross-origin requests to `fonts.googleapis.com`.
- **Responsive images.** `Screenshot.astro` serves AVIF/WebP at four widths (480, 720, 960, 1440). Source images are processed by Astro's asset pipeline.
- **Hashed assets.** Badge SVGs imported with `?url` → emitted to `/_astro/` with content-hash filenames; `_headers` applies `Cache-Control: immutable` for 1 year.
- **Asset inlining disabled.** `assetsInlineLimit: 0` — no base64 blobs embedded in HTML; each file emits separately for cache granularity.
- **Material Symbols lazy-loaded.** Icon font loaded via print→screen media swap; doesn't block first paint.
