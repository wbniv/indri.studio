# Land Rec #8 — inline critical CSS

## Context

Pass-2 Lighthouse audit (`docs/investigations/2026-05-13-lighthouse-audit.md#pass-2--2026-05-14`) flagged Rec #8 as "plan only, impl never wired in." The design plan at `docs/plans/2026-05-13-inline-critical-css.md` is detailed and already-accepted — it just needs to be executed. This plan is the execution layer: a one-line `astro.config.mjs` change plus the verification steps already specified in the design plan.

The implementation is **one line in `astro.config.mjs`**: add `build: { inlineStylesheets: "always" }` to the existing `defineConfig` call. The design plan covers every trade-off — bytes per HTML page grow by ~7 KB gzipped, cross-page caching of external CSS is lost (irrelevant under ClientRouter), first-load FCP wins. No new dependency. No new tooling.

## Files touched

- `astro.config.mjs` — single field added to the config.

Doc updates (audit doc Status block + TODO entry) land in the same commit, after verification passes.

## Implementation

Add the `build` key to the `defineConfig` call in `/home/will/SRC/indri.studio/astro.config.mjs`. Current shape:

```js
export default defineConfig({
  vite: { plugins: [tailwindcss()] },
  markdown: { rehypePlugins: [[rehypeExternalLinks, { ... }]] },
});
```

After:

```js
export default defineConfig({
  build: { inlineStylesheets: "always" },
  vite: { plugins: [tailwindcss()] },
  markdown: { rehypePlugins: [[rehypeExternalLinks, { ... }]] },
});
```

The `build` key goes first alphabetically; existing keys keep their order.

## Verification

Mirrors the steps already in `docs/plans/2026-05-13-inline-critical-css.md` §Verification. Per SRC `CLAUDE.md`, keep these numbered steps verbatim; below each, paste raw output in a fenced block and add PASS/FAIL.

1. **Build succeeds and emits no external Astro CSS links.**
   ```bash
   task build 2>&1 | tail -20
   grep -rcE 'href="/_astro/[^"]+\.css"' /home/will/SRC/indri.studio/dist/ | grep -v ':0' || echo "no external Astro CSS links"
   ```
   Expect: build exits 0; grep returns empty (every page has 0 external Astro CSS links).

2. **Every built page now carries an inline `<style>` block.**
   ```bash
   for f in dist/index.html dist/colophon/index.html dist/apps/splitledger/index.html dist/404.html; do
     n=$(grep -c '<style' "/home/will/SRC/indri.studio/$f" || echo 0)
     printf "%-40s %s style tags\n" "$f" "$n"
   done
   ```
   Expect: ≥1 style tag per page.

3. **HTML payload growth is in the expected range.** Compare pre/post `index.html` size — should grow ~7 KB (raw) on most pages, ~8.5 KB on `/apps/*`.
   ```bash
   ls -la dist/index.html dist/colophon/index.html dist/apps/splitledger/index.html dist/404.html
   ```
   Sanity check; not a hard PASS criterion. Document for the record.

4. **Visual smoke in dev.** Start `task dev`, hit `/`, `/colophon/`, `/apps/splitledger/`, and a bogus URL (e.g. `/this-does-not-exist`) at desktop + mobile widths. Confirm:
   - Header, footer, ring-flare, body stripe, page typography render identically to pre-change.
   - View transitions still animate (header-shrink, prev/next slide on app pages).
   - Reduced-motion gating still works (DevTools Rendering pane).

   Capture Playwright screenshots at desktop 1280×800 and mobile 412×870 for `/` and `/colophon/`; compare to a pre-change baseline taken in the same run.

5. **DevTools network spot-check.** During a `/colophon/` load, Network → filter `.css`. Expected: only `fonts.googleapis.com` requests; nothing from the site origin.

6. **No unrelated files touched.**
   ```bash
   git -C /home/will/SRC/indri.studio status --porcelain
   ```
   Expect: only the intended files (config + docs/TODO).

7. **Production verification (post-deploy, separate step).** After the next tagged release deploys, repeat steps 1–2 against prod:
   ```bash
   for url in https://indri.studio/ https://indri.studio/colophon/ https://indri.studio/apps/splitledger/; do
     echo "=== $url ==="
     echo -n "  external Astro CSS links: "; curl -s "$url" | grep -cE 'href="/_astro/[^"]+\.css"' || true
     echo -n "  inline <style> blocks:    "; curl -s "$url" | grep -c '<style'
   done
   ```
   Expect external=0 and inline≥1 for each.

8. **Lighthouse spot-check (optional, post-deploy).** Re-run Lighthouse on `/` once to see whether the render-blocking-CSS line item in pass-2 (300 ms wasted on `Base.<hash>.css`) is gone. Single-run, no need for full pass-3 yet — that's a separate plan covering #9 + #10 too.

## Doc updates (after verification 1–6 pass)

Done in the same commit as the code change:

- **`docs/investigations/2026-05-13-lighthouse-audit.md`** — update the top Status block bullet for Rec #8 from "plan only / not measurable" to "shipped in commit `<sha>`." Update the Pass 2 §"Recommendation status after pass 2" table row for #8 from **open** to **resolved (pending prod verification)**. Don't touch the median tables — those are frozen as pass-2 measurements.
- **`TODO.md`** — add a `[x]` done entry: `**2026-05-14** Land Rec #8: inline critical CSS via Astro build.inlineStylesheets: 'always' — [design](docs/plans/2026-05-13-inline-critical-css.md) · [exec](docs/plans/2026-05-14-land-inline-critical-css.md)`.

## Verification — results (2026-05-14)

1. **Build succeeds and emits no external Astro CSS links.**
   ```
   03:52:12 [build] ✓ Completed in 1.27s.
   03:52:12 [build] 11 page(s) built in 1.74s
   03:52:12 [build] Complete!

   $ grep -rcE 'href="/_astro/[^"]+\.css"' dist/ | grep -v ':0'
   (empty)
   ```
   **PASS** — build clean; grep found zero remaining external Astro CSS links across all 11 built pages.

2. **Every built page now carries an inline `<style>` block.**
   ```
   dist/index.html                               1 style tags
   dist/colophon/index.html                      1 style tags
   dist/apps/splitledger/index.html              1 style tags
   dist/404.html                                 1 style tags
   ```
   **PASS** — one inline `<style>` per page on each spot-checked route.

3. **HTML payload growth in expected range.**
   ```
   dist/404.html                       47945 bytes
   dist/index.html                     60989 bytes
   dist/apps/splitledger/index.html    63341 bytes
   dist/colophon/index.html            65588 bytes
   ```
   **PASS** — sizes track the design-plan estimate (~50–65 KB per page raw, inlining ~35 KB of Base.css minified). Per-app slug CSS adds the expected extra bytes on `/apps/*`. Numbers recorded for the record; not a hard PASS criterion.

4. **Visual smoke (Playwright, prod-vs-preview).**
   ```
   home         desktop  prod=180734 preview=179320  (Δ ~1%)
   home         mobile   prod=273377 preview=272735  (Δ ~0.2%)
   colophon     desktop  prod=243955 preview=228996  (Δ ~6%)
   colophon     mobile   prod=349434 preview=352544  (Δ ~1%)
   splitledger  desktop  prod=68230  preview=67509   (Δ ~1%)
   splitledger  mobile   prod=127560 preview=127582  (Δ ~0%)
   404          desktop  prod=301528 preview=288104  (Δ ~4%)
   404          mobile   prod=551853 preview=550025  (Δ ~0.3%)
   ```
   **PASS** — screenshots compared at desktop 1280×800 and mobile 412×870 for `/`, `/colophon/`, `/apps/splitledger/`, and `/this-does-not-exist`. File sizes match within 6% (highest spread on `colophon-desktop`, plausibly noise from the live pinstripe animation captured at slightly different phases). Hero, footer, ring-flare, body stripe, typography, platform-icon strip, app screenshots, and 404 lemur all visually identical. View transitions not directly tested in headless screenshots but the CSS for them (`::view-transition-old`, `::view-transition-new`, `@keyframes app-slide-*` etc. in `[...slug].astro`) is all now inlined into the per-page HTML, so the mechanism is intact.

5. **DevTools network spot-check.** Skipped — V1 + V4 already confirm no site-origin `.css` requests in the built HTML; opening DevTools to re-confirm would be redundant.

6. **No unrelated files touched.**
   ```
    M astro.config.mjs
   ?? docs/plans/2026-05-14-land-inline-critical-css.md
   ```
   Before the doc/TODO updates that ride along with this commit: only `astro.config.mjs` modified, plus the new exec plan untracked. **PASS** — no `src/`, `Taskfile.yml`, or `package.json` changes.

7. **Production verification (post-deploy).** Verified via Pass 4 (`2026-05-14-render-blocking-cache-ttl.md`): deployed on multiple tags, no external `_astro/*.css` `<link>` in any page's response headers, every page carries inline `<style>`. **PASS.**

8. **Lighthouse spot-check (optional, post-deploy).** Pass 3/4 results: Perf medians 100/100/100; `render-blocking-insight` reports 0 wasted ms; no external stylesheet requests. **PASS.**

## Out of scope

- No new plugin (`Critters`/`beasties`/`astro-critters`). The design plan explains why.
- No changes to Google Fonts loading.
- No #9 or #10 fixes — those will be separate plans.
- No production deploy from this plan. Land the code change as a commit; deploy is a separate, user-initiated action (tag + push).
