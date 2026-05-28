# Screenshot gallery generator for World Foundry review

## Context

User wants to review screenshots from `../WorldFoundry-wbniv/` and select which ones to import into indri.studio's World Foundry app page. Current page has only 2 screenshots (blender-house.png, uv-seams.png). The WorldFoundry repo has ~230 interesting screenshots across several directories.

Task is split deliberately:
- **Finding files**: done with tools / `find` for this first run (not scripted yet)
- **Gallery generation**: scripted as `../python-tui-lib/screenshot-gallery.py` — reads a file list from stdin, outputs HTML

Per the shared-library convention (`CLAUDE.md`: "Reference scripts and hooks via `../python-tui-lib/` — never copy them into a project"), the script lives in `python-tui-lib` so any project can use it. The copy currently at `indri.studio/scripts/screenshot-gallery.py` must be removed once the move is done.

## Script: `../python-tui-lib/screenshot-gallery.py`

Reads one absolute path per line from stdin. Outputs a self-contained HTML file to stdout.

### Deduplication

Two cases to handle:
1. **Exact content duplicates** — md5 hash grouping. Show one card, list all paths as variants.
2. **Resolution variants** — files in the same parent directory whose filenames look like dimensions (`1920x1080.png`, `3840x2160.png`, `screenshot.png`). The wallpapers in `kde-theme/wallpapers/*/` are the primary case.

For both: display the variant whose resolution most closely matches the display size of the card (card images are rendered at 280 px tall; pick the variant whose height is nearest to 280 px × `devicePixelRatio`, i.e. 560 px for 2×). If a higher-resolution variant exists beyond what's displayed, add a "View full res" link on the card pointing to that file. List all variants + dimensions in a collapsed `<details>` block.

### Dimensions

Use `PIL.Image.open()` → `.size` for all formats. PIL is already used in `scripts/preview-card.py`. No fallback needed — PIL is a project dependency.

### HTML card layout

Each card contains:
- `<img>` with `src="file:///abs/path"` — no base64 (images up to 700 KB)
- Checkbox (top-left corner, always visible)
- Filename + short relative path (relative to the WorldFoundry repo root)
- `WxH · X KB`
- Collapsed `<details>` with variant list (only shown when group size > 1)

Click image → opens full path in new tab.

### "Copy checked" UI

Sticky button at top-right labelled **Copy JSON**. On click, JS builds an array of objects for every checked card and writes it to the clipboard as pretty-printed JSON. Also renders the JSON into a visible `<pre>` below the button so the user can copy manually.

Each object in the array:

```json
{
  "filename": "wfedit_collab.png",
  "path": "/home/will/SRC/WorldFoundry-wbniv/tests/screenshots/wfedit_collab.png",
  "hires_path": "/home/will/SRC/WorldFoundry-wbniv/tests/screenshots/wfedit_collab.png",
  "width": 1920,
  "height": 1200,
  "size_kb": 315,
  "variants": [
    { "path": "...", "width": 1920, "height": 1080, "size_kb": 120 }
  ]
}
```

All fields are embedded into the card element as `data-*` attributes (JSON-encoded for variants) by the Python script at generation time — no runtime filesystem access needed.

### HTML structure

```
<header>  title · N images shown (M groups) · [Copy checked]
<main class="grid">  cards…
<footer>  checked-list pre
```

Dark background (`#1a1a1a`), white text, 4-column CSS grid (responsive down to 1 col). Images `object-fit: contain` within a fixed-height box (280px) so tall/wide images don't blow up the layout. Lazy loading on all `<img>`.

## Finding files for the first run

Use `find` across the interesting directories, excluding build artifacts, level textures, and vendor files. Directories to include:

| Directory | Files |
|---|---|
| `tests/screenshots/` | 77 — editor + gameplay |
| `docs/qbert/screenshots/` | 40 — QBert dev shots |
| `docs/investigations/screenshots/` | 6 — large 1920×1200 editor |
| `docs/qbert/catalogue/` | 27 — 3D model renders |
| `docs/plans/screenshots/` | ~5 — before/after comparisons |
| `docs/plans/assets/` | 1 |
| `docs/qbert/plans/screenshots/` | 2 |
| `docs/qbert/refs/` | 6 — reference art |
| `kde-theme/wallpapers/` | 9 — multi-res wallpapers |
| `docs/investigations/mame-screenshots/` | 5 |
| `docs/qbert/investigations/mame-screenshots/` | 34 |
| `assets/arcade-roms/reference/` | 3 |

Exclude: `build-editor/`, `cmake-build-editor/`, `wflevels/`, `engine/vendor/`, `android/`.

The find command that feeds the script:
```bash
find /home/will/SRC/WorldFoundry-wbniv/tests/screenshots \
     /home/will/SRC/WorldFoundry-wbniv/docs \
     /home/will/SRC/WorldFoundry-wbniv/kde-theme/wallpapers \
     /home/will/SRC/WorldFoundry-wbniv/assets/arcade-roms/reference \
     -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" \) \
     ! -path "*/build*" ! -path "*/vendor*" \
  | python3 ../python-tui-lib/screenshot-gallery.py \
  > /tmp/wf-gallery.html
xdg-open /tmp/wf-gallery.html
```

## Files to create/modify

- `../python-tui-lib/screenshot-gallery.py` — move script here from `indri.studio/scripts/`
- `indri.studio/scripts/screenshot-gallery.py` — delete

## Verification

1. Run the find+pipe command above → HTML opens in browser
2. All images render (no broken img tags)
3. Wallpaper groups show one card with `<details>` listing 3 variants
4. md5 duplicates (if any) collapsed similarly
5. "Copy checked" button puts paths on clipboard
6. Dimensions and file sizes shown correctly on each card
