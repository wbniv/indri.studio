| Date | Change |
|------|--------|
| [2026-06-25](https://github.com/wbniv/indri.studio/commit/0f75a0a) | docs(plan): update Mermaid-fix plan to the real fix + add Astro 7 plan |
| [2026-06-25](https://github.com/wbniv/indri.studio/commit/33191d7) | docs(plan): record the Mermaid diagram label-clipping fix |

<!--history-meta v1
0f75a0a	author	Will Norris
0f75a0a	added	101
0f75a0a	deleted	133
0f75a0a	files	1
0f75a0a	body	- Rewrite the Mermaid label-clipping plan to reflect the actual two-cause fix\n  (Inter-font CSS + base64-carry & astro:build:done injection), the verification,\n  and the dead ends (incl. correcting the 39a4947 commit's wrong claim that\n  Astro 7 wouldn't help — it would: the corruption is rehype's build-time\n  re-serialisation, and pristine SVG renders clean).\n- Add the Astro 7 / Sätteri migration plan (verbatim raw HTML would obviate the\n  injection integration; requires porting rehypeExternalLinks).\n- TODO: Astro 7 migration + fix the stale sync-docs manifest (deleted\n  wt/321-snes-hwref branch breaks task sync-docs).\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01LRTvYvtgA5tTtrFDw9ih6Z
33191d7	author	Will Norris
33191d7	added	154
33191d7	deleted	0
33191d7	files	1
33191d7	body	Retroactive plan for the two-cause fix shipped as v0.1.64 (f945cf3, CSS font\ncascade) + v0.1.65 (b5d8929, <br></br> double line-break). Captures root cause,\nthe fix in both layers, the files/commits/deploys, and the numbered verification\nwith raw 0/10-overflow measurements. Notes the unverified PDF/release-docs path\nand the cross-OS font-wrap residual as follow-ups.\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01LRTvYvtgA5tTtrFDw9ih6Z
-->
