# Replace Material Symbols icon font with inline SVGs

## Context

The homepage hero flashes raw ligature text ("smartphonetabletpcsseppublis") because the Material Symbols icon font is loaded from Google CDN using a non-blocking `media="print"` trick — the font doesn't render until after the CDN download completes. With only 9 unique icons used across the whole site, replacing with inline SVGs eliminates the external dependency and the flash entirely.

## Icons in use

| Icon name | Material symbol | Used in |
|---|---|---|
| smartphone | `smartphone` | `PlatformIcon` → hero |
| tablet | `tablet` | `PlatformIcon` → hero |
| console | `sports_esports` | `PlatformIcon` → hero |
| tv | `cast` | `PlatformIcon` → hero |
| web | `public` | `PlatformIcon` → hero |
| home | `home` | `404.astro` |
| apps | `apps` | `404.astro`, `apps/[...slug].astro` |
| chevrons | `chevron_left` / `chevron_right` | `apps/[...slug].astro` |
| rocket | `rocket_launch` | `apps/[...slug].astro` |

## Implementation

### 1. Add `@material-symbols/svg-400` package

```bash
pnpm add @material-symbols/svg-400
```

This package ships individual SVG files for every Material Symbols icon at weight 400. We'll read the paths at build time in Astro components — no runtime JS, no font request.

### 2. Create `src/components/MIcon.astro`

A tiny wrapper that reads an SVG file from the package and inlines it:

```astro
---
// Props: name (Material Symbols name), class, label, size (px, default 24)
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

interface Props {
  name: string;
  class?: string;
  label?: string;
  size?: number;
}
const { name, class: className = '', label, size = 24 } = Astro.props;
const svgPath = resolve(`node_modules/@material-symbols/svg-400/outlined/${name}.svg`);
const svgRaw = readFileSync(svgPath, 'utf-8');
// Inject class, aria-label, width/height into the <svg> tag
const svg = svgRaw.replace(
  '<svg ',
  `<svg class="${className}" role="img" aria-label="${label ?? name}" width="${size}" height="${size}" `
);
---
<Fragment set:html={svg} />
```

### 3. Update `PlatformIcon.astro`

Replace the `<span class="material-symbols-outlined">` approach with `<MIcon>`. Map the 5 platform props to Material Symbols names. Keep the existing `role`/`aria-label` semantics by passing `label` to MIcon.

Add a consistent class like `platform-icon` so the CSS animation selectors can target it.

### 4. Update `404.astro`

Replace the two direct `<span class="material-symbols-outlined">home</span>` / `apps` spans with `<MIcon name="home" ...>` / `<MIcon name="apps" ...>`.

### 5. Update `apps/[...slug].astro`

Replace the four icon spans (`chevron_left`, `apps`, `chevron_right`, `rocket_launch`) with `<MIcon>` calls.

### 6. Update `src/styles/global.css`

The platform-strip animation uses `text-shadow` (icon-font-specific). SVG elements don't respond to `text-shadow` — replace with `filter: drop-shadow()`.

Change selector from `.platform-strip .material-symbols-outlined` to `.platform-strip .platform-icon` (or `svg`).

```css
/* before */
text-shadow: 0 0 16px var(--color-primary-container);

/* after */
filter: drop-shadow(0 0 8px var(--color-primary-container));
```

Also update any `font-size` sizing on the icons to use `width`/`height` on the SVG directly (already set via the `size` prop in MIcon).

### 7. Remove `MaterialSymbols.astro`

Delete `src/components/MaterialSymbols.astro`.

Remove it from:
- `src/pages/index.astro` (import + `<MaterialSymbols slot="head" />`)
- `src/pages/404.astro`
- `src/layouts/AppLayout.astro`

## Files to modify

- `package.json` / `pnpm-lock.yaml` — add `@material-symbols/svg-400`
- `src/components/MIcon.astro` — new file
- `src/components/PlatformIcon.astro` — swap span → MIcon
- `src/components/MaterialSymbols.astro` — delete
- `src/pages/index.astro` — remove MaterialSymbols import/usage
- `src/pages/404.astro` — remove MaterialSymbols, swap icon spans
- `src/pages/apps/[...slug].astro` — swap icon spans
- `src/layouts/AppLayout.astro` — remove MaterialSymbols import/usage
- `src/styles/global.css` — update platform-strip selectors + glow effect

## Verification

1. `task build` — clean build, no missing icon errors
2. `task dev` — open homepage; icons render immediately on first paint, no text flash
3. Hero platform icons animate with the purple glow as before
4. Navigate to `/404` — home and apps icons display correctly
5. Open an app detail page — chevron and rocket icons display correctly
6. Confirm no `fonts.googleapis.com` requests in the Network tab
