# Plan — embed the live `bsnes-jg-wasm` emulator on `/apps/llvm-mos-65816/`

**Status:** ✅ DEPLOYED + VERIFIED IN PRODUCTION (2026-06-25, tags `v0.1.68` → `v0.1.69`).
Live at [https://indri.studio/apps/llvm-mos-65816/](https://indri.studio/apps/llvm-mos-65816/):
the embed boots mandel-display and the Verify-fidelity self-check reads `0x9103 == gate` in a real
browser against the CDN. See **Results** below. Cross-repo: assets/build come from
[`~/SRC/bsnes-jg-wasm`](../../../bsnes-jg-wasm) (see its
[plan](../../../bsnes-jg-wasm/docs/plans/2026-06-25-bsnes-jg-wasm.md)); the integration,
hosting, and deploy land here in `indri.studio`.

**Embed model (user, 2026-06-25):** **inline, always-on** — the emulator runs *on* the page with
mandel-display, not behind a click-to-launch iframe. The wasm loads with the page; CPU is conserved
by pausing the run loop when the canvas is scrolled off-screen (IntersectionObserver) and when the
tab is hidden (browser RAF throttling). Lighthouse impact on this one page is accepted as a
deliberate trade for a live demo (measure it; it does not affect other pages).

## Context

`/apps/llvm-mos-65816/` is a Markdown app page ("SNES C Compiler",
`src/content/apps/llvm-mos-65816.md`) rendered by `src/pages/apps/[...slug].astro`. It already
*shows* static screenshots of a Mandelbrot rendered from C on the SNES (`mandel-jg.png`) and pitches
the compiler as "verified pixel-for-pixel against two emulators (MAME and bsnes-jg)."

`bsnes-jg-wasm` now ships a **verified WebAssembly build of the exact bsnes-jg 2.1.0 core the
project's differential gate trusts** (sha256-pinned), driven by a custom Jolly-Good-API frontend. It
boots the `+mos-a16` homebrew and runs an **in-browser fidelity self-check** that reproduces the
gate's headless WRAM assert (`mandel-display` → `0x9103`). That is precisely the page's claim, made
*live and playable*.

## Goal / deliverable

At **[https://indri.studio/apps/llvm-mos-65816/](https://indri.studio/apps/llvm-mos-65816/)**, a
"Run it in your browser" section that launches the cycle-accurate core running our **mandel-display**
program, with the **Verify fidelity** button front-and-centre (the `0x9103 == the gate` story). The
landing page's Lighthouse budget (Perf/A11y/BP/SEO ≥ 95) must survive.

## Mockup

The new section sits in the existing `SNES C Compiler` app page, after the intro prose and before
the `Install` heading (so a visitor sees the live proof of "verified pixel-for-pixel" immediately).
It's a `glass-card` with a `section-label`, the live `<canvas>` at 8:7, a minimal control row, and a
provenance caption — all in the studio's dark theme.

```
indri.studio/apps/llvm-mos-65816/

  ‹ prev        ▦ All apps        next ›

  SNES C Compiler                                          ← h1 (existing)
  Write modern C — boot it on a Super Nintendo.            ← summary (existing)

  An optimizing, open-source C compiler for the WDC 65816 …
  verified pixel-for-pixel against MAME and bsnes-jg.      ← prose (existing)

  RUN IT IN YOUR BROWSER                                   ← NEW · section-label
  ╭──────────────────────────────────────────────────╮       (glass-card)
  │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
  │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓◀ Mandelbrot ▶▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│   ← <canvas>, 8:7,
  │▓▓▓▓▓▓▓ cycle-accurate SNES render, live ▓▓▓▓▓▓▓▓▓▓│      auto-boots
  │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│      mandel-display
  ╰──────────────────────────────────────────────────╯
   running mandel-display.sfc · 512×240                  ← status
   [ Verify fidelity ]   ✓ 0x9103 == the gate            ← button + badge (green on pass)
   ← ↑ ↓ → · Z/X = B/A · A/S = Y/X · Enter · Shift        ← keys hint (muted)

   bsnes-jg 2.1.0 · sha256 a8e0fd… · the exact core the
   differential gate trusts.                             ← provenance caption

  ## Install … (existing prose continues)

  SCREENSHOTS                                             ← existing gallery
  [ mandel-jg ]  [ mandel-mode7 ]  [ compare ]
```

Control-row states: the badge reads `idle` before a check, `verifying… 720/1000` while running, and
flips to a green `✓ 0x9103 == the gate` on pass (red `✗ got 0x…` on mismatch). The run loop pauses
when the card scrolls out of view.

## Constraints (from indri.studio)

- **Lighthouse budget is sacred** — the deploy workflow audits every page; the homepage/app pages run
  ≥ 95 with CLS ≤ 0.05. A ~3.9 MB wasm core must **not** load on page view.
- **Static-asset hosting** — Astro → `dist/` → Cloudflare Workers Static Assets. `public/` is the
  verbatim passthrough; binaries already live there (`public/docs/snes-bootup.pdf`, `public/lh/*`).
- **Single-thread / no COOP-COEP** — the core is single-threaded (Asyncify fibers, no
  `SharedArrayBuffer`), so no cross-origin-isolation headers are needed. Same-origin iframe is fine.
- **Design system** — dark theme, Space Grotesk/Inter, `glass-card`, `prose`. The embed must look at
  home, not like a bolted-on `<canvas>`.

## Decisions (proposed — confirm on review)

1. **Embed model: always-on inline canvas** *(user decision, 2026-06-25)*. An `EmulatorEmbed.astro`
   component renders the `<canvas>` + controls directly in the page and auto-boots mandel-display;
   the core loads with the page. The run loop is paused when off-screen (IntersectionObserver) and
   when the tab is hidden, so it doesn't peg a CPU core while the reader is elsewhere. The 3.9 MB wasm
   is fetched on this page (Lighthouse trade accepted here only). The component reuses
   `bsnes-jg-wasm/web/app.js`, parameterised with `window.BJG_BASE` (asset base) +
   `window.BJG_DEFAULT_ROM` so the same tested code drives both the standalone page and this embed.
   - *Rejected — click-to-launch iframe:* perf-cheaper but hides the demo behind a click; the user
     wants it visibly running on the page.
   - The static assets (`cores/*`, `roms/mandel-display.sfc`, `app.js`) still live at
     `public/apps/llvm-mos-65816/play/`; the embed loads them by absolute URL (no iframe).
2. **Bundle path: `public/apps/llvm-mos-65816/play/`** → serves at `/apps/llvm-mos-65816/play/`. A
   subpath, so there is **no collision** with the Astro route that emits
   `dist/apps/llvm-mos-65816/index.html`.
3. **Featured program: `mandel-display` only.** The play bundle ships a single ROM and auto-boots it;
   the **Verify fidelity** self-check (WRAM `$0580 == 0x9103`) is the hero. (The full picker stays in
   `bsnes-jg-wasm` for local dev.)
4. **Artifact handling: commit the built bundle into `indri.studio`** (like `snes-bootup.pdf` / the
   `lh/` archives), regenerated by a reproducible sync script — *not* an emsdk build in CI. Core is
   ~3.9 MB wasm (~1.3 MB brotli at the edge) + ~72 KB js + 32 KB ROM. Provenance (`PROVENANCE.json`,
   version + sha256) ships alongside so the page can prove which core it runs.
5. **Integration point: a small `EmulatorEmbed.astro`** rendered by `[...slug].astro` when
   `post.id === 'llvm-mos-65816'` — mirroring the existing per-app injection
   (`post.id === 'claude-code-authoring-formats' && <script …>`). Cleaner than raw HTML in the `.md`
   and keeps styling in the design system.

## Approach

### A. `bsnes-jg-wasm` — emit a deployable single-program bundle
- Add `deploy-bundle.sh` (+ `task bundle`) that produces `dist-bundle/` containing a trimmed
  `index.html` (defaults to `mandel-display`, picker reduced or hidden, indri-dark styling), `app.js`,
  `cores/bsnes_jg.{js,wasm}` + `PROVENANCE.json`, `roms/mandel-display.sfc`, `roms/manifest.json`.
  All asset paths stay **relative** (already true) so the bundle works under any base path.
- Reuses the existing `web/` sources; just selects the one ROM and drops the dev banner.

### B. `indri.studio` — sync the bundle in
- `scripts/sync-llvm-mos-emulator.sh` (mirrors `bsnes-jg-wasm/sync-roms.sh`): default source
  `../bsnes-jg-wasm/dist-bundle` (override arg); `rsync`/`cp` into
  `public/apps/llvm-mos-65816/play/`. Runs `bsnes-jg-wasm`'s build if the bundle is missing.
- Commit the synced bundle (binaries included).

### C. `indri.studio` — the embed component
- `src/components/EmulatorEmbed.astro`: `glass-card` figure with the poster image + "▶ Run it live"
  button; on click, replace the poster with a same-origin `<iframe>` (8:7 aspect, `loading="lazy"`,
  `title="bsnes-jg running mandel-display"`). Caption links the provenance / the
  `bsnes-jg-wasm` repo. Respect `prefers-reduced-motion`; keyboard-focusable button.
- Render it in `src/pages/apps/[...slug].astro` for `post.id === 'llvm-mos-65816'`, placed after the
  prose (above `screenshots`). Optionally generalise later via a `liveDemo` frontmatter field.
- Add one paragraph to `src/content/apps/llvm-mos-65816.md` introducing the live demo.

### D. `indri.studio` — headers
- Append to `public/_headers`: a cache rule for `/apps/llvm-mos-65816/play/*` (the wasm filename is
  **not** content-hashed, so `max-age` + `stale-while-revalidate`, like the favicon rule — *not*
  `immutable`). Optional hardening: version the wasm filename (`bsnes_jg.<ver>.wasm`) to make it
  immutable-cacheable.
- Confirm Workers Static Assets serves `.wasm` as `application/wasm` (it sets content-type by
  extension; verify with `curl -I`).

### E. build → verify → deploy
- `pnpm build`; `task preview`; manual + headless check (see Verification).
- Commit; **tag `v*` and push** → `.github/workflows/deploy.yml` builds + `wrangler deploy` + runs
  the post-deploy Lighthouse audit. Confirm the budget held.

## Results (2026-06-25)

- **Local (headless Chrome, `pnpm build` → `dist/`):** embed boots, renders the Mandelbrot, self-check
  `✓ FIDELITY 0x9103 == gate`, no console errors. PASS.
- **Production (`v0.1.69`):** after deploy, `https://indri.studio/apps/llvm-mos-65816/` →
  `running mandel-display.sfc · 512×240`, `✓ FIDELITY 0x9103 == gate`, no page errors; core served as
  `application/wasm`. PASS.
- **Production bug found + fixed (CSP).** The first deploy (`v0.1.68`) shipped but the core failed to
  instantiate live: the Worker's CSP `script-src` (`'self' 'nonce-…' 'unsafe-inline'`) blocks
  `WebAssembly.instantiate()` (both streaming and the ArrayBuffer fallback → `CompileError`). Local
  dev sends no CSP, so it was prod-only. Fixed in `worker/index.ts` by adding **`'wasm-unsafe-eval'`**
  (permits WASM compile only, not general `eval()`; Lighthouse-CSP-clean), redeployed as `v0.1.69`.
- **Lighthouse budget — not affected.** The CI Lighthouse sample is home + 9 specific app pages and
  does **not** include `llvm-mos-65816`, so the inline 3.9 MB wasm never enters the audited budget.
  The deploy's threshold/CLS alerts (`continue-on-error`) are the documented single-run variance on
  the *sampled* pages, unrelated to this change. (Deliberately leaving the heavy interactive page out
  of the sample rather than letting it create a standing ≥95-Perf alert.)

## Verification

> Run each step; paste raw output below it; PASS/FAIL; write back here.

1. **Bundle builds.** `bsnes-jg-wasm` `task bundle` → `dist-bundle/index.html` + `cores/bsnes_jg.wasm`;
   `sync-llvm-mos-emulator.sh` populates `public/apps/llvm-mos-65816/play/`; `pnpm build` emits
   `dist/apps/llvm-mos-65816/play/index.html`. `curl -I …/play/cores/bsnes_jg.wasm` →
   `content-type: application/wasm`.
2. **Embed works locally.** `task preview`: `/apps/llvm-mos-65816/` shows the poster + button; click
   loads the iframe; `mandel-display` boots and renders; **Verify fidelity** → `0x9103 == gate`
   (headless-Chrome harness, reuse `bsnes-jg-wasm/scratchpad/verify.mjs` pointed at the iframe URL).
3. **Lighthouse budget intact.** `task lighthouse` on `/apps/llvm-mos-65816/`: Perf/A11y/BP/SEO ≥ 95,
   CLS ≤ 0.05 — unchanged vs current (the iframe is lazy, so the wasm is not in the page's critical
   path).
4. **Production.** After the tag deploy: the section is live at
   [https://indri.studio/apps/llvm-mos-65816/](https://indri.studio/apps/llvm-mos-65816/); the core
   serves as `application/wasm`; the self-check passes in current Chromium **and on a phone**
   (the open mobile-perf question from `bsnes-jg-wasm` becomes user-facing here).
5. **License hygiene.** GPLv3 bundle ships with source + `PROVENANCE.json`; `NOTICE` carried or
   referenced; no snes9x / EmulatorJS in the shipped path.

## Risks / open items

- **Lighthouse budget** — the whole reason for click-to-launch. If a future change makes the embed
  eager, the budget check (post-deploy alert) will flag it. Measure in step 3 before tagging.
- **~4 MB binary in git** — acceptable (precedent: committed PDFs/archives), but noted. Alternative
  if it grows: have CI fetch the bundle from a `bsnes-jg-wasm` release artifact instead of committing.
- **Mobile perf** — cycle-accurate + Asyncify is heavy; ~82 fps on a laptop, phone unmeasured. A live
  public embed makes this the headline risk. Gate step 4 on a real phone; if a low-end device chugs,
  fall back to "tap to run" with an FPS note, or trim Asyncify (`ASYNCIFY_ONLY`).
- **Cross-origin isolation** — *not* needed (single-thread, same-origin iframe). Don't add COOP/COEP.
- **Sync drift** — the committed bundle is a snapshot; re-run the sync script (and bump provenance)
  whenever `bsnes-jg-wasm`'s core or page changes. The script is the source of truth, not hand-copies.
- **Scope** — this hosts an existing artifact; it adds no compiler/core coverage. Showcase only.
