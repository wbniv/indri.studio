# CI integration for `task lighthouse`

> Capture a Lighthouse bundle on every tag-driven prod deploy so each release has an archived performance snapshot — without making Lighthouse a deploy gate.

## Context

`task lighthouse` exists and produces stable, devtools-throttled Pass-3 baselines (Perf 100 / 100 / 99). Today it's manually invoked. Every prod deploy that lands a perf-affecting change risks unnoticed regressions until somebody re-runs the audit by hand.

The deploy workflow is tag-driven (`.github/workflows/deploy.yml`: `push.tags = ['v*']` + `workflow_dispatch`). The natural integration point is to chain a Lighthouse step onto that same job, archive the JSON bundle as a per-tag artifact, and surface medians in the workflow summary so a reviewer can see scores at a glance from the Actions UI.

**Out-of-scope by intent:** no deploy gating on Lighthouse score, no regression alerts, no permanent off-runner archival. Both are reasonable future additions but each adds moving parts beyond the ~30-min budget.

## Approach

Append five steps to the existing `deploy` job (`.github/workflows/deploy.yml`) after the `wrangler-action` step:

1. **Install `task`** via `arduino/setup-task@v2` — keeps the workflow using the same Taskfile entry humans use locally; avoids duplicating the lighthouse script in YAML.
2. **Brief propagation wait** — `sleep 30` is enough for Cloudflare Workers' global rollout to settle (deploy returns when accepted; world-wide propagation is sub-30s on the free tier).
3. **Run `task lighthouse`** with `continue-on-error: true` so a Lighthouse failure doesn't fail the deploy. The Taskfile entry already writes JSONs to `/tmp/lh/latest/` and prints per-run scores + medians to stdout (visible in workflow logs).
4. **Upload artifact** via `actions/upload-artifact@v4` — name `lighthouse-${{ github.ref_name }}`, path `/tmp/lh/latest/*.json`, default 90-day retention.
5. **Write workflow summary** — three `jq` one-liners append a markdown table of per-page Perf median + CWV to `$GITHUB_STEP_SUMMARY`, so the Actions run page shows scores without needing to download the artifact.

`ubuntu-latest` ships with `google-chrome-stable`, `jq`, and `column` — no extra installs needed beyond `setup-task`.

## Files touched

| Path | Action |
|---|---|
| `.github/workflows/deploy.yml` | Append ~25 lines (5 new steps) after the existing `wrangler-action` step. No other file changes. |

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
            echo "| Page | Perf (median of 3) | FCP | LCP | TBT | CLS |"
            echo "|---|---:|---:|---:|---:|---:|"
            for SLUG in home colophon splitledger; do
              PERF=()
              for RUN in 1 2 3; do
                PERF+=( "$(jq -r '(.categories.performance.score*100)|round' /tmp/lh/latest/${SLUG}.run-${RUN}.report.json)" )
              done
              MED=$(printf '%s\n' "${PERF[@]}" | sort -n | sed -n 2p)
              jq -r --arg slug "$SLUG" --arg med "$MED" '
                "| \($slug) | \($med) | \(.audits[\"first-contentful-paint\"].displayValue) | \(.audits[\"largest-contentful-paint\"].displayValue) | \(.audits[\"total-blocking-time\"].displayValue) | \(.audits[\"cumulative-layout-shift\"].displayValue) |"
              ' /tmp/lh/latest/${SLUG}.run-2.report.json
            done
          } >> $GITHUB_STEP_SUMMARY
```

## Verification steps

Per SRC `CLAUDE.md` plan-verification format — keep numbered steps verbatim; below each, paste raw command output in a fenced block and add PASS / FAIL.

1. **Workflow file parses (YAML lint).**
   ```bash
   python3 -c "import yaml; yaml.safe_load(open('.github/workflows/deploy.yml'))" && echo OK
   ```
   Expect: `OK`.

2. **`act` dry-run lists all jobs (if `act` installed) or `gh workflow view` shows the expected steps.**
   ```bash
   gh workflow view deploy --yaml | grep -E 'Lighthouse|setup-task|upload-artifact'
   ```
   Expect: the three new step names appear.

3. **Manual trigger via `workflow_dispatch` on `main` reproduces the new steps' behaviour without bumping prod.**
   ```bash
   gh workflow run deploy --ref main
   sleep 5
   RUN_ID=$(gh run list --workflow deploy --limit 1 --json databaseId -q '.[0].databaseId')
   gh run watch "$RUN_ID" --exit-status || true
   gh run view "$RUN_ID" --log | grep -E 'Lighthouse|task lighthouse|Upload Lighthouse'
   ```
   Expect: workflow completes (deploy succeeds); Lighthouse step runs; artifact upload step runs.

4. **Artifact is downloadable + contains 9 JSON files.**
   ```bash
   RUN_ID=$(gh run list --workflow deploy --limit 1 --json databaseId -q '.[0].databaseId')
   gh run download "$RUN_ID" -n "lighthouse-main"
   ls *.json | wc -l
   ```
   Expect: 9 files.

5. **Workflow run summary shows the Lighthouse table.**
   ```bash
   gh run view "$RUN_ID" --json jobs -q '.jobs[0].steps[] | select(.name == "Lighthouse summary") | .conclusion'
   ```
   Expect: `success`. Then visually confirm the Actions UI shows the markdown table at the top of the run page.

6. **Real tag-push triggers the same path end-to-end.** (Only run when actually shipping a release.)
   ```bash
   task publish    # bumps patch, tags, pushes
   ```
   Expect: workflow fires on the tag; Lighthouse step runs; artifact named `lighthouse-v<x.y.z>`.

7. **Scores match the locally-run Pass-3 baseline (no CI-specific regression).**
   Compare the workflow's summary table against the most recent local `task lighthouse` medians (home 100, colophon 100, splitledger 98–99). Expect: within ±1 point per page; if larger drift appears, investigate runner-environment differences before treating as a real regression.

## Out of scope

- **No Lighthouse-score deploy gating.** `continue-on-error: true` keeps the audit informational. Adding a score-threshold guard is a future decision and would block legitimate deploys on `simulate`-style variance — even though we use `devtools` now, runner CPU variance is a wildcard.
- **No off-runner archival.** Artifacts live on GitHub Actions storage for 90 days. R2/S3 push, GitHub-Release-asset upload, or in-repo `dist/lh/<tag>/` commits are deferrable.
- **No diff-vs-previous-release.** A "this release regressed vs vN-1" comment would need durable cross-run state — feasible (download previous artifact, jq compare) but adds 2–3× the complexity for marginal value when run-to-run delta is ≤ 1 point.
- **No PR-time Lighthouse.** This wires into deploy (tag push + manual dispatch) only. Running Lighthouse on every PR would multiply Actions minutes and chase pre-deploy preview URLs — separate concern.
