# TODO

Low-priority tasks that aren't blocking but shouldn't be lost.

## Active

- [ ] **2026-06-25** Publish "SNES C Compiler" (llvm-mos-65816) gallery entry — committed as `draft: true`; flip to `false` + `task publish` once `wbniv/llvm-mos-65816` is public (badge 404s until then) and any WDC outreach is settled — [plan](docs/plans/2026-06-25-add-llvm-mos-65816-to-the-indri-studio-product-gal.md)

- [ ] **2026-06-25** Embed the live `bsnes-jg-wasm` emulator (cycle-accurate bsnes-jg running our `mandel-display` program + the `0x9103` fidelity self-check) on `/apps/llvm-mos-65816/` — click-to-launch iframe over a static bundle at `public/apps/llvm-mos-65816/play/`, synced from `../bsnes-jg-wasm`; keep the Lighthouse budget (lazy-load). Confirm embed model + check phone perf before tagging — [plan](docs/plans/2026-06-25-llvm-mos-emulator-embed.md)

- [ ] **2026-05-22** Add `curl | bash` installer for `claude-usage` at `apt.indri.studio/install-claude-usage.sh` (thin bootstrap → upstream `install.sh`); also tighten `install.sh` pre-flight checks for `glib-compile-schemas` / `systemctl --user` / `gnome-shell` — [plan](docs/plans/2026-05-22-claude-usage-curlbash-installer.md)

- [ ] **2026-05-21** Stand up a second apt repo at `apt.biohack.net` (own zone, own R2 bucket `biohack-net-secrets` + `biohack-net-apt`, own operator token). Decide whether biohack.net gets a fresh monorepo or piggy-backs on an existing biohack.net website repo. Reuse the same skill (`new-web-apt-repo`).

- [ ] **2026-06-25** **Astro 7 migration (Sätteri pipeline)** — modernise the markdown pipeline; its verbatim raw-HTML handling would let inline Mermaid SVG survive uncorrupted, letting us delete the build-done `mermaid-inject` integration. Requires porting `rehypeExternalLinks` to a Sätteri HAST plugin. Major bump — branch + full Lighthouse before tagging — [plan](docs/plans/2026-06-25-astro-7-migration.md)

- [ ] **2026-06-25** Fix the stale `scripts/sync-65816-docs.sh` manifest — it references the deleted `wt/321-snes-hwref` branch (worktree consolidation), so `task sync-docs` fails on `65816-opcodes`. Point the consolidated docs at `main`. Blocks regenerating the reader docs from source.

- [ ] **2026-06-25** Verify the **PDF / release-bundled docs** render path (`../python-tui-lib/scripts/md-to-html.sh`, used by `../llvm-mos-65816/dev/build-release-docs.sh`) for the same Mermaid `<br></br>` double-break / label-clip the web path had — it doesn't go through Astro so it may differ, and the `sync-65816-docs.sh` `</p><p>` fix doesn't touch it. Check a generated `.pdf` before assuming clean — [plan](docs/plans/2026-06-25-mermaid-diagram-label-clipping.md)

## Done

- [x] **2026-05-21** Bootstrap `apt.indri.studio` + publish `claude-usage` 0.11.20 (apt-v0.1.1 green; InRelease + key.gpg live; verified `apt-cache show` end-to-end from clean ubuntu:latest) — [plan](docs/plans/2026-05-21-apt-indri-studio-bootstrap.md)
- [x] **2026-05-14** HTML cache: `no-store` via Worker (content-type check); `_headers` merges rules so `/*` catch-all broke `_astro/*` immutable cache in v0.1.35, corrected in v0.1.36 — [plan](docs/plans/2026-05-14-html-cache-no-store.md)
- [x] **2026-05-14** Fix gustos-colores LCP: eager-load first screenshot (`loading="eager"` + `fetchpriority="high"`); 94 → 96 on CI, Phase-5 threshold gate green on v0.1.34
- [x] **2026-05-14** Lighthouse pass 5 — 10-page sampling, per-tag prod archive at `/lh/<tag>/`, Phase-5 threshold gate (≥ 95); fixed gustos-colores 94→96 (font-display swap + 720w Screenshot breakpoint) on v0.1.33 — [plan](docs/plans/2026-05-14-lighthouse-pass-5.md)
- [x] **2026-05-14** Defensive CLS hardening: Material Symbols 1em slot + CI CLS-budget check (≤ 0.05); Perf 100/100/100, CLS 0/0/0.003; CI green on v0.1.28 — [plan](docs/plans/2026-05-14-cls-defensive-hardening.md)
- [x] **2026-05-14** Asset pipeline: roll-your-own `optimize-screenshots.mjs` → Astro native; hashed `_astro/*` URLs inherit immutable-1y cache; V1–V10 PASS — [plan](docs/plans/2026-05-14-asset-pipeline-cache-busting.md)
- [x] **2026-05-14** IAM token narrowing (audit H5 Path A): `iam-self/token.tf` expanded to cover all `global/` surfaces; narrow `indri-cf-token` replaced (new id `1834…`), SSM + GH Actions secret rotated, old bootstrap `90c2…` revoked — [plan](docs/plans/2026-05-14-iam-token-narrow.md) · [audit](docs/investigations/2026-05-14-iam-token-audit.md#resolved-2026-05-14)
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


## Inbox — auto-captured plan deferrals

_Auto-added from plan "Out of scope"/"Deferred" sections at commit time. Triage each into M1/M2/etc. and delete it here — it will not come back._

<!-- BEGIN auto-captured-deferrals (managed by audit-plan-deferrals.sh — triage these into the curated sections above; the fingerprint ledger means a deleted item is NOT re-added) -->
- [verify] **2026-06-25-add-llvm-mos-65816-to-the-indri-studio-product-gal** — Verification section present but no PASS recorded — run + record the steps. _from [2026-06-25-add-llvm-mos-65816-to-the-indri-studio-product-gal.md](docs/plans/2026-06-25-add-llvm-mos-65816-to-the-indri-studio-product-gal.md)_  <!-- fp:b6de012c5009da31 -->
<!-- triaged 2026-06-25: PDF/release-docs check (fp:f8b15c02) promoted to ## Active above. Cross-OS font residual (fp:17fcdb9d) is a non-actionable caveat fully recorded in the plan's "Follow-ups" section, not backlog — dropped. Ledger keeps both from returning. -->
<!-- triaged 2026-06-25: all four are covered by the curated ## Active items above — the Astro 7 [verify] (fp:9989472d) + "Astro 7 / Sätteri migration" (fp:ad1c2c59) → the "Astro 7 migration" Active item; "task sync-docs broken" (fp:d49ec893) → the "Fix the stale sync-docs manifest" Active item; "Dev mode" (fp:0585a219) is a non-actionable caveat recorded in the mermaid plan's Follow-ups. Ledger keeps them from returning. -->
<!-- END auto-captured-deferrals -->
