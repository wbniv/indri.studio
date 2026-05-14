# indri.studio — Development Guide

> Project-specific conventions. Shared conventions cascade from `~/SRC/CLAUDE.md`.

indri.studio is the marketing site for **Indri**, a small studio that builds apps for phones, tablets, consoles, TVs, and the web. The site catalogues every Indri app, hosts each app's privacy/terms, and introduces the studio team.

It directly replaces `rapid-raccoon.com` — the predecessor studio site — using the same Cloudflare-hosted Astro pattern, plus full Terraform-managed infrastructure.

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Astro 6](https://astro.build/) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) (CSS-first via `@theme`) |
| Content | Astro Content Collections — `apps` and `team` |
| Hosting | Cloudflare Workers + Static Assets (via `wrangler.toml`) |
| IaC | Terraform (Cloudflare provider) — `infrastructure/cloudflare/` |
| Secrets | AWS SSM Parameter Store at `/indri-studio/...` |
| CI/CD | GitHub Actions — tag-driven deploy (`v*` tags) |
| Package manager | pnpm |

## Commands

```bash
task dev                     # Astro dev server (localhost:4321)
task build                   # Static build into ./dist/
task deploy                  # Build + wrangler deploy
task md -- <file>            # Preview a .md file in browser
task secrets-pull            # Pull SSM secrets into local .env
task secrets-bootstrap       # Push local secrets into SSM (one-time)
task tf-plan                 # Terraform plan (in infrastructure/cloudflare/global/)
task tf-apply                # Terraform apply
```

Run all commands from the repo root. The `Taskfile.yml` is the canonical entry point — never run raw `wrangler`/`terraform`/`pnpm` unless no task entry covers it.

## Brand

Greys + neon Phosphor purple, ringtail-lemur palette. **Always pull design tokens from `src/styles/global.css`** — never hardcode hex values in components.

| Token | Hex | Use |
|---|---|---|
| `--color-grey-900` | `#1A1815` | Primary background |
| `--color-grey-700` | `#3D3833` | Card surfaces |
| `--color-grey-200` | `#C8C0B8` | Secondary text |
| `--color-grey-50`  | `#F5F0E8` | High-emphasis text |
| `--color-primary-container` | `#B026FF` | Phosphor neon purple — accent |

Existing Material-name utilities work as expected: `bg-surface`, `text-primary-container`, `border-outline-variant`, etc.

**Stripe motif** — ring-tailed-lemur reference. Available as `.stripe-divider` for horizontal banding between sections. Use sparingly — it's a flavour element, not a structural one.

## Content collections

Two collections, defined in `src/content.config.ts`:

### `apps` — one entry per Indri app

```
src/content/apps/<slug>.md
```

Frontmatter (current v1 schema): `title`, `date`, `summary`, `draft`. The richer per-app schema (screenshots, store links, theme tokens) in `docs/plans/2026-05-13-initial-buildout.md` is the target — add fields incrementally as the per-app rendering wires them up.

### `team` — one entry per founder/employee

```
src/content/team/<slug>.md
```

Frontmatter: `name`, `role`, `bio`, `order`, `featured`, optional `socials`. The homepage team strip renders the subset where `featured: true`. The full `/about` page (every member regardless of `featured`) is planned but not yet shipped.

## Per-app theming (planned, not yet wired)

Each app's landing page should render in its own brand (warm fintech for SplitLedger, retro industrial for World Foundry, parchment serif for Finding Your Way, etc.) — not the Indri studio brand. Plan §"Aesthetic strategy" + §"Mockups" cover the design intent; implementation introduces `AppLayout.astro` that reads theme tokens from frontmatter and writes them as CSS custom properties on a wrapper.

Until that lands, every page inherits the studio's grey + purple palette.

## Plan-first workflow

The full project plan lives at `docs/plans/2026-05-13-initial-buildout.md` (commission of this initial buildout). Before any non-trivial change:

1. Read or update the plan.
2. Add a `TODO.md` entry pointing to the relevant plan section.
3. Implement.
4. Mark the TODO done, move it to the done section.

When in doubt about a decision, the plan is the contract.

## Markdown preview

After writing or editing any `.md` file (including this one), run `task md -- {filename}` to preview in the browser. Never on non-Markdown files. (Same convention as parking-space and bumper2bumper.)
