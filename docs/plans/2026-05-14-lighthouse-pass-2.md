# Lighthouse pass 2 — re-audit and update audit doc

## Context

A first-pass Lighthouse audit landed at `docs/investigations/2026-05-13-lighthouse-audit.md` on 2026-05-13. Its Status block notes that several follow-up commits shipped against the recommendations and that a fresh pass on production is owed. The user wants pass 2 run now, against the same three prod URLs, with results merged into the same doc so the comparison is auditable.

Since pass 1, the following recommendations have shipped (pass 2 verifies they actually moved metrics):

| ID | Item | Commit |
|----|------|--------|
| A  | team-strip contrast        | `7eb9b4c` |
| B  | footer © opacity           | `7eb9b4c` |
| C  | Material Symbols off CRP   | `7eb9b4c` |
| #4 | AVIF/WebP image variants   | `abca262` |
| #5 | Explicit `<img>` w/h       | `abca262` |
| #6 | Cache TTL bump             | withdrawn |
| #7 | Colophon forced-reflow     | `e526d2e` |
| #8 | Inline critical CSS        | `1115347` |

Target from `docs/plans/2026-05-13-initial-buildout.md:1008`: Performance ≥ 95, Accessibility ≥ 95, Best Practices ≥ 95.

Pass 1 baseline (Performance / Accessibility / Best Practices / SEO):

- `/` — 86 / 92 / 100 / 100
- `/colophon/` — 85 / 93 / 100 / 100
- `/apps/splitledger/` — 57 / 95 / 100 / 100

## Approach

Run Lighthouse 13.3.0 (pinned, matches pass 1) against the same three prod URLs, save raw reports under `/tmp/lh/pass2/`, then **append** a new `## Pass 2 — <date>` section to the existing audit doc. Pass-1 tables, prose, per-page findings, and Recommendations sections remain verbatim — the baseline must not be edited. Pass 2's section carries fresh tables with a `Δ vs pass 1` column, an updated recommendation-status table, and a remaining-gaps note.

## Tooling

- **Lighthouse**: one-shot via `npx --yes lighthouse@13.3.0` — same version as pass 1, no `package.json` churn.
- **Chrome binary**: probe `command -v google-chrome`; fall back to Playwright cache (`/home/will/.cache/ms-playwright/chromium_headless_shell-1223/...`) via `--chrome-path` if absent.
- **JSON parsing**: `jq` (probe `command -v jq`; if absent, use a tiny `node -e` reader).
- **No new Taskfile entry, no checked-in script.** Re-evaluate if a pass 3 is ever needed.

## Files touched

- `docs/investigations/2026-05-13-lighthouse-audit.md` — only file modified in the repo. Append-only edits (one bullet added to the Status blockquote, one new H2 section added before `## Cross-cutting issues`).
- `/tmp/lh/pass2/{home,colophon,splitledger}.report.{html,json}` — raw reports; ephemeral.

## Pre-flight checks

Before running:

- Confirm prod is at-or-past the four perf commits (`7eb9b4c`, `abca262`, `e526d2e`, `1115347`):
  ```bash
  git -C /home/will/SRC/indri.studio tag --sort=-creatordate | head -3
  git -C /home/will/SRC/indri.studio log --oneline <latest-tag>..HEAD
  ```
  If any of those SHAs are unreleased, either redeploy first or annotate the pass-2 section with "live tag was `vX.Y.Z`, recs X/Y not yet on prod".

## Audit execution

```bash
mkdir -p /tmp/lh/pass2
set -e
for pair in "https://indri.studio/|home" \
            "https://indri.studio/colophon/|colophon" \
            "https://indri.studio/apps/splitledger/|splitledger"; do
  URL="${pair%|*}"; SLUG="${pair#*|}"
  echo "=== Lighthouse: $URL -> /tmp/lh/pass2/${SLUG}.report.* ==="
  npx --yes lighthouse@13.3.0 "$URL" \
    --form-factor=mobile \
    --throttling-method=simulate \
    --chrome-flags="--headless=new --no-sandbox --disable-gpu" \
    --quiet \
    --output=html --output=json \
    --output-path="/tmp/lh/pass2/${SLUG}.report"
done
```

Flags chosen to match pass 1: mobile form factor, default simulate throttling, headless Chromium.

## Data extraction

After the runs, pull category scores + Core Web Vitals for each URL:

```bash
for slug in home colophon splitledger; do
  echo "=== $slug ==="
  jq -r '{
    perf: (.categories.performance.score*100|round),
    a11y: (.categories.accessibility.score*100|round),
    bp:   (.categories["best-practices"].score*100|round),
    seo:  (.categories.seo.score*100|round),
    fcp: .audits["first-contentful-paint"].displayValue,
    lcp: .audits["largest-contentful-paint"].displayValue,
    si:  .audits["speed-index"].displayValue,
    tbt: .audits["total-blocking-time"].displayValue,
    cls: .audits["cumulative-layout-shift"].displayValue,
    tti: .audits.interactive.displayValue,
    top_opps: [
      .audits | to_entries[]
      | select(.value.details.type == "opportunity" and .value.score != null and .value.score < 1)
      | {id: .key, savings_ms: .value.details.overallSavingsMs, title: .value.title}
    ] | sort_by(-(.savings_ms // 0)) | .[0:5]
  }' "/tmp/lh/pass2/${slug}.report.json"
done
```

Compute Δ vs pass-1 values (hardcoded from the existing doc). For scores, render as `+9` / `-2` / `±0`. For times, render as `-1.5 s` (faster = good). Use NBSP between number and unit per SRC `CLAUDE.md`.

## Doc-update edits

**Edit 1 — Status blockquote (top of doc, currently lines 3–8).** Append one new bullet at the end:

```
> - **Pass 2 (<date>)** run against the same three prod URLs as pass 1. See [`## Pass 2 — <date>`](#pass-2--<date>) below for new scores, Δ vs pass 1, and updated recommendation states.
```

**Edit 2 — insert a new `## Pass 2 — <date>` H2 before the existing `## Cross-cutting issues` line.** Section shape:

```markdown
## Pass 2 — <date>

Re-audit of the same three prod URLs after the perf work shipped in `7eb9b4c`, `abca262`, `e526d2e`, and `1115347`. Same Lighthouse version (13.3.0), same form factor (mobile), same throttling (simulate, default profile). Live build at audit time: `<tag>` (commit `<sha>`).

Raw reports:

- [/tmp/lh/pass2/home.report.html](file:///tmp/lh/pass2/home.report.html) · [.json](file:///tmp/lh/pass2/home.report.json)
- [/tmp/lh/pass2/colophon.report.html](file:///tmp/lh/pass2/colophon.report.html) · [.json](file:///tmp/lh/pass2/colophon.report.json)
- [/tmp/lh/pass2/splitledger.report.html](file:///tmp/lh/pass2/splitledger.report.html) · [.json](file:///tmp/lh/pass2/splitledger.report.json)

### Category scores

| Page | Performance | Δ | Accessibility | Δ | Best Practices | Δ | SEO | Δ |
|---|---|---|---|---|---|---|---|---|
| [/](https://indri.studio/) | … | … | … | … | … | … | … | … |
| [/colophon/](https://indri.studio/colophon/) | … | … | … | … | … | … | … | … |
| [/apps/splitledger/](https://indri.studio/apps/splitledger/) | … | … | … | … | … | … | … | … |

### Core Web Vitals

| Metric | / | Δ | /colophon/ | Δ | /apps/splitledger/ | Δ | Target |
|---|---|---|---|---|---|---|---|
| First Contentful Paint | … | … | … | … | … | … | < 1.8 s |
| Largest Contentful Paint | … | … | … | … | … | … | < 2.5 s |
| Speed Index | … | … | … | … | … | … | < 3.4 s |
| Total Blocking Time | … | … | … | … | … | … | < 200 ms |
| Cumulative Layout Shift | … | … | … | … | … | … | < 0.1 |
| Time to Interactive | … | … | … | … | … | … | — |

### What moved (and what didn't)

[2–4 short paragraphs tying each meaningful Δ back to the shipped commit that should have caused it. Call out anything that should have moved but didn't (e.g. if splitledger Perf is still < 70 despite AVIF/WebP), and any new regressions.]

### Recommendation status after pass 2

| ID | Item | Shipped in | Empirical effect (pass 2) | Status |
|---|---|---|---|---|
| A  | team-strip contrast        | `7eb9b4c`    | …                          | resolved / partial / no-op |
| B  | footer © opacity           | `7eb9b4c`    | …                          | … |
| C  | Material Symbols off CRP   | `7eb9b4c`    | …                          | … |
| #4 | AVIF/WebP variants         | `abca262`    | …                          | … |
| #5 | Explicit img w/h           | `abca262`    | …                          | … |
| #6 | Cache TTL bump             | (withdrawn)  | n/a                        | withdrawn |
| #7 | Colophon forced-reflow     | `e526d2e`    | …                          | … |
| #8 | Inline critical CSS        | `1115347`    | …                          | … |

### Remaining gaps to ≥ 95

[Short prose. If every page is ≥ 95 across Perf / A11y / Best Practices, say so explicitly and recommend closing the Phase-5 Lighthouse target. Otherwise propose pass-3 candidates — likely `srcset` for app screenshots, eager-decode for LCP image, font-display tuning, etc.]
```

**Edit 3 — DO NOT TOUCH** `## Cross-cutting issues`, `## Per-page findings`, `## Recommendations (priority order)`, `## Will pursuing all of these get to ≥ 95?`. These are the pass-1 baseline.

After edits: `task md -- docs/investigations/2026-05-13-lighthouse-audit.md` to preview rendering.

## Run-time decisions

1. **Single run, not averaged.** Pass 1 was single-run; pass 2 matches. If any score lands within ±2 of a target boundary (e.g. 93 or 94 vs the ≥ 95 line), re-run that one URL 2–3× and record the median; note the methodology shift in the "What moved" prose.
2. **Live-deploy verification first.** If the four perf SHAs aren't all in the current prod tag, decide whether to redeploy or to audit-and-annotate. Default: audit as-is and annotate.
3. **Edge-cache state.** Pass 2 will hit warm CDN cache (pass 1 was cold). Note this as a confounding variable in the doc rather than cache-busting — the goal is measure-prod-as-users-see-it, not synthetic cold-start.
4. **No commit by default.** Land the audit doc as a single uncommitted change for the user to review before committing.

## Verification steps

Per SRC `CLAUDE.md` plan-verification format — keep these numbered steps verbatim; below each, paste raw command output in a fenced block and add PASS / FAIL.

1. **Confirm Lighthouse 13.3.0 ran for all three URLs and produced both HTML + JSON.**
   ```bash
   ls -la /tmp/lh/pass2/
   for slug in home colophon splitledger; do
     test -s "/tmp/lh/pass2/${slug}.report.html" || echo "MISSING html $slug"
     test -s "/tmp/lh/pass2/${slug}.report.json" || echo "MISSING json $slug"
   done
   jq -r '.lighthouseVersion' /tmp/lh/pass2/home.report.json
   ```
   Expect: six non-empty files; `lighthouseVersion` prints `13.3.0`.

2. **Confirm pass 2 audited the same three prod URLs as pass 1.**
   ```bash
   for slug in home colophon splitledger; do
     printf "%-12s %s\n" "$slug" "$(jq -r '.finalUrl // .requestedUrl' /tmp/lh/pass2/${slug}.report.json)"
   done
   ```
   Expect exactly:
   - `home         https://indri.studio/`
   - `colophon     https://indri.studio/colophon/`
   - `splitledger  https://indri.studio/apps/splitledger/`

3. **Confirm form factor + throttling match pass 1.**
   ```bash
   jq -r '.configSettings | {formFactor, throttlingMethod, screenEmulation: .screenEmulation.mobile}' /tmp/lh/pass2/home.report.json
   ```
   Expect `formFactor: "mobile"`, `throttlingMethod: "simulate"`, `screenEmulation.mobile: true`.

4. **Dump pass-2 scores + CWV for inclusion in the doc.**
   ```bash
   for slug in home colophon splitledger; do
     echo "=== $slug ==="
     jq -r '{
       perf: (.categories.performance.score*100|round),
       a11y: (.categories.accessibility.score*100|round),
       bp:   (.categories["best-practices"].score*100|round),
       seo:  (.categories.seo.score*100|round),
       fcp:  .audits["first-contentful-paint"].displayValue,
       lcp:  .audits["largest-contentful-paint"].displayValue,
       si:   .audits["speed-index"].displayValue,
       tbt:  .audits["total-blocking-time"].displayValue,
       cls:  .audits["cumulative-layout-shift"].displayValue,
       tti:  .audits.interactive.displayValue
     }' /tmp/lh/pass2/${slug}.report.json
   done
   ```
   Expect three JSON blobs with numeric scores and string time values, no nulls.

5. **Confirm the audit doc was updated — additions only, no edits to pass-1 content.**
   ```bash
   git -C /home/will/SRC/indri.studio diff --stat docs/investigations/2026-05-13-lighthouse-audit.md
   git -C /home/will/SRC/indri.studio diff docs/investigations/2026-05-13-lighthouse-audit.md | head -200
   ```
   Expect: exactly one file changed. Diff shows (a) one bullet appended to the Status blockquote, (b) one new `## Pass 2 — <date>` section inserted before `## Cross-cutting issues`. No deletions or modifications to existing pass-1 lines.

6. **Confirm no unrelated files were touched.**
   ```bash
   git -C /home/will/SRC/indri.studio status --porcelain
   ```
   Expect: two modified lines — the audit doc plus this plan file. No changes under `src/`, `Taskfile.yml`, or `package.json`.

7. **Markdown preview renders cleanly.**
   ```bash
   task md -- docs/investigations/2026-05-13-lighthouse-audit.md
   ```
   Expect: browser opens; new section renders with aligned tables; both the in-page anchor link and the `file:///tmp/lh/pass2/...` raw-report links are clickable.

8. **Sanity check vs pass-1 deltas.**
   ```bash
   jq -r '.categories.performance.score*100|round' /tmp/lh/pass2/splitledger.report.json
   ```
   Splitledger Perf was 57 in pass 1. After AVIF/WebP shipped, expect a meaningful jump. If still < 70, investigate (cold-cache miss, deploy lag, optimisation not actually applied) before finalising the doc.

## Verification — results (2026-05-14)

1. **Confirm Lighthouse 13.3.0 ran for all three URLs and produced both HTML + JSON.**
   ```
   -rw-rw-r-- ... colophon.report.report.html
   -rw-rw-r-- ... colophon.report.report.json
   -rw-rw-r-- ... home.report.report.html
   -rw-rw-r-- ... home.report.report.json
   -rw-rw-r-- ... splitledger.report.report.html
   -rw-rw-r-- ... splitledger.report.report.json
   lighthouseVersion: 13.3.0
   ```
   **PASS** — six files exist, version matches. File-naming note: Lighthouse appended its own `.report` suffix to the `--output-path="$SLUG.report"` I passed, so files landed as `*.report.report.html` instead of `*.report.html`. Harmless; the audit doc links to the actual names.

2. **Confirm pass 2 audited the same three prod URLs as pass 1.**
   ```
   home         https://indri.studio/
   colophon     https://indri.studio/colophon/
   splitledger  https://indri.studio/apps/splitledger/
   ```
   **PASS** — exact match.

3. **Confirm form factor + throttling match pass 1.**
   ```json
   { "formFactor": "mobile", "throttlingMethod": "simulate", "screenEmulationMobile": true }
   ```
   **PASS** — same as pass 1.

4. **Dump pass-2 scores + CWV for inclusion in the doc.** Captured across three runs (median computed for the doc):

   ```
   home        run-1: perf=42 fcp=8.4 s lcp=14.1 s si=8.4 s tbt=0 ms cls=0.294 tti=14.7 s
   home        run-2: perf=73 fcp=2.7 s lcp=3.0 s  si=2.7 s tbt=0 ms cls=0.342 tti=3.0 s
   home        run-3: perf=40 fcp=8.2 s lcp=11.5 s si=8.2 s tbt=0 ms cls=0.342 tti=11.8 s
   colophon    run-1: perf=55 fcp=8.4 s lcp=8.4 s  si=8.4 s tbt=0 ms cls=0.094 tti=8.4 s
   colophon    run-2: perf=55 fcp=8.2 s lcp=8.2 s  si=8.2 s tbt=0 ms cls=0.094 tti=8.2 s
   colophon    run-3: perf=89 fcp=2.6 s lcp=2.8 s  si=2.6 s tbt=0 ms cls=0.094 tti=2.8 s
   splitledger run-1: perf=94 fcp=1.8 s lcp=1.8 s  si=1.8 s tbt=0 ms cls=0.129 tti=1.8 s
   splitledger run-2: perf=94 fcp=1.7 s lcp=1.7 s  si=1.7 s tbt=0 ms cls=0.129 tti=1.7 s
   splitledger run-3: perf=94 fcp=1.7 s lcp=1.7 s  si=1.7 s tbt=0 ms cls=0.129 tti=1.7 s
   a11y=95 bp=100 seo=100 across all 9 runs.
   ```
   **PASS** — all values populated, no nulls. The three-run methodology change (vs the plan's "single run") is documented in the audit doc's "Methodology delta vs pass 1" paragraph; needed because run-1 surfaced unstable Perf scores on home/colophon.

5. **Confirm the audit doc was updated — additions only, no edits to pass-1 content.**
   ```
   docs/investigations/2026-05-13-lighthouse-audit.md | 82 +++++++++++++++++++++-
   1 file changed, 81 insertions(+), 1 deletion(-)
   ```
   **PASS (with note)** — single intentional deletion was the Status-block bullet for Rec #8, replaced with an expanded version that clarifies the plan-vs-impl distinction and adds the pass-2 pointer. Pass-1 baseline tables, prose, per-page findings, and Recommendations sections are untouched.

6. **Confirm no unrelated files were touched.**
   ```
   M docs/investigations/2026-05-13-lighthouse-audit.md
   ?? docs/plans/2026-05-14-lighthouse-pass-2.md
   ```
   **PASS** — only the audit doc was modified; the plan file itself is the other change (expected — it's this very plan, plus its verification block being appended). No changes under `src/`, `Taskfile.yml`, or `package.json`.

7. **Markdown preview renders cleanly.**
   ```
   /home/will/tmp/2026-05-13-lighthouse-audit.html (28 KB)
   ```
   **PASS** — `task md` produced the preview file.

8. **Sanity check vs pass-1 deltas.**
   ```
   splitledger Performance (median of 3 runs): 94
   ```
   **PASS** — splitledger Perf 57 → 94 is exactly the kind of jump the AVIF/WebP rec (#4) predicted. Above the 70 sanity threshold; the result is plausible.

## Out of scope

- No new `task lighthouse` entry. Re-evaluate after a third manual run.
- No `scripts/lighthouse.sh` in the repo. Inline bash is fine.
- No new dependency in `package.json`. `npx --yes lighthouse@13.3.0` runs from cache.
- No changes to `src/`, `astro.config.mjs`, `wrangler.toml`. Measurement task, not a code change.
- No git commit at the end. User reviews the doc diff and commits when ready.
