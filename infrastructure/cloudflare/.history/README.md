| Date | Change |
|------|--------|
| [2026-05-14](https://github.com/wbniv/indri.studio/commit/eff6bed) | IAM token narrowing (audit H5): swap SSM token to TF-managed narrow |
| [2026-05-13](https://github.com/wbniv/indri.studio/commit/8cae236) | First-publish infra: CF v5 syntax, indri-* slug, secrets scripts |
| [2026-05-13](https://github.com/wbniv/indri.studio/commit/5116e8f) | Add Cloudflare Terraform skeleton |

<!--history-meta v1
eff6bed	author	Will Norris
eff6bed	added	29
eff6bed	deleted	11
eff6bed	files	1
eff6bed	body	Closes Path A from docs/investigations/2026-05-14-iam-token-audit.md. The\nSSM/CI token in production (the original bootstrap, id 90c2...) is replaced\nby the TF-managed narrow indri-cf-token (new id 1834...), bringing the chain\nTF code → SSM → CI → runtime into a single, reproducible path.\n\niam-self/token.tf gains four permission groups (zone write, zone settings\nwrite, email-routing rules write, email-routing addresses write) so the\nnarrow token covers everything in global/. Policy + permission_groups list\norder pinned to match the CF API's return order — the provider matches by\nindex, not set equality, and would otherwise hit "inconsistent result after\napply" on every plan. Taskfile gains tf-plan-iam / tf-apply-iam.\n\nBootstrap token requirement documented: Account → Account API Tokens: Edit\nis structurally absent from the narrow token (it can't manage itself), so\nevery rotation needs a fresh short-lived bootstrap minted in the dashboard.\n\nCo-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
8cae236	author	Will Norris
8cae236	added	2
8cae236	deleted	2
8cae236	files	1
8cae236	body	- Slug sweep: is-terraform → indri-terraform, is-cf-token → indri-cf-token\n  across TF + docs + README. Matches the per-project IAM-user convention\n  used in sibling SRC projects.\n- CF provider v5 fixes: cloudflare_zone now uses { account = { id = ... },\n  name = ... } shape; cloudflare_workers_custom_domain drops deprecated\n  environment arg; iam-self/ switches from cloudflare_api_token (User) to\n  cloudflare_account_token (Account) — CF officially recommends Account\n  tokens for non-user credentials.\n- Authored scripts/secrets-{pull,bootstrap}.sh referenced in Taskfile but\n  previously missing. Simple SSM round-trip for /indri-studio/cloudflare/*,\n  no drift-protection (v2 concern).\n- docs/plans/2026-05-13-first-publish.md captures the executed path\n  including the gotchas (Account-vs-User token, 409 conflicts on Porkbun\n  parking DNS, ruleset perm gap, narrow-token follow-up).\n\nCo-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
5116e8f	author	Will Norris
5116e8f	added	41
5116e8f	deleted	0
5116e8f	files	1
5116e8f	body	Mirrors finding-your-way's aws/ layout — bootstrap/ for state backend,\niam-self/ for the self-narrowed is-cf-token, global/ for zone settings,\nWorkers custom-domain bindings (apex + www), and the www → apex 301\nredirect rule. Plus a README walking through the first-apply order.\n\nSkeleton state — account_id and zone_id values still need to be filled\nin before first apply, per the TODO comments. Provider v5 resource\nsyntax for ruleset/api_token may need adjustment at apply time.\n\nAlso: SETUP.md autolinks fixed (the md-to-pdf renderer doesn't honor\n<url> shorthand — always use [url](url) form).\n\nCo-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
-->
