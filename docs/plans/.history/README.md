| Date | Change |
|------|--------|
| [2026-10-09](https://github.com/wbniv/indri.studio/commit/b5588e6) | Index World Foundry logo page update |
| [2026-10-09](https://github.com/wbniv/indri.studio/commit/ce66a02) | Index release-note cleanup in Finding Your Way plan |
| [2026-10-09](https://github.com/wbniv/indri.studio/commit/281b22b) | Update plan index for final Finding Your Way copy |
| [2026-10-09](https://github.com/wbniv/indri.studio/commit/6f22214) | Update Finding Your Way plan index |
| [2026-10-09](https://github.com/wbniv/indri.studio/commit/ce67dc8) | Index Finding Your Way layout plan |
| [2026-10-05](https://github.com/wbniv/indri.studio/commit/cbb9912) | docs: record live APK milestone verification and index plan |
| [2026-07-27](https://github.com/wbniv/indri.studio/commit/77b936d) | snes: vendor the player engine from @wbniv/bsnes-jg-player |
| [2026-06-30](https://github.com/wbniv/indri.studio/commit/fcbe827) | chore(plans): add README index row for purple→green rebrand plan |
| [2026-06-27](https://github.com/wbniv/indri.studio/commit/ef7ed8c) | docs: biohack /blossom HUD re-fixed (v1.0.76) |
| [2026-06-27](https://github.com/wbniv/indri.studio/commit/4dd7568) | docs: record biohack /blossom HUD regression (re-synced to yoff=8) |
| [2026-06-27](https://github.com/wbniv/indri.studio/commit/c6a28d2) | docs: index the /blossom HUD overscan-crop fix plan |
| [2026-06-26](https://github.com/wbniv/indri.studio/commit/08a6663) | docs(plans): correct more misreads (union of 2 more Opus audit passes) |
| [2026-06-26](https://github.com/wbniv/indri.studio/commit/5916a92) | docs(plans): fix summaries/categories flagged by an Opus faithfulness audit |
| [2026-06-26](https://github.com/wbniv/indri.studio/commit/49f6b36) | docs: add plan index (docs/plans/README.md) |

<!--history-meta v1
b5588e6	author	Will Norris
b5588e6	added	1
b5588e6	deleted	1
b5588e6	files	1
ce66a02	author	Will Norris
ce66a02	added	1
ce66a02	deleted	1
ce66a02	files	1
281b22b	author	Will Norris
281b22b	added	1
281b22b	deleted	1
281b22b	files	1
6f22214	author	Will Norris
6f22214	added	1
6f22214	deleted	1
6f22214	files	1
ce67dc8	author	Will Norris
ce67dc8	added	2
ce67dc8	deleted	1
ce67dc8	files	1
cbb9912	author	Will Norris
cbb9912	added	3
cbb9912	deleted	1
cbb9912	files	1
77b936d	author	Will Norris
77b936d	added	2
77b936d	deleted	1
77b936d	files	1
77b936d	body	Phase C of bsnes-jg-wasm/docs/plans/2026-07-27-npm-player-package.md\n(see docs/plans/2026-07-27-snes-package-adoption.md).\n\n- scripts/sync-llvm-mos-emulator.sh is now a thin wrapper over the package's\n  sync CLI (versioned engine + ENGINE_VERSION drift stamp); pnpm run\n  sync-engine. Dep is github:wbniv/bsnes-jg-wasm#npm-package until the\n  first npm publish.\n- deploy.yml: 'bsnes-jg-player sync --check' fails the deploy on a\n  hand-edited engine copy.\n- Deliberate deviation from the canonical plan's sketch: indri KEEPS its\n  own embed markup + Base.astro boot (already centralized + site-branded);\n  SnesPlayer.astro would swap that for generic chrome with no dedup gain.\n- Inherited engine changes (intentional): poster clears to black on ROM\n  accept; manifest-driven touchNav; the measured adaptive-yoff decision.\n\nVerified: build green (133 pages); on the built mandel-display page the\npackaged engine lands the gate CRC 0x204F @ WRAM $0200 after 5800 frames\n(live Chrome, deterministic frame-stepped selfcheck).\n\nCo-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_011DEG8ouwAWtqeWtcvZSysz
fcbe827	author	Will Norris
fcbe827	added	2
fcbe827	deleted	1
fcbe827	files	1
fcbe827	body	Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01NKj4FfbatTq4PdbSPCDgou
ef7ed8c	author	Will Norris
ef7ed8c	added	1
ef7ed8c	deleted	1
ef7ed8c	files	1
ef7ed8c	body	Re-applied yoff=0 to biohack's vendored player copy (regressed by the\nspace-invaders bundle re-sync) and redeployed; verified live at 125% zoom\n(21px margin). Updates the plan status + §Regression (resolved), closes the\nTODO re-fix item, and corrects the index summary. Durable path confirmed:\nbsnes-jg-wasm/web/app.js is yoff=0 and deploy-bundle.sh copies it into the\nbundle, so future syncs carry the fix.\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01PUAcAwgviWnsXGBKPBiLAT
4dd7568	author	Will Norris
4dd7568	added	1
4dd7568	deleted	1
4dd7568	files	1
4dd7568	body	A later space-invaders commit (biohack c20b62e) re-copied the vendored player\nbundle into public/play/app.js, clobbering the yoff=0 fix (3f9c66e / v1.0.74)\nback to yoff=8 — biohack.net/blossom is clipped again on live. indri.studio and\nthe bsnes-jg-wasm source remain fixed.\n\nUpdates the plan (status + §Regression with the root lesson: fix the sync\nsource, not the vendored per-site copy), the index summary, and adds an active\nTODO to re-sync biohack from the fixed bundle. No code change here; biohack's\napp.js is left as-is pending the re-sync.\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01PUAcAwgviWnsXGBKPBiLAT
c6a28d2	author	Will Norris
c6a28d2	added	2
c6a28d2	deleted	1
c6a28d2	files	1
c6a28d2	body	Adds the plan-index row flagged by the check-plan-index.sh drift hook.\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01PUAcAwgviWnsXGBKPBiLAT
08a6663	author	Will Norris
08a6663	added	1
08a6663	deleted	1
08a6663	files	1
08a6663	body	Two further independent Opus passes over the Sonnet summaries, unioned, caught\nmisreads the first (non-deterministic) pass missed: inverted fixes, omitted\nSUPERSEDED status, invented specifics, and Fix-vs-Feature category errors.\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
5916a92	author	Will Norris
5916a92	added	3
5916a92	deleted	3
5916a92	files	1
5916a92	body	An Opus pass over the Sonnet-generated index flagged summaries that misread their\nplan (inverted outcomes, invented specifics, or wrong category) and supplied\ncorrections. This applies them.\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
49f6b36	author	Will Norris
49f6b36	added	85
49f6b36	deleted	0
49f6b36	files	1
49f6b36	body	One row per docs/plans/*.md — auto-generated summary + category plus the per-plan\ncommit history — kept current by the shared check-plan-index drift hook on commit.\nSummaries auto-generated (Sonnet, medium effort); refine as needed.\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
-->
