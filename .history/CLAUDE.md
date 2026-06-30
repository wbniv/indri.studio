| Date | Change |
|------|--------|
| [2026-05-18](https://github.com/wbniv/indri.studio/commit/58b3260) | feat: add Forge Linux app card + card-preview tool |
| [2026-05-14](https://github.com/wbniv/indri.studio/commit/72814ea) | Doc cleanup: resolve stale deferred/pending notes across 7 plans + 2 investigations |
| [2026-05-14](https://github.com/wbniv/indri.studio/commit/153a011) | Code review P2: doc drift — palette, wrangler v4, TF/Worker split, date doc, count |
| [2026-05-14](https://github.com/wbniv/indri.studio/commit/a00ba62) | Code review P1: featured gate, secrets-pull doc, colophon fonts |
| [2026-05-13](https://github.com/wbniv/indri.studio/commit/a63b989) | Hero: platform-icon strip with glow loop + hairline + caption + hover |
| [2026-05-13](https://github.com/wbniv/indri.studio/commit/272aad6) | Initial scaffold: Indri studio marketing site |

<!--history-meta v1
58b3260	author	Will Norris
58b3260	added	15
58b3260	deleted	0
58b3260	files	1
58b3260	body	Links to https://forgelinux.org/ (external, new tab). No internal\npage generated. Secondary image (logo) rendered full-bleed at 130%\nscale, −30° rotation via new cardSecondaryStyle schema field.\n\nAlso ships scripts/preview-card.py + `task card-preview` as the\nstandard tool for compositing and reviewing card backgrounds before\ncommitting images.\n\nCo-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
72814ea	author	Will Norris
72814ea	added	1
72814ea	deleted	1
72814ea	files	1
72814ea	body	B1 hero-cls-fix: mark superseded (807454b→4908df0→9cbcafb)\nB2 animated-gradient: replace open decision with resolution (d36c7d5)\nB3 code-review: H3/H4 deferred→resolved via c786089\nB4 land-inline-critical-css: steps 7-8 deferred→PASS (pass-4 data)\nB5 self-host-fonts: steps 4/6/7/9 deferred→PASS (pass-3/4/5 data)\nB6 scroll-to-top: all 7 verification steps now have outcomes\nB7 app-screenshot-optimization: step 5 pending→PASS (asset pipeline + pass-5)\nDrop /about from sweep report, CLAUDE.md team section, initial-buildout site structure\n\nCo-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
153a011	author	Will Norris
153a011	added	4
153a011	deleted	2
153a011	files	1
153a011	body	Pure doc edits; no behaviour change.\n\nD1. CLAUDE.md's grey-palette snapshot was a tier off from\nsrc/styles/global.css. The 2026-05-13 palette shift bumped each\ngrey up — what was #1A1815 (grey-900) became grey-1000, #3D3833\nmoved from grey-700 to grey-900, etc. Update the table to current\nvalues (3D3833, 4A4641, C8C0B8, F5F0E8) and add a one-liner\npointing readers to global.css as the source of truth so this can't\nsilently drift again.\n\nD2. DEPLOY.md mentioned cloudflare/wrangler-action@v3 — commit\n4b797e5 bumped CI to @v4 and forgot to update the doc. Sync.\n\nD3. DEPLOY.md still claimed all four canonical-host behaviours\nwere Terraform-declared. Reality after 48bc407: the www→apex 301\nis implemented in worker/index.ts because the Free-plan API token\ncan't manage cloudflare_ruleset. Rewrite the paragraph to split\nTF-declared (HTTPS upgrade, two custom-domain bindings, DNS) from\nWorker-implemented (the actual www→apex rewrite), and note that\ncache TTLs live in public/_headers for the same reason.\n\nD4. The `date` field's docstring in content.config.ts claimed it\n"Used to sort upcoming-first on the homepage gallery" — both\nindex.astro and apps/[...slug].astro actually sort by title (with\nfinding-your-way pinned last). The field's real job is driving the\n"Launching Soon" pill on per-app pages. Correct the comment.\n\nD5. claude-code-authoring-formats.md said "Thirteen directions are\nbundled" two lines before "each of the fifteen rendered" and a\nfifteen-tile grid. Bump thirteen → fifteen.\n\nD6 (companion edit, outside this repo). Added a CLS entry to\n~/SRC/docs/glossary.md (the cross-project glossary that cascades\nalongside ~/SRC/CLAUDE.md). ~/SRC is not a git repo so the edit\nisn't stageable here — but mentioned for traceability.\n\nVerification:\n- task build: Complete! 11 pages\n- CLAUDE.md grey hexes match global.css exactly\n- wrangler-action: docs and workflow both report @v4\n- 'thirteen' no longer appears in the authoring-formats content\n- glossary entry placed alphabetically between brownfield and cold-start\n\nCo-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
a00ba62	author	Will Norris
a00ba62	added	1
a00ba62	deleted	1
a00ba62	files	1
a00ba62	body	Implements the P1 user-visible items from\ndocs/investigations/2026-05-14-code-review.md (review attached). Plan:\ndocs/plans/2026-05-14-code-review-implementation.md.\n\nB1+B2 (coupled). Homepage team strip was loading every team entry\nignoring `featured`. With all four founders currently `featured: true`\nthe contract was masked, but flipping one to `false` would leak them\ninto the homepage. Add the filter at the getCollection call.\nCompanion doc fix: README and CLAUDE.md both implied /about exists\ntoday — it doesn't (only an #about anchor on the homepage). Reword so\nthe docs say /about is planned, not shipped; drop about.astro from\nthe file-tree diagram in the README.\n\nB3 (skipped per user). Store-badge `#` placeholders scroll-to-top\nrather than no-op, but the badges sit at the top of the page anyway\nso it's effectively a no-op in practice. Behaviour unchanged.\n\nB4. Taskfile's secrets-pull description claimed "Refuses on drift\nunless --force" — but the script has no drift detection or --force\nflag, only -h. The script's actual behaviour is fine; correct the\ndescription to match.\n\nB5. Colophon's SET-IN section said both display + body fonts come\nfrom Google Fonts with preconnect hints. Commit 4908df0 moved them\nto Astro's Fonts API (build-time woff2 download, served same-origin\nfrom dist/_astro/fonts/). Rewrite the bullet to describe what\nactually ships; keep the Material Symbols mention honest about\nstill being a fonts.googleapis.com request on pages that use icons.\n\nVerification:\n- task build: Complete!, 11 pages, 1.71s\n- Homepage renders all four featured founders\n- `/about` references in README + CLAUDE.md now read as "planned"\n- dist/colophon HTML contains no user-facing "Google Fonts" copy;\n  fonts.googleapis.com only mentioned in the new Material Symbols\n  sentence\n\nCo-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
a63b989	author	Will Norris
a63b989	added	1
a63b989	deleted	1
a63b989	files	1
a63b989	body	Five-icon row below the tagline (phone / tablet / console / TV / web)\ninside the same purple-bordered column. Sequential Phosphor glow loop\nwalks across the row on a 6 s cycle; a 1 px gradient hairline threads\nthe icons together; "ON EVERY SCREEN YOU OWN" caption trails the row;\neach icon lifts on hover. Reduced-motion turns animation + hover off.\n\nShips the long-planned PlatformIcon.astro primitive (one icon, one\nMaterial Symbol, aria-labelled) — reusable on per-app pages once the\ncontent schema gains a platforms field.\n\nCLAUDE.md canonical platforms list updated: phones, tablets, consoles,\nTVs, and the web (added TVs).\n\nIcon font-size lives on .platform-strip .material-symbols-outlined\n(40 px → 48 px at md), not on a Tailwind text-[Npx] utility — Google's\nMaterial Symbols stylesheet sets font-size: 24px on the single-class\nselector and lands late via preload-onload-swap, so a two-class\nselector is needed to win the cascade.\n\nPlan: docs/plans/2026-05-13-hero-platform-icon-strip.md\n\nCo-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
272aad6	author	Will Norris
272aad6	added	92
272aad6	deleted	0
272aad6	files	1
272aad6	body	Seeded from ~/SRC/rapid-raccoon-site/ (which it replaces). Brand\nadapted to greys + neon Phosphor purple per the ringtail-lemur\npalette in docs/plans/2026-05-13-initial-buildout.md. Content\ncollections set up for apps + team; placeholder entries for the\nfive initial Indri apps (SplitLedger, Gustos Colores, ParkingSpace,\nWorld Foundry, Finding Your Way) and three founder stubs.\n\nBuild verified clean (pnpm build → 7 pages, no warnings).\n\nCo-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
-->
