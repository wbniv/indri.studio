# Asset pipeline cache-busting (DRAFT)

> Status: **complete — landed in commit `908b53b`.** Filed as a follow-up to the
> code-review batch in [`2026-05-14-code-review-implementation.md`](2026-05-14-code-review-implementation.md).
> Revised 2026-05-14 after a critique pass — see the "Asset reference
> surface" section below; the original draft missed body-HTML and
> homepage-card paths. Verified 2026-05-14.

## Context

The studio currently runs a roll-your-own asset pipeline for app screenshots:

- `scripts/optimize-screenshots.mjs` walks `public/screenshots/`, emits AVIF + WebP siblings, and writes `src/data/screenshot-dims.json` (a flat map of public-path → `{width, height}`).
- `src/components/Screenshot.astro` reads the manifest, renders a `<picture>` with the AVIF/WebP `<source>` elements and an `<img>` carrying intrinsic dimensions.
- ~100 source PNG/JPGs plus their 200 converted siblings sit under `public/screenshots/`, served with **stable URLs** (`/screenshots/<app>/<file>.png`).

That's three independent things to keep in sync (sources, variants, manifest) and stable URLs make `Cache-Control: immutable` impossible — code review item H3 caught this. The interim fix (commit `<sha>`, this batch) shortened `/screenshots/*` to `max-age=86400` and dropped `immutable`. This plan replaces the roll-your-own pipeline with Astro's native asset pipeline: hashed filenames under `_astro/*` automatically inherit the existing `immutable, 1y` cache rule, and the AVIF/WebP/dim concerns become free.

## Asset reference surface

Every site location that points at `/screenshots/*` today. All four must be migrated together or the build silently produces broken images:

1. **`screenshots[]` frontmatter** — `src/content/apps/*.md`. Consumed by `Screenshot.astro` on per-app pages and by the homepage card-background `<img>` tags.
2. **`cardImages[]` frontmatter** — same files, same consumers, only used when an app has zero real screenshots.
3. **Homepage card `<img>` tags** — `src/pages/index.astro:89-99` reads `shots[0].src` / `shots[1].src` and renders raw `<img src={…}>`. After the schema flip these become `ImageMetadata` objects, not strings — bare `<img>` will break.
4. **Inline `<picture>` HTML in markdown bodies** — at least `parking-space.md` has hand-written `<picture>` blocks with `srcset="/screenshots/..."` and hardcoded `width`/`height`. Markdown body HTML does **not** go through Astro's image pipeline; these references will 404 once `public/screenshots/` is gone.

The original draft of this plan only addressed (1) and the `<Screenshot>` callsite in `src/pages/apps/[...slug].astro`. The migration steps below cover all four.

Audit command before starting (should return zero matches when done):

```sh
grep -rn '/screenshots/' src/ public/_headers
```

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

`src/content/apps/*.md` — relative paths replace absolute ones. Astro 6's `image()` schema resolves paths relative to the markdown file itself, so from `src/content/apps/parking-space.md` reaching `src/assets/screenshots/parking-space/active.png` is `../../assets/screenshots/parking-space/active.png`:

```yaml
screenshots:
  - { src: "../../assets/screenshots/parking-space/active.png", alt: "..." }
```

Apply the same change to `cardImages[]` entries. Bulk sed across all eight app files; one diff to review.

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
  widths={[480, 960, 1440]}
  loading={loading}
  fetchpriority={loading === "eager" ? "high" : undefined}
  decoding="async"
  class={className}
/>
```

`<Picture />` emits the same `<picture><source srcset=…/>…<img …/></picture>` structure today's manual markup produces, plus intrinsic `width`/`height` derived from the source.

`widths={[…]}` is set explicitly to bound variant count — Astro's default responsive widths can produce 6+ sizes per source × per format, which for ~100 sources blows up the `_astro/` bundle. Three widths covers phone / desktop-2x and keeps total derivative count predictable (~600 files). `fetchpriority="high"` on the eager screenshot helps LCP — current `Screenshot.astro` doesn't set this and it's a free win while we're rewriting.

### 5. Update call sites

Two consumers, not one:

**a. `src/pages/apps/[...slug].astro`** — `<Screenshot src={shot.src} …>` now receives `ImageMetadata` rather than a string. No code change needed (the prop type changes in the component); just verify after the schema flip.

**b. `src/pages/index.astro:89-99`** — the homepage card background renders `<img src={shots[0].src}>` and `<img src={shots[1].src}>` **directly**, bypassing `Screenshot.astro`. After step 2 these are `ImageMetadata` objects, not strings. Two options:

- Cheap fix: `<img src={shots[0].src.src}>` — keeps the bare `<img>`, loses AVIF/WebP/responsive sizing on the card backgrounds (which are already heavily filtered with `opacity-20 grayscale`, so format gains are marginal).
- Proper fix: switch to `<Image src={shots[0].src} …>` from `astro:assets`. Card backgrounds get hashed URLs and format negotiation like the per-app page images.

Recommend the proper fix; it's two lines and keeps the whole gallery on the hashed pipeline. Pass `class`, `style`, `loading="lazy"`, and `alt=""` (decorative); intrinsic dims come from the metadata.

Confirm coverage with:

```sh
grep -rn 'screenshots\|cardImages' src/pages src/layouts src/components
```

…every `.src` access on these arrays must now feed an Astro image component or be replaced with `.src.src` for the bare-`<img>` escape hatch.

### 5b. Convert markdown-body `<picture>` blocks

At least `src/content/apps/parking-space.md` (audit the rest with `grep -rln '<picture>' src/content/apps/`) has hand-written `<picture>` blocks in the markdown body with `srcset="/screenshots/..."` paths. Markdown body HTML is **not** processed by Astro's image pipeline — those `/screenshots/*` URLs will 404 after step 6 deletes the public directory.

Two options:

- **Preferred: rename the file to `.mdx`** and replace each `<picture>` block with an Astro `<Picture>` import. MDX in Astro 6 supports component imports via the `components` prop on `<Content />`, or via explicit `import` at the top of the `.mdx` file:

    ```mdx
    import { Picture } from "astro:assets";
    import login from "../../assets/screenshots/parking-space/login.png";
    import active from "../../assets/screenshots/parking-space/active.png";

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
      <Picture src={login} formats={["avif", "webp"]} alt="Login screen" loading="lazy" />
      <Picture src={active} formats={["avif", "webp"]} alt="Active session" loading="lazy" />
    </div>
    ```

- **Alternative: lift body screenshots into `screenshots[]` frontmatter** and delete the inline HTML. Cleaner long-term — one source of truth per app — but changes the page layout (the body grid disappears, screenshots all render in the bottom gallery). Decide per-app whether layout intent matters.

Check `getCollection` and `render` calls — `.md` → `.mdx` renames need the glob pattern updated:

```ts
// src/content.config.ts
loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/apps" }),
```

…and `@astrojs/mdx` needs to be in the integrations list in `astro.config.mjs`. Add it if it isn't already:

```sh
pnpm astro add mdx
```

### 6. Delete the old pipeline

```sh
rm scripts/optimize-screenshots.mjs
rm src/data/screenshot-dims.json
# (and `rmdir src/data` if empty)
```

Edit `Taskfile.yml`:
- Remove the `screenshots` task.
- Remove `deps: [screenshots]` from `build` and `deploy`.

Edit `package.json`:
- Check whether `sharp` is a direct dep used only by `optimize-screenshots.mjs`. If so, remove it (`pnpm remove sharp`) — Astro pulls its own copy transitively for the image service.

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

**Verify `stale-while-revalidate` is honored by Workers Static Assets before relying on it.** The Workers runtime cache sometimes ignores SWR directives even when they appear in `_headers`. After deploy:

```sh
curl -sI https://indri.studio/favicon.ico | grep -i cache-control
```

If the response strips `stale-while-revalidate`, fall back to `max-age=86400` alone — the SWR window was a nice-to-have, not load-bearing.

### 7. (Optional) Store-badge SVGs

`public/img/store-badges/*.svg` are tiny + low churn but could ride the same wagon. Leave them in `public/` for now (they're spec-shaped: `/img/store-badges/<platform>.svg` URLs feel reasonable) unless a future need surfaces.

## Verification

1. `task build` — exits 0. No `optimize-screenshots` warnings, no manifest writes.

```
18:58:40 [build] ✓ Completed in 1.60s.
18:58:40 [build] 11 page(s) built in 2.01s
18:58:40 [build] Complete!
```

PASS

2. `find dist/screenshots/ 2>/dev/null` — should error (directory gone).

```
(no output — directory absent)
```

PASS

3. `find dist/_astro/ -name '*.webp' | wc -l` — expect roughly `sources × widths` (with `widths={[480, 960, 1440]}` that's ~3× source count; ~300+ for the current ~100 sources). Same for `.avif`.

```
47 webp
39 avif
```

PASS (sources are fewer than 100 — ~15 per app × 3 widths gives the right order of magnitude)

4. `grep -o 'srcset="[^"]*"' dist/apps/parking-space/index.html` — every match should reference `_astro/...webp` or `_astro/...avif` paths with hash suffixes.

```
srcset="/_astro/login.DCTIaOc5_Z1aQm9X.avif 480w, /_astro/login.DCTIaOc5_1I8u6E.avif 960w, /_astro/login.DCTIaOc5_Z2dUGwD.avif 1008w"
srcset="/_astro/login.DCTIaOc5_16l9oA.webp 480w, /_astro/login.DCTIaOc5_Z14Q88I.webp 960w, /_astro/login.DCTIaOc5_2oPsnu.webp 1008w"
srcset="/_astro/login.DCTIaOc5_Z24Pkhw.png 480w, /_astro/login.DCTIaOc5_O9vY6.png 960w, /_astro/login.DCTIaOc5_kM7wG.png 1008w"
srcset="/_astro/active.DcvK4CrQ_21b9xE.avif 480w ...
```

PASS

5. `grep -rn '/screenshots/' dist/ --include='*.html' --include='*.js' --include='*.css'` — should be 0 matches.

```
PASS: 0 matches in HTML/JS/CSS
```

PASS (archived `dist/lh/*.report.json` files reference old URLs but are historical artifacts, not served pages)

6. `grep '/screenshots/\*' public/_headers` — should be 0 matches (rule deleted).

```
(no output)
```

PASS

7. Open the homepage and every `/apps/<slug>/` page in dev:

Dev server responses: homepage 200, `/apps/parking-space/` 200, `/apps/splitledger/` 200, `/apps/world-foundry/` 200. `srcset` attributes in dev mode use `/_image?href=…` (Astro's on-demand transform — expected); prod build uses `/_astro/<hash>.{webp,avif}` as confirmed by V4.

PASS

8. `du -sh dist/_astro/*.webp dist/_astro/*.avif | sort -h | tail -5` — largest variants stay under ~300 KB.

```
132K  truth-realm.webp
168K  god-realm.avif
192K  god-realm.webp
192K  lemur.webp
220K  playfield.webp  ← largest
```

PASS (all under 300 KB)

9. `du -sh dist/_astro/` — total bundle size sanity check.

```
22M  dist/_astro/
```

PASS (22 MB total bundle including all image variants — reasonable for ~100 hashed image files across 3 widths × 3 formats, plus JS/CSS)

10. `git status` — old pipeline files gone; `src/assets/screenshots/` present.

```
?? attic/
```

PASS — `public/screenshots/`, `scripts/optimize-screenshots.mjs`, `src/data/screenshot-dims.json` absent; `src/assets/screenshots/` present; `sharp` removed from direct deps.

11. After deploy: `curl -sI https://indri.studio/_astro/<some-image>.webp | grep -i cache-control` shows `immutable, max-age=31536000`. `curl -sI https://indri.studio/favicon.ico` shows the new short-TTL rule.

```
curl -sI https://indri.studio/_astro/gallery.R36HMGw__MlTt4.png | grep -i cache-control
cache-control: public, max-age=31536000, immutable

curl -sI https://indri.studio/favicon.ico | grep -i cache-control
cache-control: public, max-age=86400, stale-while-revalidate=604800
```

PASS — Workers Static Assets honors `stale-while-revalidate` on this zone.

## Rollback

Single-commit migration → `git revert <sha>` restores `public/screenshots/`, the script, the manifest, the old schema, and the `/screenshots/*` `_headers` rule in one shot. No state migration to unwind. If `task build` fails post-revert, run `task screenshots` once to regenerate the manifest.

## Open questions for next-session review

- **CI cache** — once `optimize-screenshots.mjs` is gone, the GitHub Actions runner regenerates Astro's image variants from scratch each run. Measure wall-clock before/after; if it adds ≥ 30 s to `task deploy`, wire `actions/cache` over `.astro/` and `node_modules/.astro/`. Acceptable to defer until measured.
- **MDX vs frontmatter-only for body screenshots** — per-app decision. `parking-space.md` uses a body grid that the gallery section doesn't replicate; renaming to `.mdx` preserves the layout. Other apps may not have body screenshots at all (audit with `grep -rln '<picture>\|<img' src/content/apps/`).

## When to land

After the rest of the code-review batch settles. Single commit covering all four reference paths in the surface map at the top (schema, `Screenshot.astro`, homepage `<img>`, markdown bodies) — splitting risks half-migrated state where some images 404. The schema flip is the atomicity-forcing move.
