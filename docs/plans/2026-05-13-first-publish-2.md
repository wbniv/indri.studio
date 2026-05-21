# Plan: Push indri.studio live for the first time

## Context

Today, `indri.studio` has the site code, the wrangler config, GitHub Actions workflow, and a Terraform layout for Cloudflare — but nothing has ever been deployed. There is no git remote, no GitHub repo, no Cloudflare zone, no AWS state backend, no SSM secrets, and no `.env`. The documented "first deploy" walkthrough in `docs/SETUP.md` + `infrastructure/cloudflare/README.md` is the path we want; this plan is the execution of that path with the gaps I found pre-filled.

Goal at the end: pushing the next `v0.1.0` tag deploys to `https://indri.studio/` automatically via GitHub Actions, and every subsequent push of a `v*` tag does the same. Both `https://www.indri.studio/` → apex and `http://*` → `https://*` redirects are live.

The user is leaving the uncommitted `slug.astro` prev/next nav and the in-flight `wf-asset-browser` → `blender-asset-searcher` rename **untouched in the working tree** — this plan does not commit them.

## Gaps in the existing scaffolding that must be filled first

| Gap | What to do |
|---|---|
| AWS profile `is-terraform` doesn't exist | Run the `iam-bootstrap` skill to create the `is-terraform` IAM user, S3 state bucket (`indri-studio-terraform-state`), and DynamoDB locks table — matches what `infrastructure/cloudflare/bootstrap/main.tf` expects. |
| `scripts/secrets-pull.sh` + `scripts/secrets-bootstrap.sh` referenced in `Taskfile.yml` don't exist | Author both, mirroring the bumper2bumper pair (simple SSM read/write, no drift-protection round-tripping for v1 — drift refusal can come in a v2). |
| `account_id = ""` defaults in `infrastructure/cloudflare/global/variables.tf` and `infrastructure/cloudflare/iam-self/token.tf` | Replace with the real CF account ID (sourced from SSM at apply time via `-var`, *not* hardcoded — leave the default empty and pass `-var="account_id=$(aws ssm get-parameter ...)"`). |
| `zone_id = ""` default in `iam-self/token.tf` | Populate after `global/` applies once and exports `zone_id` — see ordering note in §"Order of operations". |
| No git remote, no GitHub repo | `gh repo create` under chosen owner. |

## Unavoidable manual user steps (one-time)

Per `~/SRC/CLAUDE.md` "Automate; minimize manual steps" — these are the only manual operations; everything else automates from these inputs.

1. **Cloudflare account + zone.** Confirm a Cloudflare account exists on your login. Add `indri.studio` as a Free-plan zone. CF shows two nameservers (e.g. `kate.ns.cloudflare.com` / `tim.ns.cloudflare.com`) — these are the inputs to step 2.
2. **Porkbun nameserver swap.** `indri.studio` is registered at Porkbun and staying there. Log into Porkbun → Domain Management → `indri.studio` → Authoritative Nameservers → replace Porkbun's defaults with the two CF nameservers from step 1. Save. Propagation usually < 15 min; CF flips the zone to **Active** (green check) once it sees the change. Until Active, `global/` Terraform apply will fail with "zone not active".
3. **One bootstrap Cloudflare API token.** Dashboard → My Profile → API Tokens → "Edit Cloudflare Workers" template → scope to your account and `indri.studio` zone → copy the token (shown once). This token gets self-narrowed by `iam-self/` and then revoked.

**Locked-in choices** (no longer manual):
- GitHub owner: `wbniv` personal namespace. Repo: `github.com/wbniv/indri.studio`.
- State + secrets path: AWS-SSM + S3 state (matches every other SRC project; effectively $0/mo).

Everything else is automated from steps 1–3.

## Order of operations

1. **AWS bootstrap.** Invoke `iam-bootstrap` skill → creates `is-terraform` IAM user, profile in `~/.aws/config`, S3 state bucket, DynamoDB locks table.
2. **Stash the Cloudflare bootstrap token + account ID in SSM.**
   ```sh
   AWS_PROFILE=is-terraform aws ssm put-parameter \
     --region us-west-2 \
     --name /indri-studio/cloudflare/api_token --type SecureString \
     --value "<bootstrap-token>"
   AWS_PROFILE=is-terraform aws ssm put-parameter \
     --region us-west-2 \
     --name /indri-studio/cloudflare/account_id --type String \
     --value "<account-id>"
   ```
3. **Author the missing secrets scripts** at `scripts/secrets-pull.sh` and `scripts/secrets-bootstrap.sh` (simple SSM read/write under `/indri-studio/`).
4. **Terraform: bootstrap is already covered by step 1**, so skip `infrastructure/cloudflare/bootstrap/` (the iam-bootstrap skill produced the same artefacts). Verify the bucket/table names match what the `backend.tf` files reference.
5. **Terraform: `global/` first.** Even though `iam-self/` is listed first in the README, applying `global/` first creates the zone so we can read `zone_id` for the narrow token policy. Pass the bootstrap token as `CLOUDFLARE_API_TOKEN` and the account ID as `-var`. Apply produces zone_id, Workers custom-domain bindings for apex + www, the www→apex redirect rule, and Always-Use-HTTPS.
6. **Terraform: `iam-self/`.** Plug in the `zone_id` from step 5 output, apply — mints the narrow `is-cf-token`. Push the resulting token value into SSM (overwriting the bootstrap token), then revoke the bootstrap token in the CF dashboard.
7. **GitHub repo.** `gh repo create wbniv/indri.studio --private --source . --remote origin --push` (push `main`). Private by default — flip to public later if you want unlimited Actions minutes.
8. **GitHub Actions secrets.** Two secrets, read from SSM, set via `gh secret set` (commands are already documented verbatim in `docs/SETUP.md` §5).
9. **First deploy.** `task publish` → tags `v0.1.0` and pushes → CI runs `pnpm build` + `wrangler deploy` → site is live at `https://indri.studio/`.
10. **Smoke test.** `curl -I` the four canonical-host expectations from `docs/DEPLOY.md` and verify the gallery page renders.

## Critical files modified or created

- **Authored**: `scripts/secrets-pull.sh`, `scripts/secrets-bootstrap.sh` (new).
- **No edits to**: `Taskfile.yml`, `wrangler.toml`, `.github/workflows/deploy.yml`, any TF files (the empty `account_id` defaults stay — pass via `-var` at apply time so the value lives in SSM as the single source of truth).
- **Working-tree changes deliberately left unstaged**: `src/pages/apps/[...slug].astro`, `src/content/apps/blender-asset-searcher.md` (mid-rename), `public/screenshots/blender-asset-searcher/`. These are user's other in-flight work; the publish should not pick them up.

## Verification

Run after step 9 completes and CI's deploy job is green:

1. **GitHub Actions run succeeded.**
   ```sh
   gh run list --workflow=deploy.yml --limit 1
   ```
   Expect `completed  success`. PASS / FAIL.

2. **Canonical-host policy from `docs/DEPLOY.md`** — four checks:
   ```sh
   curl -sI https://indri.studio/        | head -1   # expect HTTP/2 200
   curl -sI https://www.indri.studio/    | head -1   # expect 301 → https://indri.studio/
   curl -sI http://indri.studio/         | head -1   # expect 301 → https://indri.studio/
   curl -sI http://www.indri.studio/     | head -1   # expect 301 → https://indri.studio/
   ```
   Each PASS / FAIL.

3. **Content sanity.** `curl -s https://indri.studio/ | grep -c "ParkingSpace\|SplitLedger\|World Foundry"` ≥ 3. PASS / FAIL.

4. **Workers deploy listing.**
   ```sh
   pnpm wrangler deployments list 2>&1 | head -3
   ```
   Most-recent entry matches the SHA the CI run deployed. PASS / FAIL.

5. **Workflow dispatch works** (rollback path).
   ```sh
   gh workflow view deploy.yml
   ```
   Lists `workflow_dispatch` as a trigger. PASS / FAIL.

Paste raw output below each numbered step and write the results back into this plan file before promoting the corresponding TODO item to `[x]`.
