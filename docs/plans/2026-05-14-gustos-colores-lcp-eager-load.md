# Fix gustos-colores LCP — eager-load first screenshot

## Context

gustos-colores scores Perf 94 on CI Lighthouse (LCP ~2.3–3.0 s), which fails the Phase-5 threshold gate (≥ 95) and turns every deploy red. All other 9 sampled pages clear 95.

Root cause confirmed from the v0.1.31 Lighthouse JSON (`public/lh/v0.1.31/gustos-colores.run-1.report.json`):

- **LCP element**: `gallery.R36HMGw__2vgLmQ.avif` — the first screenshot image
- **LCP breakdown**: TTFB 64 ms, resource load delay **792 ms**, resource load 2115 ms
- **Lighthouse audit `prioritize-lcp-image`**: fires, recommending `fetchpriority="high"`
- **Cause**: `[...slug].astro` calls `.map((shot) => ...)` without index tracking and passes no `loading` prop to `<Screenshot>`, so all screenshots — including the above-the-fold first one — default to `loading="lazy"`. The 792 ms load delay is the browser not discovering the image until near-viewport scroll triggers lazy loading.

`Screenshot.astro` already has the complete solution wired: when `loading="eager"` is passed, it also sets `fetchpriority="high"` on the `<Picture>` element. The fix is purely a call-site change.

## Change

**File:** `src/pages/apps/[...slug].astro`

Add `idx` to the map callback and pass `loading` to the first screenshot:

```diff
-{post.data.screenshots.map((shot) => (
+{post.data.screenshots.map((shot, idx) => (
     <li class="glass-card p-3">
-        <Screenshot src={shot.src} alt={shot.alt ?? ""} />
+        <Screenshot src={shot.src} alt={shot.alt ?? ""} loading={idx === 0 ? "eager" : "lazy"} />
```

No changes to `Screenshot.astro`, `content.config.ts`, or any other file.

## Why this is the complete fix

- `Screenshot.astro:21` — default `loading = "lazy"`; needs a call-site override for index 0
- `Screenshot.astro:~31` — `fetchpriority={loading === "eager" ? "high" : undefined}` already wired; activates automatically
- All subsequent screenshots keep `loading="lazy"` — correct, they're below the fold
- The fix applies to every app page, not just gustos-colores — any app whose first screenshot is the LCP element benefits

## Verification

1. **Local Lighthouse spot-check.**
   ```bash
   RUNS=1 task lighthouse
   ```
   Expect: gustos-colores Perf ≥ 95 (previously 94); all other pages unchanged at ≥ 95.
   Skipped — task runs against prod URLs; verified by CI instead (step 3).

2. **Build still clean.**
   ```bash
   task build
   ```
   Expect: no TypeScript errors; same page count.
   ```
   19:45:05 [build] ✓ Completed in 1.77s.
   19:45:05 [build] 11 page(s) built in 2.18s
   19:45:05 [build] Complete!
   ```
   **PASS.**

3. **CI threshold gate passes on next deploy.**
   After `task publish`, the CI `Phase-5 threshold check` step should be green for the first time since v0.1.28.

   v0.1.34 CI run `25860999026` — Phase-5 threshold check: **success**. All 10 pages ✓:
   ```
   | blender-asset-searcher        | 100 | 96 | 100 | 100 | ✓ |
   | claude-code-authoring-formats | 100 | 96 | 100 | 100 | ✓ |
   | colophon                      | 100 | 95 | 100 | 100 | ✓ |
   | finding-your-way              | 100 | 95 | 100 | 100 | ✓ |
   | gustos-colores                |  96 | 95 | 100 | 100 | ✓ |
   | home                          |  99 | 95 | 100 | 100 | ✓ |
   | parking-space                 | 100 | 95 | 100 | 100 | ✓ |
   | pinball-construction-set      | 100 | 96 | 100 | 100 | ✓ |
   | splitledger                   | 100 | 95 | 100 | 100 | ✓ |
   | world-foundry                 | 100 | 95 |  96 | 100 | ✓ |
   ```
   **PASS** — gustos-colores 94 → 96; threshold gate green for first time since v0.1.28.
