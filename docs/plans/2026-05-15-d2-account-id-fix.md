# Plan: Fix D2 — Terraform account_id stale default

## Context

Pass-13 identified `infrastructure/cloudflare/global/variables.tf` had
`account_id` with `default = ""` and a stale TODO comment, making the variable
appear optional when it is actually required (an empty string fails Cloudflare
provider validation).

## Current state

**D2 is already fixed.** Reading the file now shows:

```hcl
variable "account_id" {
  description = "Cloudflare account ID hosting the indri.studio zone. Source-of-truth value lives in SSM at /indri-studio/cloudflare/account_id; supplied at apply-time via TF_VAR_account_id (see Taskfile.yml tf-apply)."
  type        = string
}
```

- `default = ""` removed — variable is now required
- TODO comment removed
- Description updated to name the correct supply mechanism (`TF_VAR_account_id`)

## Action required

None — no code changes needed. The only task is to mark D2 closed in the review
series (update pass-13 investigation or note in the next commit message).
