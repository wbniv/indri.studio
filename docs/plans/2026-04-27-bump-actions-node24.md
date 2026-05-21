# Bump GitHub Actions to Node.js 24 versions

## Context

GitHub Actions runners are deprecating Node.js 20 (forced default Node 24 on **2026-06-02**, removal of Node 20 on **2026-09-16**). A recent CI run surfaced the warning explicitly for `actions/checkout@v4`, but a sweep of `.github/workflows/` shows several other Node-based actions are also pinned to Node-20-era majors. To make the warning go away cleanly and avoid a second pass when the cutoff lands, bump every Node-based action in the repo to its latest Node-24-aware major.

All targeted actions have stable Node-24 majors that have been out long enough to be battle-tested, and the bumps are all CI-only (no production behavior change).

## Inventory of pinned actions

| File | Action | Current | Target | Notes |
|---|---|---|---|---|
| `.github/workflows/backend-ci.yml` | `actions/checkout` | v4 | **v5** | Node 24 since v5.0.0 |
| `.github/workflows/backend-ci.yml` | `dart-lang/setup-dart` | v1 | v1 (no change) | v1 mutable tag already tracks v1.7.2 (Node 24) |
| `.github/workflows/mobile-ci.yml` | `actions/checkout` | v4 | **v5** | |
| `.github/workflows/mobile-ci.yml` | `subosito/flutter-action` | v2 | v2 (no change) | Major tag v2 still current; not flagged by warning |
| `.github/workflows/frontend-release.yml` | `actions/checkout` | v4 | **v5** | |
| `.github/workflows/frontend-release.yml` | `subosito/flutter-action` | v2 | v2 (no change) | |
| `.github/workflows/frontend-release.yml` | `aws-actions/configure-aws-credentials` | v4 | **v5** | Node 24 since v5.0.0; latest is v5 line, not v6 — confirm before bumping |
| `.github/workflows/frontend-release.yml` | `docker/login-action` | v3 | **v4** | v4.1.0 is latest, Node 24 |
| `.github/workflows/frontend-release.yml` | `docker/build-push-action` | v5 | **v6** | v6 is the first Node-24 major; v7 also exists but v6 is the minimum-bump fix |
| `.github/workflows/lightsail-rebake.yml` | `actions/checkout` | v4 | **v5** | |
| `.github/workflows/lightsail-rebake.yml` | `aws-actions/configure-aws-credentials` | v4 | **v5** | |
| `.github/workflows/lightsail-rebake.yml` | `actions/github-script` | v7 | **v8** | v8 introduced Node 24 default |

(Composite/wrapper actions like `subosito/flutter-action` and `dart-lang/setup-dart`'s mutable v1 tag don't need a major bump — the runner warning didn't flag them and their latest releases are already Node-24-compatible.)

## Files to edit

1. `.github/workflows/backend-ci.yml` — 2 occurrences of `actions/checkout@v4` → `@v5` (lines 23, 37).
2. `.github/workflows/mobile-ci.yml` — 2 occurrences of `actions/checkout@v4` → `@v5` (lines 22, 35).
3. `.github/workflows/frontend-release.yml`
   - `actions/checkout@v4` → `@v5` (lines 24, 40)
   - `aws-actions/configure-aws-credentials@v4` → `@v5` (line 55)
   - `docker/login-action@v3` → `@v4` (line 62)
   - `docker/build-push-action@v5` → `@v6` (line 69)
4. `.github/workflows/lightsail-rebake.yml`
   - `actions/checkout@v4` → `@v5` (line 64)
   - `aws-actions/configure-aws-credentials@v4` → `@v5` (line 67)
   - `actions/github-script@v7` → `@v8` (line 108)

## Risk / breaking-change notes

- **`actions/checkout@v5`**: same inputs as v4. No expected behavior change.
- **`aws-actions/configure-aws-credentials@v5`**: same inputs we use (`aws-access-key-id`, `aws-secret-access-key`, `aws-region`). Newer majors tightened OIDC defaults but we don't use OIDC, so no impact.
- **`docker/login-action@v4`**: same `registry`/`username`/`password` inputs.
- **`docker/build-push-action@v6`**: same `context`/`file`/`push`/`tags` inputs we use. v6 added attestations/provenance but these are off by default — no change unless we opt in.
- **`actions/github-script@v8`**: `script` input unchanged. The inline script in `lightsail-rebake.yml:111-123` uses `github.rest.repos.createCommitComment` and `require('child_process')` — both still work on Node 24.
- All five major bumps have been out long enough (months to a year+) to be considered stable for CI.

## Verification

End-to-end verification is to push the change and watch each workflow run green:

1. **Backend CI / Mobile CI** — both run on every PR to `main`. Open the PR for these changes; both should run and succeed with no Node 20 deprecation warning in the runner logs. Inspect the "Set up job" log section for any new warning.
2. **Lightsail rebake** — triggers on changes under `infrastructure/aws-lightsail/` etc. **The workflow-file change itself (`.github/workflows/lightsail-rebake.yml` is in the `paths:` filter) will trigger a rebake on merge.** Confirm the run completes and the success-comment lands on the merge commit (proves `github-script@v8` works).
3. **Frontend release** — triggers on changes under `mobile/**` etc. This change does NOT touch those paths, so a rebake-style trigger won't happen. To verify, either (a) include a no-op touch under `mobile/` in the same PR, or (b) accept that the next normal frontend change will exercise the bumped actions, and watch that run when it happens.
4. **Sanity check after merge:** open Actions → most recent run for each workflow → confirm zero "Node.js 20 actions are deprecated" warnings in the "Set up job" output.

## Process notes

- Per repo convention, also save a copy of this plan to `docs/plans/` (e.g. `docs/plans/2026-04-27-actions-node24-bump.md`) before/at commit time so it lives with the codebase.
- Single commit is appropriate — small, atomic, all CI hygiene. Suggested message: `ci: bump GitHub Actions to Node.js 24-compatible majors`.
