# App screenshot image optimization (AVIF/WebP)

> **Status:** shipped 2026-05-13 (commit `abca262`). Variants on disk for all 146 source images, `<Screenshot>` component live on `/apps/<slug>/` pages, dimensions manifest at `src/data/screenshot-dims.json`. Site-wide PNG → AVIF: 23 MB → 3 MB (87% smaller). SplitLedger screenshots: 105 KB → 20 KB AVIF (81% smaller).

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

**Shipped: Option A** (implicit, no schema change). The `<Screenshot>` component assumes `.avif` and `.webp` siblings exist for any `.png` it sees. Mitigated by the Taskfile `deps:` chain — `task build` and `task deploy` both invoke `task screenshots` first, so production output always has current variants.

**Deviation from the plan: dimensions live in a generated manifest, not the frontmatter.** The plan suggested extending `content.config.ts` with `width`/`height` fields and hand-populating per app. With 146 source images already on disk, `scripts/optimize-screenshots.mjs` reads dimensions via sharp's metadata API and writes `src/data/screenshot-dims.json` — a flat `{src: {width, height}}` map keyed by public path. The `<Screenshot>` component imports it and looks up dims at component-render time. Removes the "remember to add dimensions when you drop a new PNG" footgun. Schema for `apps` stays `{src, alt}` as it was.

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

## Files (as shipped)

| File | Change |
|---|---|
| [`package.json`](file:///home/will/SRC/indri.studio/package.json) | Added `sharp@0.34.5` to `devDependencies` |
| `scripts/optimize-screenshots.mjs` | **New.** Node script (not bash) — walks `public/screenshots/`, emits AVIF + WebP siblings, writes dims manifest. `--force` to regenerate, `-h/--help` supported. Idempotent via mtime check. |
| [`Taskfile.yml`](file:///home/will/SRC/indri.studio/Taskfile.yml) | Added `task screenshots`; chained into `task build` and `task deploy` via `deps: [screenshots]` |
| `src/data/screenshot-dims.json` | **Generated + committed.** Flat map of public path → `{width, height}`. Regenerated on every `task screenshots` run. |
| `src/components/Screenshot.astro` | **New.** `<picture>`-based renderer. Imports dims manifest. Throws at build if a referenced `src` has no manifest entry (fail loud, not silent). |
| `src/pages/apps/[...slug].astro` | Swapped inline `<img>` for `<Screenshot src={shot.src} alt={shot.alt ?? ""}>`. |
| `public/screenshots/<slug>/*.avif` / `*.webp` | **Generated + committed** (292 variants from 146 sources). Avoids build-time sharp installs on CI, keeps deploys deterministic. |
| `src/content.config.ts` | **Not changed** (see deviation note above). |

## Verification

1. **Variants exist on disk.** `find public/screenshots -name '*.avif' | wc -l` and `find public/screenshots -name '*.webp' | wc -l` both match the source PNG/JPG count.

   ```
   $ find public/screenshots -name '*.avif' | wc -l
   146
   $ find public/screenshots -name '*.webp' | wc -l
   146
   $ find public/screenshots -type f \( -name '*.png' -o -name '*.jpg' -o -name '*.jpeg' \) | wc -l
   146

   $ for fmt in png jpg avif webp; do total=$(find public/screenshots -name "*.$fmt" -exec stat -c %s {} + 2>/dev/null | awk '{s+=$1} END {printf "%.0f", s/1024}'); echo "$fmt: ${total} KB"; done
   png: 23251 KB
   jpg: 352 KB
   avif: 3099 KB
   webp: 2974 KB
   ```
   PASS — 1:1 variant coverage; total payload reduction 87% PNG → AVIF.

2. **AVIF / WebP / PNG markup in built HTML.** Inspect `dist/apps/splitledger/index.html`; each screenshot should render as `<picture><source srcset="...avif"><source srcset="...webp"><img src="...png" width=... height=... loading="lazy" decoding="async"></picture>`.

   ```
   $ grep -E "picture|source srcset" dist/apps/splitledger/index.html | head -8
   <picture> <source srcset="/screenshots/splitledger/balances.avif" type="image/avif">
             <source srcset="/screenshots/splitledger/balances.webp" type="image/webp">
             <img src="/screenshots/splitledger/balances.png" alt="Balances dashboard"
                  width="191" height="512" loading="lazy" decoding="async" class="block w-full h-auto">
   </picture>
   ```
   PASS — explicit `width`/`height` from the manifest (addresses audit warning #5 "unsized-images").

3. **Idempotence.** Re-running `task screenshots` with all variants up-to-date should skip everything.

   ```
   $ time node scripts/optimize-screenshots.mjs
   done: 146 sources, 0 variants generated, 292 up-to-date, manifest → src/data/screenshot-dims.json
   real    0m0.082s
   ```
   PASS — 80 ms on a no-op pass. Production `task build` overhead is negligible.

4. **No build regression.** `task build` succeeds end-to-end.

   ```
   $ task build 2>&1 | tail -3
   [build] ✓ Completed in 1.34s.
   [build] 11 page(s) built in 1.71s
   [build] Complete!
   ```
   PASS.

5. **Live Lighthouse re-audit.** The approach changed: the roll-your-own WebP/AVIF variant generation described in this plan was superseded by the Astro native asset pipeline (`docs/plans/2026-05-14-asset-pipeline-cache-busting.md`, `c786089`). Under the new pipeline, Pass 5 CI (v0.1.31) measured splitledger Perf **100**, LCP ≤ 1.5 s. **PASS** (via superseding plan).

## Sequencing (resolved)

The blocker named in the original plan — in-flight edits to `src/pages/apps/[...slug].astro` — landed in commit `d40a3a5` (per-app view-transition opacity/translate split). This plan landed against the post-merge file. No conflicts.
