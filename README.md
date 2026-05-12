# indri.studio

Marketing site for **Indri**, a small studio building apps for phones, tablets, consoles, and the web. Astro 6 + Tailwind v4 + Cloudflare Workers (Static Assets), with a Terraform-managed Cloudflare infrastructure layer.

Replaces `rapid-raccoon.com`. Pattern seeded from [`~/SRC/rapid-raccoon-site/`](../rapid-raccoon-site/); Terraform pattern mirrors [`~/SRC/finding-your-way/infrastructure/`](../finding-your-way/infrastructure/).

The full project plan: [`docs/plans/2026-05-13-initial-buildout.md`](docs/plans/2026-05-13-initial-buildout.md). It's the contract — read or update it before any non-trivial change.

## Prerequisites

- Node 22 (`.nvmrc` + `package.json` engines pin this; use fnm or nvm).
- pnpm 10+.
- AWS CLI configured for SSM reads (`/indri-studio/...`).
- For deploys: Cloudflare account access, `wrangler` (installed as a dev dep).

## Dev

```sh
pnpm install
pnpm dev        # http://localhost:4321
pnpm build      # static output into dist/
pnpm preview    # serve dist/ locally
```

The Taskfile wraps these — `task dev`, `task build`, `task deploy`. See [docs/SETUP.md](docs/SETUP.md) for first-time setup.

## Adding an app

1. Create `src/content/apps/<slug>.md`.
2. Frontmatter (required fields from [`src/content.config.ts`](src/content.config.ts)):

   ```markdown
   ---
   title: My new app
   date: 2026-09-01
   summary: One-liner shown on the home gallery.
   draft: false
   ---

   Markdown body for the app's landing page.
   ```

3. `pnpm dev` to preview, `git commit && git push`. Tag (`v0.x.y`) to deploy.

## Adding a team member

1. Create `src/content/team/<slug>.md`.
2. Frontmatter:

   ```markdown
   ---
   name: Their Name
   role: Their role
   bio: One to three sentences.
   order: 4
   featured: true
   socials:
     github: https://github.com/them
   ---
   ```

3. Appears on [/about](/about) ordered by `order`. If `featured: true`, also on the homepage team strip.

## Deploy

See [`docs/DEPLOY.md`](docs/DEPLOY.md). Short version:

- Local: `task deploy` (or `pnpm build && pnpm wrangler deploy`)
- CI: push a `v*` tag — GitHub Actions does the rest. Workflow in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

## Layout

```
src/
  layouts/
    Base.astro             shared header + footer + global CSS
  pages/
    index.astro            studio homepage with app gallery
    about.astro            studio statement + team grid
    apps/
      [...slug].astro      one page per content entry
  content/
    apps/                  one .md per Indri app
    team/                  one .md per founder/employee
  content.config.ts        collection schemas
  styles/global.css        Tailwind v4 + Indri brand tokens
infrastructure/
  cloudflare/              TF for zone, Workers domain bindings, redirects
```

## Convention pointers

- [`CLAUDE.md`](CLAUDE.md) — project conventions for Claude Code sessions
- [`~/SRC/CLAUDE.md`](../CLAUDE.md) — shared conventions across all SRC projects
- [`docs/plans/`](docs/plans/) — implementation plans (this project + future work)
- [`Taskfile.yml`](Taskfile.yml) — canonical command entry point
