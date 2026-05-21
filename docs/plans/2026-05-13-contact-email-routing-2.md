# Plan: Wire `hello@indri.studio` via Cloudflare Email Routing (Terraform)

## Context

The Initial-buildout backlog had a "contact" item with no implementation. The studio site currently has zero contact UI — the footer is just the wordmark + a `© year` link to `/colophon`. Decision (this turn): one mailbox `hello@indri.studio` forwarding to `wbnorris@gmail.com`, one footer mailto link next to the colophon link, no form, no `/contact` page, no per-app aliases.

Per project conventions (`~/SRC/CLAUDE.md` — *Everything must be reproducible*), the Cloudflare Email Routing setup must be declared in Terraform alongside the existing zone/Workers/redirect resources, not clicked through the dashboard.

The TF infrastructure is in place: `infrastructure/cloudflare/global/` is applied (zone, Workers custom-domain bindings, redirects), Cloudflare provider pinned to `~> 5.19.1`, S3 backend live. The current `indri-cf-token` (in `iam-self/`) holds DNS Write + Workers Routes Write (zone) + Workers Scripts Write (account). It is **missing** the two Email Routing permission groups, so `iam-self/` must be re-applied first to widen the token before `global/` can manage email routing resources.

## Files to change

| Path | Change |
|---|---|
| `infrastructure/cloudflare/iam-self/token.tf` | Add Email Routing Rules Write + Email Routing Addresses Write to `local.permission_groups` and the zone-scoped policy block |
| `infrastructure/cloudflare/global/email.tf` *(new)* | Settings, MX/SPF/DKIM records, destination address, `hello@` rule |
| `infrastructure/cloudflare/global/variables.tf` | Add `forward_to_email` variable (default `"wbnorris@gmail.com"`) |
| `infrastructure/cloudflare/global/outputs.tf` | Output the destination-verification status so plans surface it cleanly |
| `Taskfile.yml` | Add `tf-plan-iam` / `tf-apply-iam` (iam-self currently has no task aliases — applying it requires raw `terraform -chdir=…`, against the project rule "Use `task <name>` over raw commands") |
| `src/layouts/Base.astro` | Add `mailto:hello@indri.studio` link in footer next to the colophon link, matching its existing styling |
| `docs/plans/2026-05-13-initial-buildout.md` | Mark the contact decision in Phase 5; drop "newsletter" from the Indri sectional rhythm bullet (no newsletter infra exists) |

## Detailed changes

### 1. `infrastructure/cloudflare/iam-self/token.tf` — widen token

Add two entries to `local.permission_groups` (zone scope):

```hcl
locals {
  permission_groups = {
    dns_write                     = "4755a26eedb94da69e1066d98aa820be"
    workers_routes_write          = "28f4b596e7d643029c524985477ae49a"
    workers_scripts_write         = "e086da7e2179491d91ee5f35b3ca210a"
    email_routing_addresses_write = "<ID — fetch via `cloudflare_api_token_permission_groups_list` data source or CF docs>"
    email_routing_rules_write     = "<ID — same source>"
  }
}
```

Append both IDs to the zone-scoped policy's `permission_groups`:

```hcl
permission_groups = [
  { id = local.permission_groups.dns_write },
  { id = local.permission_groups.workers_routes_write },
  { id = local.permission_groups.email_routing_addresses_write },
  { id = local.permission_groups.email_routing_rules_write },
]
```

Permission-group IDs come from CF's catalog. If a `cloudflare_api_token_permission_groups_list` data source exists in provider v5, prefer it (self-documenting, version-agnostic). Otherwise hard-code with a comment citing the CF docs URL.

The token *value* (secret in SSM at `/indri-studio/cloudflare/api_token`) does not change — only its scope. No SSM write, no GitHub Actions secret refresh, no `task secrets-pull`.

### 2. `infrastructure/cloudflare/global/email.tf` — new file

```hcl
# Email Routing for indri.studio.
# Forwards hello@indri.studio → var.forward_to_email.
# Destination address requires one-time email-link verification (Cloudflare
# sends a confirmation message to var.forward_to_email on first apply).

resource "cloudflare_email_routing_settings" "this" {
  zone_id     = cloudflare_zone.indri_studio.id
  enabled     = true
  skip_wizard = true  # we own this in TF, not the dashboard wizard
}

# MX + SPF TXT records required for inbound mail. Cloudflare manages
# these declaratively via this resource (no manual cloudflare_record
# entries needed).
resource "cloudflare_email_routing_dns" "this" {
  zone_id = cloudflare_zone.indri_studio.id
  name    = var.domain
  depends_on = [cloudflare_email_routing_settings.this]
}

resource "cloudflare_email_routing_address" "primary" {
  account_id = var.account_id
  email      = var.forward_to_email
}

resource "cloudflare_email_routing_rule" "hello" {
  zone_id  = cloudflare_zone.indri_studio.id
  name     = "hello@indri.studio → ${var.forward_to_email}"
  enabled  = true
  priority = 0

  matchers = [{
    type  = "literal"
    field = "to"
    value = "hello@${var.domain}"
  }]

  actions = [{
    type  = "forward"
    value = [var.forward_to_email]
  }]

  depends_on = [
    cloudflare_email_routing_dns.this,
    cloudflare_email_routing_address.primary,
  ]
}
```

Verify exact attribute shapes against the locally-installed provider (`terraform providers schema -json | jq '.provider_schemas["registry.terraform.io/cloudflare/cloudflare"].resource_schemas.cloudflare_email_routing_rule'`) before final apply — v5.x has had minor revisions in the email_routing_* resources.

### 3. `infrastructure/cloudflare/global/variables.tf` — add variable

```hcl
variable "forward_to_email" {
  description = "Destination inbox for hello@${var.domain}. Receives a one-time verification email from Cloudflare on first apply."
  type        = string
  default     = "wbnorris@gmail.com"
}
```

### 4. `infrastructure/cloudflare/global/outputs.tf` — surface verification

```hcl
output "email_routing_destination_verified" {
  description = "Whether the destination address has clicked Cloudflare's verification email. False on first apply; flips to true once the user clicks the link."
  value       = cloudflare_email_routing_address.primary.verified
}
```

### 5. `Taskfile.yml` — iam-self task aliases

Mirror the existing `tf-plan` / `tf-apply` task structure, but pointed at `infrastructure/cloudflare/iam-self/`. Same `set -euo pipefail`, same env loading, same backend init guard. (Read existing task definitions verbatim; copy with the path swapped.)

### 6. `src/layouts/Base.astro` — footer mailto

Currently lines 119–141 render footer as wordmark + `© year` link to `/colophon`. Add a sibling `<a>` for the mailto, matching the colophon link's styling exactly so visual rhythm is preserved:

```astro
<div class="font-display uppercase text-[10px] tracking-[0.3em] text-on-surface-variant flex items-center gap-4">
  <a
    href="mailto:hello@indri.studio"
    class="opacity-50 hover:opacity-100 hover:text-primary-container transition-all"
  >
    hello@indri.studio
  </a>
  <a
    href="/colophon"
    class={`opacity-50 hover:opacity-100 hover:text-primary-container transition-all ${pathname === "/colophon" ? "text-primary-container opacity-100" : ""}`}
  >
    © {new Date().getFullYear()}
  </a>
</div>
```

The `flex items-center gap-4` wrapper replaces the bare `<div>` so both links sit on the same baseline. Mobile already stacks via the parent `flex-col md:flex-row` at line 124 — no extra responsive work needed.

### 7. `docs/plans/2026-05-13-initial-buildout.md` — record decisions

- Phase 5: append a ✅ contact bullet pointing at the Email Routing TF additions and the footer mailto.
- "Sectional rhythm to borrow from Hoox" Indri bullet (currently `hero → app gallery → featured screenshots → studio statement → newsletter/contact → CTA`): drop `newsletter/` since no newsletter infrastructure exists or is planned; rewrite as `hero → app gallery → featured screenshots → studio statement → contact (footer mailto) → CTA`.

## Order of operations

The token must be widened before the email routing resources can be created, otherwise `terraform apply` in `global/` will 403 on the email routing API calls.

1. `task tf-plan-iam` — confirm only the policy expansion changes (no resource recreation).
2. `task tf-apply-iam` — widen the token in place. Token value unchanged.
3. `task tf-plan` — confirm the new `email.tf` resources show as creates.
4. `task tf-apply` — apply email routing settings, DNS records, address, rule. The address resource will succeed but `verified = false` until step 5.
5. **Manual**: open `wbnorris@gmail.com`, click the Cloudflare verification link. (Unavoidable — Cloudflare requires destination-address email confirmation. Documented as the single manual step in `~/SRC/CLAUDE.md`'s "When a manual step is truly unavoidable" carve-out.)
6. `task tf-plan` again — should show no drift; `email_routing_destination_verified` output flips to `true` on next refresh.
7. Edit `Base.astro` footer; `pnpm build` cleanly; commit.
8. `git tag v0.x.y && git push --tags` triggers GitHub Actions deploy of the footer change. (Or `task deploy` for an out-of-band push.)

## Verification

1. **Token policy widened**

   ```bash
   terraform -chdir=infrastructure/cloudflare/iam-self show -json \
     | jq '.values.root_module.resources[] | select(.type=="cloudflare_account_token") | .values.policies'
   ```

   Expect 4 permission_group IDs in the zone-scoped policy (the original two plus email_routing_addresses_write and email_routing_rules_write).

2. **MX records resolve**

   ```bash
   dig +short MX indri.studio
   ```

   Expect three Cloudflare MX records: `route1.mx.cloudflare.net`, `route2.mx.cloudflare.net`, `route3.mx.cloudflare.net`.

3. **SPF TXT record present**

   ```bash
   dig +short TXT indri.studio | grep -i spf
   ```

   Expect `"v=spf1 include:_spf.mx.cloudflare.net ~all"`.

4. **Destination address verified**

   ```bash
   terraform -chdir=infrastructure/cloudflare/global output email_routing_destination_verified
   ```

   Expect `true` after step 5 of the order-of-operations.

5. **Live mail test**

   Send a message from a non-Cloudflare-routed address (e.g. another Gmail) to `hello@indri.studio`. Expect delivery to `wbnorris@gmail.com` within ~30 s. Reply-to remains the original sender; To: header preserves `hello@indri.studio` so a Gmail filter `to:hello@indri.studio → label:Indri` works.

6. **Footer link present, correctly styled**

   ```bash
   pnpm build
   grep -o 'mailto:hello@indri.studio' dist/index.html
   ```

   Expect one match. Spot-check `pnpm dev` in browser: hover state matches the colophon link's hover (opacity 50 → 100, colour shifts to Phosphor purple).

7. **Build clean, no warnings**

   ```bash
   pnpm build 2>&1 | grep -i warn
   ```

   Expect no output.

8. **Plan doc updated, previewed**

   ```bash
   task md -- docs/plans/2026-05-13-initial-buildout.md
   ```

   Phase 5 shows the new ✅ contact line; Sectional-rhythm bullet no longer says "newsletter".

## Notes / caveats

- **Permission-group IDs** for the Email Routing perms: I gave placeholders in §1 because the IDs are catalog values that should be looked up at implementation time rather than memorised. The `cloudflare_api_token_permission_groups_list` data source (if present in provider v5.19.1) is the cleanest source; otherwise consult the CF docs and pin the value with a comment URL.
- **Provider resource shape**: The `cloudflare_email_routing_*` resources have evolved across v5.x point releases. Before final `apply`, run `terraform providers schema -json` and diff the actual attribute names against the snippets in §2. The plan's resource block is correct in spirit; attribute names are the part most likely to drift.
- **`prevent_destroy` on the zone** (already set in `zone.tf`) protects the broader infra; new email resources don't need additional lifecycle protection — re-applying with email routing disabled would correctly tear them down.
- **No newsletter infrastructure** is being added. If a newsletter is ever wanted, it's a separate plan — likely a Buttondown / Beehiiv account + a dedicated form-handling Worker. Out of scope here.
- **No per-app aliases** (`splitledger@indri.studio` etc.) yet. If later wanted, each is one additional `cloudflare_email_routing_rule` block; the address (`wbnorris@gmail.com`) can be reused as the forward target.
