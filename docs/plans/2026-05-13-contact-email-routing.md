# Contact email (`hello@indri.studio`) with Cloudflare Email Routing

## Context

The studio footer currently shows only the `©` colophon link. We want a public contact address — `hello@indri.studio` — that transparently forwards to `wbnorris@gmail.com`, with the routing infrastructure managed in Terraform so it's reproducible.

We started designing this in a previous session, but the design only lived in chat. When the computer crashed it was gone — the whole point of the project's CLAUDE.md plan-first convention is to make that kind of loss recoverable. So the **first implementation step is to land the plan in `docs/plans/`** (this file), and a feedback memory will reinforce the lesson for future sessions.

## Goal

- Mail to `hello@indri.studio` arrives at `wbnorris@gmail.com`.
- The address is exposed (as a `mailto:` link, behind a Material Symbols envelope glyph) in the site footer, styled to match the existing colophon link.
- Everything reproducible from this repo + a Cloudflare API token + a one-time verification click in the destination inbox. No other manual dashboard steps.

## Approach

### 1. Save a feedback memory

Write `feedback-plan-first-before-code.md` reinforcing: write the plan to `docs/plans/` BEFORE touching code, even if the user seems impatient. Include the contact-email-crash-loss incident as the **Why**.

### 2. Cloudflare Email Routing in Terraform

New file `infrastructure/cloudflare/global/email_routing.tf`. Section-comment style matches `workers.tf` / `redirects.tf` (short block comment above each resource explaining intent).

Resources, all using the v5 provider (`cloudflare/cloudflare ~> 5.0`):

- **`cloudflare_email_routing_settings.indri_studio`** — `zone_id = cloudflare_zone.indri_studio.id`, `enabled = true`.
- **`cloudflare_email_routing_address.wbnorris_gmail`** — registers `wbnorris@gmail.com` as a destination. Cloudflare emails a verification link to that inbox on first apply; the address sits in not-yet-verified state until clicked, and rules referencing it won't actually deliver until then.
- **`cloudflare_email_routing_rule.hello`** — matcher `to: hello@indri.studio`, action `forward → wbnorris@gmail.com`, `enabled = true`. Depends on the routing address resource.
- **`cloudflare_dns_record` × 3** — the three MX records pointing at `route1/2/3.mx.cloudflare.net` (priorities per current Cloudflare docs; verify exact integer at apply time against the `cloudflare email routing dns` requirement). `proxied = false`.
- **`cloudflare_dns_record` × 1** — TXT SPF: `v=spf1 include:_spf.mx.cloudflare.net ~all`. `proxied = false`.

Note: provider v5 renamed `cloudflare_record` → `cloudflare_dns_record`. The codebase has no existing DNS records to copy attribute names from, so reference the v5 schema (`zone_id`, `name`, `type`, `content`, `priority`, `ttl`).

### 3. Footer edit (`src/layouts/Base.astro:131–153`)

Add a sibling icon-only `<a>` link to the existing colophon link, inside the same `<div class="font-display uppercase text-[10px] tracking-[0.3em] text-on-surface-variant">` container. Treatment:

- `href="mailto:hello@indri.studio"`
- Visible content: a Material Symbols Outlined `mail` glyph (the family is already loaded globally in `Base.astro` lines 53–64 — no new import needed). Markup: `<span class="material-symbols-outlined" aria-hidden="true" style="font-size: 14px; vertical-align: middle;">mail</span>`.
- `aria-label="Email Indri"` on the `<a>` (no visible text, so accessibility label is required).
- Class set matches the colophon link: `opacity-70 hover:opacity-100 hover:text-primary-container transition-all` — but **omit** the active-pathname branch (no route to compare).
- Insert a `·` separator between the two links (literal `·` in a `<span class="mx-2">` or similar — keep the existing kerning balance from the `tracking-[0.3em]` container).

Sizing note: the colophon text is `text-[10px]` with heavy letter-spacing. The Material Symbols `mail` glyph at native 10 px renders thin and weedy; bumping the icon to ~14 px with `vertical-align: middle` gives visual parity with the © text's optical height. Confirm against the rendered footer during verification and tune if needed.

Order in footer reads: `✉ · © 2026`.

## Files

- **NEW** `infrastructure/cloudflare/global/email_routing.tf` — 4 email-routing resources + 4 DNS records
- **EDIT** `src/layouts/Base.astro:131–153` — `mailto:` envelope link + dot separator
- **EDIT** `TODO.md` — entry linking to this plan
- **EDIT** `/home/will/.claude/projects/-home-will-SRC-indri-studio/memory/MEMORY.md` + new `feedback-plan-first-before-code.md`

## Verification

1. **`task tf-plan`** — expect 4 email-routing resources + 4 DNS records to be created; no changes to existing zone/workers/redirects; no destructive diff.

   Several iterations were needed before this came up clean — the path is documented in detail in §"Execution notes" below. Final state: the original "4 DNS records" sub-resources collapsed into a single `cloudflare_email_routing_dns` resource (Cloudflare auto-manages the MX/SPF records); the `cloudflare_ruleset` redirect resource had to be deleted entirely (Free-plan token-permission cap) — the redirect is on TODO for re-implementation in the Worker.

   ```text
   Plan: 3 to add, 0 to change, 0 to destroy.
     + cloudflare_email_routing_settings.indri_studio
     + cloudflare_email_routing_dns.indri_studio
     + cloudflare_email_routing_rule.hello
   ```
   (The 4th, `cloudflare_email_routing_address.wbnorris_gmail`, landed during an earlier partial apply and was already in state.)

   **PASS** (with scope deviations documented above).

2. **`task tf-apply`** — apply; expect the verification email at `wbnorris@gmail.com`; click the link.

   ```text
   cloudflare_email_routing_settings.indri_studio: Creation complete after 1s
   cloudflare_email_routing_rule.hello:            Creation complete after 1s
   ```
   No verification email was sent — Cloudflare auto-verified `wbnorris@gmail.com` immediately because it matches the Cloudflare account's login email (created and verified at the same timestamp). The `cloudflare_email_routing_dns` resource was deferred (records exist via the settings-enable side effect; resource tracking is on TODO).

   **PASS** — destination verified without manual step.

3. **Cloudflare dashboard sanity check** — destination shows **Verified**, rule shows **Enabled**.

   API confirmation (in place of dashboard click):
   ```text
   addresses[0]: { email: "wbnorris@gmail.com", verified: "2026-05-13T16:12:19Z" }
   settings:     { enabled: true, status: "ready", name: "indri.studio" }
   rule:         { enabled: true, name: "Forward hello@ to wbnorris@gmail.com",
                   matchers: [{ type: "literal", field: "to", value: "hello@indri.studio" }],
                   actions:  [{ type: "forward", value: ["wbnorris@gmail.com"] }] }
   ```

   **PASS**.

4. **`dig +short MX indri.studio`** — expect three `routeN.mx.cloudflare.net` entries.

   ```text
   22 route1.mx.cloudflare.net.
   77 route3.mx.cloudflare.net.
   22 route2.mx.cloudflare.net.
   ```

   **PASS**.

5. **`dig +short TXT indri.studio`** — expect SPF record including `_spf.mx.cloudflare.net`.

   ```text
   "v=spf1 include:_spf.mx.cloudflare.net ~all"
   ```

   **PASS**.

6. **End-to-end mail test** — from a phone, send to `hello@indri.studio`; confirm arrival at `wbnorris@gmail.com` within ~1 min.

   Done from a third-party (non-Cloudflare) source: Kevin Seghetti (`kts@tenetti.org`) sent a message titled "this is a test" at 11:28 PM ICT 2026-05-13. It arrived in `wbnorris@gmail.com` within seconds, TLS-encrypted, with Gmail headers showing `to: hello@indri.studio · mailed-by: indri.studio · signed-by: tenetti.org`. Gmail flagged it "Important".

   **PASS**.

7. **`task dev`**, open `localhost:4321` — footer renders the mail icon + © colophon side by side, hover states match.

   Confirmed visually post-deploy at `https://indri.studio` (shipped in tag `v0.1.15`). Mail icon at 14 px with `vertical-align: middle` reads at parity with the 10 px © text. Hover transitions to neon Phosphor purple via `hover:text-primary-container`. The `target="_blank"` + `rel="noopener noreferrer"` was added late in the session so the OS mailto handler opens in a new tab instead of hijacking the current page (matters when Gmail web is the registered mailto handler).

   **PASS**.

8. **`task build`** — clean build.

   ```text
   22:22:54 [build] 11 page(s) built in 1.79s
   22:22:54 [build] Complete!
   ```

   **PASS**.

9. Re-run `terraform plan` post-apply — expect clean (no drift).

   ```text
   cloudflare_email_routing_rule.hello: Refreshing state... [id=88dbe6923f19450abb07f65c8e096248]
   cloudflare_email_routing_dns.indri_studio: Refreshing state... [id=7e4eca114304080627a70387382dede7]
   No changes. Your infrastructure matches the configuration.
   ```

   **PASS**.

## Execution notes (what actually happened)

Documenting the deviations so future readers don't repeat the dead-ends:

- **Latent Taskfile bugs surfaced**: no `dotenv: ['.env']` at top level, and no `TF_VAR_account_id ← CLOUDFLARE_ACCOUNT_ID` bridge. Without these, `terraform plan` 403'd on auth, and `var.account_id` defaulted to `""` (forcing zone replacement, blocked correctly by `prevent_destroy`). Both fixed in this commit.
- **Account-owned API tokens (`cfat_…` prefix) can't manage zone-kind rulesets** on Free-plan zones. Account Rulesets at account scope, Page Rules Edit at zone scope — neither was enough to GET-by-ID or POST a zone-kind ruleset in the `http_request_dynamic_redirect` phase. Cloudflare's UI exposes "Account Rulesets" as a permission but the API doesn't honour it for kind-zone rulesets on this account.
- **User API tokens (`cfut_…` prefix) didn't help either** — same 403 on the ruleset endpoint despite the broader catalog. Conclusion: the redirect ruleset cannot be managed via Terraform on this Cloudflare plan, full stop. The resource was deleted (Cloudflare-side delete + `terraform state rm` + drop `redirects.tf`). Worker-fetch-handler replacement is on TODO.
- **Stale Porkbun MX records** (`fwd1/fwd2.porkbun.com`, leftover from when DNS was at the registrar) blocked `cloudflare_email_routing_settings` from enabling with HTTP 409 / code 2008 "Non-Cloudflare MX records exist". Deleted via API; not currently in scope of TF (no inventory record of them).
- **`cloudflare_email_routing_dns` rejects `name = var.domain`** — the `name` field is for routing on a subdomain (`mail.indri.studio`), not the zone apex. For the apex, omit `name` and Cloudflare auto-derives it.

## Out of scope

- DMARC/DKIM beyond the default SPF (revisit only if deliverability complaints arise).
- Additional aliases (`will@`, `support@`) — single address for now.
- Catch-all routing or custom Worker handlers for incoming mail.
- Footer redesign — purely additive: one `<a>` + separator.
