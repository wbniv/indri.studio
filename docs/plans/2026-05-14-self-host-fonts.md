# Self-host fonts via Astro Fonts API — push `/apps/splitledger/` Perf 99 → 100

> Site-wide font self-hosting. Replaces the cross-origin Google Fonts CSS round-trip with build-time-downloaded woff2 files served from the same origin as the HTML. Pushes splitledger Lighthouse Perf 99 → 100; secondary win is every page on the site sheds the same critical-path cost.

## Context

Pass 3 of the Lighthouse audit ([`docs/investigations/2026-05-13-lighthouse-audit.md#pass-3--2026-05-14-methodology-study--re-baseline`](../investigations/2026-05-13-lighthouse-audit.md#pass-3--2026-05-14-methodology-study--re-baseline)) landed `/apps/splitledger/` at Perf **99** under the canonical `devtools` throttling — one point shy of the Phase-5 ≥ 95 target's ceiling and the only sub-100 score across the three sampled pages.

The audit doc attributed the gap to `unused-javascript` (View-Transitions runtime). Re-inspection of the raw `/tmp/lh/pass3/devtools/splitledger.run-*.report.json` reports shows that audit is **passing** (score 1.0, zero items). The actual 1-point gap is:

| Audit  | Weight | Score | Lost points |
|--------|--------|-------|-------------|
| FCP (1.4 s) | 10 | 0.95 | **0.5** |
| CLS (0.058) | 25 | 0.98 | **0.5** |

Lighthouse rounds the final perf score; we need unrounded ≥ 99.5 to land 100, so closing **either** metric is sufficient.

`render-blocking-insight` (diagnostic, weight 0) consistently flags the Google Fonts CSS at ~1.35 s wasted critical time across all three Pass-3 runs. That's the lever: the current `preload` + `onload`-swap pattern in `Base.astro:50-61` still incurs a cross-origin DNS+TCP+TLS+request round-trip to `fonts.googleapis.com`, then a second to `fonts.gstatic.com` for the woff2s. Self-hosting eliminates both, dropping FCP enough to lift its score 0.95 → 1.0 and clearing the 99 → 100 threshold.

A second benefit: every page on the site (home, colophon, 404, all apps) shares this critical-path cost — the FCP win generalizes beyond splitledger and pulls the entire site closer to "perfect-100 across the board".

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

- `astro.config.mjs` — add `fontProviders` import and `fonts: [...]` block.
- `src/layouts/Base.astro` — replace lines 43-61 (preconnects + preload-onload + noscript fallback) with two `<Font />` calls; add `import { Font } from "astro:assets"`.
- `src/styles/global.css` — delete the `Space Grotesk Fallback` / `Inter Fallback` `@font-face` blocks (lines 10-25); update `--font-display` / `--font-body` / `--font-mono` / `--font-sans` (lines 133-136) to reference Astro's registered family CSS variables.
- `TODO.md` — promote entry to done on completion.
- `docs/investigations/2026-05-13-lighthouse-audit.md` — append a short note to Pass 3 confirming Perf 100 across all three pages; correct the `unused-javascript` mis-attribution in the "Remaining gaps to ≥ 95" / "Optional pass-4 candidates" section.

**Out of scope:**
- `src/layouts/AppLayout.astro` per-app `fontImports` extensibility hook. No app currently uses it (splitledger.md has no `theme` override). If/when a per-app brand font is wired (e.g., the "warm fintech for SplitLedger" theme described in CLAUDE.md), migrate it to Astro Fonts API at that time.
- `src/components/MaterialSymbols.astro` — already loaded per-page only, not in Base. Already optimized.

## Implementation detail

### `astro.config.mjs`

```js
import { defineConfig, fontProviders } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import rehypeExternalLinks from 'rehype-external-links';

export default defineConfig({
	build: { inlineStylesheets: "always" },
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

In the frontmatter:

```astro
import { Font } from "astro:assets";
```

Replace lines 43-61 (preconnects through `<noscript>` closing) with:

```astro
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
   Expect: at least one preload per family; inlined `@font-face` blocks present.

4. **Visual smoke — dev + prod build render unchanged.**
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
   - `M docs/investigations/2026-05-13-lighthouse-audit.md`
   - `M TODO.md`
   - `?? docs/plans/2026-05-14-self-host-fonts.md`

9. **Markdown preview renders cleanly.**
   ```bash
   task md -- docs/plans/2026-05-14-self-host-fonts.md
   ```
   Expect: browser opens; plan renders with code blocks intact.

## Verification — results (2026-05-14)

1. **Confirm Astro emits the woff2 files into the build.**
   ```
   04:56:47 [assets] Copying fonts (2 files)...
   $ find dist -name '*.woff2' | sort
   dist/_astro/fonts/68c4c61e5cf389d9.woff2
   dist/_astro/fonts/e868cdf4720e9ea5.woff2
   $ ls -la dist/_astro/fonts/
   -rw-rw-r-- 22320 May 14 04:56 68c4c61e5cf389d9.woff2   # Space Grotesk variable, Latin
   -rw-rw-r-- 48432 May 14 04:56 e868cdf4720e9ea5.woff2   # Inter variable, Latin
   ```
   **PASS (better than expected)** — Astro auto-selected **variable fonts**: one woff2 per family covers all weights via the variable axis. 2 files × ~70 KB total, far smaller than the 9 separate static woff2s (~220 KB) my plan estimated. Same expressive coverage at a third of the bytes.

2. **Confirm no cross-origin Google Fonts references for type fonts on any page.**
   ```
   $ for f in dist/index.html dist/colophon/index.html dist/apps/splitledger/index.html dist/404.html; do
       grep -oE '.{40}fonts\.(googleapis|gstatic).{0,120}' "$f"
     done
   # splitledger/404/home: only Material Symbols Outlined CSS preload (cleanup-plan design)
   # colophon: only prose-text refs inside the article body (<code>fonts.googleapis.com</code>)
   ```
   **PASS** — zero cross-origin references for Space Grotesk or Inter. The remaining `fonts.googleapis.com` references are the Material Symbols icon-font preload on icon-using pages (`/`, `/404`, `/apps/*`) — by design of the parallel `render-blocking-cache-ttl` cleanup plan, out of scope for this change. Colophon has no cross-origin font requests at all.

3. **Confirm preload + inline @font-face shipped on splitledger page.**
   ```
   $ grep -oE '<link[^>]*rel="preload"[^>]*as="font"[^>]*>' dist/apps/splitledger/index.html
   <link rel="preload" href="/_astro/fonts/68c4c61e5cf389d9.woff2" as="font" type="font/woff2" crossorigin>
   <link rel="preload" href="/_astro/fonts/e868cdf4720e9ea5.woff2" as="font" type="font/woff2" crossorigin>
   $ grep -oE 'font-display:[a-z]+' dist/apps/splitledger/index.html | sort | uniq -c
         9 font-display:optional   # 5 SG weights + 4 Inter weights — brand faces
         9 font-display:swap       # auto-generated metric-matched fallback faces
         1 font-display:var        # false match: CSS variable name in tokens
   ```
   **PASS** — two same-origin font preloads (one per family), nine inline `@font-face` brand faces (all `font-display:optional`), nine inline metric-matched fallback faces derived from the actual downloaded woff2 (`optimizedFallbacks`).

4. **Visual smoke — dev + prod build render unchanged.**
   Deferred — manual user step. Open `/`, `/colophon/`, `/apps/splitledger/` at mobile + desktop widths and confirm headline renders in Space Grotesk, body in Inter, no FOUT.

5. **Confirm `font-display: optional` is preserved.**
   See step 3: every brand `@font-face` carries `font-display:optional;`. Per-family `display: "optional"` in `astro.config.mjs` flows through to the emitted CSS. **PASS**.

6. **Lighthouse — re-run `task lighthouse`.**
   Pending — requires `task deploy` first (the canonical task runs against prod URLs). Expected on deploy:
   - `splitledger` Perf median = **100** (was 99).
   - `home` + `colophon` Perf still 100.
   - `render-blocking-insight` no longer flags Google Fonts CSS (cleared the ~1.35 s wasted critical time).
   - CLS holds at or below Pass-3 baseline (home 0.003, colophon 0, splitledger 0.058) — the metric-matched fallback face is now derived from actual font metrics rather than hand-tuned guesses, so if anything CLS should slightly improve.

7. **Confirm `render-blocking-insight` no longer flags Google Fonts.**
   Pending — same dependency as step 6.

8. **Confirm only the expected files changed.**
   ```
   $ git status --porcelain
    M astro.config.mjs
    M src/layouts/Base.astro
    M src/styles/global.css
   ?? docs/plans/2026-05-14-self-host-fonts.md
   ```
   **PASS** — exactly the four files in the plan's "Files touched" list. No incidental drift into `src/pages/`, `src/components/`, or other source files. The parallel agent's `render-blocking-cache-ttl` files are not touched by this commit; that plan's verified TODO entry (footer ✉, Material Symbols per-page, Cloudflare cache rules) remains intact and undisturbed.

9. **Markdown preview renders cleanly.**
   Deferred — manual user step. `task md -- docs/plans/2026-05-14-self-host-fonts.md`.

## Interaction with the parallel `render-blocking-cache-ttl` plan

The cleanup plan landed a `preload + onload-swap` pattern for the type stylesheet (still cross-origin to fonts.googleapis.com). This self-host plan **supersedes that font work** — there is no longer any cross-origin type-stylesheet request to preload. The cleanup plan's verification step 1 (preload-swap pattern present in built HTML) becomes obsolete; the cleanup plan's other work (Material Symbols lifted out of Base, footer `✉` glyph, Cloudflare cache-TTL Terraform) is untouched and remains valid.

When promoting the cleanup-plan TODO entry to done, drop the type-stylesheet preload-swap claim from its description — the actual production state is self-hosted, not preload-swapped.

## Rollback

Revert the three source files (`astro.config.mjs`, `src/layouts/Base.astro`, `src/styles/global.css`). No package added — Astro Fonts API ships in the framework. Rollback is one `git checkout`.
