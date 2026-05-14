# Plan sweep — deferred, punted, and stale items

**Date:** 2026-05-14  
**Scope:** All 27 files in `docs/plans/` and 4 files in `docs/investigations/`

---

## A — Real open work

Items where code still needs to be written or a decision still needs to be made.

### ~~A1. gustos-colores Perf 94 fails Phase‑5 threshold on every deploy~~ ✓

The CI `Phase-5 threshold check` step (`scripts/lighthouse-threshold.sh`) exits 1 on every deploy because gustos-colores consistently scores 94 on the CI runner's single-run devtools audit. All other 9 pages clear 95.

- Pass-5 CI result (v0.1.31): gustos-colores Perf **94**, LCP ~2.3 s. Every other page ≥ 95.
- Local 3-run devtools median: gustos-colores ranged 89–94 during pass-5 development, suggesting real margin pressure, not pure noise.
- The asset-pipeline migration (`c786089`) moved screenshots to hashed `_astro/*` URLs and resolved parking-space (75 → 100) and world-foundry (62 → 100). gustos-colores improved less (89 → 94) — its LCP path is likely dominated by something else.

**What to investigate:** What is gustos-colores's LCP element and why is it ~0.5 s slower than comparable pages? Candidates: an above-the-fold screenshot that's larger or not `fetchpriority="high"`, a non-hashed image still in `public/`, or a `<picture>` block in the markdown body (those don't go through Astro's image pipeline — `parking-space.md` had this problem).

---

## B — Stale documentation

Work was done; docs weren't updated to say so. No code changes needed, just doc patches.

### ~~B1. `hero-cls-fix.md` still says "Drafted, awaiting approval"~~ ✓

**Plan:** `docs/plans/2026-05-14-hero-cls-fix.md`

The plan's status line reads `Status: Drafted, awaiting approval` but commit `807454b` implemented all three parts (metric-matched fallback, `display=optional/block`, icon-dimension reserve). The fix was then made moot by:
1. Self-hosted fonts (`4908df0`) — Astro Fonts API with `optimizedFallbacks` superseded the manual `@font-face` metric-matching.
2. Pass 3 re-baselining — the original 0.342 CLS was a `simulate`-throttling artefact; under `devtools` the real CLS was 0.003.
3. CLS defensive hardening (`9cbcafb`) — generalised the icon-dimension reserve to a global `.material-symbols-outlined` rule.

**Doc fix needed:** Add a status block at the top of the plan marking it superseded, citing the three commits above. No verification steps needed.

### ~~B2. `animated-gradient-segmentation.md` ends on an unresolved decision~~ ✓

**Investigation:** `docs/investigations/2026-05-14-animated-gradient-segmentation.md`

The document's final "Status" section (lines 230–237) says:
> Reverted to commit `68d6c5f` … Decide whether to: commit the revert, reset and continue, or move forward with one of the fix candidates.

The decision was made: commit `d36c7d5` (`Pinstripe BG: static gradient + transform animation — fixes Chrome/Linux segmented-line bug`) landed fix candidate #1 (static gradient, animate via `transform`). The TODO done entry confirms it. The investigation doc was never updated with the outcome.

**Doc fix needed:** Append a "Resolution" section to the investigation noting `d36c7d5` as the chosen fix, confirming fix #1 worked, and closing the open decision.

### ~~B3. Code review — H3 and H4 listed as deferred, but asset-pipeline resolved both~~ ✓

**Investigation:** `docs/investigations/2026-05-14-code-review.md` (implementation note, lines 299–302)

The implementation note reads:
> Deferred to `docs/plans/2026-05-14-asset-pipeline-cache-busting.md` (filed in `65ddf4a`):
> - H3 properly — migrate `public/screenshots/` into `src/assets/`…
> - H4 — the proposed CI pre-build regen step becomes moot once `optimize-screenshots.mjs` is deleted.

The asset-pipeline plan completed (`c786089`, verified V1–V10 PASS). `optimize-screenshots.mjs` is deleted, `public/screenshots/` is gone, all screenshot URLs are now hashed `_astro/*`. Both H3 and H4 are resolved.

**Doc fix needed:** Update the implementation note to replace "Deferred" with "Resolved via `c786089`" for H3 and H4.

### ~~B4. `land-inline-critical-css.md` — steps 7–8 say "deferred pending deploy"~~ ✓

**Plan:** `docs/plans/2026-05-14-land-inline-critical-css.md`

Steps 7 (prod verification) and 8 (Lighthouse spot-check) were deferred with "will run once the next tagged release is on Cloudflare." That was v0.1.17 or earlier; the site has been through at least 15 deploys since. Pass 4 (`2026-05-14-render-blocking-cache-ttl.md`) explicitly confirmed the inline-CSS approach with 100/100/100 Lighthouse results — that constitutes pass verification for both steps.

**Doc fix needed:** Replace the "Deferred" notes in steps 7–8 with a brief result citing pass-4 Lighthouse data (Perf medians 100/100/100, no external `_astro/*.css` link).

### ~~B5. `self-host-fonts.md` — steps 4, 6, 7, 9 say "deferred pending deploy"~~ ✓

**Plan:** `docs/plans/2026-05-14-self-host-fonts.md`

Steps 4 (visual smoke), 6 (Lighthouse re-run), 7 (render-blocking-insight), and 9 (markdown preview) were deferred pending the first deploy. The fonts have been on prod since v0.1.2x. Pass 4 confirmed no render-blocking resources; pass 5 shows 100/100/100 on all pages; CLS is 0 on colophon and splitledger.

**Doc fix needed:** Replace "Pending/Deferred" notes in those four steps with concise pass references pointing at pass-4 and pass-5 data.

### ~~B6. `scroll-to-top.md` — all 7 verification steps have no output~~ ✓

**Plan:** `docs/plans/2026-05-14-scroll-to-top.md`

Steps 1–7 are listed with pass criteria but no raw output is pasted. The feature is live and working (pass-5 Lighthouse run covers the pages; the CLS hardening plan's pass-5 run included splitledger with 0 CLS). Steps 1–4 and 6–7 can be verified by reading the code and the Lighthouse data; step 5 (DevTools forced-reflow profiling) requires a manual DevTools session.

**Doc fix needed:** For steps 1–4 and 6–7, paste a reference to the verifying evidence (e.g., "Verified implicitly by pass-5 Lighthouse run on splitledger — CLS 0, no new layout shifts"). For step 5, either run the profiling session and paste output, or mark it as "Deferred — manual DevTools session required; no forced-reflow behavior expected per code inspection (scrollY read on `DOMContentLoaded`, no layout-affecting writes triggered)."

### ~~B7. `app-screenshot-image-optimization.md` — step 5 pending prod audit~~ ✓

**Plan:** `docs/plans/2026-05-13-app-screenshot-image-optimization.md`

Step 5 ("Live Lighthouse re-audit against `/apps/splitledger/`") says "Pending — flip to PASS once a fresh audit on production confirms LCP drops." The asset-pipeline migration completed (`c786089`) and pass-5 shows splitledger Perf 100 in CI. The original step was written before the asset-pipeline plan existed; that plan superseded the optimization approach described here.

**Doc fix needed:** Update step 5 to PASS, citing pass-5 CI data (splitledger Perf 100, LCP ≤ 1.5 s). Note that the approach changed (native `<Image />` vs. the manual WebP/AVIF variants this plan proposed) — same outcome via a different path.

---

## C — Intentional future work

Explicitly deferred in the plans, acknowledged in CLAUDE.md, not lost. Listed here for completeness; no action required unless prioritising.

| Item | Where tracked | Status |
|------|--------------|--------|
| Per-app theming (`AppLayout`, theme tokens from frontmatter) | `CLAUDE.md §"Per-app theming"`, `self-host-fonts.md §"Out of scope"` | Planned, not wired — needs `AppLayout.astro` + schema fields |
| Store-badge SVG `public/img/store-badges/*.svg` through asset pipeline | `asset-pipeline-cache-busting.md §"Out of scope"` | No urgency; SVGs are stable |
| `StripedGridMotion.astro` re-use | `code-review.md D6`, shelved to `attic/` | Component preserved locally; wire back if striped hero bands are wanted |

---

## D — Findings that look open but aren't

These were flagged by the sweep but turned out to be resolved or intentionally closed.

| Item | Resolution |
|------|-----------|
| `hero-cls-fix.md` never implemented | It was — `807454b`; then superseded (see B1) |
| animated-gradient decision unresolved | Resolved by `d36c7d5`; doc just not updated (see B2) |
| `lighthouse-tag-archive.md` untracked, now missing | Was superseded by pass-5 plan before commit; correctly discarded |
| `attic/` untracked | Was intentional (`7204bb7`); `attic/StripedGridMotion.astro` committed to repo in `72814ea` |
| `first-publish.md` verification results blank | The plan pre-dated the first deploy; the deploy succeeded (site is live); verification was never the point of re-visiting this doc |
| Code review B3 (store-badge `#` placeholders) | Skipped per user — reads as a no-op in practice since badges sit at top of pages |
| Code review H5 (IAM token) | Resolved — `docs/plans/2026-05-14-iam-token-narrow.md` + `docs/investigations/2026-05-14-iam-token-audit.md` both closed |

---

## Priority order

If addressing the above:

~~1. **A1** — resolved in `8b3adba` (v0.1.34); gustos-colores 94 → 96, threshold gate green~~
~~2. **B1–B7** — all resolved in `72814ea`~~
