| Date | Change |
|------|--------|
| [2026-07-27](https://github.com/wbniv/indri.studio/commit/4e8d158) | docs: record verification PASS evidence; queue deploy-verify item |
| [2026-07-27](https://github.com/wbniv/indri.studio/commit/77b936d) | snes: vendor the player engine from @wbniv/bsnes-jg-player |

<!--history-meta v1
4e8d158	author	Will Norris
4e8d158	added	20
4e8d158	deleted	2
4e8d158	files	1
4e8d158	body	Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_011DEG8ouwAWtqeWtcvZSysz
77b936d	author	Will Norris
77b936d	added	16
77b936d	deleted	0
77b936d	files	1
77b936d	body	Phase C of bsnes-jg-wasm/docs/plans/2026-07-27-npm-player-package.md\n(see docs/plans/2026-07-27-snes-package-adoption.md).\n\n- scripts/sync-llvm-mos-emulator.sh is now a thin wrapper over the package's\n  sync CLI (versioned engine + ENGINE_VERSION drift stamp); pnpm run\n  sync-engine. Dep is github:wbniv/bsnes-jg-wasm#npm-package until the\n  first npm publish.\n- deploy.yml: 'bsnes-jg-player sync --check' fails the deploy on a\n  hand-edited engine copy.\n- Deliberate deviation from the canonical plan's sketch: indri KEEPS its\n  own embed markup + Base.astro boot (already centralized + site-branded);\n  SnesPlayer.astro would swap that for generic chrome with no dedup gain.\n- Inherited engine changes (intentional): poster clears to black on ROM\n  accept; manifest-driven touchNav; the measured adaptive-yoff decision.\n\nVerified: build green (133 pages); on the built mandel-display page the\npackaged engine lands the gate CRC 0x204F @ WRAM $0200 after 5800 frames\n(live Chrome, deterministic frame-stepped selfcheck).\n\nCo-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_011DEG8ouwAWtqeWtcvZSysz
-->
