| Date | Change |
|------|--------|
| [2026-10-31](https://github.com/wbniv/indri.studio/commit/8d6327f) | Debug bridge page: real settings dialog, drop view 6, fix phone overflow |
| [2026-10-31](https://github.com/wbniv/indri.studio/commit/60a01a2) | Record debug-bridge page verification; index the plan; mark done |
| [2026-10-31](https://github.com/wbniv/indri.studio/commit/d74480f) | Add World Foundry debug bridge page; icon rows in the bridge section |

<!--history-meta v1
8d6327f	author	Will Norris
8d6327f	added	78
8d6327f	deleted	12
8d6327f	files	1
8d6327f	body	- View 5 is now the engine's real "Baseline settings" dialog, captured on a\n  Chromecast HD running the baseline level, replacing the placeholder.\n- View 6 ("This page, in the wild") is removed: it only pictured the page\n  that links here. The page has five views and no placeholders.\n- Phone width: the page measured 560 px on a 390 px screen. The container\n  sits in the layout's flex column with auto margins and sized itself from\n  its content (the transcript's unwrapped lines), so it now has width: 100%.\n  An earlier fix (min-width: 0, image max-width) did not cure it; the new\n  guard caught that.\n- scripts/check-mobile-overflow.mjs loads pages at 390 px in headless\n  Chrome and exits 1 on horizontal overflow. Run against the buggy build\n  (FAIL), the first fix (FAIL) and the final build (PASS).\n- Gallery on the World Foundry page: cropped the black padding baked into\n  the Star + Fire screenshot (640x640 -> 640x322) and the treemap's border.\n\nCo-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01YEenqRBjdJpGEUgxdZ9651
60a01a2	author	Will Norris
60a01a2	added	64
60a01a2	deleted	3
60a01a2	files	1
60a01a2	body	All seven verification steps recorded with raw output in the plan (page\nlive as v0.1.277, old paths 301). Adds the plan-index row the commit hook\nasked for, moves the TODO item to Done, and drops the resolved\n"no PASS recorded" Inbox line.\n\nCo-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01YEenqRBjdJpGEUgxdZ9651
d74480f	author	Will Norris
d74480f	added	148
d74480f	deleted	0
d74480f	files	1
d74480f	body	New standalone page /apps/world-foundry-v2/debug-bridge/ showing the debug\nbridge six ways: Blender live panel, editor, terminal session and bridge\nframes (captured from a live engine or existing), plus two placeholders\n(settings forms, the page in the wild). Linked from the World Foundry v2\n"Better tools" section by the words "debug bridge" and a line after the list.\n\nThe bridge feature list in that section now has an icon tile per item with\nmore space between rows, so the page moves from .md to .mdx to use MIcon.\n\nCapture scripts live in scripts/wf-bridge-captures/ so the Blender panel,\nterminal session and frame can be regenerated. Plan, diagrams and mockups:\ndocs/plans/2026-10-31-world-foundry-debug-bridge-page.md\n\nCo-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01YEenqRBjdJpGEUgxdZ9651
-->
