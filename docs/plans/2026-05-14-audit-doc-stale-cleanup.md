# Plan: Audit-doc cleanup — annotate Pass-1 sections superseded by Pass 4

## Context

`docs/investigations/2026-05-13-lighthouse-audit.md` was written as a single Pass-1 investigation note on 2026-05-13, then extended in-place with Pass-2, Pass-3, and Pass-4 sections as new audits ran. Pass 4 (landed earlier today) resolved every remaining `render-blocking-resources` item, brought `uses-long-cache-ttl` to `null` (n/a), and cleared the Phase-5 ≥ 95 target for the third pass in a row.

However, the **Pass-1 era sections at the bottom of the doc are now stale**: the `## Cross-cutting issues`, `## Per-page findings`, `## Recommendations (priority order)`, and `## Will pursuing all of these get to ≥ 95?` sections still read as live open issues, even though every item in them has been resolved or accepted-by-design. The top-of-doc status banner also has three out-of-date lines (Rec #6 "withdrawn", Rec #7 "live re-audit owed", Rec #8 "pending prod verification").

The user pasted the stale `### Render-blocking resources` paragraph back into chat today thinking it was an open problem. That's the failure mode this plan addresses — future readers (including the user, including me in a later session) should be able to see at a glance which Pass-1 findings are resolved without re-tracing the investigation.

**Intended outcome:** keep the Pass-1 historical narrative intact (don't rewrite history) but add the smallest set of in-place annotations so every stale section is visibly marked as resolved with a one-click anchor to the resolving Pass.

## Approach

Three annotation patterns, used consistently:

1. **Top-of-section banner blockquote** — for whole sections that are now stale. Format:
   ```
   > **Resolved by Pass N (2026-05-14).** [One sentence — what changed.] See [`## Pass N`](#anchor) for verification. Pass-1 narrative below preserved as historical record.
   ```
   This pattern mirrors the existing Pass-3 blockquote at L188 ("Numbers are not comparable to Pass 2…").

2. **In-banner-line append** — for the three stale status-banner lines (L6, L7, L8). Don't rewrite; append a `**→ Pass N resolved this via X.**` to the end of each line so the original framing stays readable as Pass-1 intent.

3. **Heading prefix** — for the speculative `## Will pursuing all of these get to ≥ 95?` section. Change the heading to `## Will pursuing all of these get to ≥ 95? (Pass-1 speculation — answered yes by Pass 4)` so a glance at the TOC tells the story.

No content is deleted. No Pass-1 narrative is rewritten. Every annotation links to the resolving Pass section so a reader can verify the claim.

## Files to change

Only `docs/investigations/2026-05-13-lighthouse-audit.md`. No other files reference the stale anchors (Explore agent confirmed; `TODO.md:7` correctly anchors to the Pass-4 section, not the Pass-1 sections).

## Edits (line-number ordered)

### L5 — Pass-1 "fresh Lighthouse pass still owed" → satisfied

Append to the end of the existing line (after "track it as a new investigation note."):

> **→ Pass 2 / Pass 3 / Pass 4 below ran the owed re-audits.**

### L6 — Rec #6 "withdrawn" → resolved by Pass 4

Append to the end of the existing line (after "no content-hashing / versioning strategy in place."):

> **→ Pass 4 resolved this** via `public/_headers` route (not Terraform rulesets; Free-plan API token can't manage them). `_astro/*` + `screenshots/*` now serve `public, max-age=31536000, immutable` on prod; HTML stays short-TTL for deploy flush.

### L7 — Rec #7 "live re-audit owed" → resolved by Pass 2

Append (after "Live re-audit owed."):

> **→ Pass 2 verified:** TBT 180 ms → 0 ms on colophon, all three pages now 0 ms TBT under `devtools` (Pass 3 + Pass 4).

### L8 — Rec #8 "pending prod verification" → resolved by Pass 4

Append (after "Pending prod verification + Lighthouse re-spot post-deploy."):

> **→ Pass 4 verified on prod:** `_astro/Base.<hash>.css` no longer present in deployed HTML; `render-blocking-resources` audit returns `null` (n/a).

### L302 — `## Cross-cutting issues (all three pages)` — add top-of-section banner

Insert a new blockquote immediately after the H2, before L304's `### Render-blocking resources`:

> **Resolved by Pass 4 (2026-05-14).** Every item in this section was resolved by the render-blocking + cache-TTL cleanup. `render-blocking-resources` and `uses-long-cache-ttl` both return `null` (n/a) on all 9 production runs; `network-dependency-tree` follows as a consequence. See [`## Pass 4 — 2026-05-14`](#pass-4--2026-05-14-render-blocking--cache-ttl-cleanup) for per-fix verification. Pass-1 narrative below preserved as historical record.

(Three subsections at L304, L316, L320 stay verbatim — the banner covers them.)

### L324 — `## Per-page findings` — add top-of-section banner

Insert immediately after the H2, before L326's `### / (homepage)`:

> **Largely resolved by later passes (2026-05-14).** Findings below mix three categories: render-blocking and image-delivery items resolved by Pass 4 + Pass 2 (`#3`, `#4`, `#5`, `#6`, `#8`); team-strip + footer-opacity A11y items resolved in commit `7eb9b4c` (Items A + B + C in the status banner); colour-contrast on Phosphor `#B026FF` accepted as a brand trade in [`Why A11y stays at 95`](#why-a11y-stays-at-95-and-isnt-being-chased). See the per-Pass `Recommendation status` tables for item-by-item state.

### L369 — `## Recommendations (priority order)` — add top-of-section banner + per-item status

Insert immediately after the H2, before L371's `### High impact, low effort`:

> **Status as of Pass 4 (2026-05-14):**
>
> | # | Item | Status |
> |---|---|---|
> | 1 | Team-strip contrast | **resolved** (commit `7eb9b4c`, Items A/B/C) |
> | 2 | Footer © opacity | **resolved** (commit `7eb9b4c`) |
> | 3 | Material Symbols off the critical render path | **resolved** by Pass 4 (`<MaterialSymbols />` per-page component) |
> | 4 | AVIF/WebP screenshot variants | **resolved** (commit `abca262`, verified Pass 2) |
> | 5 | Explicit `width`/`height` on screenshot `<img>` | **resolved** (commit `abca262`, verified Pass 2) |
> | 6 | Cloudflare cache TTL on `_astro/*` + `screenshots/*` | **resolved** by Pass 4 (`public/_headers` route) |
> | 7 | Colophon `forced-reflow` | **resolved** (Pass 2 — TBT 180 ms → 0) |
> | 8 | Inline critical CSS | **resolved** (commit `2db6163`; `inlineStylesheets: "always"`, Pass 4-verified) |
>
> All eight Pass-1 recommendations are resolved. Pass-1 prose below preserved as historical context.

### L388 — `## Will pursuing all of these get to ≥ 95?` — rename + add answer line

Rewrite the heading from:
```
## Will pursuing all of these get to ≥ 95?
```
to:
```
## Will pursuing all of these get to ≥ 95? (Pass-1 speculation — answered "yes" by Pass 4)
```

Insert a single blockquote immediately after the heading, before L390:

> **Answered: yes.** Three consecutive passes (Pass 2, Pass 3, Pass 4) have cleared the Phase-5 ≥ 95 bar across Perf / A11y / BP / SEO on all three sampled URLs. Pass 4 medians: Perf 100 / 100 / 100, A11y 95 / 95 / 95 (the brand-colour trade documented in [`Why A11y stays at 95`](#why-a11y-stays-at-95-and-isnt-being-chased)), BP 100 / 100 / 100, SEO 100 / 100 / 100. Speculative analysis below is Pass-1 era and preserved for historical context.

(The original speculative prose at L390–L394 stays verbatim.)

## Existing utilities to reuse

- The Pass-3 blockquote pattern at L188 (`> **Numbers are not comparable to Pass 2.** …`) is the prior art for the "this Pass-N section supersedes earlier framing" annotation style — match it.
- Anchor format follows the existing pattern: `[`## Pass 4 — 2026-05-14`](#pass-4--2026-05-14-render-blocking--cache-ttl-cleanup)` — Markdown auto-slugger lowercases, replaces spaces with hyphens, strips punctuation except double-em-dash converts to double-hyphen.
- `task md -- docs/investigations/2026-05-13-lighthouse-audit.md` already wired for browser preview.

## Verification

1. **Every stale-flag string is either gone from current-tense framing or annotated with a Pass-N resolution.**
   ```bash
   grep -nE 'withdrawn|owed|pending prod|likely shorter|would drop' docs/investigations/2026-05-13-lighthouse-audit.md
   ```
   Expect: every hit appears either inside a Pass-1-historical-context blockquote or with a `→ Pass N resolved this` annotation on the same line.

   ```
   L5: "owed" + "**→ Pass 2 / Pass 3 / Pass 4 below ran the owed re-audits.**"
   L6: "withdrawn" + "**→ Pass 4 resolved this** via public/_headers route..."
   L7: "owed" + "**→ Pass 2 verified:** TBT 180 ms → 0 ms..."
   L8: "pending prod" + "**→ Pass 4 verified on prod:** _astro/Base.<hash>.css no longer present..."
   L52: false positive — "owed" matches inside "showed" (Pass-2 methodology body)
   L106, L108: Pass-2 status-table snapshot rows, bounded by "Recommendation status after pass 2" header at L97
   L262: Pass-4 status table — the canonical resolution narrative for #6 (mentions "ruleset path withdrawn" as historical context); not stale
   L314, L320, L369: Pass-1 body inside the "Resolved by Pass 4" / "Largely resolved by later passes" banner-covered sections
   ```
   **PASS** — every match is either a false positive (L52), inside a section-header-bounded snapshot (L106/L108), the Pass-4 canonical resolution (L262), or covered by a banner blockquote (L314/L320/L369). The four stale top-banner lines (L5–L8) all carry the `→ Pass N` annotation.

2. **Markdown preview renders cleanly.**
   ```
   $ task md -- docs/investigations/2026-05-13-lighthouse-audit.md
   /home/will/tmp/2026-05-13-lighthouse-audit.html (251 KB)
   Opening in existing browser session.
   ```
   **PASS** — render is +4 KB vs pre-cleanup (was 247 KB), as expected for the added blockquotes; no markdown errors.

3. **TOC scan: stale sections read as "resolved/historical" at a glance.** Every one of `## Cross-cutting issues`, `## Per-page findings`, `## Recommendations`, `## Will pursuing…` now leads with a Pass-N status banner before any Pass-1 prose. **PASS** by visual inspection of the rendered HTML (banners are visually distinct blockquote-styled blocks with bold "Resolved by" / "Status as of" / "Answered: yes" leads).

4. **No external references broken.** `TODO.md:7` and any other `docs/` cross-references still resolve — Explore agent confirmed no inbound links to the Pass-1 section anchors exist; verify after edits with:
   ```bash
   grep -rE 'cross-cutting|will-pursuing|per-page-findings|recommendations-priority' docs/ TODO.md
   ```
   ```
   docs/plans/2026-05-14-audit-doc-stale-cleanup.md:   grep -rE 'cross-cutting|...   # the verification command itself, not an anchor link
   ```
   **PASS** — only hit is this plan file's own verification command in prose; no actual anchor links to Pass-1 sections exist elsewhere.
   Expect: no hits (no cross-file dependencies on the Pass-1 anchors).

5. **Commit + push** the doc change as a single commit.

## Out of scope

- **No Pass-1 prose rewrites.** The original investigation text stays verbatim. Annotations are additive only.
- **No section reordering.** Pass-1 sections stay below Pass-2/3/4 even though they're now historical — keeps the chronological narrative.
- **No new Pass.** This is purely a cleanup of stale framing in already-resolved sections. No new audit runs, no new findings.
- **No edits to other docs.** `docs/plans/*.md` and `TODO.md` already reference Pass 4 correctly.
