# Self-host fonts via Astro Fonts API — push `/apps/splitledger/` Perf 99 → 100

## Context

Pass 3 of the Lighthouse audit (`docs/investigations/2026-05-13-lighthouse-audit.md#pass-3--2026-05-14-methodology-study--re-baseline`) landed splitledger at Perf **99** under the canonical `devtools` throttling — one point shy of the Phase-5 ≥ 95 target's ceiling.

The audit doc attributed the gap to `unused-javascript` (View-Transitions runtime), but inspection of the raw `/tmp/lh/pass3/devtools/splitledger.run-*.report.json` shows that audit is **passing** (score 1.0, zero items). The actual 1-point gap is:

| Audit  | Weight | Score | Lost points |
|--------|--------|-------|-------------|
| FCP (1.4 s) | 10 | 0.95 | **0.5** |
| CLS (0.058) | 25 | 0.98 | **0.5** |

Lighthouse rounds the final perf score — we need unrounded ≥ 99.5 to land 100, so closing **either** metric is sufficient.

`render-blocking-insight` (diagnostic, weight 0) consistently flags the Google Fonts CSS at ~1.35 s wasted critical time across all three runs. That's the lever: the current `preload` + `onload`-swap pattern in `Base.astro:50-61` still incurs a cross-origin DNS+TCP+TLS+request round trip to `fonts.googleapis.com`, then a second to `fonts.gstatic.com` for the woff2s. Self-hosting eliminates both, dropping FCP enough to lift its score 0.95 → 1.0 and clearing the 99 → 100 threshold.

A second benefit: every page on the site (home, colophon, 404, all apps) shares this critical-path cost — the win generalizes beyond splitledger.

## Approach

Use the **Astro 6 Fonts API** (`fonts: [...]` in `astro.config.mjs` + `<Font />` from `astro:assets`). Confirmed stable in Astro 6.1.9 (not under `experimental`). The API handles:

- Build-time download of Space Grotesk + Inter from Google
- Latin subsetting (default)
- woff2 emission into `dist/_astro/fonts/`
- Auto-generated `<link rel="preload" as="font" type="font/woff2" crossorigin>` per resolved file
- Inlined `@font-face` declarations (no extra request)
- **Metric-matched fallback face derived from the *actual* downloaded woff2 metrics** (`optimizedFallbacks: true`, default) — strictly more accurate than the existing hand-tuned `"Space Grotesk Fallback"` / `"Inter Fallback"` blocks in `global.css:10-25`, which the file's own comment flags as "may need calibration"
- `font-display: optional` honored per-family — preserves the current no-FOUT/no-CLS contract

After the change:
- Zero requests to `fonts.googleapis.com` / `fonts.gstatic.com` from any page
- Font files served same-origin via Cloudflare Workers Static Assets, already on the critical-path warm connection
- FCP for `/apps/splitledger/` drops below the perfect-score threshold; Perf score: **99 → 100**

## Files touched

- **`astro.config.mjs`** — add `fontProviders` import and `fonts: [...]` block.
- **`src/layouts/Base.astro`** — replace lines 43-61 (preconnects + preload-onload + noscript fallback) with two `<Font />` calls; add `import { Font } from "astro:assets"`.
- **`src/styles/global.css`** — delete the `Space Grotesk Fallback` / `Inter Fallback` `@font-face` blocks (lines 10-25); update `--font-display` / `--font-body` / `--font-mono` / `--font-sans` (lines 133-136) to reference Astro's registered family CSS variables.
- **`docs/plans/2026-05-14-self-host-fonts.md`** — write the project plan doc (SRC convention: plan-first under `docs/plans/`).
- **`TODO.md`** — add entry pointing at the plan.

**Out of scope:**
- `src/layouts/AppLayout.astro` per-app `fontImports` extensibility hook (Base.astro:48-54). No app currently uses it (splitledger.md has no `theme` override). If/when a per-app brand font is wired (e.g., the "warm fintech for SplitLedger" theme described in CLAUDE.md), migrate it to Astro Fonts API at that time.
- `MaterialSymbols.astro` — already loaded per-page only, not in Base. Already optimized.

## Implementation detail

### `astro.config.mjs`

```js
import { defineConfig, fontProviders } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import rehypeExternalLinks from 'rehype-external-links';

export default defineConfig({
  build: {
    inlineStylesheets: "always",
  },
  fonts: [
    {
      provider: fontProviders.google(),
      name: "Space Grotesk",
      cssVariable: "--font-space-grotesk",
      weights: ["300", "400", "500", "600", "700"],
      styles: ["normal"],
      subsets: ["latin"],
      display: "optional",
      fallbacks: ["system-ui", "-apple-system", "Segoe UI", "sans-serif"],
    },
    {
      provider: fontProviders.google(),
      name: "Inter",
      cssVariable: "--font-inter",
      weights: ["300", "400", "500", "600"],
      styles: ["normal"],
      subsets: ["latin"],
      display: "optional",
      fallbacks: ["system-ui", "-apple-system", "Segoe UI", "sans-serif"],
    },
  ],
  vite: { plugins: [tailwindcss()] },
  markdown: { /* unchanged */ },
});
```

Ending each `fallbacks` array with a generic family name (`sans-serif`) is the signal that triggers `optimizedFallbacks`.

### `src/layouts/Base.astro`

In the frontmatter, alongside existing imports:

```astro
import { Font } from "astro:assets";
```

Replace lines 43-61 (preconnects through `<noscript>` closing) with:

```astro
<!-- Self-hosted brand fonts via Astro Fonts API. Build-time download
 ~ + Latin subset + auto-preload + metric-matched fallback face
 ~ derived from the actual woff2 (optimizedFallbacks). Served from
 ~ same origin on Workers Static Assets — no cross-origin CSS
 ~ round-trip, no render-blocking. font-display: optional preserved
 ~ via the per-family config in astro.config.mjs. -->
<Font cssVariable="--font-space-grotesk" preload />
<Font cssVariable="--font-inter" preload />
```

Drop the `<noscript>` — there's no JS-required swap to fall back from. The `@font-face` rules emitted by `<Font />` are plain inline CSS in the document.

### `src/styles/global.css`

Delete lines 10-25 (`@font-face "Space Grotesk Fallback"` and `@font-face "Inter Fallback"`). Astro emits equivalent (better, metric-correct) fallback faces automatically.

Update lines 133-136:

```css
--font-display: var(--font-space-grotesk), system-ui, -apple-system, Segoe UI, sans-serif;
--font-body: var(--font-inter), system-ui, -apple-system, Segoe UI, sans-serif;
--font-mono: var(--font-space-grotesk), ui-monospace, SFMono-Regular, Menlo, monospace;
--font-sans: var(--font-inter), system-ui, -apple-system, Segoe UI, sans-serif;
```

`var(--font-space-grotesk)` resolves to Astro's full registered stack (`"Space Grotesk", "<auto fallback>", system-ui, ...`). The trailing tokens after `var(...)` are belt-and-suspenders.

## Verification steps

Each step pastes raw command output below it in a fenced block; mark PASS/FAIL per the SRC plan-verification format.

1. **Confirm Astro emits the woff2 files into the build.**
   ```bash
   pnpm build 2>&1 | tail -10
   find dist -name '*.woff2' | sort
   ls dist/_astro/fonts/ | wc -l
   ```
   Expect: 9 woff2 files total (5 Space Grotesk + 4 Inter, Latin subset).

2. **Confirm no cross-origin Google Fonts references in any rendered HTML.**
   ```bash
   grep -rE 'fonts\.googleapis|fonts\.gstatic' dist/ || echo "clean"
   ```
   Expect: `clean` — no matches anywhere in `dist/`.

3. **Confirm preload + inline @font-face shipped on splitledger page.**
   ```bash
   grep -E '<link rel="preload" as="font"' dist/apps/splitledger/index.html | head -5
   grep -E '@font-face' dist/apps/splitledger/index.html | head -3
   ```
   Expect: at least one preload per family (Astro defaults to preloading the first resolved file per `cssVariable`); inlined `@font-face` blocks present.

4. **Visual smoke — dev + prod build are pixel-identical to current prod.**
   ```bash
   pnpm dev   # localhost:4321
   ```
   Manually verify `/`, `/colophon/`, `/apps/splitledger/` at mobile + desktop widths. Headline ("SOFTWARE for everyone…") renders in Space Grotesk; body copy in Inter. Header band shrink animation still fires on scroll + cross-page nav.

5. **Confirm `font-display: optional` is preserved.**
   ```bash
   grep -E 'font-display' dist/apps/splitledger/index.html | head
   ```
   Expect: every `@font-face` block emitted by Astro carries `font-display: optional;`.

6. **Lighthouse — re-run the canonical `task lighthouse`.**
   ```bash
   task lighthouse
   ```
   Expect:
   - `splitledger` per-run Perf = **100** for all three runs (or at minimum, median 100).
   - `home` and `colophon` Perf still 100 (no regression).
   - All three pages: A11y 95, BP 100, SEO 100 (unchanged).
   - CLS holds at or below current Pass-3 baseline (home 0.003, colophon 0, splitledger 0.058).

7. **Confirm `render-blocking-insight` no longer flags Google Fonts.**
   ```bash
   jq '.audits["render-blocking-insight"]' /tmp/lh/latest/splitledger.run-1.report.json
   ```
   Expect: either score=1 (audit passes) or, if still surfacing, items[] no longer includes any `fonts.googleapis.com` URL.

8. **Confirm only the expected files changed.**
   ```bash
   git status --porcelain
   ```
   Expect:
   - `M astro.config.mjs`
   - `M src/layouts/Base.astro`
   - `M src/styles/global.css`
   - `M TODO.md`
   - `?? docs/plans/2026-05-14-self-host-fonts.md`

9. **Markdown preview renders cleanly.**
   ```bash
   task md -- docs/plans/2026-05-14-self-host-fonts.md
   ```
   Expect: browser opens; plan renders with code blocks intact.

## Rollback

Revert the three source files (`astro.config.mjs`, `src/layouts/Base.astro`, `src/styles/global.css`). No package added — Astro Fonts API ships in the framework. Rollback is one `git checkout`.

## Critical files for implementation

- `/home/will/SRC/indri.studio/astro.config.mjs`
- `/home/will/SRC/indri.studio/src/layouts/Base.astro` (lines 1-5 imports, 43-61 head fragment)
- `/home/will/SRC/indri.studio/src/styles/global.css` (lines 10-25 fallback faces, 133-136 family tokens)
- `/home/will/SRC/indri.studio/Taskfile.yml` (verification step 6 — `task lighthouse`)
- `/home/will/SRC/indri.studio/docs/investigations/2026-05-13-lighthouse-audit.md` (update Pass-3 "Optional pass-4 candidates" line after the fix lands, and correct the `unused-javascript` mis-attribution in the same edit)
