# www → apex redirect via Worker `fetch` handler

## Context

TODO entry (open): "Re-implement www→apex redirect in the indri-studio Worker's `fetch` handler — the `cloudflare_ruleset` resource is unmanageable from any API-token type on this Free-plan zone (deleted manually 2026-05-13). www.indri.studio currently has no redirect; fix before any marketing pushes traffic to `www.`"

Current state:

- `infrastructure/cloudflare/global/workers.tf:10` and `:18` bind the `indri-studio` Worker to **both** `indri.studio` (apex) and `www.indri.studio` via `cloudflare_workers_custom_domain` resources. Both hostnames hit the same Worker.
- `wrangler.toml` has no `main` — the project is currently pure static assets via `[assets] directory = "./dist"`. There is no Worker script yet.
- The `cloudflare_ruleset` resource that previously did the edge-level 301 was deleted (2026-05-13) because the Free-plan API token type can't manage it. Re-creating it is blocked at the Cloudflare API layer.
- Result: `www.indri.studio/<anything>` serves the same content as the apex — no canonicalisation, two SEO surface areas.

## Approach

Add a minimal Worker `fetch` handler that:

1. Inspects `new URL(request.url).hostname`.
2. If it's `www.indri.studio` → return `Response.redirect(<apex URL>, 301)`. Swap only the hostname; preserve scheme, path, query, and hash.
3. Otherwise → `return env.ASSETS.fetch(request)` so static assets continue to serve unchanged.

To make the handler intercept every request (including paths that match a static asset on disk), `wrangler.toml` needs:

- `main = "worker/index.ts"`
- `[assets] binding = "ASSETS"` so the Worker can reach the static-assets binding via `env.ASSETS`.
- `[assets] run_worker_first = true` so the Worker is invoked **before** the assets lookup. Without this, a `GET www.indri.studio/index.html` request would be served from `dist/index.html` and the redirect never fires.

No Terraform change — both hostnames are already custom-domain-bound to this Worker, so the redirect logic is the only missing piece.

## Files touched

| Path | Action |
|---|---|
| `worker/index.ts` | **new** — ~15-line Worker entry; default export with `fetch(request, env)` |
| `wrangler.toml` | uncomment `main`, add `assets.binding`, add `assets.run_worker_first = true` |
| `docs/plans/2026-05-14-www-apex-redirect.md` | this file |
| `TODO.md` | partial-stage to append `— [plan](docs/plans/2026-05-14-www-apex-redirect.md)` to the existing `- [ ] Re-implement www→apex redirect...` line. Other in-flight TODO changes (`[verify]` Render-blocking, any new entries) left untouched in working tree |

## Worker source (concrete)

```ts
// worker/index.ts
interface Env { ASSETS: Fetcher }

const APEX = "indri.studio";
const WWW = "www.indri.studio";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.hostname === WWW) {
      url.hostname = APEX;
      return Response.redirect(url.toString(), 301);
    }
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
```

Why constants for `APEX` / `WWW`: explicit single-line declaration is more readable than a regex strip-www, and the Worker only ever sees these two hostnames (both are bound in `workers.tf`). If a third hostname is ever added, this file needs revisiting anyway.

## `wrangler.toml` delta

```toml
name = "indri-studio"
compatibility_date = "2024-11-01"
main = "worker/index.ts"

[assets]
binding = "ASSETS"
directory = "./dist"
not_found_handling = "404-page"
run_worker_first = true
```

## Verification

Per SRC `CLAUDE.md` plan-verification format — keep these numbered steps verbatim; below each, paste raw command output in a fenced block and add PASS / FAIL.

1. **Local build still produces `dist/`.**
   ```bash
   task build 2>&1 | tail -5
   ls dist/index.html dist/colophon/index.html dist/apps/splitledger/index.html
   ```
   Expect: build completes; three index.html files present.

2. **Wrangler dev validates the config.**
   ```bash
   pnpm wrangler dev --local --port 8788 --inspector-port 0 2>&1 &
   sleep 5
   curl -sI -H "Host: www.indri.studio" http://localhost:8788/
   curl -sI -H "Host: indri.studio" http://localhost:8788/
   pkill -f 'wrangler dev'
   ```
   Expect: `www.indri.studio` → `HTTP/1.1 301` with `location: https://indri.studio/`; `indri.studio` → `HTTP/1.1 200`.

3. **Deploy to production.**
   ```bash
   task deploy 2>&1 | tail -10
   ```
   Expect: `wrangler deploy` succeeds; new Worker version with `main` deployed.

4. **Apex still serves content.**
   ```bash
   curl -sI https://indri.studio/ | head -5
   curl -sI https://indri.studio/colophon/ | head -5
   curl -sI https://indri.studio/apps/splitledger/ | head -5
   ```
   Expect: each returns `HTTP/2 200`.

5. **`www.` redirects with path preserved.**
   ```bash
   curl -sI https://www.indri.studio/ | grep -iE 'HTTP|location'
   curl -sI https://www.indri.studio/colophon/ | grep -iE 'HTTP|location'
   curl -sI https://www.indri.studio/apps/splitledger/ | grep -iE 'HTTP|location'
   ```
   Expect:
   - `HTTP/2 301` + `location: https://indri.studio/`
   - `HTTP/2 301` + `location: https://indri.studio/colophon/`
   - `HTTP/2 301` + `location: https://indri.studio/apps/splitledger/`

6. **Query string preserved through the redirect.**
   ```bash
   curl -sI 'https://www.indri.studio/?utm_source=test' | grep -iE 'HTTP|location'
   ```
   Expect: `location: https://indri.studio/?utm_source=test`.

7. **`task lighthouse` re-check.** Confirm the Worker hop didn't move Pass-3 baselines.
   ```bash
   task lighthouse 2>&1 | tail -20
   ```
   Expect: medians stay at 100 / 100 / 99 (or better) under `devtools` throttling.

8. **TODO entry updated to point at this plan.**
   ```bash
   grep -n 'www→apex' TODO.md
   ```
   Expect: the open `- [ ]` line now ends with `— [plan](docs/plans/2026-05-14-www-apex-redirect.md)`.

## Out of scope

- **No Terraform changes.** The TODO mentions the deleted `cloudflare_ruleset`; we're routing around it at the Worker layer, not re-introducing it.
- **No `[[routes]]` block in `wrangler.toml`.** Routes are TF-owned (per the wrangler.toml comment) — adding wrangler routes would fight TF on ownership.
- **No SEO sitemap / canonical URL changes.** Apex is already canonical in `<link rel="canonical">` (Astro defaults to the site URL). The 301 carries the SEO weight.
- **No HSTS / cache-control header tuning** on the redirect Response. Cloudflare defaults are fine; over-engineering would add risk for no measurable gain.
- **No Worker source TypeScript build step.** Wrangler handles `.ts` source directly via its built-in esbuild — no `tsc` step needed.

## Risks

- `run_worker_first` is a recent Wrangler config flag. `wrangler` is pinned at `^4.84.1` in `package.json`, which supports it. If a future wrangler upgrade renames the flag, the local-build verification step would catch it before deploy.
- Adding a Worker `main` means **every request** goes through Worker CPU (vs the current zero-Worker static-assets path). The handler is ~5 ms p99; well within Free-plan's 10 ms CPU/request budget.
- If Cloudflare's static-assets caching ever changes so that `run_worker_first = true` bypasses edge cache, FCP could regress. Re-running `task lighthouse` (step 7) covers that.
