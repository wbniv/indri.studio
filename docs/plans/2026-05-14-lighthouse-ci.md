# Lighthouse CI integration on tag-driven deploys

## Context

`task lighthouse` exists and produces stable, devtools-throttled medians (Pass 4: 100 / 100 / 100). Today it's manually invoked. Every prod deploy that lands a perf-affecting change risks unnoticed regressions until somebody re-runs the audit by hand.

The deploy workflow is tag-driven — `.github/workflows/deploy.yml` fires on `push.tags = ['v*']` plus `workflow_dispatch`. The natural integration point is to chain a Lighthouse step onto that same job, archive the JSON bundle as a per-tag artifact, and surface per-page medians in the workflow summary so a reviewer can see scores at a glance from the Actions UI without downloading anything.

**Out-of-scope by intent:** no deploy gating on Lighthouse score, no regression alerts, no permanent off-runner archival. Each is a reasonable future addition but adds moving parts beyond the ~30-min budget for this task.

## GitHub Actions minutes budget

`wbniv/indri.studio` is **private**, so the workflow consumes from the **2,000 min/month GitHub Free** pool (ubuntu-latest is 1× multiplier — minutes = wall-clock). Recent deploy cadence (15 runs in ~14 h on 2026-05-13/14, ~50 s each) projects ~15 deploys/day × 50 s ≈ **375 min/month** for the current pipeline.

A naive Lighthouse step adds **per deploy**:
- `setup-task`: ~5 s
- `sleep 30`: 30 s
- `task lighthouse` (3 URLs × 3 runs × ~25 s on ubuntu-latest): **~4 min**
- artifact upload + summary: ~10 s

That's **~4.5 min added per deploy** → ~67 min/day at current cadence → **~2,000 min/month — burns the entire free budget**, before counting any other workflows.

**Mitigation: run 1× per URL in CI**, not 3×. Pass 3 established that `devtools` throttling produces zero run-to-run variance — 9 cells, range 0 across all of them. Pass 4 confirmed the same shape (100/100/100 medians, identical per-run scores). A single run per URL is **statistically equivalent** to a 3-run median under this methodology, and humans can still use the 3-run variant locally for paranoid sanity checks.

Per-deploy cost with 1 run per URL:
- `task lighthouse` (3 URLs × 1 run × ~25 s + ~10 s npx warm-up): **~1.5 min**
- Total added: **~2 min/deploy** → ~30 min/day → **~900 min/month**, comfortably under 2,000.

Sustained cadence sensitivity table (1-run variant):

| Deploys/day | LH-added minutes/day | LH-added minutes/month (×30) |
|---:|---:|---:|
| 5 | 10 | 300 |
| 15 (current) | 30 | 900 |
| 30 | 60 | 1800 |

At >25 deploys/day sustained, even the 1-run variant gets tight. If the cadence stays high, follow-up move would be either (a) gate Lighthouse on a tag-pattern (e.g., only `v*.*.0` minor/major), (b) move to a daily cron decoupled from deploys, or (c) bump the plan. None are needed today.

## Approach

Append five steps to the existing `deploy` job in `.github/workflows/deploy.yml`, after the `cloudflare/wrangler-action@v4` step, and parameterise the existing `Taskfile.yml` `lighthouse:` entry with a `RUNS` env var (default 3 locally, override `RUNS=1` in CI):

1. **Install `task`** via `arduino/setup-task@v2` — workflow uses the same `Taskfile.yml` entry humans use locally; no duplicate of the Lighthouse script in YAML.
2. **Brief propagation wait** — `sleep 30` for Cloudflare Workers' global rollout to settle. Wrangler returns when the deploy is accepted; sub-30 s is enough for the new version to reach the runner's edge.
3. **Run `RUNS=1 task lighthouse`** with `continue-on-error: true`. 1-run-per-URL variant per the budget analysis above. The Taskfile entry writes JSONs to `/tmp/lh/latest/` and prints per-run scores + medians to stdout (visible in workflow logs).
4. **Upload artifact** via `actions/upload-artifact@v4` — name `lighthouse-${{ github.ref_name }}`, path `/tmp/lh/latest/*.json`, default 90-day retention.
5. **Write workflow summary** — three `jq` one-liners append a markdown table (per-page Perf + CWV from the single run) to `$GITHUB_STEP_SUMMARY`, so the Actions run page surfaces scores immediately.

`ubuntu-latest` already ships `google-chrome-stable`, `jq`, and `column` — no extra installs beyond `setup-task`. Node 22 is already pinned via `.nvmrc` and set up earlier in the same job.

## Files touched

| Path | Action |
|---|---|
| `.github/workflows/deploy.yml` | Append ~25 lines (5 new steps) after the existing `wrangler-action` step. |
| `Taskfile.yml` | Parameterise the `lighthouse:` task with `RUNS=${RUNS:-3}` so CI can override to 1. Default-3 local behaviour preserved. |
| `TODO.md` | Add a `[x]` Done entry after implementation lands. Partial-stage to avoid collision with the other agent's in-flight items. |

## YAML delta (concrete)

```yaml
      - uses: cloudflare/wrangler-action@v4
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy

      - uses: arduino/setup-task@v2
        with:
          version: '3.x'
          repo-token: ${{ secrets.GITHUB_TOKEN }}

      - name: Wait for Cloudflare propagation
        run: sleep 30

      - name: Lighthouse audit
        id: lh
        continue-on-error: true
        env:
          RUNS: '1'   # 3× run locally; devtools variance is 0 so 1× in CI saves ~3 min/deploy. See plan §"GitHub Actions minutes budget".
        run: task lighthouse

      - name: Upload Lighthouse bundle
        if: steps.lh.outcome == 'success'
        uses: actions/upload-artifact@v4
        with:
          name: lighthouse-${{ github.ref_name }}
          path: /tmp/lh/latest/*.json
          retention-days: 90

      - name: Lighthouse summary
        if: steps.lh.outcome == 'success'
        run: |
          {
            echo "## Lighthouse — ${{ github.ref_name }}"
            echo
            echo "| Page | Perf | FCP | LCP | TBT | CLS |"
            echo "|---|---:|---:|---:|---:|---:|"
            for SLUG in home colophon splitledger; do
              jq -r --arg slug "$SLUG" '
                "| \($slug) | \((.categories.performance.score*100)|round) | \(.audits[\"first-contentful-paint\"].displayValue) | \(.audits[\"largest-contentful-paint\"].displayValue) | \(.audits[\"total-blocking-time\"].displayValue) | \(.audits[\"cumulative-layout-shift\"].displayValue) |"
              ' /tmp/lh/latest/${SLUG}.run-1.report.json
            done
          } >> $GITHUB_STEP_SUMMARY
```

### `Taskfile.yml` delta (concrete)

```yaml
lighthouse:
  desc: "Run Lighthouse 13.3.0 …  RUNS=1 to single-run (CI default; devtools variance is 0)."
  cmds:
    - |
      set -euo pipefail
      mkdir -p /tmp/lh/latest
      RUNS=${RUNS:-3}
      URLS=(
        "https://indri.studio/|home"
        …
      )
      for pair in "${URLS[@]}"; do
        URL="${pair%|*}"; SLUG="${pair#*|}"
        for RUN in $(seq 1 "$RUNS"); do
          …
        done
      done
      # downstream summary loops also use `$(seq 1 "$RUNS")` instead of hardcoded 1 2 3
```

## Verification steps

Per SRC `CLAUDE.md` plan-verification format — keep numbered steps verbatim; below each, paste raw command output in a fenced block and add PASS / FAIL.

1. **Workflow file parses (YAML sanity).**
   ```bash
   python3 -c "import yaml; yaml.safe_load(open('.github/workflows/deploy.yml'))" && echo OK
   ```
   Expect: `OK`.

2. **`gh workflow view` shows the new steps.**
   ```bash
   gh workflow view deploy --yaml | grep -E 'Lighthouse|setup-task|upload-artifact'
   ```
   Expect: the three new step names appear.

3. **Manual `workflow_dispatch` reproduces the full path without a tag bump.**
   ```bash
   gh workflow run deploy --ref main
   sleep 5
   RUN_ID=$(gh run list --workflow deploy --limit 1 --json databaseId -q '.[0].databaseId')
   gh run watch "$RUN_ID" --exit-status || true
   gh run view "$RUN_ID" --log | grep -E 'Lighthouse audit|Upload Lighthouse|Lighthouse summary'
   ```
   Expect: workflow completes; the three Lighthouse step names appear in the log.

4. **Artifact is downloadable + contains 3 JSON files** (one per URL under `RUNS=1`).
   ```bash
   RUN_ID=$(gh run list --workflow deploy --limit 1 --json databaseId -q '.[0].databaseId')
   gh run download "$RUN_ID" -n "lighthouse-main"
   ls *.json | wc -l
   ```
   Expect: 3.

5. **Workflow summary shows the Lighthouse table.**
   ```bash
   gh run view "$RUN_ID" --json jobs -q '.jobs[0].steps[] | select(.name == "Lighthouse summary") | .conclusion'
   ```
   Expect: `success`. Visually confirm the Actions UI shows the markdown table at the top of the run page.

6. **Scores match the locally-run Pass-4 baseline (no CI-environment regression).**
   Compare the workflow's summary table against the most recent local `task lighthouse` medians (home 100, colophon 100, splitledger 100 under Pass 4). Expect: within ±1 point per page. Larger drift = investigate runner CPU/network variance before treating as a real regression.

7. **Real tag-push triggers the same path end-to-end.** Only run when shipping a release.
   ```bash
   task publish
   ```
   Expect: workflow fires on the new tag; artifact named `lighthouse-v<x.y.z>`.

## Out of scope

- **No Lighthouse-score deploy gating.** `continue-on-error: true` keeps the audit informational. A score-threshold guard would block legitimate deploys on runner-CPU variance — defer until we have multi-release data on how stable CI scores are.
- **No off-runner archival.** Artifacts live in GitHub Actions storage for 90 days. R2/S3 push, GitHub Release asset upload, or in-repo `dist/lh/<tag>/` commits are all deferrable.
- **No diff-vs-previous-release comment.** A "this release regressed vs vN-1" check would need cross-run state lookup — feasible (download previous artifact, jq compare) but adds 2–3× the complexity for marginal value when run-to-run delta is ≤ 1 point.
- **No PR-time Lighthouse.** Wires into deploy (tag push + manual dispatch) only. Running Lighthouse on every PR would multiply Actions minutes and chase pre-deploy preview URLs.

## Risks

- **Actions minutes budget at sustained >25 deploys/day.** Covered in §"GitHub Actions minutes budget" above. Mitigation already baked in (RUNS=1 in CI, 3 locally); if cadence stays >25/day sustained, move to tag-pattern gating or a daily cron.
- **`arduino/setup-task@v2` reliability.** Third-party action; verified active maintenance and used widely. If it stops working, fall back to `curl -sL https://taskfile.dev/install.sh | sh` in a `run:` step.
- **30 s wait may be too short** under very-cold-edge conditions or workflow_dispatch from a non-tag commit (where prod is unchanged). If verification shows score drift vs local, bump to 60 s or poll the apex for a cache-buster header.
- **Single-run sensitivity.** With `RUNS=1` we lose run-to-run resilience. Pass 3 + Pass 4 data shows zero variance under `devtools`, but a future change to network conditions or LH version could re-introduce some. If a release ever shows an unexpected drop, the first move is `RUNS=3 task lighthouse` locally before treating it as a real regression.
