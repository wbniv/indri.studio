| Date | Change |
|------|--------|
| [2026-06-27](https://github.com/wbniv/indri.studio/commit/4dd7568) | docs: record biohack /blossom HUD regression (re-synced to yoff=8) |
| [2026-06-27](https://github.com/wbniv/indri.studio/commit/9e82840) | docs: plan for the /blossom HUD overscan-crop fix |

<!--history-meta v1
4dd7568	author	Will Norris
4dd7568	added	47
4dd7568	deleted	9
4dd7568	files	1
4dd7568	body	A later space-invaders commit (biohack c20b62e) re-copied the vendored player\nbundle into public/play/app.js, clobbering the yoff=0 fix (3f9c66e / v1.0.74)\nback to yoff=8 — biohack.net/blossom is clipped again on live. indri.studio and\nthe bsnes-jg-wasm source remain fixed.\n\nUpdates the plan (status + §Regression with the root lesson: fix the sync\nsource, not the vendored per-site copy), the index summary, and adds an active\nTODO to re-sync biohack from the fixed bundle. No code change here; biohack's\napp.js is left as-is pending the re-sync.\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01PUAcAwgviWnsXGBKPBiLAT
9e82840	author	Will Norris
9e82840	added	152
9e82840	deleted	0
9e82840	files	1
9e82840	body	Retroactive plan documenting the yoff=8 -> yoff=0 fix (present() was cropping\nthe active picture's top 8 rows on a false NTSC-overscan assumption), the\n3-repo rollout (indri 7b82611, bsnes-jg-wasm aaacbae, biohack v1.0.74), and the\nlive verification at 125% zoom. TODO done-section entry added.\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01PUAcAwgviWnsXGBKPBiLAT
-->
