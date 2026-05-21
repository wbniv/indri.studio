# Add Forge Linux app card

## Context

User wants a homepage app card for **Forge Linux** (https://forgelinux.org/) with two provided screenshots as card-background imagery. The card links directly to the external site — no internal detail page, no store badges.

## Approach

Add an optional `externalUrl` field to the content schema. When set, the homepage card links to that URL (target blank). The slug page router excludes these entries from static generation so no internal `/apps/forge-linux/` page is created and prev/next navigation in other app detail pages stays clean.

## Files to change

| File | Change |
|------|--------|
| `src/assets/screenshots/forge-linux/site.png` | Copy from `/home/will/SRC/screenshots/Screenshot_20260518-184148.png` |
| `src/assets/screenshots/forge-linux/logo.png` | Copy from `/home/will/Pictures/Screenshots/Screenshot From 2026-05-18 19-02-16.png` |
| `src/content.config.ts` | Add `externalUrl: z.string().url().optional()` to the apps schema |
| `src/content/apps/forge-linux.md` | New content entry |
| `src/pages/index.astro` | Use `externalUrl` as href when present; add `target` + `rel` for external links |
| `src/pages/apps/[...slug].astro` | Filter out `externalUrl` entries from `getStaticPaths` and prev/next sort |
| `scripts/preview-card.py` | **New.** Compositing script: takes two image paths + card slot index, outputs a PNG preview applying the exact CSS treatment (opacity, saturation, rotation, scale, gradient overlay, title text). `-h/--help` supported. |
| `Taskfile.yml` | Add `card-preview` task wrapping `scripts/preview-card.py` |
| `CLAUDE.md` | Add "App card images" section: source images → assets dir, run `task card-preview` to review before committing |

## Implementation steps

1. **Copy screenshots** into `src/assets/screenshots/forge-linux/`

   > **Standard process (new):** before committing card images, run `task card-preview IMG1=<primary> IMG2=<secondary> TITLE="App Name"` to render a composite preview and review it. See step 6 below.

2. **`src/content.config.ts`** — after the `github` field inside `storeLinks`:
   ```ts
   externalUrl: z.string().url().optional(),
   ```
   (top-level, not inside `storeLinks`)

3. **`src/content/apps/forge-linux.md`**:
   ```md
   ---
   title: Forge Linux
   date: 2025-01-01
   summary: A Linux distribution built for game developers and digital artists.
   draft: false
   externalUrl: https://forgelinux.org/
   screenshots:
     - { src: "../../assets/screenshots/forge-linux/site.png", alt: "Forge Linux site" }
     - { src: "../../assets/screenshots/forge-linux/logo.png", alt: "Forge Linux logo" }
   ---

   A Linux distribution built for game developers and digital artists.
   ```
   The `screenshots` array drives the card's blurred/rotated background imagery (same `opacity-35 saturate-50` treatment as all other cards). Since there is no internal detail page, these images only ever render as card backgrounds — never in a screenshots grid.

4. **`src/pages/index.astro`** — update the card `<a>` tag:
   ```astro
   <a
     href={app.data.externalUrl ?? `/apps/${app.id}/`}
     {...(app.data.externalUrl ? { target: "_blank", rel: "noopener noreferrer" } : {})}
     class="glass-card glass-card-hover relative overflow-hidden block h-full p-6 md:p-8 group"
   >
   ```

5. **`src/pages/apps/[...slug].astro`** — filter `externalUrl` entries from static generation:
   ```ts
   const posts = (await getCollection("apps", ({ data }) => !data.draft && !data.externalUrl))
     .sort(...)
   ```

6. **`scripts/preview-card.py`** — reusable compositing script:

   ```
   usage: preview-card.py [-h] --img1 PATH --img2 PATH --title TEXT [--summary TEXT]
                          [--index INT] [--out PATH] [--width INT] [--height INT]
   ```

   - `--index` drives the rotation/scale formula from `index.astro` (default 0)
   - Outputs a PNG applying the full card treatment: opacity 35%/25%, saturate 50%, rotate/scale per formula, grey gradient overlay, title + summary text
   - Default output: `/tmp/card-preview.png`

   Taskfile entry:
   ```yaml
   card-preview:
     desc: "Preview a card background composite. IMG1=, IMG2=, TITLE=, SUMMARY= (optional), INDEX= (optional, affects rotation)"
     cmds:
       - python3 scripts/preview-card.py --img1 "{{.IMG1}}" --img2 "{{.IMG2}}" --title "{{.TITLE}}" --summary "{{.SUMMARY}}" --index "{{.INDEX | default 0}}" --out /tmp/card-preview.png
       - xdg-open /tmp/card-preview.png
   ```

   CLAUDE.md addition (under "Commands"):
   > **`task card-preview IMG1=… IMG2=… TITLE=…`** — composite-preview a card before committing images. Pass `INDEX=<n>` to test the exact grid position. Review the output PNG; if it looks good, commit the source images.

## Card image rendering

Forge Linux lands at sort index **2** (B → C → **F** → G → P → P → S → W → finding-your-way pinned last), giving:

- `rotation = +11°` (even index, so positive; `5 + (2×3)%7 = 5+6 = 11`)
- `scale = 1.35` (`1.25 + 2×0.05`)

Layers inside the card:

| Layer | Image | CSS treatment |
|-------|-------|---------------|
| Primary (full bleed) | `site.png` — dark mobile UI | `opacity-35 saturate-50`, `scale(1.35) rotate(11deg)` |
| Secondary (bottom-right ¾) | `logo.png` — white "FOUNDRY LINUX" on black | `opacity-25 saturate-50 mix-blend-luminosity`, `rotate(-15.4deg)`, offset `-bottom-[20%] -right-[15%]` |
| Gradient overlay | — | `from-[rgba(74,70,65,0.82)] via-[rgba(74,70,65,0.58)] to-[rgba(74,70,65,0.40)]` |

**Rendered preview** (generated by `scripts/preview-card.py` — approved):

<img src="file:///home/will/.claude/plans/screenshots/forge-linux-card-preview.png" width="640" alt="Forge Linux card preview">

## Verification

1. `task build` — no type errors, Astro resolves the two new images
2. `task dev` — homepage shows Forge Linux card between F entries (alphabetical)
3. Click the card → new tab opens `https://forgelinux.org/`
4. Navigate to `/apps/forge-linux/` → 404 (no static page generated)
5. Prev/next on adjacent app detail pages skips Forge Linux
