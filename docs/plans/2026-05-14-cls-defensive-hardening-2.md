# Plan: Defensive CLS hardening for splitledger (and all sampled pages)

## Context

`/apps/splitledger/` currently measures CLS = 0 under canonical `devtools` Lighthouse throttling (Pass 4, 2026-05-14). The historical residual (Pass 3: 0.058) was eliminated when render-blocking CSS was removed — that closed the swap window between the metric-matched fallback fonts and the real Space Grotesk + Inter. **The current zero is conditional on that gap staying closed.**

Two failure modes could reopen it:
1. **Material Symbols FOIT swap.** Material Symbols loads `display=block` (~100 ms invisible window before glyphs render). On `[...slug].astro:88`, the hourglass icon inside the "LAUNCHING SOON" pill has no width/height reserved on the icon span — during FOIT the slot is ~0 px, and when the font lands the adjacent "Launching Soon" text shifts right by ~1 em. Today this happens fast enough that Lighthouse doesn't catch it; if anything slows Material Symbols delivery (e.g., a new render-blocking resource lands, or the per-page preload pattern regresses), the shift becomes measurable.
2. **No CI gate.** `.github/workflows/deploy.yml` runs `task lighthouse` post-deploy (shipped earlier today per `docs/plans/2026-05-14-lighthouse-ci.md`), emits a `$GITHUB_STEP_SUMMARY` table including CLS, but **does not enforce any threshold**. A regression that bumps CLS to 0.15 ships silently — the value appears in the summary, no alert fires, nobody reads it.

The user explicitly called this out from the audit doc's "Remaining action items" list: *"Tighten splitledger CLS further (currently 0 under devtools, so this is purely defensive against future regressions)."*

**Intended outcome:** two small additions that catch the two failure modes — markup hardening so Material Symbols FOIT never shifts adjacent text, and a CI budget assertion so any regression to CLS > 0.05 on any sampled page is flagged in the Actions UI on the next deploy.

## Approach

### Part 1 — Markup: reserve the Material Symbols icon box globally

The hero `.platform-strip .material-symbols-outlined` already uses this exact pattern at `src/styles/global.css:436–448` with explicit pixel sizes (40 px / 48 px desktop) and a comment that calls out the FOIT-shift hazard verbatim. Lift the pattern to a global default using `em`-relative sizing so it scales with whatever `font-size` the consumer sets (the chevrons use 28 px via `.side-nav-arrow`, the hourglass uses 14 px via `text-sm`, etc. — each becomes a square box at its own font size).

Add to `src/styles/global.css` inside the existing `@layer components` block (sibling to the platform-strip rule, before it so the more-specific platform-strip rule still wins):

```css
.material-symbols-outlined {
    /* Reserve the icon box during the Material Symbols FOIT window
     * (display=block on the @font-face). Before the font loads, the
     * ligature names ("hourglass_top", "arrow_back") have near-zero
     * width — adjacent text would shift right by ~1em when glyphs
     * render. The hero .platform-strip override below uses this same
     * pattern with explicit pixel sizes; this is the em-relative
     * version that covers every other icon site.
     *
     * Google's Material Symbols stylesheet doesn't set width or
     * height (it sets font-size, display: inline-block, line-height: 1),
     * so a plain layered rule wins without !important. */
    width: 1em;
    height: 1em;
    text-align: center;
}
```

Affected icon sites verified by the Phase-1 audit:
- `src/pages/apps/[...slug].astro:88` — hourglass in pill (`text-sm`, 14 px). **Newly defended.**
- `src/pages/apps/[...slug].astro:57, 68, 80` — chevrons + apps icon (`.side-nav-arrow` already sets `font-size: 28px !important; line-height: 1`; the new global rule adds 28 px × 28 px slot — matches existing intent).
- `src/pages/404.astro` — home + apps icons (already explicit sizing; new rule adds no-op slot).
- `src/components/PlatformIcon.astro` / hero platform-strip — overridden by `.platform-strip .material-symbols-outlined` with 40 px / 48 px slots (more-specific selector wins).

The footer mail icon is already a unicode `✉` glyph after Pass 4 — not a Material Symbols site anymore.

### Part 2 — CI: assert a CLS budget after the existing Lighthouse step

The deploy workflow already runs `task lighthouse` (`.github/workflows/deploy.yml:63–68`) and emits a summary table including CLS (`deploy.yml:88–101`). Add a budget-check step **after** the summary so the table still prints regardless of pass/fail. Threshold: **0.05** (well below Lighthouse's "good" 0.1 threshold; tight enough that any real regression trips it, with floating-point noise headroom).

Insert after the existing "Lighthouse summary" step (`.github/workflows/deploy.yml:88`):

```yaml
      - name: CLS budget check
        if: steps.lh.outcome == 'success'
        continue-on-error: true
        env:
          CLS_BUDGET: '0.05'
        run: |
          set -euo pipefail
          violations=0
          {
            echo
            echo "### CLS budget: ≤ ${CLS_BUDGET}"
            echo
            echo "| Page | CLS | Status |"
            echo "|---|---:|:---:|"
            for SLUG in home colophon splitledger; do
              CLS=$(jq -r '.audits["cumulative-layout-shift"].numericValue' \
                /tmp/lh/latest/${SLUG}.run-1.report.json)
              STATUS=$(awk -v c="$CLS" -v b="$CLS_BUDGET" \
                'BEGIN { print (c+0 <= b+0) ? "✓ OK" : "⚠️ OVER" }')
              printf "| %s | %.4f | %s |\n" "$SLUG" "$CLS" "$STATUS"
              if [ "${STATUS#⚠️}" != "$STATUS" ]; then
                violations=$((violations + 1))
              fi
            done
          } >> "$GITHUB_STEP_SUMMARY"
          if [ "$violations" -gt 0 ]; then
            echo "::warning::$violations page(s) over CLS budget ${CLS_BUDGET}; see job summary."
            exit 1
          fi
```

Notes on the YAML:
- `continue-on-error: true` matches the existing Lighthouse step — a CLS regression doesn't block the deploy (the deploy already shipped at line 42–46, before Lighthouse runs); the check shows red in the Actions UI and emits an annotation so it's visible in the PR / Actions feed.
- Reads `numericValue` (raw float), not `displayValue` (formatted string), so the comparison is precise.
- `awk` for the float comparison — POSIX-portable, no `bc` dependency.
- The `::warning::` annotation appears in the Actions UI sidebar alongside any deploy logs, so future-me will see it on the next deploy after a regression ships.

## Files to change

| File | Change |
|---|---|
| `src/styles/global.css` | Add `.material-symbols-outlined` global rule (em-relative width/height/text-align) inside the existing `@layer components` block, ahead of the `.platform-strip` override. ~12 lines incl. comment. |
| `.github/workflows/deploy.yml` | Add `CLS budget check` step after the existing `Lighthouse summary` step. ~30 lines. |
| `TODO.md` | Add a `[ ]` entry pointing at this plan; mark `[x]` and move to Done after verification. |

## Existing utilities to reuse

- **Hero platform-strip CSS at `src/styles/global.css:436–453`** — prior art for the exact reserve-the-box pattern. The new global rule is the em-relative generalization of this. Comment cross-references it.
- **`task lighthouse` (Taskfile.yml)** — already wired post-deploy; the new CI step extends its output, doesn't duplicate it.
- **`$GITHUB_STEP_SUMMARY` table at `.github/workflows/deploy.yml:88–101`** — already prints CLS values; the budget check adds an interpretation row below.
- **`jq` patterns in the summary step** — same JSON parsing approach, just the `numericValue` field instead of `displayValue`.

## Verification

Per SRC `CLAUDE.md` plan-verification format — keep numbered steps verbatim; below each, paste raw output in a fenced block and add PASS/FAIL.

1. **Build still succeeds with the new global rule.**
   ```bash
   task build
   ```
   Expect: no errors; `dist/` rebuilds; no CSS warnings about the new selector.

2. **Chevron and hourglass slots are reserved in the built CSS.**
   ```bash
   grep -A4 '\.material-symbols-outlined {' dist/_astro/*.css | head -20
   ```
   Expect: the new global rule (`width: 1em; height: 1em; text-align: center`) appears in the bundle, followed (later) by the existing platform-strip override with `font-size: 40px !important; width: 40px; height: 40px;` etc. The more-specific rule still wins for the hero.

3. **No visual regression on existing icon sites.** Spin the dev server (`task dev`) and load `/`, `/apps/splitledger/`, `/colophon/`, `/404`. Pixel-compare the hero platform-strip, the apps page chevrons, and the LAUNCHING SOON pill against pre-change screenshots. Expect: identical rendering on existing sites; the hourglass pill is now indistinguishable during a force-throttled load (Network → Slow 4G in DevTools).

4. **Simulate the FOIT shift before and after.** In DevTools on the splitledger page, force Material Symbols to load slowly (Network panel → throttle, or block the font request and reload). Watch the hourglass + "LAUNCHING SOON" text. Before the change: text shifts right when font lands. After: text holds position; only the glyph fills the already-reserved slot.

5. **Local CLS still measures 0 under `devtools`.**
   ```bash
   task lighthouse
   ```
   Expect: CLS column shows `0` or `≤ 0.003` for all three pages; Perf medians hold at 100 / 100 / 100.

6. **CI budget check formats the summary table correctly on a green run.** Push the change as a `v*` tag (or use `workflow_dispatch`); inspect the Actions UI summary. Expect: the existing Lighthouse table prints first; below it, a new "### CLS budget: ≤ 0.05" table with three rows, each showing `✓ OK`; the `CLS budget check` step itself shows as green.

7. **CI budget check fires on a synthetic regression.** Temporarily inject a CLS regression (e.g., remove `width`/`height` from one screenshot's `<img>` and add a stalling delay to the screenshot LCP); push to a non-tag branch and trigger `workflow_dispatch`. Expect: the budget table shows `⚠️ OVER` for splitledger; the step exits 1 (red badge in Actions UI); a `::warning::` annotation appears in the run sidebar; the deploy itself still completes (already ran before Lighthouse). Revert the synthetic regression after confirming.

8. **Commit + push** as a single commit (CSS change + workflow change + TODO entry).

## Out of scope

- **Build-time validation of `screenshot-dims.json`** — the Phase-1 audit flagged this as a possible defense, but the existing render path already throws at build time if a screenshot lacks dims (Astro errors on the `<img>`-without-dims branch). The vulnerability is theoretical without a concrete failure-mode scenario.
- **Aspect-ratio on screenshot grid containers (`.glass-card`)** — would require per-screenshot aspect data (phone, tablet, console all differ); the `width`/`height` on the inner `<img>` already reserves space, and the container shrinks to the content. Marginal additional defense at non-trivial cost.
- **Per-app theme-token layout-prop guard** — Phase-1 flagged that a future `theme` object could in principle inject `font-size` and shift layout. Per-app theming isn't wired yet (CLAUDE.md: "planned, not yet wired"); revisit when the theming schema lands and add a type guard at that point, not preemptively.
- **Tightening the CLS budget below 0.05** — Lighthouse's "good" threshold is 0.1; 0.05 already gives ~50 % headroom over the current 0.003 ceiling. Tighter (0.01) would risk false positives from browser-noise variance on CI runners.
- **Blocking deploys on CLS regression** — the deploy precedes Lighthouse in the workflow by design (per the lighthouse-ci plan from earlier today); the budget check is an alert, not a gate. Changing that would require restructuring the workflow to run Lighthouse against a preview deploy before the prod deploy — out of scope for a defensive add.
