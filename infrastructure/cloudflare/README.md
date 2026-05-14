# Cloudflare infrastructure for indri.studio

Terraform skeleton for the indri.studio zone, Workers custom-domain bindings, redirect rules, and self-narrowed API token. Pattern mirrors [`~/SRC/finding-your-way/infrastructure/aws/`](../../../finding-your-way/infrastructure/aws/) — only the provider differs.

## Layout

| Dir | Purpose | Backend |
|---|---|---|
| `bootstrap/` | One-time: create the S3 state bucket + DynamoDB locks table. | local (chicken-and-egg) |
| `iam-self/` | Self-narrow the bootstrap CF token to `indri-cf-token` (project-scoped). | S3 |
| `global/` | Zone settings, Workers custom-domain bindings, redirect rules. | S3 |

## First-apply order

```sh
# 1. State backend (uses local state for itself)
cd bootstrap && terraform init && terraform apply

# 2. Narrow the bootstrap token. Mint a one-shot bootstrap token in the
#    Cloudflare dashboard at https://dash.cloudflare.com/profile/api-tokens
#    with these two permissions scoped to the indri-studio account:
#      - User    → API Tokens: Edit              (manage user-scope tokens)
#      - Account → Account API Tokens: Edit      (manage account-scope tokens)
#    Export it as CLOUDFLARE_API_TOKEN. Then run iam-self + push value to SSM:
task tf-apply-iam
aws ssm put-parameter \
  --profile indri-terraform \
  --name /indri-studio/cloudflare/api_token \
  --type SecureString \
  --value "$(terraform -chdir=infrastructure/cloudflare/iam-self output -raw token_value)" \
  --overwrite
gh secret set CLOUDFLARE_API_TOKEN --body "$(terraform -chdir=infrastructure/cloudflare/iam-self output -raw token_value)"
task secrets-pull

# 3. Apply the actual indri.studio infrastructure (zone, Workers, email routing)
task tf-apply

# 4. Revoke the bootstrap token in the dashboard (or via API).
```

## Token rotation (post-bootstrap)

Same flow as step 2 above — every rotation needs a fresh, short-lived
bootstrap token (Account API Tokens: Edit is structurally absent from the
narrow token by design). Steps:

1. Mint bootstrap → export `CLOUDFLARE_API_TOKEN`.
2. `terraform -chdir=infrastructure/cloudflare/iam-self apply -replace=cloudflare_account_token.indri_cf_token` — destroys + recreates, fresh value lands in TF state.
3. Push new value to SSM + GH Actions secret + `task secrets-pull` (commands as in step 2 of First-apply).
4. Revoke the bootstrap token.

## History

- **2026-05-13** First apply. Bootstrap token `indri-studio-terraform` (id `90c2…`) used for both iam-self and global, then left in SSM/CI by mistake. The narrow `indri-cf-token` (`d789…`) was minted but never swapped in.
- **2026-05-14** Audit + Path A executed (see [`docs/investigations/2026-05-14-iam-token-audit.md`](../../docs/investigations/2026-05-14-iam-token-audit.md) and [`docs/plans/2026-05-14-iam-token-narrow.md`](../../docs/plans/2026-05-14-iam-token-narrow.md)). Narrow token expanded to cover all of `global/`, replaced (new id `1834…`), pushed to SSM + GH; old bootstrap revoked.

## State backend

Each project gets its own S3 state bucket — `indri-studio-terraform-state`, paralleling `findingyourway-terraform-state`, `parkingspace-terraform-state`, etc. AWS profile: `indri-terraform` (per-project IAM user, narrow scope, see plan).
