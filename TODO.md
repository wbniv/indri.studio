# TODO

Low-priority tasks that aren't blocking but shouldn't be lost.

- [ ] Re-implement www→apex redirect in the indri-studio Worker's `fetch` handler — the `cloudflare_ruleset` resource is unmanageable from any API-token type on this Free-plan zone (deleted manually 2026-05-13). www.indri.studio currently has no redirect; fix before any marketing pushes traffic to `www.`
- [ ] Scroll-to-top affordance on app pages — floating ^ button, bottom-right, only on app pages that exceed one viewport, appears after scrolling half a screen — [plan](docs/plans/2026-05-14-scroll-to-top.md)

## Done

- [x] **2026-05-14** Land Rec #8: inline critical CSS via Astro `build.inlineStylesheets: 'always'`, every built page now carries inlined Base.css, no external `_astro/*.css` link — [design](docs/plans/2026-05-13-inline-critical-css.md) · [exec](docs/plans/2026-05-14-land-inline-critical-css.md)
- [x] **2026-05-14** Lighthouse pass 2 against prod (post-`v0.1.24`) — A11y now 95 across the board, SplitLedger Perf 57→94, but new CLS regression (font/icon swap) and Rec #8 plan never wired in — [plan](docs/plans/2026-05-14-lighthouse-pass-2.md) · [audit](docs/investigations/2026-05-13-lighthouse-audit.md#pass-2--2026-05-14)
- [x] **2026-05-14** Pinstripe BG: static gradient on fixed pseudo-element, animated via transform — fixes Chrome/Linux segmented-line bug — [investigation](docs/investigations/2026-05-14-animated-gradient-segmentation.md)
- [x] **2026-05-13** Pinstripe BG: animate line width (95s) + gap (140s) alongside drift/rotate — [plan](docs/plans/2026-05-13-stripe-width-gap-pulse.md)
- [x] **2026-05-13** Contact email `hello@indri.studio` via Cloudflare Email Routing, footer mail icon — [plan](docs/plans/2026-05-13-contact-email-routing.md)
- [x] **2026-05-13** Hero: phone/tablet/console/TV/web icon strip under tagline with sequential Phosphor glow — [plan](docs/plans/2026-05-13-hero-platform-icon-strip.md)
- [x] **2026-05-13** 404 page with ring-tailed-lemur-as-the-0 + ring-tail sweep, inverted-tagline copy — [plan](docs/plans/2026-05-13-404-page.md)
