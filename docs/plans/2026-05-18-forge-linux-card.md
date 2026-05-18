# Add Forge Linux app card

> **Status:** implementing 2026-05-18

## Context

Add a homepage app card for **Forge Linux** (https://forgelinux.org/) — a Linux distro for game developers and digital artists. The card links directly to the external site (new tab). No internal detail page, no store badges.

Also establishes the standard process for compositing and previewing card background images via `scripts/preview-card.py` + `task card-preview`.

## Approach

- Add `externalUrl: z.string().url().optional()` to the apps content schema. Homepage cards with this field link to the external URL (target blank). The slug router filters them out so no internal page is generated.
- Add `cardSecondaryStyle` to the schema to allow per-card overrides of the secondary image's position/scale/rotation (full-bleed 130% −30° approved for Forge Linux logo).
- Ship `scripts/preview-card.py` + `task card-preview` as the standard pre-commit card preview tool.

## Card image — approved

Primary: `site.png` (mobile screenshot of foundrylinux.org) — full bleed, `opacity-35 saturate-50`, `scale(1.35) rotate(11deg)`

Secondary: `logo.png` (Foundry Linux wordmark, white on black) — **full bleed**, `opacity-25 saturate-50`, `scale(1.3) rotate(-30deg)`

<img src="file:///home/will/.claude/plans/screenshots/forge-linux-card-preview.png" width="640" alt="Approved card preview">

## Files

| File | Change |
|------|--------|
| `src/assets/screenshots/forge-linux/site.png` | Copy from `/home/will/SRC/screenshots/Screenshot_20260518-184148.png` |
| `src/assets/screenshots/forge-linux/logo.png` | Copy from `/home/will/Pictures/Screenshots/Screenshot From 2026-05-18 19-02-16.png` |
| `src/content.config.ts` | Add `externalUrl` (top-level) + `cardSecondaryStyle` to apps schema |
| `src/content/apps/forge-linux.md` | New content entry |
| `src/pages/index.astro` | External URL href/target; `cardSecondaryStyle` full-bleed rendering path |
| `src/pages/apps/[...slug].astro` | Filter `externalUrl` entries from `getStaticPaths` + prev/next sort |
| `scripts/preview-card.py` | **New.** Reusable card composite preview script |
| `Taskfile.yml` | Add `card-preview` task |
| `CLAUDE.md` | Add "App card images" section documenting the process |

## Standard card image process (new)

1. Drop source images in `src/assets/screenshots/<slug>/`
2. Run `task card-preview IMG1=<primary> IMG2=<secondary> TITLE="Name" INDEX=<n>` — `INDEX` drives the same rotation/scale formula as the grid slot
3. Review `/tmp/card-preview.png`; iterate on `--scale2`, `--rotation2`, `--fullbleed2` as needed
4. When approved, reference images in frontmatter (`screenshots` or `cardImages`) and add any `cardSecondaryStyle` overrides

## Deploy

```bash
task publish
```

## Verification

1. `task build` — no type errors, images resolve
2. `task dev` — Forge Linux card appears alphabetically (after blender-asset-searcher, claude-code-authoring-formats)
3. Click card → new tab opens `https://forgelinux.org/`
4. `/apps/forge-linux/` → 404
5. Prev/next on adjacent detail pages skips Forge Linux
