# Cloudflare infrastructure for indri.studio

Terraform skeleton for the indri.studio zone, Workers custom-domain bindings, redirect rules, and self-narrowed API token. Pattern mirrors [`~/SRC/finding-your-way/infrastructure/aws/`](../../../finding-your-way/infrastructure/aws/) — only the provider differs.

## Layout

| Dir | Purpose | Backend |
|---|---|---|
| `bootstrap/` | One-time: create the S3 state bucket + DynamoDB locks table. | local (chicken-and-egg) |
| `iam-self/` | Self-narrow the bootstrap CF token to `is-cf-token` (project-scoped). | S3 |
| `global/` | Zone settings, Workers custom-domain bindings, redirect rules. | S3 |

## First-apply order

```sh
# 1. State backend (uses local state for itself)
cd bootstrap && terraform init && terraform apply

# 2. Narrow the bootstrap token. Set CLOUDFLARE_API_TOKEN to the bootstrap
#    token, then apply. Push the resulting narrow token into SSM and revoke
#    the bootstrap token afterward.
cd ../iam-self && terraform init && terraform apply
aws ssm put-parameter \
  --name /indri-studio/cloudflare/api_token \
  --type SecureString \
  --value "$(terraform output -raw token_value)" \
  --overwrite

# 3. Apply the actual indri.studio infrastructure (zone, Workers, redirects)
cd ../global && terraform init && terraform apply
```

## TODOs before first apply

- Set `account_id` in `global/variables.tf` and `iam-self/token.tf` (currently `""`).
- Set `zone_id` in `iam-self/token.tf` after `global/` first applies, or split the apply order so the zone is created before the narrow token references it.
- Verify Cloudflare provider v5 resource syntax — the `cloudflare_ruleset` redirect and the `cloudflare_api_token` permission filter were hand-written against the v5 schema and may need adjustment when first applied. The provider's docs are authoritative.

## State backend

Each project gets its own S3 state bucket — `indri-studio-terraform-state`, paralleling `findingyourway-terraform-state`, `parkingspace-terraform-state`, etc. AWS profile: `is-terraform` (per-project IAM user, narrow scope, see plan).
