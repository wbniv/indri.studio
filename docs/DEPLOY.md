# Deploying indri.studio

The site ships to **Cloudflare Workers with Static Assets** — not Cloudflare Pages. Wrangler uploads the contents of `./dist`; Cloudflare serves them directly. No Worker script runs for requests.

Cloudflare infrastructure (zone settings, Workers custom-domain bindings, DNS, redirect rules) is **Terraform-managed** under [`infrastructure/cloudflare/`](../infrastructure/cloudflare/). Wrangler is responsible only for uploading the built bundle — it never touches DNS or routing.

Config lives in [`wrangler.toml`](../wrangler.toml):

- `[assets] directory = "./dist"` — what gets uploaded.
- `not_found_handling = "404-page"` — unknown paths serve `/404.html`.
- **No `[[routes]]` block** — Terraform owns the custom-domain bindings (`cloudflare_workers_custom_domain` for `indri.studio` and `www.indri.studio` in [`infrastructure/cloudflare/global/workers.tf`](../infrastructure/cloudflare/global/workers.tf)).

## Primary flow: push a version tag

Deploys are triggered by pushing a `v*` tag. The workflow at [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) runs `pnpm build` then `cloudflare/wrangler-action@v3`, and is also wired to `workflow_dispatch` so you can re-run a deploy from the GitHub Actions UI without cutting a new tag.

```sh
git tag v0.1.0
git push origin v0.1.0
```

A green deploy job means the site is live at `https://indri.studio/` (and `https://www.indri.studio/`, which 301-redirects to apex per the Terraform-declared canonical-host policy).

### Rollback

Two options, both work:

1. **Redeploy an earlier tag** from the Actions UI — open the previous tag's deploy run and click "Re-run all jobs". Rebuilds from that tag's commit and ships it.
2. **Cloudflare-side rollback**:
   ```sh
   pnpm wrangler rollback      # prompts for a prior version
   ```
   Fast, but doesn't change what's in git — the next tag push will overwrite.

### Cutting a tag from an older commit

If you need to ship a fix that isn't on `main` tip, tag the specific commit:

```sh
git tag v0.1.1 <sha>
git push origin v0.1.1
```

## One-time setup

See [SETUP.md](SETUP.md) — Cloudflare account creation, project-scoped API token, SSM seeding, GitHub repo secrets, Terraform bootstrap. All of that only needs doing once per repo / account / machine.

## Checking what's live

```sh
pnpm wrangler deployments list                       # recent deploys with version IDs
pnpm wrangler tail                                   # stream live request logs (read-only)
curl -I https://indri.studio/                        # HTTP headers, cache state
curl -I https://www.indri.studio/                    # expect 301 → https://indri.studio/
curl -I http://indri.studio/                         # expect 301 → https://indri.studio/
```

## Canonical-host policy

| Request | Expected response |
|---|---|
| `https://indri.studio/` | 200 — canonical host |
| `https://www.indri.studio/` | 301 → `https://indri.studio/` |
| `http://indri.studio/` | 301 → `https://indri.studio/` (Always Use HTTPS) |
| `http://www.indri.studio/` | 301 → `https://indri.studio/` (combined HTTPS + apex redirect) |

All four behaviours are Terraform-declared and survive any UI change.

## Common failures

- **Deploy fails with auth error in CI.** Either secret is missing or wrong. Re-check `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` in repo Settings → Secrets. Tokens don't round-trip through the UI — re-paste if in doubt. Source of truth is SSM at `/indri-studio/cloudflare/api_token`.
- **"Zone not active" on first custom-domain deploy.** Cloudflare zone activation can lag — retry after a few minutes once the registrar nameserver change has propagated.
- **CI build fails on lockfile.** Usually a dependency change. Run `pnpm install` locally, commit the updated `pnpm-lock.yaml`, re-tag.
- **Local `wrangler deploy` ships a stale dist.** `rm -rf dist && pnpm build && pnpm wrangler deploy` — wrangler doesn't rebuild for you.
- **Auth expired locally.** Re-run `pnpm wrangler login`.
