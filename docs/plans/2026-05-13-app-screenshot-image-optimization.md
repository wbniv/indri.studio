# App screenshot image optimization (AVIF/WebP)

## Context

The first production [Lighthouse](https://developer.chrome.com/docs/lighthouse) audit on 2026-05-13 (full results in `docs/investigations/2026-05-13-lighthouse-audit.md`) found `/apps/splitledger/` performing badly — Performance score **57** with LCP at **8.3 s**. Cause: large unoptimized PNG screenshots in `public/screenshots/<slug>/*.png` rendered directly via plain `<img>`. The Lighthouse `image-delivery-insight` audit flagged both `transactions.png` (~17 kB wasted) and `balances.png` (~13 kB wasted) as candidates for modern-format conversion. The same pattern applies to every per-app page that ships screenshots — splitledger is just the worst.

Switching to a `<picture>` element with [AVIF](https://en.wikipedia.org/wiki/AVIF) and [WebP](https://en.wikipedia.org/wiki/WebP) sources plus the existing PNGs as fallback should cut per-image payload by 30–50 % and bring SplitLedger's LCP into the < 4 s range (and likely Performance into the 80s, on the path to the ≥ 95 target).

**Why this is its own plan, deferred**: at audit time, `src/pages/apps/[...slug].astro` (the file that renders these screenshots) was being modified by another agent. Touching it during their in-flight edits would risk conflicts. This plan defers the rendering swap until their work has settled, but defines the approach.

## Approach

Three stages: build-time variant generation, content-collection awareness, render-time `<picture>` element.

### 1. Variant generation (build step)

Add [`sharp`](https://sharp.pixelplumbing.com) as a dev dependency. Write a build script `scripts/optimize-screenshots.sh` that:

- Walks `public/screenshots/<slug>/` recursively for `*.png` and `*.jpg`/`*.jpeg`.
- For each source image, generates `<basename>.avif` and `<basename>.webp` next to it.
- Skips when a variant already exists *and* its mtime is newer than the source (idempotent — cheap to re-run).
- Uses sharp's `.avif({ quality: 60, effort: 6 })` and `.webp({ quality: 75 })` — good defaults; tunable per pack later.
- Honours `set -euo pipefail` and the project's `-h`/`--help` convention.

Wire into [`Taskfile.yml`](file:///home/will/SRC/indri.studio/Taskfile.yml) as `task screenshots` (standalone) and chain into `task build` via a `deps:` entry so production builds always have current variants.

### 2. Content-collection awareness (optional, nice-to-have)

Two options:

**Option A — implicit (no schema change):** the rendering component just *assumes* `.avif` and `.webp` siblings exist for any `.png` it sees. Cheaper, no migration. Risk: silent breakage if someone adds a PNG and forgets to run `task screenshots`. Mitigated by the `deps:` chain (production builds always run it).

**Option B — explicit in frontmatter:** the screenshot schema in `src/content.config.ts` declares each screenshot's available formats. More verbose but self-documenting. Probably overkill for the current site size.

Recommend **A**. Revisit if the implicit pattern bites.

### 3. Render swap (`<picture>` element)

In whatever component renders screenshots on `/apps/<slug>/` pages (currently inline in `src/pages/apps/[...slug].astro`; consider extracting to `src/components/Screenshot.astro`):

```astro
---
interface Props {
  src: string;       // path like "/screenshots/splitledger/transactions.png"
  alt: string;
  width: number;     // explicit — eliminates CLS
  height: number;
  loading?: "lazy" | "eager";  // default lazy
}
const { src, alt, width, height, loading = "lazy" } = Astro.props;
const stem = src.replace(/\.(png|jpe?g)$/i, "");
---

<picture>
  <source srcset={`${stem}.avif`} type="image/avif" />
  <source srcset={`${stem}.webp`} type="image/webp" />
  <img
    src={src}
    alt={alt}
    width={width}
    height={height}
    loading={loading}
    decoding="async"
    class="block w-full h-auto"
  />
</picture>
```

Note the explicit `width`/`height` attributes — addresses Lighthouse's `unsized-images` warning that flagged the existing `<img src="/screenshots/splitledger/transactions.png">` (currently no dimensions → contributes to CLS risk).

To know the intrinsic dimensions, either:
- Read them from the source PNG at build time (sharp can return them); store in the content collection.
- Pass them explicitly from the rendering page.

Easiest: extend the content-collection schema's screenshot entry to include `width` and `height` (numbers), populated either by hand or by a `scripts/screenshot-dimensions.sh` helper.

## Files

| File | Change |
|---|---|
| [`package.json`](file:///home/will/SRC/indri.studio/package.json) | Add `sharp` to `devDependencies` |
| `scripts/optimize-screenshots.sh` | **New.** Variant-generation build step |
| [`Taskfile.yml`](file:///home/will/SRC/indri.studio/Taskfile.yml) | Add `task screenshots`; chain into `task build` via `deps:` |
| `src/content.config.ts` | Extend screenshot entry schema with `width` and `height` numbers |
| `src/content/apps/<slug>.md` | Populate `width`/`height` per existing screenshot |
| `src/components/Screenshot.astro` | **New.** `<picture>`-based renderer; replaces inline `<img>` |
| `src/pages/apps/[...slug].astro` | Swap inline `<img src=...>` for `<Screenshot src=... width=... height=...>` |
| `public/screenshots/<slug>/*.avif` / `*.webp` | **Generated.** Build artifacts; consider whether to commit (yes, to avoid build-time `sharp` failures hosing CI) |

## Verification

`task dev` running on [localhost:4321](http://localhost:4321). After landing:

1. **Variants exist on disk.** `find public/screenshots -name '*.avif' | wc -l` and `find public/screenshots -name '*.webp' | wc -l` both match the PNG count.
2. **AVIF served to modern browsers.** Open [/apps/splitledger/](http://localhost:4321/apps/splitledger/) in Chrome, DevTools → Network, reload. Confirm the `Type: avif` requests are landing (not `png`). Repeat in Firefox; AVIF should land there too.
3. **PNG fallback works.** Disable AVIF + WebP via DevTools (or test in an older browser). PNG variants serve as fallback; page renders normally.
4. **CLS eliminated.** Re-run [Lighthouse](https://developer.chrome.com/docs/lighthouse) on `/apps/splitledger/` — `cumulative-layout-shift` should stay at 0 (was 0.044 before).
5. **LCP target.** Re-run Lighthouse; `largest-contentful-paint` should drop from 8.3 s to under 4 s; Performance score should move from 57 into the 80s at minimum.
6. **No build regression.** `task build` succeeds end-to-end including the variant-generation step.

## Sequencing

Block until the other agent's `src/pages/apps/[...slug].astro` work has landed (the file is currently unstaged-modified). Once their changes commit, this plan can be picked up — stages (1) and (3) can land in the same PR; stages (1)+(2) can land separately if (3) needs more thought.
