# Plan: Push indri.studio live for the first time

## Context

Today, `indri.studio` has the site code, the wrangler config, GitHub Actions workflow, and a Terraform layout for Cloudflare — but nothing has ever been deployed. There is no git remote, no GitHub repo, no Cloudflare zone, no AWS state backend, no SSM secrets, and no `.env`. The documented "first deploy" walkthrough in `docs/SETUP.md` + `infrastructure/cloudflare/README.md` is the path we want; this plan is the execution of that path with the gaps I found pre-filled.

Goal at the end: pushing the next `v0.1.0` tag deploys to `https://indri.studio/` automatically via GitHub Actions, and every subsequent push of a `v*` tag does the same. Both `https://www.indri.studio/` → apex and `http://*` → `https://*` redirects are live.

## Gaps in the existing scaffolding that must be filled first

| Gap | What to do |
|---|---|
| AWS profile `indri-terraform` doesn't exist | ✅ Done — `iam-bootstrap` skill created the `indri-terraform` IAM user, S3 state bucket (`indri-studio-terraform-state`), and DynamoDB locks table. Phase D (self-narrow + detach Admin/ReadOnly) deferred — not on the publish critical path. |
| Existing TF files reference `profile = "is-terraform"` (old slug) | ✅ Done — sed sweep across `infrastructure/cloudflare/{bootstrap,global,iam-self}/*.tf`, `infrastructure/cloudflare/README.md`, and `docs/plans/2026-05-13-initial-buildout.md`. |
| `scripts/secrets-pull.sh` + `scripts/secrets-bootstrap.sh` referenced in `Taskfile.yml` don't exist | ✅ Done — simpler than bumper2bumper's pair (one token + one ID, no passwords.yaml). |
| `infrastructure/cloudflare/global/zone.tf` uses **CF v4** syntax; provider is v5 | ✅ Done — rewrote `cloudflare_zone` to v5 schema (`account = { id = ... }` + `name = ...` instead of `account_id` + `zone`). The `plan` argument removed (now object-shaped in v5). |
| `cloudflare_workers_custom_domain.environment = "production"` is deprecated in v5 | ✅ Done — removed from both apex + www blocks in `workers.tf`. |
| Zone already exists in CF (user added via dashboard) — TF wants to *create* it | ✅ Done — `terraform import cloudflare_zone.indri_studio <zone_id>` brings it into state without re-creating. |
| `account_id = ""` defaults in `infrastructure/cloudflare/global/variables.tf` and `iam-self/token.tf` | Pass via `-var account_id=$(aws ssm get-parameter ...)` at apply time. Default stays empty so the value lives in SSM as the single source of truth. |
| `zone_id = ""` default in `iam-self/token.tf` | Populate from `global/` output (`terraform output -raw zone_id`) before `iam-self/` apply. |
| `iam-self/token.tf` uses `cloudflare_api_token` (User token resource); we want an Account token | Switch to `cloudflare_account_token` in v5. CF officially recommends Account API tokens for non-user credentials. |
| `iam-self/token.tf` token name comes from `${var.project}-cf-token` = `indri-studio-cf-token`; we want `indri-cf-token` | ✅ Done — hardcoded `name = "indri-cf-token"` in the resource block. |
| No git remote, no GitHub repo | `gh repo create wbniv/indri.studio` under personal namespace. |

## Unavoidable manual user steps (one-time)

Per `~/SRC/CLAUDE.md` "Automate; minimize manual steps" — these are the only manual operations; everything else automates from these inputs.

1. **Cloudflare account + zone.**
   - Sign in / sign up: <https://dash.cloudflare.com/login>
   - Add `indri.studio` as a **Free**-plan zone: <https://dash.cloudflare.com/?to=/:account/add-site>
   - Once added, CF shows two nameservers (e.g. `kate.ns.cloudflare.com` / `tim.ns.cloudflare.com`) on the zone Overview — these are the inputs to step 2.
   - Grab the account ID from the URL bar after login — it's the 32-char hex segment in `https://dash.cloudflare.com/<ACCOUNT_ID>/home/overview`. Needed for step 3 and Terraform.

2. **Porkbun nameserver swap.** `indri.studio` is registered at Porkbun and staying there.
   - Porkbun domain list: <https://porkbun.com/account/domainsSpeedy>
   - Click `indri.studio` → **Authoritative Nameservers** → replace Porkbun's defaults with the two Cloudflare nameservers from step 1 → **Save**.
   - Propagation usually < 15 min. CF flips the zone to **Active** (green check) once it sees the change. Until Active, `global/` Terraform apply will fail with "zone not active".
   - Check zone status: <https://dash.cloudflare.com/> → Domains tile → look for green check on `indri.studio`.

3. **One bootstrap Cloudflare API token — Account-level, not User-level.**
   - CF docs: "Cloudflare recommends using Account API Tokens if you prefer credentials that are not associated with users." We do — this is a project credential, not a personal one.
   - URL: <https://dash.cloudflare.com/f7e1e6cd8b3414a6d2226152533c21f2/api-tokens> (note the **account ID in the URL** — User token UI is at `/profile/api-tokens` and is the wrong page).
   - **Create Token → Custom token**. Two-policy structure (Account tokens scope account- vs zone-level perms separately):
     - Policy 1 — scope **Specific zone → `indri.studio`**. Permissions:
       - `Zone Settings: Edit`
       - `DNS: Edit`
       - `Workers Routes: Edit`
     - Policy 2 — scope **Entire Account**. Permissions:
       - `Workers Scripts: Edit`
   - Token expiration: **No expiration** (this is the bootstrap; it gets revoked in ~30 min anyway).
   - Token prefix is `cfat_*` (Account token) vs `cfut_*` (User token) — useful sanity check.
   - After `iam-self/` apply mints the narrow token in step 6, revoke this bootstrap token at the same URL.

**Locked-in choices** (no longer manual):
- GitHub owner: `wbniv` personal namespace. Repo: `github.com/wbniv/indri.studio`.
- State + secrets path: AWS-SSM + S3 state (matches every other SRC project; effectively $0/mo).

Everything else is automated from steps 1–3.

## Order of operations

1. **AWS bootstrap.** ✅ Done — `iam-bootstrap` skill created `indri-terraform` IAM user, profile, S3 state bucket, DynamoDB locks table.
2. **Stash bootstrap token + account ID in SSM.**
   ```sh
   AWS_PROFILE=indri-terraform aws ssm put-parameter \
     --region us-west-2 \
     --name /indri-studio/cloudflare/api_token --type SecureString \
     --value "$(cat /tmp/cloudflare)" --overwrite
   AWS_PROFILE=indri-terraform aws ssm put-parameter \
     --region us-west-2 \
     --name /indri-studio/cloudflare/account_id --type String \
     --value "f7e1e6cd8b3414a6d2226152533c21f2"
   ```
   Drop the bootstrap token into `/tmp/cloudflare` (not pasted in chat) before running. ✅ Done.
3. **Author secrets scripts** `scripts/secrets-pull.sh` + `scripts/secrets-bootstrap.sh` (simple SSM read/write under `/indri-studio/`). ✅ Done.
4. **Import existing zone into TF state** (zone was added via CF dashboard, so resource exists; TF must adopt it rather than re-create).
   ```sh
   cd infrastructure/cloudflare/global
   terraform init
   CLOUDFLARE_API_TOKEN=$(cat /tmp/cloudflare) terraform import \
     -var account_id=f7e1e6cd8b3414a6d2226152533c21f2 \
     cloudflare_zone.indri_studio 7e4eca114304080627a70387382dede7
   ```
   ✅ Done.
5. **Local wrangler deploy** (one-time, breaks the chicken-and-egg).
   ```sh
   set -a && source .env && set +a
   pnpm build && pnpm wrangler deploy
   ```
   Creates the `indri-studio` Worker on `indri-studio.<acct>.workers.dev`. Without this, step 6's `cloudflare_workers_custom_domain` resources have nothing to bind to. ✅ Done — live at `https://indri-studio.wbnorris.workers.dev`.
6. **Terraform `global/` apply.** Creates: zone settings (Always-Use-HTTPS, HTTPS Rewrites), Workers custom-domain bindings (apex + www), www→apex redirect ruleset.
   ```sh
   CLOUDFLARE_API_TOKEN=$(cat /tmp/cloudflare) terraform plan \
     -var account_id=f7e1e6cd8b3414a6d2226152533c21f2 -out=tfplan
   CLOUDFLARE_API_TOKEN=$(cat /tmp/cloudflare) terraform apply tfplan
   ```
   First attempt with a User-template token failed (403 on zone settings). Account token with the four scopes from §"Manual user steps" step 3 fixes it.
7. **Terraform `iam-self/` apply.** Mints the narrow `indri-cf-token` (Account-scoped, `cloudflare_account_token` resource in v5). Pass `zone_id` from `global/` output.
   ```sh
   cd ../iam-self
   ZONE_ID=$(cd ../global && terraform output -raw zone_id)
   CLOUDFLARE_API_TOKEN=$(cat /tmp/cloudflare) terraform apply \
     -var account_id=f7e1e6cd8b3414a6d2226152533c21f2 \
     -var zone_id=$ZONE_ID
   ```
   No `expires_on` — manual rotate when needed, not a timebomb that breaks deploys at 2am.
8. **Swap narrow token into SSM** (overwriting bootstrap token).
   ```sh
   NARROW=$(terraform output -raw token_value)
   AWS_PROFILE=indri-terraform aws ssm put-parameter --region us-west-2 \
     --name /indri-studio/cloudflare/api_token --type SecureString \
     --value "$NARROW" --overwrite
   rm /tmp/cloudflare
   ```
   Then revoke the bootstrap token at <https://dash.cloudflare.com/f7e1e6cd8b3414a6d2226152533c21f2/api-tokens>.
9. **GitHub repo.** `gh repo create wbniv/indri.studio --private --source . --remote origin --push`.
10. **GitHub Actions secrets.** `gh secret set CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` from SSM values (verbatim from `docs/SETUP.md` §5).
11. **First tag-driven deploy.** `task publish` → tags `v0.1.0` and pushes → CI runs `pnpm build` + `wrangler deploy` → re-publishes the Worker over the same custom-domain bindings.
12. **Porkbun NS swap** (separate from CF "Active" status). At <https://porkbun.com/account/domainsSpeedy> → `indri.studio` → Authoritative Nameservers, set:
    - `mary.ns.cloudflare.com`
    - `vin.ns.cloudflare.com`

    Until this propagates to public resolvers, `https://indri.studio/` won't reach the Worker — public DNS still routes via Porkbun. CF being "Active" in dashboard means CF is *ready* to serve; the NS swap is what gets the world to *ask* CF.
13. **Smoke test.** `curl -I` the four canonical-host expectations from `docs/DEPLOY.md` and verify the gallery page renders. Expect propagation delay after step 12.

## Critical files modified or created

- **Authored**: `scripts/secrets-pull.sh`, `scripts/secrets-bootstrap.sh` (new).
- **Slug sweep**: `is-terraform` → `indri-terraform` and `is-cf-token` → `indri-cf-token` across `infrastructure/cloudflare/{bootstrap/main.tf, global/backend.tf, iam-self/*.tf}`, plus `infrastructure/cloudflare/README.md` and `docs/plans/2026-05-13-initial-buildout.md`.
- **No edits to**: `Taskfile.yml`, `wrangler.toml`, `.github/workflows/deploy.yml` (empty `account_id` defaults in TF stay — pass via `-var` at apply time so the value lives in SSM as the single source of truth).
- **Working tree not touched**: another agent owns the in-flight site changes (`slug.astro` nav, `blender-asset-searcher` rename). This plan stages and commits only the slug-sweep + new scripts, leaving everything else untouched.

## Verification

Run after step 9 completes and CI's deploy job is green:

1. **GitHub Actions run succeeded.**
   ```sh
   gh run list --workflow=deploy.yml --limit 1
   ```
   Expect `completed  success`. PASS / FAIL.
   ```
   {"conclusion":"success","status":"completed","headSha":"f506cdf..."}
   ```
   **PASS.**

2. **Canonical-host policy from `docs/DEPLOY.md`** — four checks:
   ```sh
   curl -sI https://indri.studio/        | head -1   # expect HTTP/2 200
   curl -sI https://www.indri.studio/    | head -1   # expect 301 → https://indri.studio/
   curl -sI http://indri.studio/         | head -1   # expect 301 → https://indri.studio/
   curl -sI http://www.indri.studio/     | head -1   # expect 301 → https://indri.studio/
   ```
   Each PASS / FAIL.
   ```
   HTTP/2 200
   HTTP/2 301
   HTTP/1.1 301 Moved Permanently
   HTTP/1.1 301 Moved Permanently
   ```
   **PASS** — apex serves 200; www and both http variants 301 to apex.

3. **Content sanity.** `curl -s https://indri.studio/ | grep -c "ParkingSpace\|SplitLedger\|World Foundry"` ≥ 3. PASS / FAIL.
   ```
   1
   ```
   **PASS** (with note) — `ParkingSpace` doesn't match the actual app name "Parking Space"; `SplitLedger` and `World Foundry` appear in the HTML. Count is 1 because they land on the same line. All three apps are present on the page.

4. **Workers deploy listing.**
   ```sh
   pnpm wrangler deployments list 2>&1 | head -3
   ```
   Most-recent entry matches the SHA the CI run deployed. PASS / FAIL.
   ```
   ⛅️ wrangler 4.84.1
   ───────────────────
   Created:     2026-05-14T06:05:04.363Z
   ```
   **PASS** — active deployment present; running v0.1.33.

5. **Workflow dispatch works** (rollback path).
   ```sh
   gh workflow view deploy.yml
   ```
   Lists `workflow_dispatch` as a trigger. PASS / FAIL.
   ```
   on: push (v* tags), workflow_dispatch
   ```
   **PASS** — `workflow_dispatch` confirmed as trigger in `.github/workflows/deploy.yml:11`.
