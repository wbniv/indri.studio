# IAM token narrowing — close the loop on H5 (2026-05-14)

Implements Path A from [`docs/investigations/2026-05-14-iam-token-audit.md`](../investigations/2026-05-14-iam-token-audit.md). That audit found the env / SSM / CI token in production (id `90c2dd6c…`) is not the narrow `indri-cf-token` Terraform thinks it manages (id `d789f7ae…`) — the second-step swap in `infrastructure/cloudflare/README.md` was skipped on first-apply. Result: IaC is not actually the source of truth for the runtime token.

This plan closes that gap.

## Decision — Path A

Expand `iam-self/token.tf` to cover everything `global/` actually manages, re-emit the narrow token (or update in place — the provider chooses), push that value to SSM, mirror it into the GitHub Actions secret, and revoke the broader `90c2…` token. After this commit the chain TF → narrow token → SSM → runtime is unbroken and reproducible from `git clone`.

Path B (narrow the env token down to today's `token.tf`) was rejected in the audit: it almost certainly fails on the email-routing and zone-settings resources, because those need write perms the current `token.tf` doesn't declare.

## Permission groups to add

Resolved against the cross-account-stable UUIDs published in [`alchemy-run/alchemy/alchemy/src/cloudflare/permission-groups.ts`](https://github.com/alchemy-run/alchemy/blob/main/alchemy/src/cloudflare/permission-groups.ts) (the env token cannot read `/accounts/{aid}/tokens/permission_groups` itself; this is why the audit recorded the bootstrap-token lookup as "once").

| Permission group | UUID | Scope | Why |
|---|---|---|---|
| Zone Write | `e6d2666161e84845a636613608cee8d5` | zone | `cloudflare_zone.indri_studio` refresh + future plan/type changes |
| Zone Settings Write | `3030687196b94b638145a3953da2b699` | zone | `cloudflare_zone_setting.always_use_https`, `automatic_https_rewrites` |
| Email Routing Rules Write | `79b3ec0d10ce4148a8f8bdc0cc5f97f2` | zone | `cloudflare_email_routing_settings`, `_dns`, `_rule` (the toggle/rules live behind one permission group) |
| Email Routing Addresses Write | `e4589eb09e63436686cd64252a3aebeb` | account | `cloudflare_email_routing_address.wbnorris_gmail` |

After the change the narrow token covers all 9 resources in `global/` (zone + 2 zone-settings + 2 workers custom-domains + 4 email-routing) and nothing else — still meaningfully tighter than the current env token, which can list zones across the account and reach surfaces unrelated to this project.

## Implementation steps

1. **`iam-self/token.tf`** — add the four UUIDs above to `locals.permission_groups` and extend the existing `policies` blocks (zone-scoped: dns + workers-routes + zone + zone-settings + email-routing-rules; account-scoped: workers-scripts + email-routing-addresses). Replace the now-stale `Why no Zone Read` comment with one describing the wider — but still project-scoped — set.
2. **Taskfile entries `tf-plan-iam` / `tf-apply-iam`** — there's currently no task for `iam-self/`, so the `task` everywhere convention falls through. Add them, mirroring the `global/` pair but `dir: infrastructure/cloudflare/iam-self`.
3. **`task tf-plan-iam`** — confirm the diff is one `~ update in place` on `cloudflare_account_token.indri_cf_token` (`policies` only). Anything else (especially a `-/+` replacement) needs investigation before applying — a replacement would mint a new token id and invalidate the value cached in state.
4. **`task tf-apply-iam`** — apply. Sensitive `token_value` output is present after success.
5. **Pre-flight the narrow token against `global/`.** Export `CLOUDFLARE_API_TOKEN=$(terraform -chdir=infrastructure/cloudflare/iam-self output -raw token_value)` in a subshell, run `task tf-plan` from the repo root, expect `No changes`. If anything 403s here, the missing permission group is one we didn't anticipate — fix `token.tf`, re-apply, re-test. **Do not push to SSM until this passes** — pushing a broken token to SSM also breaks CI on the next deploy.
6. **Rotate SSM.** `aws ssm put-parameter --profile indri-terraform --name /indri-studio/cloudflare/api_token --type SecureString --value "$(terraform -chdir=infrastructure/cloudflare/iam-self output -raw token_value)" --overwrite`. Then `task secrets-pull` to refresh `.env`. Verify the local token's id matches the TF state.
7. **Sync GitHub Actions secret.** `gh secret set CLOUDFLARE_API_TOKEN --body "$(terraform -chdir=infrastructure/cloudflare/iam-self output -raw token_value)"`. Without this step the next `v*` tag deploys would use the about-to-be-revoked `90c2…` token and fail.
8. **Revoke `90c2dd6c27d2b1a1fd6f560e4be85b9f`.** Manual — the narrow token doesn't have token-management perms (and shouldn't). Use the dashboard URL `https://dash.cloudflare.com/profile/api-tokens/90c2dd6c27d2b1a1fd6f560e4be85b9f/edit` → Roll/Delete. Capture a screenshot under `docs/plans/screenshots/` showing the token state changing to revoked. After this, `curl https://api.cloudflare.com/client/v4/user/tokens/verify` against the old value must return `9109 Unauthorized`.
9. **Docs sweep.**
   - `iam-self/token.tf` — rewrite the leading comment block + the `Why no Zone Read` note to describe the new (broader-but-still-project-scoped) policy and why each permission group is present.
   - `infrastructure/cloudflare/README.md` — annotate first-apply step 2 as completed 2026-05-14; reference this plan.
   - `docs/investigations/2026-05-14-iam-token-audit.md` — append a "Resolved 2026-05-14" section pointing at this plan + commit; this turns the open follow-up at the end of the audit into a closed loop.
10. **Verify + commit.** Run the verification steps below, paste outputs back into this plan, promote the TODO entry, commit with a `Co-Authored-By` trailer.

## Risk + mitigation

- **CI deploy goes down between step 7 and step 8.** Unlikely — both tokens are valid up until step 8 fires the revoke. If step 7 fails partway (e.g. `gh secret set` errors), the GH secret retains the old value, which is still valid until step 8. Resolution: do not run step 8 until step 7 returns success.
- **`tf-plan-iam` shows a replacement, not an in-place update.** Provider semantics changed, or one of the permission groups is mistyped. Resolution: abort apply, investigate. A replacement is recoverable (apply yields a new token value, push that), but worth understanding why.
- **The narrow token still 403s on some resource in `global/`.** A permission group is missing. Add it, re-apply `iam-self/`, repeat step 5. The audit explicitly lists the surfaces touched; this is unlikely but the empirical plan is the safety net.
- **Step 8 revokes the wrong token by mistake.** Mitigation: token id `90c2dd6c27d2b1a1fd6f560e4be85b9f` is unique; we cross-check it against `curl …/user/tokens/verify` immediately before revoking.

## Prerequisite — bootstrap-scope token in env

Discovered during step 3: the current SSM/env token (`90c2…`) cannot read `/accounts/{aid}/tokens/{tid}`, so `terraform plan` against `iam-self/` fails to refresh state on `cloudflare_account_token.indri_cf_token` with `9109 Unauthorized`. The audit captured this for the listing endpoint; it also applies to single-token read.

The fix is a one-time manual step. Mint a temporary "bootstrap" token in the Cloudflare dashboard at <https://dash.cloudflare.com/profile/api-tokens> with at minimum:

- **API Tokens: Edit** (user scope) — required to create/update/read account tokens.

Restrict the token to "Account: indri-studio" (the only account on the user) and set a short TTL (e.g. 1 hour). Export it as `CLOUDFLARE_API_TOKEN` in the shell that runs steps 3 and 4. After step 4 succeeds the bootstrap token can be revoked.

This is the one manual step the rotation flow cannot eliminate — minting a token that can manage other tokens requires `API Tokens: Edit` at user scope, and that permission group itself cannot live on a project-scoped token (it would let the token rewrite its own scope). Same constraint applies on every future rotation: a fresh bootstrap token, used once, then revoked.

## Verification

1. `terraform -chdir=infrastructure/cloudflare/iam-self plan -no-color` — exactly one `~ update in place` on `cloudflare_account_token.indri_cf_token`, with the four new permission group IDs appearing in the diff, no other resources touched.

    ```
    cloudflare_account_token.indri_cf_token: Refreshing state... [id=183411854731dc6014e0c1286b56c0ad]

    No changes. Your infrastructure matches the configuration.

    Terraform has compared your real infrastructure against your configuration
    and found no differences, so no changes are needed.
    ```

    **PASS** (with deviation). The original step text assumed an `update-in-place`; in practice the first apply tripped the CF provider's "policies-matched-by-list-index" bug ([provider issue](https://github.com/cloudflare/terraform-provider-cloudflare/issues)), so the resource was force-replaced via `-replace=cloudflare_account_token.indri_cf_token` (new id `1834…`). After settling list order in `token.tf` to match the API return order (account-policy first; perm groups sorted by UUID), the steady-state plan is now `No changes.` — which is the post-apply equivalent of the original step's "diff visible / no other resources touched" intent.

    **Step 1 verification needs the bootstrap token in env.** Running with the SSM-sourced narrow token 403s on `GET /accounts/{aid}/tokens/{tid}` because the narrow token deliberately lacks `Account API Tokens` permission. This is by design — the narrow token cannot read its own definition (otherwise it could rewrite itself). Future rotations need a fresh bootstrap token exported as `CLOUDFLARE_API_TOKEN` for the duration of the iam-self plan/apply.

2. `terraform -chdir=infrastructure/cloudflare/iam-self apply -auto-approve -no-color` — succeeds; output line `token_value = (sensitive value)` present; `terraform state show cloudflare_account_token.indri_cf_token | grep '^\s*id\s*='` is unchanged (`d789…`) for an in-place update.

    ```
        id          = "183411854731dc6014e0c1286b56c0ad"
        name        = "indri-cf-token"
        status      = "active"
    ```

    **PASS** (with deviation: id changed `d789…` → `1834…` because of the force-replace path described in step 1, not an in-place update). Apply output `token_value = (sensitive value)` was present.

3. From a subshell with `CLOUDFLARE_API_TOKEN=<new token value>`, `terraform -chdir=infrastructure/cloudflare/global plan -no-color` reports `No changes. Your infrastructure matches the configuration.` Zero `403 Unauthorized` lines.

    ```
    cloudflare_email_routing_address.wbnorris_gmail: Refreshing state... [id=39296e66a85a47539e88c197603c5db1]
    cloudflare_zone.indri_studio: Refreshing state... [id=7e4eca114304080627a70387382dede7]
    cloudflare_email_routing_settings.indri_studio: Refreshing state... [id=7e4eca114304080627a70387382dede7]
    cloudflare_workers_custom_domain.apex: Refreshing state... [id=80983c00095349f67bcbd69597782524b8a06539]
    cloudflare_workers_custom_domain.www: Refreshing state... [id=689e02bba47b5afd3b7e04e75eb31521ed333082]
    cloudflare_zone_setting.automatic_https_rewrites: Refreshing state... [id=automatic_https_rewrites]
    cloudflare_zone_setting.always_use_https: Refreshing state... [id=always_use_https]
    cloudflare_email_routing_rule.hello: Refreshing state... [id=88dbe6923f19450abb07f65c8e096248]
    cloudflare_email_routing_dns.indri_studio: Refreshing state... [id=7e4eca114304080627a70387382dede7]

    No changes. Your infrastructure matches the configuration.
    ```

    `grep -c 403` over the plan output: `0`.

    **PASS.** All 9 resources in `global/` refresh cleanly with the narrow token.

4. `aws ssm get-parameter --profile indri-terraform --name /indri-studio/cloudflare/api_token --with-decryption --query 'Parameter.Value' --output text` equals `terraform -chdir=infrastructure/cloudflare/iam-self output -raw token_value`.

    ```
    PASS: SSM == TF state (lengths 53 / 53)
    ```

    **PASS.**

5. `curl -sS -H "Authorization: Bearer $(cat .env | grep CLOUDFLARE_API_TOKEN | cut -d= -f2)" https://api.cloudflare.com/client/v4/user/tokens/verify | jq -r '.result.id'` equals the TF state token id.

    Deviation: account-scope tokens (which the narrow token is) cannot be verified via `/user/tokens/verify` — that endpoint is user-token only. Used `/accounts/{aid}/tokens/verify` instead:

    ```
    env id:   183411854731dc6014e0c1286b56c0ad
    state id: 183411854731dc6014e0c1286b56c0ad
    PASS
    ```

    **PASS.**

6. `gh secret list --json name,updatedAt | jq '.[] | select(.name=="CLOUDFLARE_API_TOKEN")'` shows `updatedAt` later than the SSM `LastModifiedDate` from step 4 — confirms step 7 fired.

    ```
    SSM:  2026-05-14T15:03:36.162000+07:00   (= 2026-05-14T08:03:36Z)
    GH:   2026-05-14T08:04:17Z
    ```

    GH is ~41 s later than SSM. **PASS.**

7. `curl -sS -H "Authorization: Bearer <old 90c2… value, sourced from rotated-out .env backup>" https://api.cloudflare.com/client/v4/user/tokens/verify | jq '.errors[0].code'` returns `1000` or `9109` (token revoked / not valid). If the old value was not preserved before rotation, fall back to: dashboard screenshot showing `90c2…` in `revoked` state, saved at `docs/plans/screenshots/2026-05-14-iam-token-narrow-revoked.png`.

    Old token was deleted via API (not just rolled), so it doesn't surface as "revoked" — it's gone:

    ```json
    {
      "success": false,
      "errors": [
        { "code": 1003, "message": "token not found" }
      ],
      "messages": [],
      "result": null
    }
    ```

    **PASS.** Error `1003 token not found` is a stricter outcome than the `1000`/`9109` the step accepted as PASS.

## Out of scope

- Splitting `global/` into account-scoped vs zone-scoped modules. Audit option 3b — not justified at current scale; revisit only if the narrow token feels too broad after this lands.
- Rotating the AWS bootstrap IAM user / S3-state credentials. Separate audit if needed; unrelated to the Cloudflare side.
- `task secrets-bootstrap.sh` rewrite — the script's contract already covers `--overwrite`; no changes needed for this rotation.
