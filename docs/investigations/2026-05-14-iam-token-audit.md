# IAM token audit — indri-cf-token (2026-05-14)

Resolves code review item H5 from [`2026-05-14-code-review.md`](2026-05-14-code-review.md).

## Question

The review asked: does the narrow project-scoped Cloudflare API token (`indri-cf-token`, declared in [`infrastructure/cloudflare/iam-self/token.tf`](../../infrastructure/cloudflare/iam-self/token.tf)) actually have the permissions needed to manage everything in [`infrastructure/cloudflare/global/`](../../infrastructure/cloudflare/global/)? Three scenarios were proposed:

1. The token in SSM has broader permissions than `token.tf` declares (i.e. someone added perms via the dashboard).
2. The narrow token works fine because Cloudflare's implicit permission inheritance covers the gap.
3. The TF resources have only ever been applied with the bootstrap token, and the narrow token would 403 on first re-apply.

## Findings

**Scenario 1, with a twist: the token *in SSM/.env* is not the token *Terraform manages*. They're different tokens.**

Evidence:

1. **`task tf-plan` against `global/` succeeds with the current SSM-sourced token.** No `403 Unauthorized` errors on any of the 9 resources (zone, two zone settings, two custom domains, four email-routing entries). Plan output: `No changes. Your infrastructure matches the configuration.` So the token can read everything in `global/`.

2. **The token currently in SSM (and `.env`) has id `90c2dd6c27d2b1a1fd6f560e4be85b9f`.**

    ```sh
    curl -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
      https://api.cloudflare.com/client/v4/user/tokens/verify \
      | jq -r '.result.id'
    ```

3. **The token Terraform thinks it created (per `iam-self/` state) has id `d789f7ae94935755d1ea4af01a859c06`.** Issued 2026-05-13 08:39:58Z. Policies match `token.tf` exactly: DNS:Edit + Workers Routes:Edit (zone scope) + Workers Scripts:Edit (account scope).

    ```sh
    cd infrastructure/cloudflare/iam-self
    terraform state show cloudflare_account_token.indri_cf_token | grep '^\s*id\s*='
    # → id = "d789f7ae94935755d1ea4af01a859c06"
    ```

4. **The env token can read API surfaces outside what `token.tf` declares.** Tested directly:
    - `GET /zones/{zid}/settings/always_use_https` → `success: true, value: "on"`. Zone Settings:Read is not in `token.tf`.
    - `GET /zones/{zid}/email/routing/rules` → `success: true, 2 rules`. Email Routing:Read is not in `token.tf`.

5. **The env token cannot list account-scoped tokens.** `GET /accounts/{aid}/tokens` returns `9109 Unauthorized` — so it's not fully account-admin either. It's somewhere in between the narrow TF declaration and a bootstrap admin token.

## Interpretation

The most plausible story:

- During first-apply (2026-05-13), the bootstrap CF token was used. `iam-self/` minted the narrow `indri-cf-token` at id `d789...` and stored it in Terraform state.
- Step 2 of `infrastructure/cloudflare/README.md` ("push the resulting narrow token into SSM and revoke the bootstrap token") was **not completed**. Either skipped, or done partway and reverted.
- The token now in SSM (id `90c2...`) is likely the bootstrap token, or some other manually-minted broader token. Its policy details aren't queryable from itself (read-access on `/accounts/{aid}/tokens/{tid}` is denied).
- All subsequent operations — `task tf-plan`, `task deploy`, CI runs — use the broader `90c2...` token via `CLOUDFLARE_API_TOKEN` in `.env` / GitHub Actions secret.
- The narrow `d789...` token exists in Cloudflare's database, recorded in TF state, but nothing uses it.

## What this means for reproducibility

The chain "TF code → narrow token → SSM → runtime" is broken at the SSM step. Anyone re-bootstrapping the project from `git clone` + `terraform apply` would get a working narrow token but a runtime still authenticating with whatever they have in `.env`. The token actually in use isn't visible in IaC.

## Recommended cleanup (follow-up plan, not this commit)

Two-step pivot, with a verification gap before each:

### Step 1 — Verify the env token's actual scope (manual)

Open the Cloudflare dashboard → My Profile → API Tokens. Find the token with id `90c2dd6c27d2b1a1fd6f560e4be85b9f` (URL: `https://dash.cloudflare.com/profile/api-tokens/<id>/edit`). Record its declared permissions. This is the gap `token.tf` is missing.

Likely set, based on what the SSM token can already read in `global/`:

- Account: Workers Scripts:Edit, Workers Routes:Edit (or Workers:Edit), Email Routing Addresses:Edit, **possibly** Account Settings:Read.
- Zone (indri.studio): DNS:Edit, Zone Settings:Edit, Zone:Edit (for the zone resource itself), Email Routing:Edit.

### Step 2 — Reconcile

Two paths, depending on the verification result:

**Path A — Expand `token.tf` to match the actual env token, re-mint, swap in SSM.** Add the missing permission groups (`zone_settings_write`, `email_routing_edit`, etc.) so the narrow TF-managed token would have the same surface as today's env token. Apply, push the new token to SSM (`aws ssm put-parameter --name /indri-studio/cloudflare/api_token --type SecureString --value "$(terraform output -raw token_value)" --overwrite`), revoke the old `90c2...` token. Now TF is the source of truth.

**Path B — Narrow the env token down to what `token.tf` declares.** Test that `task tf-plan` and `task deploy` still succeed with the narrow `d789...` token. If yes, push the narrow token's value to SSM, revoke `90c2...`. Cheaper change to the IaC but riskier — likely fails on email-routing or zone-settings apply.

Recommend Path A. It captures actual practice in code rather than restricting it, and the resulting narrow token is still meaningfully tighter than full account admin (no token listing, no other zones, no R2/D1/etc).

### Out of scope here

- Splitting `global/` into account-scoped vs runtime modules (review option 3b). Worth revisiting only if Path A's expanded token feels broader than warranted — current scale doesn't justify the structural complexity.
- Rotating the bootstrap S3-state IAM user. Unrelated; separate audit if needed.

## Verification on Path A (for the future follow-up commit)

1. `task tf-plan` from `iam-self/` shows the policy change (additional permission_groups in the diff). No drift on other resources.
2. `task tf-apply` succeeds; new token value emitted.
3. `aws ssm get-parameter --name /indri-studio/cloudflare/api_token --with-decryption | jq -r '.Parameter.Value'` equals the new TF output.
4. Old token id `90c2...` no longer verifies (revoked).
5. CI deploy on the next `v*` tag still succeeds (or run a manual `workflow_dispatch` after rotating).

## Reference

- `~/SRC/CLAUDE.md`: "Everything must be reproducible." — the SSM/TF mismatch directly violates this.
- `iam-self/README.md` step 2 — the missed step.

## Resolved 2026-05-14

Path A executed end-to-end — see [`docs/plans/2026-05-14-iam-token-narrow.md`](../plans/2026-05-14-iam-token-narrow.md).

Findings during implementation that updated the audit's model:

- The bootstrap token (`90c2…`) was named `indri-studio-terraform` — confirming the audit's hypothesis that it was the first-apply bootstrap, never swapped out. Audit was right.
- The `d789…` narrow token had been hand-widened via the dashboard at some point after first-apply (it carried `Account Rulesets Write` and `Page Rules Write` not in `token.tf`) — both leftovers from the original `cloudflare_ruleset` redirect that was later replaced by a Worker `fetch` handler. Drift the audit didn't surface because it never plan-refreshed `iam-self/`.
- The `d789…` token's stored value in TF state was dead (rolled separately at some point), so the rotation had to `-replace` the resource rather than update-in-place. New id `1834…`.
- The Cloudflare TF provider matches `policies[]` and `permission_groups[]` by list index, not set equality — `token.tf` now orders both deterministically to match the API's return order (account-scoped policy first; perm groups in UUID-ascending order).

Outcome: SSM, CI, and TF state all point at the same narrow `1834…` token. Old `90c2…` revoked via API. The chain `TF code → narrow token → SSM/CI → runtime` is unbroken and reproducible from `git clone` + the one-shot bootstrap token described in `infrastructure/cloudflare/README.md`.
