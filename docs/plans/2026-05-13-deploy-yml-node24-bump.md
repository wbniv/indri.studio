# GitHub Actions: bump to Node-24-bundled major versions

## Context

The v0.1.21 deploy run (commit `a4ef9f4`) succeeded but emitted a GitHub
deprecation warning:

> Node.js 20 actions are deprecated. The following actions are running on
> Node.js 20 and may not work as expected: actions/checkout@v4,
> actions/setup-node@v4, cloudflare/wrangler-action@v3, pnpm/action-setup@v4.
> Actions will be forced to run with Node.js 24 by default starting June 2nd,
> 2026. Node.js 20 will be removed from the runner on September 16th, 2026.

The project's own Node version (`.nvmrc` → `22`, `package.json` engines
→ `>=22.12.0`) is already modern. The deprecation is at a different
layer: the JavaScript-implemented action wrappers themselves run on the
runner's bundled Node 20 runtime. New majors of each action bundle Node 24
(or higher) and aren't affected. Doing this now removes the warning from
every future deploy log, gets ahead of the June 2026 forcing date, and is
a tiny edit confined to one file.

## Change

Update version pins in `.github/workflows/deploy.yml`:

| Action | Current | New | Notes |
|---|---|---|---|
| `actions/checkout` | `@v4` | `@v6` | v5 + v6 both Node-24-bundled. v6 moves persisted credentials to `$RUNNER_TEMP` (we don't use `persist-credentials` so no impact). |
| `pnpm/action-setup` | `@v4` | `@v6` | v6 adds pnpm 11 support; `with: version: 10` continues to pin our version. |
| `actions/setup-node` | `@v4` | `@v6` | v5 auto-caches via `packageManager` field; v6 limits auto-cache to npm. We pass `cache: pnpm` explicitly, so behaviour is unchanged regardless. |
| `cloudflare/wrangler-action` | `@v3` | `@v4` | v4 defaults to wrangler v4. We already use wrangler v4 locally (`"wrangler": "^4.84.1"` in `package.json`), so the bump aligns CI with dev. |

No argument changes. Each action's inputs we currently set
(`version: 10`, `node-version-file: .nvmrc`, `cache: pnpm`, `apiToken`,
`accountId`, `command: deploy`) are accepted unchanged by the new majors.

## Files modified

- `.github/workflows/deploy.yml` — four version-pin string replacements.

## Verification

1. Commit the bump on main and push.
2. The push doesn't trigger the workflow (it's tag-driven), so manually fire
   `workflow_dispatch` to test the new action versions without waiting for a
   real release tag:
   ```bash
   gh workflow run deploy.yml --ref main
   gh run watch
   ```
3. Confirm:
   - Run succeeds (`completed success`).
   - The Node-20-deprecation annotation no longer appears in the run summary
     (check `gh run view <run-id> --log` for the annotation line — should
     be absent).
   - Site still loads at https://indri.studio (the workflow_dispatch deploys
     the current state, so this is a no-op redeploy if the working tree
     matches what's on origin/main).
