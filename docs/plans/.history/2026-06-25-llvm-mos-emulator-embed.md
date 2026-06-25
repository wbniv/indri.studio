| Date | Change |
|------|--------|
| [2026-06-25](https://github.com/wbniv/indri.studio/commit/3bd1b57) | docs: record the llvm-mos emulator embed as deployed + the CSP fix |
| [2026-06-25](https://github.com/wbniv/indri.studio/commit/6b83ec9) | apps/llvm-mos-65816: embed the live cycle-accurate SNES emulator |

<!--history-meta v1
3bd1b57	author	Will Norris
3bd1b57	added	22
3bd1b57	deleted	1
3bd1b57	files	1
3bd1b57	body	Plan → DEPLOYED/VERIFIED (v0.1.69); Results section captures the prod CSP bug\n(WebAssembly blocked by script-src; fixed with 'wasm-unsafe-eval') and that the\npage is outside the Lighthouse sample so the budget is untouched. TODO moved to\nDone.\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_012z1vSadjiUqKEsQ6dU4u3P
6b83ec9	author	Will Norris
6b83ec9	added	185
6b83ec9	deleted	0
6b83ec9	files	1
6b83ec9	body	Put a running emulator on the SNES C Compiler page, inline under the title: a\nWebAssembly build of bsnes-jg 2.1.0 (the exact, sha256-pinned core the\nllvm-mos-65816 differential gate trusts) boots our mandel-display program, and a\nVerify-fidelity button reproduces the gate's headless WRAM assert\n(corpus_result @ $0580 == 0x9103) live in the tab — making the page's\n"verified pixel-for-pixel" claim playable.\n\n- EmulatorEmbed.astro: inline <canvas> in the studio theme; (re)boots on\n  astro:page-load so it survives view transitions; the loop pauses off-screen.\n  Rendered by apps/[...slug].astro for this app only.\n- public/apps/llvm-mos-65816/play/: the static bundle (core .wasm/.js, app.js,\n  mandel-display.sfc, manifest, provenance), synced from bsnes-jg-wasm via\n  scripts/sync-llvm-mos-emulator.sh.\n- _headers: cache rule for the bundle (served as application/wasm).\n\nVerified locally in headless Chrome: boots, renders the Mandelbrot, self-check\nPASS (0x9103 == gate), no console errors. Plan + screenshots in docs/plans/.\nThe ~3.9 MB core loads on this page only (inline embed, per design call).\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_012z1vSadjiUqKEsQ6dU4u3P
-->
