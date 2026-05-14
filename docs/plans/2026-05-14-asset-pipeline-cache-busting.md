# Asset pipeline cache-busting (DRAFT)

> Status: **draft — not yet executed.** Filed as a follow-up to the
> code-review batch in [`2026-05-14-code-review-implementation.md`](2026-05-14-code-review-implementation.md).
> The next session should review this plan, ask any unresolved
> questions, then execute.

## Context

The studio currently runs a roll-your-own asset pipeline for app screenshots:

- `scripts/optimize-screenshots.mjs` walks `public/screenshots/`, emits AVIF + WebP siblings, and writes `src/data/screenshot-dims.json` (a flat map of public-path → `{width, height}`).
- `src/components/Screenshot.astro` reads the manifest, renders a `<picture>` with the AVIF/WebP `<source>` elements and an `<img>` carrying intrinsic dimensions.
- ~100 source PNG/JPGs plus their 200 converted siblings sit under `public/screenshots/`, served with **stable URLs** (`/screenshots/<app>/<file>.png`).

That's three independent things to keep in sync (sources, variants, manifest) and stable URLs make `Cache-Control: immutable` impossible — code review item H3 caught this. The interim fix (commit `<sha>`, this batch) shortened `/screenshots/*` to `max-age=86400` and dropped `immutable`. This plan replaces the roll-your-own pipeline with Astro's native asset pipeline: hashed filenames under `_astro/*` automatically inherit the existing `immutable, 1y` cache rule, and the AVIF/WebP/dim concerns become free.

## Goal

After this lands:
- Screenshot URLs look like `/_astro/active.<hash>.webp`, content-hashed by Astro.
- No `optimize-screenshots.mjs`, no `screenshot-dims.json`, no `task screenshots`.
- No `/screenshots/*` rule in `public/_headers` (those URLs no longer exist; everything inherits `_astro/*`'s immutable-1y).
- Remaining `public/` files are exactly the genuinely-stable-by-convention ones (favicon, manifest, PWA icons), governed by a new short-TTL + SWR rule.

## Migration steps

### 1. Move sources into `src/assets/`

```sh
mkdir -p src/assets/screenshots
git mv public/screenshots/* src/assets/screenshots/
# Remove the pre-generated derivatives — Astro regenerates from sources
find src/assets/screenshots -type f \( -name '*.avif' -o -name '*.webp' \) -delete
```

The `src/assets/screenshots/<app>/` directory layout is preserved. Astro will re-emit derivatives at build time under `_astro/` with hashed names.

### 2. Update the content-collection schema

`src/content.config.ts` — the `apps` collection schema's `screenshots` (and `cardImages`) fields currently type `src: z.string()`. Switch to Astro's `image()` helper so the value is resolved to an `ImageMetadata` object at collection-load time:

```ts
import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const apps = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/apps" }),
  schema: ({ image }) => z.object({
    // ...other fields unchanged...
    screenshots: z
      .array(z.object({
        src: image(),
        alt: z.string().optional(),
      }))
      .default([]),
    cardImages: z
      .array(z.object({
        src: image(),
        alt: z.string().optional(),
      }))
      .default([]),
    // ...
  }),
});
```

Note: the schema becomes a function of `{ image }`, not a bare object — Astro 6 hands the image loader in via that argument.

### 3. Update each app's frontmatter

`src/content/apps/*.md` — relative paths replace absolute ones. Astro resolves these relative to the markdown file itself:

```yaml
screenshots:
  - { src: "../../assets/screenshots/parking-space/active.png", alt: "..." }
```

(Confirm the exact relative-path syntax Astro 6 accepts — it might prefer `./assets/...` if assets live next to content, or some other convention. Verify with one app first before bulk-editing.)

### 4. Rewrite `Screenshot.astro`

`src/components/Screenshot.astro` currently does its own `<picture>` markup with manual AVIF/WebP `<source>` tags + manifest lookup. Replace with Astro's `<Picture />` component:

```astro
---
import { Picture } from "astro:assets";
import type { ImageMetadata } from "astro";

interface Props {
  src: ImageMetadata;
  alt?: string;
  loading?: "eager" | "lazy";
  class?: string;
}

const { src, alt = "", loading = "lazy", class: className = "block w-full h-auto" } = Astro.props;
---

<Picture
  src={src}
  alt={alt}
  formats={["avif", "webp"]}
  loading={loading}
  decoding="async"
  class={className}
/>
```

`<Picture />` emits the same `<picture><source srcset=…/>…<img …/></picture>` structure today's manual markup produces, plus intrinsic `width`/`height` derived from the source.

### 5. Update call sites

Any `.astro` page that calls `<Screenshot src="…" />` now passes the resolved `ImageMetadata` from the content entry, not a string. Check:

```sh
grep -rn 'Screenshot' src/pages src/layouts src/components
```

…and update each callsite.

### 6. Delete the old pipeline

```sh
rm scripts/optimize-screenshots.mjs
rm src/data/screenshot-dims.json
# (and `rmdir src/data` if empty)
```

Edit `Taskfile.yml`:
- Remove the `screenshots` task.
- Remove `deps: [screenshots]` from `build` and `deploy`.

Edit `public/_headers`:
- Remove the entire `/screenshots/*` rule (the comment block too).
- Add a stable-by-convention rule for the remaining `public/` files:
    ```
    # Stable-URL-by-convention files (browser, PWA, search-engine spec).
    # Can't hash these — clients look them up by literal name.
    # Short max-age plus stale-while-revalidate lets in-place updates
    # propagate within a day without ever paying a cold fetch on revalidate.
    /favicon.ico
      Cache-Control: public, max-age=86400, stale-while-revalidate=604800
    /favicon.svg
      Cache-Control: public, max-age=86400, stale-while-revalidate=604800
    /apple-touch-icon.png
      Cache-Control: public, max-age=86400, stale-while-revalidate=604800
    /icon-*.png
      Cache-Control: public, max-age=86400, stale-while-revalidate=604800
    /site.webmanifest
      Cache-Control: public, max-age=86400, stale-while-revalidate=604800
    ```

### 7. (Optional) Store-badge SVGs

`public/img/store-badges/*.svg` are tiny + low churn but could ride the same wagon. Leave them in `public/` for now (they're spec-shaped: `/img/store-badges/<platform>.svg` URLs feel reasonable) unless a future need surfaces.

## Verification

1. `task build` — exits 0. No `optimize-screenshots` warnings, no manifest writes.
2. `find dist/screenshots/ 2>/dev/null` — should error (directory gone).
3. `find dist/_astro/ -name '*.webp' | wc -l` — should be ≥ 200 (one or two variants per source).
4. `grep -o 'srcset="[^"]*"' dist/apps/splitledger/index.html | head -1` — should show `_astro/...webp` paths with hash suffixes.
5. `grep '/screenshots/\*' public/_headers` — should be 0 matches (rule deleted).
6. Open each `/apps/<slug>/` page in dev: every screenshot renders at the same dimensions as today; no visual regression.
7. `du -sh dist/_astro/*.webp dist/_astro/*.avif | sort -h | tail -5` — largest variants stay under ~300 KB.
8. `git status` — `public/screenshots/`, `scripts/optimize-screenshots.mjs`, `src/data/screenshot-dims.json` all gone; new files under `src/assets/screenshots/`.

## Open questions for next-session review

- **Frontmatter path convention** — does Astro 6's `image()` schema accept `../../assets/...` paths from markdown frontmatter, or does it expect a specific anchor? Verify with one app before bulk-editing.
- **`cardImages` field** — currently used as a homepage-card blurred-background. Confirm it still renders correctly through `<Image />` / `<Picture />` (the blur is a CSS filter; the underlying `<img>` shape may change).
- **CI cache** — once `optimize-screenshots.mjs` is gone, the GitHub Actions runner's `dist/_astro/` is rebuilt cold every run. Acceptable (variants are fast to regenerate), but worth a one-build wall-clock measurement before declaring done.

## When to land

After the rest of the code-review batch settles. Independent commit, single-shot migration (don't split per-app — keeps the schema change atomic).
