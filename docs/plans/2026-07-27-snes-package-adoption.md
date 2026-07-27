# snes-package-adoption — indri.studio consumes @wbniv/bsnes-jg-player

**Canonical plan (Phase C of):** [~/bsnes-jg-wasm/docs/plans/2026-07-27-npm-player-package.md](../../../bsnes-jg-wasm/docs/plans/2026-07-27-npm-player-package.md).

What lands here:

1. Engine (app.js + cores/*) vendored from `@wbniv/bsnes-jg-player` (git dep until the first npm publish) — `scripts/sync-llvm-mos-emulator.sh` is now a thin wrapper over the package's sync CLI (versioned + `ENGINE_VERSION` drift stamp). ROMs/manifest/previews stay site content.
2. `deploy.yml` gains `npx bsnes-jg-player sync --check public/apps/llvm-mos-65816/play` — a hand-edited engine copy can't ship.
3. **Deliberate deviation from the canonical plan's Phase C sketch:** indri KEEPS its own embed markup + Base.astro boot (already centralized, and branded with the site's glass-card/`--color-primary-container` styling) instead of switching to the package's `SnesPlayer.astro` — the component would replace indri's branding with the generic player chrome for zero dedup gain. The boot contract is unchanged, so indri's markup drives the new engine as-is.
4. Behavior change inherited with the merged engine (intentional): poster clears to black on ROM accept (was: hold until first lit frame), plus the adaptive-yoff decision and manifest-driven touchNav (see the canonical plan's gate result).

## Verification

1. `pnpm build` green; `sync --check` passes on `public/apps/llvm-mos-65816/play`.
2. Headless selfcheck on the built `/apps/llvm-mos-65816/snes/mandel-display/?verify=1` page → `badge pass`.
3. Deploy via `task publish`; re-check one live page.
