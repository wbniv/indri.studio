# Per-app fonts, then color-mix refactor

## Context

Per-app theming landed (this session): `theme:` frontmatter block + `AppLayout.astro` that overrides studio CSS custom properties on a wrapper div. SplitLedger is wired with orange/teal/cream colors and Fraunces/Geist font names, but two gaps remain:

1. **Fonts don't actually load.** `Base.astro` only loads Space Grotesk + Inter. Setting `--font-display: Fraunces` on the wrapper does nothing unless Fraunces is fetched too. Browser falls back to Georgia.
2. **Hardcoded `rgba(176, 38, 255, ...)` literals stay studio purple.** Pill border, code-block borders, side-nav hover, prose link underlines — these don't read from `--color-primary-container` so they don't theme. SplitLedger's cream page shows purple accents that should be orange.

This plan addresses both, in the user's requested order: **(b) per-app font loading**, then **(a) color-mix refactor**.

## Approach

### B — Per-app Google Fonts loading

**Mechanism**: Astro named slots. `Base.astro` exposes `<slot name="head" />` inside `<head>`. `AppLayout.astro` reads `theme.fontImports?: string[]` and emits `<link slot="head" rel="stylesheet" href={url} />` for each entry. Studio pages (using `Base` directly) load nothing extra; per-app pages get their fonts.

**Decision**: one combined Google Fonts URL per app rather than one URL per family — fewer HTTP requests, identical caching behavior.

**Files to modify**:

1. `src/content.config.ts` — extend the existing `theme` object schema with `fontImports: z.array(z.string()).optional()`. Adjacent to the existing `fontDisplay` / `fontBody` fields.

2. `src/layouts/Base.astro` — add `<slot name="head" />` inside `<head>`, immediately before `<title>` (line 48). Position is irrelevant to rendering but adjacent to the existing Google Fonts links is clearest.

3. `src/layouts/AppLayout.astro` — inside the call to `<Base>`, before the `<div class="app-theme">`, emit one `<link slot="head" rel="stylesheet" href={url} />` per entry in `theme.fontImports`. Also add the two `<link rel="preconnect" />` tags matching the existing pattern in Base (only emit preconnects when the app has fontImports).

4. `src/content/apps/splitledger.md` — add `fontImports:` to the existing `theme:` block with a single Google Fonts URL covering Fraunces + Geist with the weight ranges actually used: `https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..700&family=Geist:wght@300..700&display=swap`

### A — color-mix refactor for hardcoded purple

**Mechanism**: replace every `rgba(176, 38, 255, X)` literal with `color-mix(in srgb, var(--color-primary-container) (X*100)%, transparent)`. Because `--color-primary-container` defaults to `#b026ff`, the rendered color outside `.app-theme` is byte-identical to the literal — zero visual change for studio pages. Inside `.app-theme`, the var resolves to the app primary, so the accent automatically themes.

**Decision**: refactor *all 13 usages globally*, not just the ones inside `.app-theme` scope. Single mechanical pass; nothing to track.

**Files to modify** (one replacement per usage):

1. `src/styles/global.css` — 6 usages: lines 215 (`.glass-card` border), 246–247 (`.app-card-title` text-shadow, 2x), 263 (`.glow-sm` box-shadow), 283–284 (`.pill-purple` border + bg)

2. `src/pages/apps/[...slug].astro` — 5 usages: lines 151 (prose `<a>` underline), 184 (prose `<code>` border), 191 (prose `<pre>` border), 242 (side-nav hover bg), 243 (side-nav hover border)

3. `src/layouts/Base.astro` — 1 usage: line 94 (footer border)

4. `src/pages/index.astro` — 1 usage: line 94 (decorative pixel block — `bg-[rgba(176,38,255,0.12)] border border-[rgba(176,38,255,0.4)]`; arbitrary-value Tailwind, replace each rgba with the color-mix equivalent)

5. `src/components/RingFlare.astro` — 2 usages: lines 72–73 (text-shadow halo)

**Conversion table** (alpha → color-mix percentage):
- `0.1` → `10%`, `0.12` → `12%`, `0.15` → `15%`, `0.18` → `18%`, `0.3` → `30%`, `0.35` → `35%`, `0.4` → `40%`, `0.45` → `45%`, `0.75` → `75%`

Worked example:
```css
/* before */
border: 1px solid rgba(176, 38, 255, 0.18);
/* after */
border: 1px solid color-mix(in srgb, var(--color-primary-container) 18%, transparent);
```

**Cleanup**: remove the now-stale "Hardcoded rgba(176, 38, 255, ...) literals..." comment in `AppLayout.astro` (lines 7–9) once the refactor lands.

## Verification

Run in order. Each step has a pass condition.

1. **Build**: `task build` — clean exit, 9 pages generated.

2. **Studio homepage unchanged**: visit `/`. Compare against pre-refactor screenshot mentally — purple pixel block in apps section, purple footer border, purple ring flares, purple card hover halos all identical. **PASS** = no visual diff.

3. **Other app pages unchanged**: visit `/apps/world-foundry/` (no theme set). Studio purple H1, summary border, code blocks, pill, prose links. **PASS** = identical to pre-change.

4. **SplitLedger per-app theming complete**: visit `/apps/splitledger/`.
   - Page bg cream `#fbf8f1`, body text near-black
   - H1 in orange `#f25e0b`, Fraunces (serif, not Georgia)
   - Summary block's left border orange
   - Body prose in Geist (sans, not system fallback)
   - "Launching Soon" pill — border + bg in orange tint (not purple)
   - Side-nav arrows orange; hover bg orange-tinted
   - Prose `<code>` / `<pre>` borders in orange tint
   - Prose `<a>` underlines in orange tint

   **PASS** = no purple accents anywhere inside the cream content area.

5. **Network panel sanity**: in DevTools on SplitLedger, verify exactly one extra Google Fonts stylesheet loaded (the Fraunces+Geist URL). Studio pages should have only the Space Grotesk+Inter URL.

6. **prefers-reduced-motion**: emulate in DevTools, scroll on SplitLedger. Header still shrinks (already wired earlier) — no, wait: confirm the reduced-motion guard for header shrink no-ops. Out of scope here but worth a glance.
