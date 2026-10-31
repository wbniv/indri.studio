| Date | Change |
|------|--------|
| [2026-10-31](https://github.com/wbniv/indri.studio/commit/60a01a2) | Record debug-bridge page verification; index the plan; mark done |
| [2026-10-31](https://github.com/wbniv/indri.studio/commit/d74480f) | Add World Foundry debug bridge page; icon rows in the bridge section |

<!--history-meta v1
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
