# Add llvm-mos-65816 to the indri.studio product gallery

## Status — committed as draft, publish on hold (2026-06-25)

Built and committed with `draft: true`, so it does **not** render on the site or
generate a detail page. Two reasons publish is held:

1. The badge target `wbniv/llvm-mos-65816` is a **private** repo, so the "Get it
   on GitHub" link would 404 for visitors until it goes public.
2. Author may reach out to WDC first (the project complements their 65816
   ecosystem); body copy was reworded to be purely additive — no comparison
   that could read as a swipe at WDC's own tooling.

**To ship later:** flip `draft: true → false` in
`src/content/apps/llvm-mos-65816.md`, confirm the repo is public, then
`task publish`.

## Context

`../llvm-mos-65816` (`wbniv/llvm-mos-65816`) is an optimizing, open-source C
compiler for the WDC 65816 — the CPU at the heart of the Super Nintendo — built
on [llvm-mos](https://github.com/llvm-mos/llvm-mos). It belongs in the
indri.studio "our apps" gallery alongside the studio's other open-source
developer tools (World Foundry, Blender Asset Searcher, Claude Code Authoring
Formats, Foundry Linux).

Adding it is a **content-only** change: the gallery is data-driven off the
`apps` content collection. A new `src/content/apps/<slug>.md` automatically
appears as a homepage card and gets a generated `/apps/<slug>/` detail page; a
`storeLinks.github` value automatically renders the GitHub badge there via the
existing `StoreBadges.astro` component. No component or schema changes are
required.

### Decisions (confirmed with user)

- **Badge scope:** detail page only (the standard pattern). The gallery card
  links to `/apps/llvm-mos-65816/`; the GitHub badge renders on that page. No
  changes to `index.astro` or `StoreBadges.astro`.
- **Display title:** a friendlier marketing name rather than the raw repo name —
  **"SNES C Compiler"** (uppercased on the card by existing CSS). Summary/body
  carry the llvm-mos lineage and the 65816/Apple‑IIgs breadth.
- **GitHub link:** the live repo URL,
  [https://github.com/wbniv/llvm-mos-65816](https://github.com/wbniv/llvm-mos-65816).

## How the gallery + badges work (reference)

- `src/pages/index.astro:9` — `getCollection("apps", ({ data }) => !data.draft)`,
  sorted alphabetically by `title` (finding-your-way pinned last). Each entry maps
  to a `.glass-card` (lines 60–146); card links to `externalUrl ?? /apps/${id}/`.
  Card background uses `screenshots[0..1]` if present, else `cardImages`
  (rendered subdued/grayscale). Title + `summary` + optional `b2b` overlay.
- `src/pages/apps/[...slug].astro` — `getStaticPaths()` generates a page per
  non-draft, non-`externalUrl` app; renders logo/title/summary, the
  `StoreBadges` row, the Markdown body, then the screenshots gallery.
- `src/components/StoreBadges.astro:34` — already has a `github` entry
  (`../assets/store-badges/github.svg`). Any `storeLinks.github` value renders
  the "Get it on GitHub" badge. **No edit needed.**
- `src/content.config.ts:15` — `apps` schema already supports every field used
  below (`title`, `date`, `summary`, `screenshots`, `storeLinks.github`, …).

Closest existing analog: `src/content/apps/world-foundry.md` (open-source dev
tool, GitHub badge, screenshots, internal detail page).

## Changes

### 1. Copy screenshots into the site assets

Source images live in the compiler repo at
`/home/will/SRC/llvm-mos-65816/docs/plans/screenshots/`. These are real product
output (Mandelbrot rendered by the SNES emulators), so they qualify as
`screenshots`, not decorative `cardImages`.

Create `src/assets/screenshots/llvm-mos-65816/` and copy a distinct, visually
rich subset. Candidate set (verify + dedupe at copy time — `mandel-jg.png` and
`mandel-mode7-jg.png` have identical byte sizes and may be the same file; the
`*-mame.png` files are tiny/low-res):

- `mandel-jg.png` — Mandelbrot rendered on bsnes-jg (primary; also the OG image)
- `mandel-mode7-compare.png` — Mode 7 perspective render, host-vs-emulator
- `mandel-compare.png` — host C reference vs SNES output (the verification story)

Pick 2–3 distinct ones; drop any that are byte-identical duplicates.

### 2. Add the content entry

Create `src/content/apps/llvm-mos-65816.md` (slug = filename → URL
`/apps/llvm-mos-65816/`, kept matching the source repo for provenance):

```markdown
---
title: SNES C Compiler
date: 2026-06-25
summary: Write modern C — boot it on a Super Nintendo.
draft: true   # held: badge target repo is private; see Status below
storeLinks:
  github: "https://github.com/wbniv/llvm-mos-65816"
screenshots:
  - { src: "../../assets/screenshots/llvm-mos-65816/mandel-jg.png", alt: "Mandelbrot rendered from C on the SNES (bsnes-jg)" }
  - { src: "../../assets/screenshots/llvm-mos-65816/mandel-mode7-jg.png", alt: "Mode 7 Mandelbrot rendered from C on the SNES (bsnes-jg)" }
  - { src: "../../assets/screenshots/llvm-mos-65816/mandel-compare.png", alt: "Host C reference vs the SNES render — pixel-for-pixel" }
---

An optimizing, open-source C compiler for the WDC&nbsp;65816 — the CPU at the
heart of the [Super Nintendo](https://en.wikipedia.org/wiki/Super_Nintendo_Entertainment_System) —
built on [llvm-mos](https://github.com/llvm-mos/llvm-mos).

It brings a modern, LLVM-based option to the 65816, complementing the
platform's long heritage of assemblers and commercial compilers: 24-bit
addressing, native 16-bit registers, and a complete SNES SDK (memory map, ROM
header, I/O registers, C runtime). Write C, get a bootable `.sfc` ROM —
verified pixel-for-pixel against two emulators (MAME and bsnes-jg).

The 65816 codegen is machine-agnostic, so the same compiler benefits other
65816 platforms (Apple IIgs) too. Open source under Apache-2.0 with LLVM
exceptions.
```

Notes:
- `date: 2026-06-25` (today) → **no** "Launching Soon" pill; the tool already
  builds ROMs. Set a future date if a "Launching Soon" pill is preferred.
- `b2b` and per-app `theme` are intentionally omitted (v1 inherits the studio
  grey+purple brand, like most entries). A retro/LLVM-green theme could be
  added later via the `theme` frontmatter block — optional polish, not required.
- Copy text is the recommended default; tune freely.

### 3. Plan-first bookkeeping

- Add a one-line `TODO.md` entry pointing at this change (use the `/todo` skill).
- Optionally mirror a short note into `docs/plans/` per the project's plan-first
  convention (this is a small content addition, so a TODO entry may suffice).

### 4. Commit and publish

After verification (below) passes, ship it. The site uses **tag-driven
deploys**: pushing a `v*` tag fires `.github/workflows/deploy.yml` (Cloudflare
Workers). `task publish` is the canonical path — it requires a clean tree on
`main`, auto-bumps the patch from the latest `v*` tag, then tags HEAD and pushes
the tag.

```bash
# Stage only the files this change touched (CLAUDE.md: commit only your work)
git add src/content/apps/llvm-mos-65816.md \
        src/assets/screenshots/llvm-mos-65816/ TODO.md
git diff --cached --stat            # confirm scope is exactly these files
git commit -m "feat(apps): add SNES C Compiler (llvm-mos-65816) to the gallery"
git push origin main                # remote branch carries the commit

task publish                        # tag HEAD (auto patch-bump v*) + push → deploy
```

- Already on `main` (current branch), which is what `task publish` requires.
- `task publish` refuses to run with a dirty tree or off `main`, so the commit
  must land first.
- Override the version with `task publish VERSION=vX.Y.Z` if a specific tag is
  wanted; default auto-bump is fine.

## Verification

1. **Schema + build** — content validates, page generates, images resolve:
   ```bash
   task build
   ```
   Expect: no schema errors; `dist/apps/llvm-mos-65816/index.html` produced;
   AVIF/WebP derivatives emitted for the copied screenshots.

2. **Dev server — gallery card**:
   ```bash
   task dev   # http://localhost:4321/
   ```
   Confirm a "SNES C COMPILER" card appears in the "our apps" grid (sorted under
   S), with the Mandelbrot screenshot as its subdued background and the summary
   line. Clicking it navigates to `/apps/llvm-mos-65816/`.

3. **Detail page — GitHub badge**: on `/apps/llvm-mos-65816/`, confirm the
   "Get it on GitHub" badge renders and links to
   `https://github.com/wbniv/llvm-mos-65816`, the body prose renders, and the
   screenshots gallery shows the copied images.

4. **(Optional) card composite preview** before finalizing imagery:
   ```bash
   task card-preview IMG1=src/assets/screenshots/llvm-mos-65816/mandel-jg.png \
                     TITLE="SNES C Compiler" INDEX=<grid-slot>
   ```

5. **Live deploy** (after `task publish`) — watch the tag-driven workflow and
   confirm the page is live:
   ```bash
   gh run watch "$(gh run list --workflow=deploy.yml -L1 --json databaseId -q '.[0].databaseId')"
   ```
   Then load the production URL `/apps/llvm-mos-65816/` and confirm the card,
   the GitHub badge (links to the repo), and the screenshots render.

## Files touched

- `src/content/apps/llvm-mos-65816.md` — **new** content entry
- `src/assets/screenshots/llvm-mos-65816/*.png` — **new** copied screenshots
- `TODO.md` — one-line entry
- *(no changes to `index.astro`, `StoreBadges.astro`, or `content.config.ts`)*

Then committed on `main` and shipped via `task publish` (tag-driven Cloudflare
deploy).
