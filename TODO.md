# TODO

Low-priority tasks that aren't blocking but shouldn't be lost.

- [verify] **2026-05-14** Defensive CLS hardening — reserve Material Symbols icon box at 1em globally; add CLS-budget alert (≤ 0.05) to post-deploy CI Lighthouse step. Local: Perf 100/100/100, CLS 0.003/0/0. CI summary table verifies on next `v*` tag — [plan](docs/plans/2026-05-14-cls-defensive-hardening.md)

## Done

- [x] **2026-05-14** Code review pass — 22 of 24 findings closed across 5 commits (B3 skipped per user, H3/H4 deferred to asset-pipeline follow-up plan) — [plan](docs/plans/2026-05-14-code-review-implementation.md)
- [x] **2026-05-14** CI: `task lighthouse` runs after every deploy (RUNS=1 to fit Free-tier budget, ~2 min added/deploy); JSON bundle uploaded as per-tag artifact + summary table in Actions UI — [plan](docs/plans/2026-05-14-lighthouse-ci.md)
- [x] **2026-05-14** Audit-doc cleanup — Pass-1 cross-cutting / per-page / recs / "will we get to 95" sections now annotated as superseded by Pass 2/3/4 — [plan](docs/plans/2026-05-14-audit-doc-stale-cleanup.md)
- [x] **2026-05-14** Lighthouse pass 4 — render-blocking + cache-TTL cleanup verified on prod; Perf medians 100/100/100 (SplitLedger +1), both targeted audits go to `null`/n-a on all 9 runs — [plan](docs/plans/2026-05-14-render-blocking-cache-ttl.md) · [audit](docs/investigations/2026-05-13-lighthouse-audit.md#pass-4--2026-05-14-render-blocking--cache-ttl-cleanup)
- [x] **2026-05-14** Self-host Space Grotesk + Inter via Astro Fonts API — 2 variable-font woff2 (~70 KB) under `_astro/fonts/`, optimizedFallbacks derive metric-matched fallback from real woff2 metrics — [plan](docs/plans/2026-05-14-self-host-fonts.md)
- [x] **2026-05-14** www→apex 301 redirect via Worker `fetch` handler (replaces deleted `cloudflare_ruleset`); prod verified, path + query preserved — [plan](docs/plans/2026-05-14-www-apex-redirect.md)
- [x] **2026-05-14** Lighthouse pass 3 — methodology study + re-baseline; `devtools` throttling chosen (summed Perf range 0 vs 35 for `simulate`), codified as `task lighthouse`; Phase-5 ≥ 95 target met (100 / 100 / 99); NEW #9 + #10 resolved — [plan](docs/plans/2026-05-14-lighthouse-pass-3.md) · [audit](docs/investigations/2026-05-13-lighthouse-audit.md#pass-3--2026-05-14-methodology-study--re-baseline)
- [x] **2026-05-14** Scroll-to-top ^ button on long app pages, gated to >1 viewport, lifts above footer when it enters view — [plan](docs/plans/2026-05-14-scroll-to-top.md)
- [x] **2026-05-14** Land Rec #8: inline critical CSS via Astro `build.inlineStylesheets: 'always'`, every built page now carries inlined Base.css, no external `_astro/*.css` link — [design](docs/plans/2026-05-13-inline-critical-css.md) · [exec](docs/plans/2026-05-14-land-inline-critical-css.md)
- [x] **2026-05-14** Lighthouse pass 2 against prod (post-`v0.1.24`) — A11y now 95 across the board, SplitLedger Perf 57→94, but new CLS regression (font/icon swap) and Rec #8 plan never wired in — [plan](docs/plans/2026-05-14-lighthouse-pass-2.md) · [audit](docs/investigations/2026-05-13-lighthouse-audit.md#pass-2--2026-05-14)
- [x] **2026-05-14** Pinstripe BG: static gradient on fixed pseudo-element, animated via transform — fixes Chrome/Linux segmented-line bug — [investigation](docs/investigations/2026-05-14-animated-gradient-segmentation.md)
- [x] **2026-05-13** Pinstripe BG: animate line width (95s) + gap (140s) alongside drift/rotate — [plan](docs/plans/2026-05-13-stripe-width-gap-pulse.md)
- [x] **2026-05-13** Contact email `hello@indri.studio` via Cloudflare Email Routing, footer mail icon — [plan](docs/plans/2026-05-13-contact-email-routing.md)
- [x] **2026-05-13** Hero: phone/tablet/console/TV/web icon strip under tagline with sequential Phosphor glow — [plan](docs/plans/2026-05-13-hero-platform-icon-strip.md)
- [x] **2026-05-13** 404 page with ring-tailed-lemur-as-the-0 + ring-tail sweep, inverted-tagline copy — [plan](docs/plans/2026-05-13-404-page.md)
