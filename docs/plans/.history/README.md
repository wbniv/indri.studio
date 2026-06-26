| Date | Change |
|------|--------|
| [2026-06-27](https://github.com/wbniv/indri.studio/commit/4dd7568) | docs: record biohack /blossom HUD regression (re-synced to yoff=8) |
| [2026-06-27](https://github.com/wbniv/indri.studio/commit/c6a28d2) | docs: index the /blossom HUD overscan-crop fix plan |
| [2026-06-26](https://github.com/wbniv/indri.studio/commit/08a6663) | docs(plans): correct more misreads (union of 2 more Opus audit passes) |
| [2026-06-26](https://github.com/wbniv/indri.studio/commit/5916a92) | docs(plans): fix summaries/categories flagged by an Opus faithfulness audit |
| [2026-06-26](https://github.com/wbniv/indri.studio/commit/49f6b36) | docs: add plan index (docs/plans/README.md) |

<!--history-meta v1
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
