# Contact email (`hello@indri.studio`) with Cloudflare Email Routing

## Context

The studio footer currently shows only the `©` colophon link. We want a public contact address — `hello@indri.studio` — that transparently forwards to `wbnorris@gmail.com`, with the routing infrastructure managed in Terraform so it's reproducible.

We started designing this in a previous session, but the design only lived in chat. When the computer crashed it was gone — the whole point of the project's CLAUDE.md plan-first convention is to make that kind of loss recoverable. So the **first implementation step is to land the plan in `docs/plans/`**, and a feedback memory will reinforce the lesson for future sessions.

## Goal

- Mail to `hello@indri.studio` arrives at `wbnorris@gmail.com`.
- The address is exposed (as a `mailto:` link) in the site footer, styled to match the existing colophon link.
- Everything reproducible from this repo + a Cloudflare API token + a one-time verification click in the destination inbox. No other manual dashboard steps.

## Approach

### 1. Persist this plan to `docs/plans/` (first, before any code)

Copy the body of this plan into `docs/plans/2026-05-13-contact-email-routing.md` and add a `TODO.md` entry pointing to it. This honours the project's plan-first convention and means a future crash leaves a recoverable artifact in the repo, not just chat history.

### 2. Save a feedback memory

Write `feedback-plan-first-before-code.md` reinforcing: write the plan to `docs/plans/` BEFORE touching code, even if the user seems impatient. Include the contact-email-crash-loss incident as the **Why**.

### 3. Cloudflare Email Routing in Terraform

New file `infrastructure/cloudflare/global/email_routing.tf`. Section-comment style matches `workers.tf` / `redirects.tf` (short block comment above each resource explaining intent).

Resources, all using the v5 provider (`cloudflare/cloudflare ~> 5.0`):

- **`cloudflare_email_routing_settings.indri_studio`** — `zone_id = cloudflare_zone.indri_studio.id`, `enabled = true`.
- **`cloudflare_email_routing_address.wbnorris_gmail`** — registers `wbnorris@gmail.com` as a destination. Cloudflare emails a verification link to that inbox on first apply; the address sits in not-yet-verified state until clicked, and rules referencing it won't actually deliver until then.
- **`cloudflare_email_routing_rule.hello`** — matcher `to: hello@indri.studio`, action `forward → wbnorris@gmail.com`, `enabled = true`. Depends on the routing address resource.
- **`cloudflare_dns_record` × 3** — the three MX records pointing at `route1/2/3.mx.cloudflare.net` (priorities per current Cloudflare docs; verify exact integer at apply time against `cloudflare email routing dns` requirement). `proxied = false`.
- **`cloudflare_dns_record` × 1** — TXT SPF: `v=spf1 include:_spf.mx.cloudflare.net ~all`. `proxied = false`.

Note: provider v5 renamed `cloudflare_record` → `cloudflare_dns_record`. The codebase has no existing DNS records to copy attribute names from, so reference the v5 schema (`zone_id`, `name`, `type`, `content`, `priority`, `ttl`).

### 4. Footer edit (`src/layouts/Base.astro:131–153`)

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
- **NEW** `docs/plans/2026-05-13-contact-email-routing.md` — project-side plan (mirror of this file)
- **EDIT** `src/layouts/Base.astro:131–153` — `mailto:` link + dot separator
- **EDIT** `TODO.md` — entry linking to the new plan
- **EDIT** `/home/will/.claude/projects/-home-will-SRC-indri-studio/memory/MEMORY.md` + new `feedback-plan-first-before-code.md`

## Verification

1. **`task tf-plan`** — expect 4 email-routing resources + 4 DNS records to be created; no changes to existing zone/workers/redirects; no destructive diff.
2. **`task tf-apply`** — apply; expect the verification email at `wbnorris@gmail.com`; click the link.
3. **Cloudflare dashboard sanity check** — destination shows **Verified**, rule shows **Enabled**. (No TF state grep for this; visual confirm.)
4. **`dig +short MX indri.studio`** — expect three `routeN.mx.cloudflare.net` entries.
5. **`dig +short TXT indri.studio`** — expect SPF record including `_spf.mx.cloudflare.net`.
6. **End-to-end mail test** — from a phone, send to `hello@indri.studio`; confirm arrival at `wbnorris@gmail.com` within ~1 min.
7. **`task dev`**, open `localhost:4321` — footer reads `✉ · © 2026` (mail icon left of the © link). Both links go `opacity-70 → 100` on hover and turn neon purple on hover. Hover the envelope shows the OS tooltip via `aria-label`. Click the envelope — OS mail client opens with `To: hello@indri.studio` prefilled. Verify icon size looks right against the © text; tune the inline `font-size` if it's noticeably heavier/lighter than the surrounding text.
8. **`task build`** — clean build.
9. Re-run `terraform plan` post-apply — expect clean (no drift).

## Out of scope

- DMARC/DKIM beyond the default SPF (revisit only if deliverability complaints arise).
- Additional aliases (`will@`, `support@`) — single address for now.
- Catch-all routing or custom Worker handlers for incoming mail.
- Footer redesign — purely additive: one `<a>` + separator.
