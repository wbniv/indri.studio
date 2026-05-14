# Code review — indri.studio (2026-05-14)

Extensive review of the indri.studio Astro + Cloudflare Workers site as of HEAD `82641f5` ("Lighthouse pass 4: render-blocking + cache-TTL cleanup verified"). Scope: `src/`, `worker/`, `infrastructure/`, `scripts/`, `.github/`, `docs/`, top-level config. Out of scope: visual design, copywriting, the rendered output of bundled assets in `dist/`.

The site is in good shape overall — small, focused, well-commented, and the recent Lighthouse-driven cleanup work is paying off. Findings below are clustered by severity. None are show-stoppers; most are doc/code drift or hardening opportunities.

---

## P1 — Bugs that ship broken behaviour to users

### B1. Homepage team strip ignores `featured` flag

[`src/content.config.ts:106`](../../src/content.config.ts) declares `featured: z.boolean().default(false)` on the `team` collection, and [`CLAUDE.md:71`](../../CLAUDE.md) + [`README.md:62`](../../README.md) both say the homepage team strip is "the subset where `featured: true`". The homepage at [`src/pages/index.astro:16`](../../src/pages/index.astro) loads the collection without that filter:

```js
const team = (await getCollection("team")).sort(
    (a, b) => a.data.order - b.data.order,
);
```

Today all four team entries (`founder-1.md` … `founder-4.md`) are `featured: true`, so the contract is masked. The moment anyone toggles a founder to `featured: false`, they will still appear on the homepage. **Either** add the filter (`getCollection("team", ({ data }) => data.featured)`), **or** remove the `featured` field from the schema until the `/about` page (B2) lands and there is somewhere for non-featured members to live.

### B2. `/about` route is documented but doesn't exist

[`README.md:62, 79`](../../README.md) and [`CLAUDE.md:71`](../../CLAUDE.md) both reference an `/about` page (`src/pages/about.astro`). It doesn't exist — there is only an `#about` anchor on the homepage at [`src/pages/index.astro:136`](../../src/pages/index.astro). Either build `about.astro` (and gate the homepage team strip to `featured: true` per B1), or remove the dangling references from the docs.

### B3. Store-badge `#` placeholders don't "no-op"

[`src/content.config.ts:57`](../../src/content.config.ts) documents the convention: `Use "#" as a placeholder when the actual store listing doesn't exist yet (a badge still renders, the link just no-ops).` Every app currently uses `#` for every store link (verified across all 8 entries in [`src/content/apps/`](../../src/content/apps/)). The actual behaviour of `<a href="#">` is **scroll to top** — not no-op. On long pages this means clicking "Available on Steam" or "Get it on Google Play" on `/apps/pinball-construction-set/` jumps the reader to the page top with no feedback.

Fix options, pick one:
- Skip the badge entirely when `link === "#"` (filter in `StoreBadges.astro:32`).
- Render a non-anchor (`<span>` or `<button disabled aria-disabled="true">`) when the value is `"#"`.
- Add an inline JS `if (e.target.matches('a[href="#"]')) e.preventDefault()` handler.

I'd default to suppressing the badge — clicking a real store badge that does nothing is worse UX than not seeing one.

### B4. `secrets-pull.sh` is missing the `--force` flag the Taskfile advertises

[`Taskfile.yml:45`](../../Taskfile.yml) describes `task secrets-pull` as: `"Render local .env from SSM (/indri-studio/cloudflare/*). Refuses on drift unless --force."` But [`scripts/secrets-pull.sh:19–23`](../../scripts/secrets-pull.sh) accepts only `-h | --help` and rejects everything else with `unknown arg`:

```bash
case "${1:-}" in
  -h|--help) sed -n '3,/^$/p' "$0" | sed 's|^# \{0,1\}||'; exit 0 ;;
  '') ;;
  *) echo "unknown arg: $1" >&2; exit 2 ;;
esac
```

There's no drift detection in the script at all — it always overwrites `.env`. Either implement the drift-check + `--force` behaviour, or correct the Taskfile description. The script is otherwise fine.

### B5. Colophon describes a font-delivery setup that no longer exists

[`src/pages/colophon.astro:180–190`](../../src/pages/colophon.astro) tells visitors:

> Both faces are served via Google Fonts; preconnect hints to `fonts.googleapis.com` and `fonts.gstatic.com` are emitted from the base layout to keep the type from blocking first paint.

That is no longer true as of commit `4908df0` (2026-05-14). [`astro.config.mjs:31–52`](../../astro.config.mjs) self-hosts Space Grotesk + Inter via Astro's Fonts API; [`src/layouts/Base.astro:44–57`](../../src/layouts/Base.astro) emits `<Font />` tags, and the cross-origin preconnect hints to `fonts.googleapis.com` / `fonts.gstatic.com` are gone from `Base.astro`. The two preconnect lines that remain in [`src/layouts/AppLayout.astro:50–51`](../../src/layouts/AppLayout.astro) are gated on `fontImports.length > 0`, which is currently never the case. Material Symbols is the only font still loaded from Google.

Rewrite the bullet to reflect reality: Space Grotesk + Inter are self-hosted via the Astro Fonts API (build-time woff2 download, served from `dist/_astro/fonts/` same-origin via Workers Static Assets); only Material Symbols Outlined is still served from `fonts.googleapis.com`. Keep this section honest — a colophon that lies about its own implementation is the worst kind of colophon.

---

## P2 — Doc/code drift that misleads collaborators

### D1. CLAUDE.md grey-palette table is out of date

[`CLAUDE.md:42–47`](../../CLAUDE.md):

| Token | Hex | Use |
|---|---|---|
| `--color-grey-900` | `#1A1815` | Primary background |
| `--color-grey-700` | `#3D3833` | Card surfaces |

The actual values in [`src/styles/global.css:45–50`](../../src/styles/global.css):

```css
--color-grey-700: #4a4641;
--color-grey-900: #3d3833;
--color-grey-1000: #0a0908;
```

The 2026-05-13 palette shift (`#1A1815` → `#2B2723` → `#3D3833`, mentioned in the global.css comment) bumped each grey up one tier. Update the CLAUDE.md table to reflect current state, or replace the entire table with a pointer to `src/styles/global.css` so it can't drift again.

### D2. DEPLOY.md mentions `wrangler-action@v3` but the workflow uses `@v4`

[`docs/DEPLOY.md:15`](../../docs/DEPLOY.md) says "`cloudflare/wrangler-action@v3`" — [`.github/workflows/deploy.yml:42`](../../.github/workflows/deploy.yml) is on `@v4`. Commit `4b797e5` ("CI: bump deploy actions to Node-24-bundled majors") forgot to update the doc.

### D3. DEPLOY.md still claims TF owns the canonical-host redirect

[`docs/DEPLOY.md:67`](../../docs/DEPLOY.md) says "All four behaviours [canonical-host redirects] are Terraform-declared and survive any UI change." That was true at the time of writing, but commit `48bc407` ("www→apex redirect via Worker fetch handler") moved the www→apex 301 into [`worker/index.ts`](../../worker/index.ts) because the Free-plan API token couldn't manage a `cloudflare_ruleset`. The TF-owned bits are still: Always-Use-HTTPS, custom-domain bindings, DNS. The www→apex part is in the Worker now.

Rewrite the paragraph: separate "TF-declared" (HTTPS upgrade, custom-domain bindings) from "Worker-implemented" (www→apex 301). The same pivot happened for cache TTL: now in [`public/_headers`](../../public/_headers), not in TF.

### D4. Schema docstring claims app `date` is used for homepage sort, but it isn't

[`src/content.config.ts:21`](../../src/content.config.ts) says of the `date` field: `Used to sort upcoming-first on the homepage gallery.` Reality: both [`src/pages/index.astro:7–14`](../../src/pages/index.astro) and [`src/pages/apps/[...slug].astro:11–15`](../../src/pages/apps/[...slug].astro) sort alphabetically by title (with `finding-your-way` pinned last). The `date` field is read only on the per-app page to render the "Launching Soon" pill ([`src/pages/apps/[...slug].astro:35–36`](../../src/pages/apps/[...slug].astro)). Either flip the homepage to sort by date and keep the pin, or correct the docstring.

### D5. Misc content typos

- [`src/content/apps/claude-code-authoring-formats.md:23, 25`](../../src/content/apps/claude-code-authoring-formats.md): "Thirteen directions are bundled" but the next paragraph says "each of the fifteen rendered" and the grid below has 15 tiles (`a` … `o`). Fix one number.
- The CLAUDE.md table refers to `bg-surface`, `text-primary-container`, `border-outline-variant` as Material-name utilities — accurate, just confirming during the same edit pass.

### D6. `StripedGridMotion.astro` is unused — deliberately so, but the component file was left behind ✅ resolved 2026-05-14

[`attic/StripedGridMotion.astro`](../../attic/StripedGridMotion.astro) (moved from `src/components/` on 2026-05-14 — see resolution at bottom of this finding) is fully implemented and its docstring describes a two-band layout that the [2026-05-13 plan](../plans/2026-05-13-striped-grid-motion.md) called for in the homepage hero (`<StripedGridMotion class="… top-6 z-0" />` above the hero, mirror below). `grep -rn StripedGridMotion src/` shows zero usages — neither [`src/pages/index.astro`](../../src/pages/index.astro) nor anywhere else imports it.

History: commit `3ba0c09` ("Header: breathe runs by default, drop StripedGridMotion bands", 2026-05-13) removed both `<StripedGridMotion />` instances and the import from `index.astro`. Commit message: "the line-ish horizontal motion they produced read as competing chrome." This was 17 hours before the body-pseudo-element pinstripe work (the `2026-05-14-animated-gradient-segmentation.md` investigation), so it's not collateral damage from that debugging — it's an aesthetic call: hero bands and body-level pinstripes were going to fight, the bands lost. The component file itself wasn't touched in that commit.

**Resolution (2026-05-14):** `git mv src/components/StripedGridMotion.astro attic/StripedGridMotion.astro`. The component is preserved verbatim (history intact via `git log --follow`) but no longer occupies `src/` and won't be mistaken for live code on next read. If a future iteration wants striped hero bands back, the wiring sits in `git show 3ba0c09 -- src/pages/index.astro`.

---

## P3 — Hardening and correctness for non-happy paths

### H1. `ScrollToTop.astro` leaks event listeners across view-transitions

[`src/components/ScrollToTop.astro:59–198`](../../src/components/ScrollToTop.astro) wraps everything in an IIFE inside `<script is:inline>`. Astro 6's `ClientRouter` re-executes inline scripts in body-region content on every page swap. So every navigation to/from an app page accumulates a fresh set of `scroll` + `resize` + `astro:before-preparation` + `astro:page-load` listeners on `window` / `document`. The handlers themselves are not idempotent.

Either:
1. Move the script to `<head>` (Astro persists `<head>` scripts) and guard with `if (!window.__scrollToTopInit) { window.__scrollToTopInit = true; … }`.
2. Rewrite as a module script (without `is:inline`) and let Astro's bundling handle it.
3. Set `data-astro-rerun` and use `astro:before-swap` to remove listeners on the outgoing page.

The same caveat applies — to a lesser degree — to the inline `<script>` in [`src/pages/apps/[...slug].astro:131–201`](../../src/pages/apps/[...slug].astro). That one uses non-`is:inline`, so Astro should be bundling it and running it once on initial load; the `astro:before-preparation` / `astro:after-swap` / `astro:page-load` listeners persist correctly. The touch-swipe handler binds to `document`, which is fine. Worth a manual verification that `setDir` doesn't fire multiple times after 5+ navigations.

### H2. App-pages `themeStyle` interpolation is unsafe if a theme value ever contains untrusted content

[`src/layouts/AppLayout.astro:29–38`](../../src/layouts/AppLayout.astro) concatenates frontmatter strings directly into a `style` attribute:

```js
const themeStyle = [
  theme.primary && `--color-primary-container: ${theme.primary}`,
  …
].filter(Boolean).join("; ");
```

This is currently safe because frontmatter is author-controlled and goes through Astro's attribute-escaping. But it's the only place in the codebase that interpolates content directly into a style attribute without value validation. If a theme value ever contained `;` plus a `background-image: url(...)`, you'd inject arbitrary CSS into the page. Three different defenders, pick one:
- Validate the theme schema with regex (`z.string().regex(/^[#a-zA-Z0-9() ,.-]+$/)`).
- Move from inline `style` to a typed `<style>` block keyed by app slug.
- Set the variables in a `data-app="<slug>"` selector in `global.css` (most ergonomic, but doesn't scale to N apps).

Cost is low; do this before the per-app theming feature lands.

### H3. `_headers` declares `screenshots/*` as `immutable` but URLs aren't content-hashed

[`public/_headers:22–23`](../../public/_headers):

```
/screenshots/*
  Cache-Control: public, max-age=31536000, immutable
```

`_astro/*` is content-hashed by Astro — safe to mark immutable. `screenshots/*` is **not** — `/screenshots/parking-space/active.png` is a stable URL whose contents may change in place when a new screenshot replaces it. Combined with `immutable`, any client that hit the old version will not revalidate for a year.

In practice this is fine *if* screenshots really never change. Two safer options:
1. Drop `immutable` and shorten to e.g. `max-age=86400` (1d). Trade a few KB of bandwidth for the ability to update an image.
2. Hash screenshot filenames the same way `_astro/*` is hashed — e.g. ship them through Astro's asset pipeline (`getImage()`, `<Image />`) rather than as raw `public/` files. The dimension manifest already exists; the conversion script just needs to emit hashed filenames.

If you keep `immutable`, document a cache-bust strategy (query string suffix, or rename-on-change) somewhere a future contributor will see it.

### H4. Build pipeline doesn't regen screenshot variants in CI

[`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml) runs `pnpm build` directly, not `task build`. The 292 committed AVIF/WebP variants under [`public/screenshots/`](../../public/screenshots/) are the only thing keeping `Screenshot.astro`'s `<source srcset>` lines from 404-ing in production.

Two failure modes:
- Someone adds a new `.png` under `public/screenshots/` and commits without running `task screenshots` — the `<source srcset>` lines point at non-existent `.avif`/`.webp` files, and browsers fall back to PNG silently. Performance regression, no error.
- Someone edits an existing `.png` in place — committed `.avif`/`.webp` siblings are stale. Same silent fallback in modern browsers, but the AVIF/WebP serve a stale image.

Easiest fix: add `node scripts/optimize-screenshots.mjs` as a pre-build step in the workflow (it's idempotent, so the cost on CI is the AWS metadata read; regen only when sources change). Slightly stronger: a pre-commit hook in `lefthook.yml` / `.git/hooks/pre-commit` that runs the same script on staged PNG/JPG changes.

### H5. The narrow CF API token probably can't apply the full `global/` config

[`infrastructure/cloudflare/iam-self/token.tf:33–69`](../../infrastructure/cloudflare/iam-self/token.tf) mints `indri-cf-token` with three permission groups: `dns_write` (zone), `workers_routes_write` (zone), `workers_scripts_write` (account). [`infrastructure/cloudflare/README.md:36`](../../infrastructure/cloudflare/README.md) says "After step 4, only the narrowed token exists — the global/ config and CI deploys both use it."

But [`infrastructure/cloudflare/global/`](../../infrastructure/cloudflare/global/) declares resources that require permissions not in that list:
- `cloudflare_zone` (creating a zone) — requires **Zone:Edit** at the account level.
- `cloudflare_zone_setting` (always_use_https, automatic_https_rewrites) — requires **Zone Settings:Edit**.
- `cloudflare_workers_custom_domain` — requires **Workers:Edit** (custom-domains permission, not Routes).
- `cloudflare_email_routing_*` — requires **Email Routing:Edit** (both zone and account scope).

Either:
- The bootstrap token never actually got revoked and the project still relies on it for the `global/` apply (likely, given the README's "TODOs before first apply" caveats are still in the code).
- The narrow token got more permissions added through the dashboard after `terraform apply` ran, and the TF code is out of date.
- The TF resources for zone setting / custom domain / email routing have only ever been applied with the bootstrap token, and re-applies will fail with 403s.

Verify which of the above is real, and either expand `permission_groups` in `token.tf` to match the resources `global/` actually manages, or split the configs (e.g. an `account-scoped` config that uses a broader token, and a `runtime` config — DNS + Workers script + cache rules — that uses the narrow token CI also uses).

The DRY principle of "narrow token, narrow scope" is right; the implementation isn't there yet.

### H6. `Base.astro` defines `navLinkClass` but never uses it

[`src/layouts/Base.astro:23–29`](../../src/layouts/Base.astro) has a 6-line `navLinkClass` arrow function. It's not called anywhere in the file (or anywhere else in the project — `grep -rn navLinkClass` returns one match). Likely leftover from the rapid-raccoon seed. Delete.

### H7. Footer mailto carries irrelevant `target="_blank" rel="noopener noreferrer"`

[`src/layouts/Base.astro:188–192`](../../src/layouts/Base.astro). `mailto:` URIs don't open a new tab (browsers hand them to the OS mail handler regardless), so `target` and `rel` are no-ops in practice. Harmless, but redundant. Drop them.

### H8. Image dimensions missing on `404.astro` lemur and colophon mascot

[`src/pages/404.astro:59–66`](../../src/pages/404.astro) — `<img src="/lemur.png">` has no explicit `width`/`height`. [`src/pages/colophon.astro:452–460`](../../src/pages/colophon.astro) — the mascot lemur has `width="1536" height="1024"` — good. The 404 case mostly survives because the image is absolutely-positioned and `pointer-events-none`, so CLS impact is bounded, but Lighthouse may still flag it. Add intrinsic dimensions.

### H9. `optimize-screenshots.mjs` exits 1 when no source images exist

[`scripts/optimize-screenshots.mjs:70–73`](../../scripts/optimize-screenshots.mjs):

```js
if (sources.length === 0) {
  console.error(`${ts()} no source images found under ${screenshotsDir}`);
  process.exit(1);
}
```

This means `task screenshots` fails on a hypothetical fresh-clone-with-no-screenshots state. Since the script is a build dep, that would propagate to `task build`. Edge case (we already have 100+ source images), but a clean failure mode is `process.exit(0)` with a warning — the manifest just stays empty.

---

## P4 — Style and small polish

### S1. `--color-surface-tint: #b026ff` hardcodes the brand purple instead of referencing the variable

[`src/styles/global.css:65`](../../src/styles/global.css). The `@theme` block defines `--color-primary-container: #b026ff` two lines later. The two are the same colour; if one ever shifts, the other will silently drift. Rewrite:

```css
--color-surface-tint: var(--color-primary-container);
```

(Tailwind v4 supports `var()` inside `@theme` value position for tokens that reference other tokens.)

### S2. `--text-headline-sm` lacks the `--letter-spacing` triplet that `lg` and `md` have

[`src/styles/global.css:130–132`](../../src/styles/global.css). Stylistic consistency only; no functional impact unless you start using the `text-headline-sm` utility at scale.

### S3. README "Dev" section bypasses the Taskfile that CLAUDE.md says is canonical

[`README.md:18–25`](../../README.md) shows `pnpm dev` / `pnpm build` / `pnpm preview` first; CLAUDE.md and SRC/CLAUDE.md both say "Use `task <name>` over raw commands." Both work, but they fight on first-impression. Either:
- Lead with `task dev` / `task build` and footnote the underlying `pnpm` calls for completeness.
- Strike "Use `task <name>` over raw commands" from CLAUDE.md if the project genuinely wants both surfaces.

### S4. `Screenshot.astro` throws instead of warning when the dimension manifest is stale

[`src/components/Screenshot.astro:23–27`](../../src/components/Screenshot.astro):

```js
if (!dim) {
  throw new Error(`Screenshot.astro: no dimensions for "${src}" …`);
}
```

This is a build-time fail-loud, which is the right call — a missing dimension means CLS in production. Calling out as good defensive design, not a flaw.

### S5. `scroll-mt-20` is a fixed offset; the sticky header shrinks

Anchors on the homepage (`#apps`, `#about`, `#team`) and on the colophon (`#set-in`, `#palette`, `#built-with`, `#motifs`, `#references`) all use `scroll-mt-20` (= 5rem = 80px). The header is initially ~72px and shrinks to ~40px as scroll progresses (per [`src/layouts/Base.astro`](../../src/layouts/Base.astro) `--header-shrink` machinery). At the top of the page (where anchor scroll lands), 80px is roughly correct; once shrunken, the anchored heading will sit too far below the new header top. Low-stakes; the user notices only if they hit the same anchor twice.

A correct fix would use `scroll-margin-top: calc(80px - 32px * var(--header-shrink, 0))`, registered via `@property` on the same `<html>` element.

---

## What's clearly working well

Worth recording explicitly so future review passes don't churn on it:

- **`worker/index.ts`** — 22 lines, one responsibility (`WWW` → `APEX` 301, fall through to `ASSETS.fetch`). Clean.
- **`scripts/setup-workers-ai.sh`** — exemplary security hygiene: `umask 077`, mktemp + `push_cleanup`, validates token via probe before pushing to SSM, uses `file://` for `--value` to keep the token out of `argv`. Reuses `cleanup-stack.sh` from the shared `python-tui-lib`.
- **Cache headers in `public/_headers`** — the comment block explicitly records *why* this lives in `_headers` instead of TF (Free-plan token can't manage `cloudflare_ruleset`). Future-you will know why the obvious-looking TF approach is a dead end.
- **`StripedGridMotion.astro`** is a clean, JS-free, per-instance-randomised component — but see D6, it's currently unused.
- **Inline critical CSS + self-hosted fonts** — recent Lighthouse pass-3/4 work paid off; the build-time decisions (inlined stylesheets, `display: optional`, metric-matched fallback faces from `@capsizecss/unpack`) are exactly the right knobs.
- **Animated stripes via `transform`** — the [`docs/investigations/2026-05-14-animated-gradient-segmentation.md`](2026-05-14-animated-gradient-segmentation.md) write-up captured a tricky Chrome/Linux compositor edge case and turned the fix into a one-line `body::before` change. Reference example for the "every anomaly has a concrete cause" rule from `~/SRC/CLAUDE.md`.

---

## Recommended order of operations

If working through this in one session:

1. **B1–B5** first — user-visible behaviour and lying-to-the-reader-on-the-colophon are the only things worth shipping urgently.
2. **D1–D5** in the same commit as the next CLAUDE.md / docs edit you'd be making anyway.
3. **H5** soon — the IAM-token gap may be hiding a 403 cliff the next `tf-apply` will discover.
4. **H1–H4** during the next non-feature pass; H4 specifically the next time you touch screenshots.
5. **S1–S5** opportunistic.

None of this is blocking — the site renders cleanly and Lighthouse is at 100 / 100 / 99. This list is primarily about reducing surprise for future maintainers (including future-you).

---

## Implementation note (2026-05-14)

22 of the 24 findings landed in five commits, following the order above. Plan: [`docs/plans/2026-05-14-code-review-implementation.md`](../plans/2026-05-14-code-review-implementation.md).

| Severity | Commit | Findings |
|---|---|---|
| P1 | `a00ba62` | B1, B2, B4, B5 (B3 skipped — store-badge `#` reads as a no-op in practice since badges sit at the top of app pages) |
| P2 | `153a011` | D1, D2, D3, D4, D5 + D6 (cross-project glossary CLS entry at `~/SRC/docs/glossary.md`) |
| P3 | `65ddf4a` | H1, H2, H6, H7, H8, H9 + H3 (interim band-aid: `max-age=86400`) |
| P3 | `235f45d` | H5 audit findings — env token diverged from TF-managed token; reconciled in `docs/plans/2026-05-14-iam-token-narrow.md` (resolved 2026-05-14) |
| P4 | `52758d7` | S1, S2, S3, S5 (S4 was praise — no action) |

Resolved via [`docs/plans/2026-05-14-asset-pipeline-cache-busting.md`](../plans/2026-05-14-asset-pipeline-cache-busting.md), commit `c786089` (V1–V10 PASS):

- H3 — `public/screenshots/` migrated into `src/assets/`; all screenshot URLs now hashed `_astro/*` and inherit the immutable‑1y rule. The interim `max-age=86400` rule for `/screenshots/*` was deleted.
- H4 — moot; `optimize-screenshots.mjs` and `screenshot-dims.json` deleted; Astro handles variant generation at build time.

H8 expanded mid-implementation: in addition to adding intrinsic dimensions on the 404 lemur, both lemur PNGs were moved from `public/` into `src/assets/` and now ship as hashed, resized variants via Astro's `<Image />` (~4 MB → ~366 KB total).
