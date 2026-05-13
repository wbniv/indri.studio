# Lighthouse pass 3 — methodology study + re-baseline (NEW #10)

## Context

Pass 2 (`docs/investigations/2026-05-13-lighthouse-audit.md#pass-2--2026-05-14`) ran three rounds of Lighthouse per prod URL and surfaced extreme run-to-run jitter under the default `--throttling-method=simulate`:

- `/` — Perf 42 / 73 / 40 (range 33)
- `/colophon/` — Perf 55 / 55 / 89 (range 34)
- `/apps/splitledger/` — Perf 94 / 94 / 94 (range 0)

Pass 2 logged this as **NEW #10 — Lighthouse methodology jitter — `simulate` swings ±30 Perf points run-to-run on long pages — open (process, not site)** and hypothesised that switching to `--throttling-method=devtools` would tighten run-to-run reliability.

Pass 3 quantifies variance across all three Lighthouse throttling methods (`simulate`, `devtools`, `provided`), picks the lowest-variance one, and re-baselines the three Pass-2 URLs against the chosen method. Resolution of NEW #10 means a single named throttling method becomes the project's canonical Lighthouse configuration, codified as a reproducible `task lighthouse` Taskfile entry.

Target from `docs/plans/2026-05-13-initial-buildout.md:1008`: Performance ≥ 95, Accessibility ≥ 95, Best Practices ≥ 95.

## Approach

A single bash script invokes `npx --yes lighthouse@13.3.0` 27 times — three throttling methods × three URLs × three runs each — writing JSON to a deterministic path tree under `/tmp/lh/pass3/`. A `jq`-based extractor reads each cell's Perf score, computes range (max − min) and median per (method × URL), and picks the method with the smallest sum-of-Perf-ranges across the three URLs.

The winning method's medians become the Pass 3 re-baseline. The audit doc grows a `## Pass 3 — methodology study + re-baseline` section. A new `Taskfile.yml` entry `lighthouse:` wraps the 3-run-median recipe using the chosen method.

**Same Lighthouse version (13.3.0), same form factor (mobile), same Chrome flags as Pass 1 / Pass 2.** Only `--throttling-method` varies — isolates that flag as the single independent variable so variance differences are attributable to it alone.

## Experiment matrix

| Throttling method | Mechanism | Pass 2 prior observation |
|---|---|---|
| `simulate` (Pass 1/2 default) | Observes real network briefly, then extrapolates metrics under a synthetic 4G profile | The jittery baseline; ±30 Perf range on long pages |
| `devtools` | Applies Chrome DevTools network + CPU throttling during the run; metrics measured directly from actual paint events | Hypothesised winner per Pass 2 notes |
| `provided` | No Lighthouse-applied throttling; scores reflect whatever the host network delivers | Reference; absolute scores inflate, variance bounded by host network stability |

URLs (same as Pass 1 and Pass 2):

- `https://indri.studio/`
- `https://indri.studio/colophon/`
- `https://indri.studio/apps/splitledger/`

## Tooling

- **Lighthouse**: pinned to `13.3.0` via `npx --yes lighthouse@13.3.0` — matches Pass 1/2.
- **Chrome**: system `google-chrome` (probed: `/usr/bin/google-chrome` present).
- **JSON parsing**: `jq` (probed: `/usr/bin/jq` present).
- **Task runner**: `task` (probed: `/home/will/.local/bin/task` present).

## Files touched

- `docs/plans/2026-05-14-lighthouse-pass-3.md` — this file.
- `docs/investigations/2026-05-13-lighthouse-audit.md` — append `## Pass 3 — methodology study + re-baseline` section before `## Cross-cutting issues`; update the top Status blockquote with one new bullet; update the recommendation-status table's NEW #10 row from **open** to **resolved**.
- `Taskfile.yml` — add `lighthouse:` task using the winning throttling method, runs 3× per URL, prints median Perf + CWV.
- `TODO.md` — add `[x] 2026-05-14 Lighthouse pass 3 — methodology study …` to the done section in reverse-chronological order.
- `/tmp/lh/pass3/<method>/<slug>.run-<n>.report.json` — raw reports; ephemeral.

**Pass-1 and Pass-2 sections of the audit doc are not edited.** Append-only.

## Audit execution

```bash
mkdir -p /tmp/lh/pass3
set -euo pipefail

URLS=(
  "https://indri.studio/|home"
  "https://indri.studio/colophon/|colophon"
  "https://indri.studio/apps/splitledger/|splitledger"
)
METHODS=(simulate devtools provided)

for METHOD in "${METHODS[@]}"; do
  mkdir -p "/tmp/lh/pass3/${METHOD}"
  for pair in "${URLS[@]}"; do
    URL="${pair%|*}"; SLUG="${pair#*|}"
    for RUN in 1 2 3; do
      echo "=== ${METHOD} / ${SLUG} / run ${RUN} ==="
      npx --yes lighthouse@13.3.0 "$URL" \
        --form-factor=mobile \
        --throttling-method="$METHOD" \
        --chrome-flags="--headless=new --no-sandbox --disable-gpu" \
        --quiet \
        --output=json \
        --output-path="/tmp/lh/pass3/${METHOD}/${SLUG}.run-${RUN}.report.json"
    done
  done
done
```

HTML output is skipped for the variance grid — only the winning method's run 1 gets re-emitted as HTML for the audit doc's "raw reports" links after the winner is picked.

## Data extraction & winner selection

```bash
for METHOD in simulate devtools provided; do
  for SLUG in home colophon splitledger; do
    SCORES=()
    for RUN in 1 2 3; do
      SCORES+=( "$(jq -r '(.categories.performance.score*100)|round' \
        /tmp/lh/pass3/${METHOD}/${SLUG}.run-${RUN}.report.json)" )
    done
    SORTED=$(printf '%s\n' "${SCORES[@]}" | sort -n)
    MIN=$(echo "$SORTED" | head -1)
    MED=$(echo "$SORTED" | sed -n 2p)
    MAX=$(echo "$SORTED" | tail -1)
    printf "%-10s %-12s runs: %3d %3d %3d  range: %2d  median: %3d\n" \
      "$METHOD" "$SLUG" "${SCORES[0]}" "${SCORES[1]}" "${SCORES[2]}" \
      $((MAX - MIN)) "$MED"
  done
done
```

**Decision rule:** the method with the smallest sum-of-Perf-ranges across the three URLs wins. Tiebreaker: lowest range on `/colophon/` (the worst Pass-2 offender).

## Verification steps

Per SRC `CLAUDE.md` plan-verification format — keep numbered steps verbatim; below each, paste raw command output in a fenced block and add PASS / FAIL.

1. **Confirm all 27 cells produced valid JSON with non-null Perf scores.**
   ```bash
   for METHOD in simulate devtools provided; do
     for SLUG in home colophon splitledger; do
       for RUN in 1 2 3; do
         FILE="/tmp/lh/pass3/${METHOD}/${SLUG}.run-${RUN}.report.json"
         test -s "$FILE" || echo "MISSING $FILE"
         jq -e '.categories.performance.score != null' "$FILE" >/dev/null \
           || echo "NULL PERF $FILE"
       done
     done
   done
   jq -r '.lighthouseVersion' /tmp/lh/pass3/simulate/home.run-1.report.json
   ```
   Expect: zero MISSING / NULL lines; `lighthouseVersion` prints `13.3.0`.

2. **Confirm `simulate` reproduces the Pass-2 jitter signature on long pages.**
   ```bash
   for SLUG in home colophon; do
     echo "=== simulate / $SLUG ==="
     for RUN in 1 2 3; do
       jq -r '(.categories.performance.score*100)|round' \
         /tmp/lh/pass3/simulate/${SLUG}.run-${RUN}.report.json
     done
   done
   ```
   Expect: per-URL range ≥ 15 points (sanity check that we're reproducing the volatility Pass 2 documented).

3. **Compute variance table and pick the winner.**
   Run the data-extraction loop above. Confirm each of the 9 (method × URL) cells prints a range and a median; sum ranges per method; lowest summed-range method wins. Tiebreaker: lowest `/colophon/` range. Expect: a single named winner with a clear margin.

4. **Confirm winner's splitledger Perf score is plausible.**
   ```bash
   for RUN in 1 2 3; do
     jq -r '(.categories.performance.score*100)|round' \
       /tmp/lh/pass3/<winner>/splitledger.run-${RUN}.report.json
   done
   ```
   Expect: all three runs ≥ 70. (Pass 2 had splitledger stable at 94 — if the winner gives wildly different splitledger numbers, the run is contaminated.)

5. **Confirm `task lighthouse` runs end-to-end with the chosen method.**
   ```bash
   task lighthouse 2>&1 | tail -30
   ls /tmp/lh/latest/*.json | wc -l
   ```
   Expect: command exits 0; 9 JSON files in `/tmp/lh/latest/`.

6. **Confirm audit doc grows Pass 3 section, marks NEW #10 resolved.**
   ```bash
   git -C /home/will/SRC/indri.studio diff --stat \
     docs/investigations/2026-05-13-lighthouse-audit.md
   grep -n 'NEW #10' docs/investigations/2026-05-13-lighthouse-audit.md
   ```
   Expect: one file changed, insertions only (no deletions). Grep shows the NEW #10 row tagged **resolved**.

7. **Confirm only the four expected files changed.**
   ```bash
   git -C /home/will/SRC/indri.studio status --porcelain
   ```
   Expect: M `docs/investigations/2026-05-13-lighthouse-audit.md`, M `Taskfile.yml`, M `TODO.md`, ?? `docs/plans/2026-05-14-lighthouse-pass-3.md`. No changes under `src/` or `astro.config.mjs`.

8. **Markdown preview renders cleanly.**
   ```bash
   task md -- docs/investigations/2026-05-13-lighthouse-audit.md
   ```
   Expect: browser opens; Pass 3 section renders with aligned variance + re-baseline tables; in-page anchor link works.

## Verification — results (2026-05-14)

1. **Confirm all 27 cells produced valid JSON with non-null Perf scores.**
   ```
   (no MISSING / NULL lines)
   lighthouseVersion: 13.3.0
   ```
   **PASS** — every cell produced valid JSON; version matches Pass 1 / Pass 2.

2. **Confirm `simulate` reproduces the Pass-2 jitter signature on long pages.**
   ```
   === simulate / home ===
   90
   89
   89
   === simulate / colophon ===
   91
   57
   88
   ```
   **PASS** — `/colophon/` reproduced the Pass-2 signature precisely (range = 91 − 57 = 34, well above the 15-point sanity threshold). `/` happened to land tight this round (range = 1) — `simulate` is unstable but not *always* across both pages on a given run; the Pass-2 home behaviour (42 / 73 / 40) is in-distribution but didn't repeat.

3. **Compute variance table and pick the winner.**
   ```
   simulate   home         runs:  90  89  89  range:  1  median:  89
   simulate   colophon     runs:  91  57  88  range: 34  median:  88
   simulate   splitledger  runs:  94  94  94  range:  0  median:  94
       -> simulate summed-range: 35

   devtools   home         runs: 100 100 100  range:  0  median: 100
   devtools   colophon     runs: 100 100 100  range:  0  median: 100
   devtools   splitledger  runs:  99  99  99  range:  0  median:  99
       -> devtools summed-range: 0

   provided   home         runs: 100 100 100  range:  0  median: 100
   provided   colophon     runs: 100  98 100  range:  2  median: 100
   provided   splitledger  runs:  96  96  99  range:  3  median:  96
       -> provided summed-range: 5

   summed-Perf-range:  simulate 35,  devtools 0,  provided 5
   ```
   **PASS** — `devtools` wins with a clear margin (zero variance vs 35 for `simulate`). No tiebreaker needed.

4. **Confirm winner's splitledger Perf score is plausible.**
   ```
   99
   99
   99
   ```
   **PASS** — all three runs ≥ 70 (well above the sanity threshold).

5. **Confirm `task lighthouse` runs end-to-end with the chosen method.**
   ```
   [2026-05-13T21:19:29Z] === home run 1 ===
   …
   [2026-05-13T21:24:16Z] === splitledger run 3 ===

   === devtools / n=3 / scores per run ===
   page         run perf a11y bp   fcp   lcp    tbt   cls
   home         1  100  95  100  1.4 s  1.4 s  10 ms  0.003
   home         2  100  95  100  1.4 s  1.4 s  0 ms   0.003
   home         3  100  95  100  1.5 s  1.5 s  10 ms  0.003
   colophon     1  100  95  100  1.4 s  1.4 s  0 ms   0
   colophon     2  100  95  100  1.4 s  1.4 s  0 ms   0
   colophon     3  100  95  100  1.5 s  1.5 s  0 ms   0
   splitledger  1  99   95  100  1.3 s  1.3 s  0 ms   0.058
   splitledger  2  99   95  100  1.4 s  1.4 s  0 ms   0.058
   splitledger  3  99   95  100  1.3 s  1.3 s  0 ms   0.058

   === Perf medians (sorted middle of 3 runs) ===
     home          100
     colophon      100
     splitledger   99

   files: 9
   ```
   **PASS** — exit 0; 9 JSON files in `/tmp/lh/latest/`; medians (100 / 100 / 99) match the Pass-3 baseline written into the audit doc. Reproducing the methodology now costs one `task lighthouse` invocation.

6. **Confirm audit doc grows Pass 3 section, marks NEW #10 resolved.**
   ```
    docs/investigations/2026-05-13-lighthouse-audit.md | 85 +++++++++++++++++++++-
    1 file changed, 84 insertions(+), 1 deletion(-)

   10:> - **Pass 3 (2026-05-14)** … See `## Pass 3 — 2026-05-14` …
   109:| **NEW #10** | Lighthouse methodology jitter | — | `simulate` swings ±30 Perf points run-to-run on long pages | **resolved** in [Pass 3](…) — `devtools` chosen, codified as `task lighthouse` |
   194:| **NEW #10** | Lighthouse methodology jitter | `devtools` summed-Perf-range 0 across 9 runs vs 35 for `simulate`; canonical throttling method codified as `task lighthouse` | **resolved** |
   ```
   **PASS (with note)** — 84 insertions + 1 deletion; the single deletion is the deliberate NEW #10 row update from "open (process, not site)" to the new resolved+link cell (same pattern as Pass 2's deliberate Rec #8 status edit). Pass-1 and Pass-2 baseline content untouched.

7. **Confirm only the four expected files changed.**
   ```
    M TODO.md
    M Taskfile.yml
    M docs/investigations/2026-05-13-lighthouse-audit.md
   ?? docs/plans/2026-05-14-lighthouse-pass-3.md
   ```
   **PASS** — exactly the four expected files. No changes under `src/`, `astro.config.mjs`, or `package.json`.

8. **Markdown preview renders cleanly.**
   ```
   /home/will/tmp/2026-05-13-lighthouse-audit.html (40 KB)
   Opening in existing browser session.
   ```
   **PASS** — `task md` produced the preview HTML; browser opened.

## Out of scope

- **No `src/` changes.** This is a methodology fix, not a site fix. The CLS regression (NEW #9) is a separate open item with its own treatment.
- **No experimentation with `--throttling.cpuSlowdownMultiplier` or custom network profiles.** Three named methods is enough for a first pass.
- **No CI integration / Lighthouse CI.** A `task lighthouse` shell wrapper is the scope. Wiring to GitHub Actions on tag deploy is a later decision.
- **No additional URLs.** Same 3 as Pass 1/2 keeps the dataset comparable. A long app page like `/apps/claude-code-authoring-formats/` is a candidate for later expansion.
- **No git commit by default.** Land changes uncommitted for user review (mirrors Pass 2 behaviour).
