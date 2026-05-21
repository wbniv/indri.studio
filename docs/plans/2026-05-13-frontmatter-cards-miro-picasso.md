# Frontmatter cards — Miró + Picasso + clickable thumbnails

## Status (2026-05-13 PM)

The 13-direction port is **done and shipped**: phases 1–4 complete, all packs live under `design/frontmatter/styles/{a-arcane,…,m-ukiyoe}`, default rendering unchanged. The indri.studio app page at `/apps/claude-code-authoring-formats/` was published (`v0.1.1`) with a 3-col grid of all 13 thumbnails.

### Round 2 (2026-05-13 PM) — adds 3 features

1. **N · Joan Miró · Constel·lacions** — cream paper with feTurbulence grain, biomorphic-blob icon panel filled per-type (deep cobalt for memory, cadmium yellow for skill, raw canvas for subagent, pure cobalt for slash), thick black contour, Caveat cursive titles with Catalan/French subtitles. Committed in `python-tui-lib` at `design/frontmatter/styles/n-miro/style.css`.

2. **O · Pablo Picasso · Cubismo** — cream paper card with hard 8px black offset shadow, three-plane cubist icon panel via layered linear-gradients with pop accent dot, DM Serif Display italic titles per painting (Guernica / Les Demoiselles / Jeune Fille / Ma Jolie), Bricolage period stamp in top-right corner, italic "Picasso." signature in bottom-left. Committed at `design/frontmatter/styles/o-picasso/style.css`.

3. **Click-to-fullsize lightbox on indri.studio** — each tile on `/apps/claude-code-authoring-formats/` is now a button. Click opens a centered `<dialog>` with backdrop matching site bg (`rgba(61,56,51,0.96)` blurred), the full-size card render, and a caption. **Arrow-key navigation** (← / →) cycles through all 15 directions; on-screen `‹` / `›` buttons + Esc / backdrop-click to close. PNGs were re-rendered using a card-only sample (`/tmp/sample-cardonly.md` — frontmatter block alone) and trimmed of white margins so the dialog shows just the styled card. Committed in indri.studio at `src/content/apps/claude-code-authoring-formats.md` + `public/screenshots/claude-code-authoring-formats/style-*-full.png` (15 new full-size PNGs).

Total style pack count: **15** (A through O). Everything below this Status section is now historical context — kept for reference.

### Round 3 (2026-05-13 late PM) — 4 types per style + 2D lightbox navigation

Currently the indri.studio gallery shows 15 tiles, each rendering one card type (memory) per style. **Goal: cover all 4 authoring formats** (memory / skill / subagent / slash-command) for each of the 15 styles, browsable from a single 2D lightbox.

**Already done in this round:**
- Generated 90 new PNGs (45 thumbnails + 45 full-size) — 15 styles × {skill, subagent, slash-command} via the same `render-with-#3d3833-body-bg + zero-fuzz-trim + 24px-buffer` pipeline used for memory. Stored in `indri.studio/public/screenshots/claude-code-authoring-formats/style-<style>-<type>{,-full}.png`.
- Subagent sample (`/tmp/sample-3-subagent.md`) flattened from YAML literal-block `description: |` to single-line so md-to-pdf's parser renders the value (the literal-block style was previously rendered as just `|`).

Total PNG count on disk: **124** = 60 thumbnails + 60 full-size + 4 legacy per-type covers from an earlier round.

**Still to do:**

1. **Gallery tiles: rotate the cover type per tile.**
   Each of the 15 style tiles shows one of the 4 types as its cover (not all memory). Rotation across the 15 tiles:

   | Tile | Style | Cover type |
   |---|---|---|
   | 1 | A · Arcane | memory |
   | 2 | B · Holo | skill |
   | 3 | C · Gem | subagent |
   | 4 | D · Min | slash-command |
   | 5 | E · Max | memory |
   | 6 | F · Future | skill |
   | 7 | G · Editorial | subagent |
   | 8 | H · Mondrian | slash-command |
   | 9 | I · NIN | memory |
   | 10 | J · Blade Runner | skill |
   | 11 | K · Caravaggio | subagent |
   | 12 | L · Van Gogh | slash-command |
   | 13 | M · Ukiyo-e | memory |
   | 14 | N · Miró | skill |
   | 15 | O · Picasso | subagent |

   Distribution: 4 memory, 4 skill, 4 subagent, 3 slash-command across the gallery. Each tile's `<img src>` points to its cover-type thumbnail.

2. **Lightbox: 2D navigation via ←/→ (style) and ↑/↓ (type).**
   - Opening the lightbox: shows the clicked tile's (style, type) pair at full size.
   - ←/→ (existing): cycle through 15 styles. **Preserve current type** — if you're on the *skill* view of A and hit →, you land on the *skill* view of B.
   - ↑/↓ (new): cycle through 4 types {memory, skill, subagent, slash-command} for the current style. Wraps at the ends.
   - On-screen ↑/↓ buttons mirror ←/→ visually — vertically stacked on a different edge or at top/bottom centre.
   - Hint strip updates to "← → style · ↑ ↓ type · Esc to close".

3. **Caption updates per-type.**
   When the lightbox shows (A, skill), caption reads "A · Arcane Codex · skill — illuminated-manuscript framing…". The style line stays the same; the type word is appended. Per-type word from the existing TYPE_META lookup or just the literal "memory/skill/subagent/slash command".

4. **File path policy.**
   Memory PNGs keep their legacy naming `style-<style>.png` (and `-full.png`). The other three types use `style-<style>-<type>.png`. The lightbox script computes the URL via:
   ```js
   function pngFor(style, type) {
     return type === 'memory'
       ? `/screenshots/.../style-${style}-full.png`
       : `/screenshots/.../style-${style}-${type}-full.png`;
   }
   ```
   No file renames needed.

5. **Markup changes** in `src/content/apps/claude-code-authoring-formats.md`:
   - Each tile button gains `data-style="<style>"` and `data-type="<cover-type>"`. (Existing `data-full` and `data-cap` deprecated in favour of computing them in JS from these two attrs.)
   - Add 4 new HTML `<button class="fm-nav fm-up">` / `fm-down` inside the dialog (alongside `fm-prev` / `fm-next`).
   - Add new CSS for vertical button positioning.

6. **Script changes** (inline `<script>` at the bottom of the markdown):
   - Track `currentStyleIdx` (0–14) and `currentTypeIdx` (0–3) instead of a single index.
   - `step(deltaStyle, deltaType)` updates both indices independently with wrap-around.
   - Key handler: `ArrowLeft` → `step(-1, 0)`, `ArrowRight` → `step(1, 0)`, `ArrowUp` → `step(0, -1)`, `ArrowDown` → `step(0, 1)`.
   - Image src and caption computed from the (style, type) pair on every transition.

**Verification (after implementing):**
- Gallery: open `/apps/claude-code-authoring-formats/` — see 15 tiles, each showing a different cover type (per the table above).
- Click any tile — lightbox opens with that style + that type.
- Press → repeatedly — cycle through 15 styles, all showing the same type.
- Press ↓ — switch to the next type for the current style.
- Caption updates to reflect current (style, type).
- Esc / backdrop click / × button all close the dialog.
- Mobile arrow buttons (`‹` `›` `▲` `▼` or whatever glyphs) all wire to the same handlers.

After verification, commit (only mine), publish with `task publish FORCE=1`.

### Round 4 (2026-05-13 evening) — fold app prev/next nav into the breadcrumb

The fixed-position `<nav aria-label="Catalogue navigation">` block at the bottom of `src/pages/apps/[...slug].astro` puts the prev/next chevrons at `position: fixed; top: 50%` on the left/right page edges. On mobile this crams them up against the viewport edges, overlapping content like the "Blender Extensions" store badge (user screenshot 18:43). They also visually compete with the body content on desktop.

**Change:** replace the standalone "← All apps" breadcrumb at the top of the article with a single three-cell nav row, centred:

```
< prev          ↑ ALL APPS          > next
```

- The current `<a href="/#apps">…All apps</a>` block (lines 41–47) becomes the **middle cell** of a flex row, with its chevron switched from `chevron_left` to `arrow_upward` (since this link goes "up" to the catalogue index, not "back" — the up-arrow reads better when flanked by left/right siblings).
- A `<a href={`/apps/${prev.id}/`}>` with a `chevron_left` icon sits on the **left** of the row, `aria-label={`Previous: ${prev.data.title}`}`.
- A `<a href={`/apps/${next.id}/`}>` with a `chevron_right` icon sits on the **right**, `aria-label={`Next: ${next.data.title}`}`.
- All three links share `font-display text-label-md uppercase tracking-[0.2em] text-outline hover:text-primary-container transition-colors` styling for consistency.
- Row layout: `flex items-center justify-between mb-10` so prev/next chevrons hug the article gutter and "↑ ALL APPS" sits centred.
- Prev/next link titles exposed via `aria-label` (screen readers) and `title` (hover tooltip) — visible chevron alone is the primary affordance.

**Delete:** the fixed-position `<nav aria-label="Catalogue navigation">` block (lines 101–124, `side-nav-prev` / `side-nav-next`). Their CSS in the `<style>` block (`.side-nav`, `.side-nav-arrow`, `.side-nav-label`, etc.) becomes dead code — leave as harmless unused rules for now (a separate cleanup commit can remove them later).

**Preserve:** the existing inline `<script define:vars={{prevHref, nextHref}}>` that wires ←/→ keystrokes to navigation. Same `prev` / `next` references work for the new row.

**Verification:**
- Desktop: top of any app page shows the three-cell nav. Click ← or → goes to prev/next app. Click ↑ ALL APPS goes back to `/#apps`. The article body is no longer flanked by floating arrows.
- Mobile: chevrons sit inside the article gutter, not the viewport edge, and don't overlap store badges / body content.
- Keyboard: pressing ← or → still navigates to prev/next app.
- Lightbox compatibility: the existing `document.querySelector('dialog[open]')` gate on the keydown handler still lets the lightbox's own ←/→ take priority when open.

## New work in this round

The user dropped a fresh bundle at `~/Downloads/frontmatter-cards.zip` containing two new direction JSX files plus a refreshed `cards-data.jsx`:

- **N · Joan Miró · Constel·lacions** — cream paper ground, pure primaries (cobalt / vermillion / cadmium / viridian), thick black calligraphic curves, biomorphic shapes, hand-drawn stars + asterisks, Catalan/French captions. Per-type painting maps: memory → *Constel·lació · vers l'arc-en-ciel* (deep cobalt night), skill → *L'Or de l'azur · le carnaval* (cadmium yellow ground), subagent → *Femme et oiseaux · dona i ocells* (raw canvas cream), slash → *Bleu II · blau* (cobalt field).

- **O · Pablo Picasso · Cubismo** — fractured cubist planes (overlapping polygons with thick black contour), mask-like faces with displaced features, newspaper-collage strips, Spanish titling, bold "Picasso." signature. Per-type painting maps: memory → *Guernica* (graphite/bone/dove monochrome), skill → *Les Demoiselles d'Avignon* (rose/ochre flesh, blue backdrop), subagent → *Jeune Fille Devant un Miroir* (violet ground with moon-yellow + vermillion + cyan planes), slash → *Nature Morte · Ma Jolie* (analytic-cubism ochres with `JOURNAL` collage strip).

Plus a UX upgrade on indri.studio: thumbnails should be **clickable** so visitors can see each direction full-size, **inside the site frame** (per user's stated preference: "probably the latter").

## Plan

### 1. Port N + O as CSS style packs

Mirror the existing 13 packs:
- `design/frontmatter/styles/n-miro/style.css` with per-type CSS variables for `--paint`, `--paint-deep`, `--red`, `--yellow`, `--green`, `--blue`, `--title`, `--title-fr`, `--date`. iconGlyph gets a thick black contour using `text-stroke` (or a layered text-shadow trick) over a biomorphic blob. Decorative `::before` / `::after` use radial-gradient stars + a single floating asterisk. Caveat-cursive title; Cormorant Garamond captions.
- `design/frontmatter/styles/o-picasso/style.css` with per-type vars for `--ground`, `--ground-deep`, `--plane1/2/3`, `--accent`, `--pop`, `--title`, `--title-es`, `--date`, `--period`. The icon panel uses `clip-path: polygon(...)` to slice into 3 overlapping cubist planes filled with the per-type colour map. DM Serif Display title + Bricolage Grotesque period stamp. Card has a thin black contour line. Optional newspaper-strip `::after` for memory/slash variants.

Both packs follow the same emission-stable contract: HTML output unchanged, only `<style>` content varies. Same per-type detection (`type`/`version`/`tools`/`description`) already in `md-to-pdf.sh`.

### 2. Generate per-direction PNGs at two sizes

For all 15 (now) directions, render the **memory** sample card twice:

- `style-<name>.png` — 700×350 thumbnail (already exist for A–M; need new ones for N, O; existing ones stay).
- `style-<name>-full.png` — full-size render of all 4 cards stacked at ~1100px wide, ~2000px tall, for the lightbox. Reuses the headless-Chrome pipeline already at `/tmp/cd-renders/render-one.py` but cropped + downscaled to a sensible width.

Drop both into `indri.studio/public/screenshots/claude-code-authoring-formats/`.

### 3. Lightbox UX on the app page

Wrap each tile in a `<button data-fullsize="style-<name>-full.png" data-direction="<title>">` (or a plain `<a href="#fullsize-<name>">`). At the bottom of the markdown body, append a single hidden `<dialog id="fm-lightbox">` plus a small inline `<script>` that wires click → `dialog.showModal()`, sets the dialog's `<img src>` + caption, and handles Esc + backdrop-click to close.

**Stays inside the site frame**: `<dialog>` renders in the top layer of the page, on top of the existing site header/footer. Backdrop is `rgba(0,0,0,0.85)`. Dialog content is a centered `<figure>` with `<img>` (max-width: 95vw, max-height: 90vh, object-fit: contain) + `<figcaption>` showing the direction name.

Accessibility: native `<dialog>` is keyboard-accessible (Esc, focus trap). Each thumbnail wrapper has `aria-label="View {direction name} full-size"`.

No external libraries. Pure HTML5 `<dialog>` + ~30 lines of inline JS. Markdown can hold raw `<script>` and `<dialog>` tags.

### 4. Update markdown content

`indri.studio/src/content/apps/claude-code-authoring-formats.md`:
- Grid grows from 13 tiles to 15 (still 3 cols, now 5 rows).
- Each `<figure>` becomes `<button>` (or `<a href="#…">`) wrapping the existing img + caption.
- Add the `<dialog>` + `<script>` block at the bottom.
- Caption text for N and O drawn from each design's per-type title and a short signature line.

### 5. Publish

After verifying locally on `http://localhost:4321/apps/claude-code-authoring-formats/`:

- Commit my changes (style packs + screenshots + markdown).
- Leave any user WIP (`Base.astro`, `global.css`) untouched.
- Run `task publish FORCE=1` (stash WIP first, pop after, same dance as last time).

## Critical files

- `/home/will/SRC/python-tui-lib/design/frontmatter/styles/n-miro/style.css` (new)
- `/home/will/SRC/python-tui-lib/design/frontmatter/styles/o-picasso/style.css` (new)
- `/home/will/SRC/indri.studio/public/screenshots/claude-code-authoring-formats/style-n-miro.png` + `-full.png` (new)
- `/home/will/SRC/indri.studio/public/screenshots/claude-code-authoring-formats/style-o-picasso.png` + `-full.png` (new)
- `/home/will/SRC/indri.studio/public/screenshots/claude-code-authoring-formats/style-{a..m}-*-full.png` (new — 13 full-size companions to existing thumbnails)
- `/home/will/SRC/indri.studio/src/content/apps/claude-code-authoring-formats.md` (modified — new tiles, lightbox markup)
- Source JSX kept at `/tmp/cd2/design-{n-miro,o-picasso}.jsx` for porting reference

## Verification

```bash
# 1. Both packs listed
./scripts/md-to-pdf.sh --list-styles | grep -E "n-miro|o-picasso"

# 2. Each renders cleanly
FRONTMATTER_STYLE=n-miro ./scripts/md-to-pdf.sh design/frontmatter/samples/1-memory.md
FRONTMATTER_STYLE=o-picasso ./scripts/md-to-pdf.sh design/frontmatter/samples/1-memory.md

# 3. indri.studio dev — click any thumbnail, lightbox opens within site frame,
#    Esc closes, backdrop-click closes, focus returns to the clicked thumbnail
xdg-open http://localhost:4321/apps/claude-code-authoring-formats/

# 4. Published tag visible at https://indri.studio/apps/claude-code-authoring-formats/
```

## Context

Claude Design returned a bundle (`api.anthropic.com/v1/design/h/N6NyGfyXpI-OQay_2OS9oA`) containing **13 distinct visual directions** for the frontmatter metadata card, all driven by the same per-type colour identity (memory=grey, skill=orange, subagent=purple, slash command=green) and the same three-column `icon · key · value` grid we asked for. The user wants all 13 implementable in `md-to-pdf.sh` rendering, swappable via CSS — "can we implement them all using only css and different images?".

**Answer:** yes. The bundle's prototypes are React/JSX, but the visuals reduce to plain HTML + CSS + a small set of image assets (mostly inline SVG; a few PNG textures for the painterly ones).

The bundle was downloaded as a gzipped tar at `~/.claude/projects/-home-will-SRC-python-tui-lib/ee9751c4-cd04-43bf-9390-8f740ed8e092/tool-results/webfetch-1778656500023-lhj9bq.bin` (187 KB, 32 files). It contains a chat transcript showing the user iterated through A→M without ever rejecting one — the README in the bundle confirms "user had this file open when they triggered the handoff."

## Visual reference

All 15 directions, each rendered solo (no DesignCanvas wrapper) with the 4 file-type cards stacked. A–M via headless Chrome on a one-off page that bootstraps React + the design's JSX + cards-data; N–O via md-to-pdf rendering the same 4 sample files with each style's CSS pack, then stacked. Each preview shows what a memory / skill / subagent / slash-command file would look like in that direction.

### Section 1 — Dark / maximalist directions

| A · Arcane Codex | B · Holo Foil ID | C · Hearthstone Gem |
|---|---|---|
| <img src="screenshots/cd-bundle/dir-a-arcane.png" width="320"> | <img src="screenshots/cd-bundle/dir-b-holo.png" width="320"> | <img src="screenshots/cd-bundle/dir-c-gem.png" width="320"> |
| Illuminated-manuscript / MTG: filigree corners, Cinzel/Cormorant serif, drop-cap medallion icon, type-specific painted backgrounds (ash slate / copper / amethyst / malachite). | Cyberpunk security card: conic-gradient holo strip, JetBrains Mono, scanlines, type stamps, hex-grid icon panel, barcode footer. | Painterly rounded card with gem-socketed icons, ribbon banner for the type word, carved-stone plaques for keys, "rare ✦" set-mark footer. |

| I · NIN Industrial | J · Blade Runner | K · Caravaggio |
|---|---|---|
| <img src="screenshots/cd-bundle/dir-i-nin.png" width="320"> | <img src="screenshots/cd-bundle/dir-j-bladerunner.png" width="320"> | <img src="screenshots/cd-bundle/dir-k-caravaggio.png" width="320"> |
| Black cards, chromatic-aberration display titles, scanlines + scratch noise, hazard chevrons framing the icon, censor-bar accent. | Smoky amber haze, per-type neon tint (cyan/amber/magenta/green), CJK kanji watermark, ESPER-style icon panel + Voight-Kampff readout, spinner LEDs, "PROPERTY OF TYRELL CORP" footer + NX-7 serials. | Velvet-black tenebrism, single warm light source, gilt-framed icon niche, Italian display titles ("Memoria", "Maestria", "Familiare", "Invocazione") + Latin small caps. |

### Section 2 — Light / minimalist & maximalist directions

| D · Modern Minimalist | E · Modern Maximalist | F · Future Minimalist |
|---|---|---|
| <img src="screenshots/cd-bundle/dir-d-min.png" width="320"> | <img src="screenshots/cd-bundle/dir-e-max.png" width="320"> | <img src="screenshots/cd-bundle/dir-f-future.png" width="320"> |
| White cards, hairlines, generous whitespace, thin-line geometric SVG icons in a tinted square, mono ID stamp, coloured-dot type indicator. | Cream paper, hard-edged shadow, saturated colour panel for the icon column with a circular wax seal, mixed Bricolage + Instrument Serif + Geist Mono, halftone dots, dark footer ribbon. | Soft pastel gradient panels matched to the type hue, thin-line outline icons, glassy thin borders, large radii, pill chips, quiet mono captions. |

| G · Editorial Riso | H · Mondrian | L · Van Gogh |
|---|---|---|
| <img src="screenshots/cd-bundle/dir-g-editorial.png" width="320"> | <img src="screenshots/cd-bundle/dir-h-mondrian.png" width="320"> | <img src="screenshots/cd-bundle/dir-l-vangogh.png" width="320"> |
| Tinted pastel cards (per-type hue across the whole card, no cream), painted halftone colour blobs, tilted stickers, mixed Bricolage + Instrument Serif + Geist Mono. | Mondrian Composition in Red/Yellow/Blue/grey with green for slash-command. Thick black grid lines drawn as gaps on a black background; bright neoplastic white. Type word in red corner ribbon. | Each type → one painting (Starry Night / Sunflowers / Irises / Wheatfield with Cypresses). Swirling oil-painted icon niches, handwritten Caveat captions + DM Serif Display italic Italian titles (_La Notte Stellata_, _I Girasoli_, …). |

| M · Ukiyo-e | N · Miró Constel·lacions | O · Picasso Cubismo |
|---|---|---|
| <img src="screenshots/cd-bundle/dir-m-ukiyoe.png" width="320"> | <img src="screenshots/cd-bundle/dir-n-miro.png" width="320"> | <img src="screenshots/cd-bundle/dir-o-picasso.png" width="320"> |
| Cream washi paper, flat-colour woodblock motifs per type (wave / chrysanthemum / crane / pine), vertical kanji titles (記憶 KIOKU, 技能 GINO, 使魔 SHIMA, 命令 MEIREI) + red hanko seals + Shippori Mincho typography. | Cream paper with feTurbulence grain, biomorphic-blob icon panel filled per-type (deep cobalt / cadmium yellow / raw canvas / pure cobalt), thick black contour, Caveat cursive titles with Catalan/French subtitles ("Constel·lació", "L'Or de l'azur", …). | Cream paper with hard 8px black offset shadow, three-plane cubist icon panel via layered linear-gradients with pop accent dot, DM Serif Display italic titles per painting (Guernica / Les Demoiselles / Jeune Fille / Ma Jolie), Bricolage period stamp + italic "Picasso." signature. |

These are the source-of-truth previews. During Phase 1+ implementation, we'll regenerate each through md-to-pdf (CSS-only port, no React) and compare back to these.

## The 15 directions

| Dir | Name | Vibe | CSS-feasibility |
|---|---|---|---|
| A | Arcane Codex | Illuminated-manuscript, MTG-style frames, drop-cap medallion icons, Cinzel/Cormorant serif | mostly — SVG filigree corners |
| B | Holo Foil ID | Cyberpunk security card, conic-gradient holo strip, scanlines, JetBrains Mono | pure CSS |
| C | Hearthstone Gem | Painterly card, gem-socketed icons, ribbon banners, stone-plaque rows | mostly — SVG/PNG gem |
| D | Modern Minimalist | White card, hairlines, tiny coloured badge, thin-line SVG icons, mono ID stamp | pure CSS (inline SVG) |
| E | Modern Maximalist | Cream paper, saturated colour block, wax seal, Bricolage + Instrument Serif + Geist Mono | mostly — halftone via CSS gradient |
| F | Future Minimalist | Pastel gradient panels, glassy thin borders, large radii, fintech-quiet | pure CSS |
| G | Editorial Riso | Tinted pastel cards, riso blob fills, tilted stickers, scattered ornaments | mostly — SVG/CSS |
| H | Mondrian | Primary red/yellow/blue + grey + green, thick black grid lines, neoplastic | pure CSS |
| I | NIN Industrial | Black cards, chromatic-aberration display, scanlines + scratch noise, hazard chevrons | needs noise PNG |
| J | Blade Runner | Smoky amber haze, neon glow, CJK kanji watermark, ESPER readouts | mostly — needs JP font |
| K | Caravaggio | Velvet-black tenebrism, single warm light, gilt-framed icon niche | needs texture PNG |
| L | Van Gogh | Per-type painting (Starry Night/Sunflowers/Irises/Wheatfield), swirling oil bg | needs 4 painting PNGs |
| M | Ukiyo-e | Cream washi paper, flat-colour woodblock motifs, vertical kanji + red hanko seals | needs 4 woodblock PNGs |
| N | Miró Constel·lacions | Cream paper + feTurbulence grain, biomorphic-blob icon panel per type, thick black contour, Caveat cursive + Catalan/French subtitles | pure CSS (inline SVG turbulence) |
| O | Picasso Cubismo | Cream paper, 8px black offset shadow, three-plane cubist icon panel via layered gradients, DM Serif italic titles per painting + Bricolage period stamp + signature | pure CSS |

## Critical files

- `/home/will/SRC/python-tui-lib/scripts/md-to-pdf.sh` — frontmatter emission lives at lines 114–183; CSS at the `<style>` block around lines 565–595.
- `/home/will/SRC/python-tui-lib/design/frontmatter/styles/` — **new directory**; one subdir per direction holding `style.css` + `assets/*.svg|*.png`.
- `~/.claude/projects/-home-will-SRC-python-tui-lib/ee9751c4-cd04-43bf-9390-8f740ed8e092/tool-results/webfetch-1778656500023-lhj9bq.bin` — source bundle (kept read-only; we port the relevant CSS, don't ship the React).

## Design

### Architecture: one markup, swappable CSS

**Enrich the HTML emission** in `md-to-pdf.sh` to carry enough structure that *every* direction can decorate it via CSS pseudo-elements and variables. The current emission is:

```html
<div class="frontmatter">
  <div class="fm-icon mono">🧠</div>
  <div class="fm-rows">
    <div class="fm-row"><span class="fm-key">name</span><span class="fm-value">…</span></div>
  </div>
</div>
```

New emission (additions only — existing CSS still works because the new attrs are additive):

```html
<div class="frontmatter" data-type="memory" data-type-label="Memory" data-suit="Mnemonic" data-type-word="MEMORIA">
  <div class="fm-icon mono" data-glyph="◐">🧠</div>
  <div class="fm-rows">
    <div class="fm-row"><span class="fm-key">name</span><span class="fm-value">…</span></div>
  </div>
</div>
```

What changes vs current:

1. `data-type="memory|skill|subagent|slash-command"` — primary hook for per-type theming. Comes from existing type detection.
2. `data-type-label`, `data-suit`, `data-type-word` — optional label strings used by some directions (A uses Latin "MEMORIA", C uses suit names "Mnemonic", etc.). Set by lookup table inside md-to-pdf.sh. Designs that don't need them ignore them.
3. `data-glyph` on `.fm-icon` — alternate Unicode glyph (◐ ⚒ ☉ /). Designs A and C use this instead of the emoji. CSS can show/hide either via `content:`.

This is the only HTML change. Everything else is style-pack territory.

### Style pack layout

```
design/frontmatter/styles/
├── a-arcane/
│   ├── style.css
│   └── assets/
│       └── filigree-corner.svg
├── b-holo/
│   └── style.css                (pure CSS, no assets)
├── c-gem/
│   ├── style.css
│   └── assets/{gem-grey,gem-orange,gem-purple,gem-green}.svg
├── d-min/
│   ├── style.css
│   └── assets/{memory,skill,subagent,slash-command}-glyph.svg
├── e-max/   …
├── f-future/   …
├── g-editorial/   …
├── h-mondrian/   (pure CSS)
├── i-nin/
│   ├── style.css
│   └── assets/noise.png   (single tileable noise — used as scratch overlay)
├── j-bladerunner/   …
├── k-caravaggio/
│   ├── style.css
│   └── assets/canvas-texture.png
├── l-vangogh/
│   ├── style.css
│   └── assets/{starry-night,sunflowers,irises,wheatfield}.png
└── m-ukiyoe/
    ├── style.css
    └── assets/{wave,chrysanthemum,crane,pine}.png
```

Each `style.css` is self-contained — defines all needed CSS for `.frontmatter`, `.fm-icon`, `.fm-row`, `.fm-key`, `.fm-value`, plus pseudo-elements for chrome. Per-type theming uses CSS variables:

```css
/* d-min/style.css */
.frontmatter[data-type="memory"]       { --hue:#475569; --tint:#f1f5f9; --soft:#cbd5e1; --code:MEM; }
.frontmatter[data-type="skill"]        { --hue:#c2410c; --tint:#fff4ed; --soft:#fed7aa; --code:SKL; }
.frontmatter[data-type="subagent"]     { --hue:#7c3aed; --tint:#f5f0ff; --soft:#ddd6fe; --code:SUB; }
.frontmatter[data-type="slash-command"]{ --hue:#15803d; --tint:#eef9f0; --soft:#bbf7d0; --code:CMD; }

.frontmatter {
  background: #fff;
  border: 1px solid rgba(15,23,42,0.08);
  border-radius: 10px;
  display: grid;
  grid-template-columns: 184px fit-content(160px) 1fr;
  …
}
.fm-icon { background: var(--tint); border: 1px solid var(--soft); …
  /* SVG glyph injected via background-image when needed */
}
…
```

Inline-SVG-needed designs reference assets via `background-image: url("assets/glyph.svg")` and md-to-pdf inlines them as base64 (see asset-inlining section).

### Style picker

A single env var: `FRONTMATTER_STYLE=<dir-name>` (e.g., `FRONTMATTER_STYLE=d-min`). Default behaviour (env var unset or empty) keeps the current shipped CSS so nothing regresses.

In `md-to-pdf.sh`:

```bash
STYLE="${FRONTMATTER_STYLE:-}"
if [[ -n "$STYLE" ]]; then
  STYLE_DIR="$(dirname "$0")/../design/frontmatter/styles/$STYLE"
  [[ -d "$STYLE_DIR" ]] || { echo "Error: no style pack at $STYLE_DIR" >&2; exit 1; }
fi
```

Pass `$STYLE_DIR` to the Python heredoc. Python reads `$STYLE_DIR/style.css` (if set) and appends its contents to the existing inline `<style>` block. Asset references inside the CSS are rewritten to base64 data URIs at the same time (same `_read_and_resize` machinery as the existing `<img>` handler — just applied to `url(…)` strings inside CSS).

A `--list-styles` flag prints available directions and exits.

### Asset hosting — where do fonts and images live?

**Images (SVG ornaments, PNG textures, painting/woodblock backgrounds)** live alongside each style in `design/frontmatter/styles/<dir>/assets/`. The CSS references them via relative paths (`url("assets/filigree-corner.svg")`); md-to-pdf rewrites those into `url("data:image/...;base64,...")` at render time, so the produced HTML is fully self-contained and prints to PDF offline. Same path-resolution logic that already handles markdown `![alt](path)` and inline `<img src="...">` tags — extended to CSS `url(...)` strings inside the chosen style.css. Assets get committed to the repo alongside the CSS.

**Fonts** — the 13 directions ask for ~16 Google Fonts families (Cinzel, Cormorant Garamond, Bricolage Grotesque, JetBrains Mono, Geist, Geist Mono, Instrument Serif, Caveat, Anton, DM Serif Display, EB Garamond, Noto Sans/Serif JP, Orbitron, Shippori Mincho, Space Grotesk). Two-tier policy:

- **Default** (CDN): each style.css opens with `@import url('https://fonts.googleapis.com/css2?...&display=swap')`. Works online (browser fetches from Google's CDN). Adds an external network dependency to the rendered HTML — fonts won't load offline. Browser fallback to system serif/sans/mono is graceful.
- **Offline mode** (opt-in via env var `FRONTMATTER_FONTS=inline`): md-to-pdf downloads each font's WOFF2 file once into a per-style cache (`design/frontmatter/styles/<dir>/assets/fonts/`), base64-inlines them as `@font-face { src: url(data:...); }`. Adds ~50–300KB per font weight to the rendered HTML but makes the output fully self-contained for offline PDF. Cache survives between renders so the network hit only happens the first time per font.

For directions L (Van Gogh) and M (Ukiyo-e), the painterly backgrounds are PNG/JPEG sourced from **Wikimedia Commons** at plan-execution time (Van Gogh and Hokusai are PD). Downloaded once into `assets/`, resized to ≤1200px wide via the existing `_read_and_resize()` helper, committed to the repo. Direction I's scratch noise + K's canvas texture are generated procedurally via SVG `<feTurbulence>` filter (no PNG file needed).

**Summary table:**

| Asset type | Location | How inlined | Network at render? |
|---|---|---|---|
| SVG ornaments | `design/frontmatter/styles/<dir>/assets/*.svg` | `url(data:image/svg+xml;base64,...)` | no |
| PNG textures (procedural) | embedded SVG `<feTurbulence>` in CSS | no separate file | no |
| PNG textures (sourced) | `design/frontmatter/styles/<dir>/assets/*.png` | `url(data:image/png;base64,...)` | no |
| Painting / woodblock backgrounds | `design/frontmatter/styles/<dir>/assets/*.jpg` (downsized) | `url(data:image/jpeg;base64,...)` | no |
| Fonts (default) | Google Fonts CDN | `@import url(...)` | yes, at view time |
| Fonts (FRONTMATTER_FONTS=inline) | `design/frontmatter/styles/<dir>/assets/fonts/*.woff2` | `@font-face { src:url(data:font/woff2;base64,...) }` | one-time download at first render |

### Asset inlining

For CSS `background-image: url("assets/foo.svg")` inside a chosen style.css:

```python
def inline_css_url(m):
    rel = m.group(1)
    abs_path = os.path.join(style_dir, rel)
    if not os.path.exists(abs_path):
        return m.group(0)
    ext = os.path.splitext(rel)[1].lstrip('.') or 'png'
    data, mime = _read_and_resize(abs_path, ext)
    b64 = base64.b64encode(data).decode()
    return f'url("data:{mime};base64,{b64}")'

style_css = re.sub(r'url\(["\']?([^"\')]+)["\']?\)', inline_css_url, style_css)
```

Self-contained HTML output, no external asset references, prints to PDF cleanly.

### Per-type label / suit / type-word lookup

Added to the Python emission block. Static lookup keyed by detected file type:

```python
TYPE_META = {
  'memory':        {'label':'Memory',        'suit':'Mnemonic',   'word':'MEMORIA',    'glyph':'◐', 'emoji':'\U0001F9E0', 'mono':True},
  'skill':         {'label':'Skill',         'suit':'Artificer',  'word':'ARTIFICIUM', 'glyph':'⚒', 'emoji':'\U0001F6E0', 'mono':False},
  'subagent':      {'label':'Subagent',      'suit':'Familiar',   'word':'FAMILIARIS', 'glyph':'☉', 'emoji':'\U0001F575', 'mono':True},
  'slash-command': {'label':'Slash Command', 'suit':'Invocation', 'word':'INVOCATIO',  'glyph':'/', 'emoji':'⌨',         'mono':False},
}
```

Existing type-detection logic stays — it just now produces a key into this table instead of inline HTML strings. The emission step pulls all the data-attrs from the table.

## Implementation phasing

The 13 directions are realistically a multi-day port if done faithfully. Recommend phasing:

### Phase 1 — architecture + simplest direction (D · Modern Minimalist)

- Enrich HTML emission with `data-type`, `data-type-label`, `data-suit`, `data-type-word`, `data-glyph`
- Build the `TYPE_META` lookup
- Add `FRONTMATTER_STYLE` env var handling + `--list-styles` flag
- Build the asset-inlining helper
- Port D as the proof of concept (simplest of the 13 — pure CSS + 4 inline SVG glyphs)
- Verify: render all 4 sample files with `FRONTMATTER_STYLE=d-min ./scripts/md-to-pdf.sh …`. Default rendering (no env var) must be byte-identical to current shipped.

### Phase 2 — pure-CSS directions (B, F, G, H)

Port B Holo Foil, F Future Minimalist, G Editorial Riso, H Mondrian. No external assets — all CSS gradients + pseudo-elements. ~4–6 hours each.

### Phase 3 — SVG-asset directions (A, C, E)

Port A Arcane (filigree SVGs), C Hearthstone Gem (gem SVGs), E Modern Maximalist (halftone via repeating-radial-gradient). ~6–8 hours each.

### Phase 4 — painterly directions (I, J, K, L, M)

Port I NIN (single noise PNG), J Blade Runner (CSS + optional CJK font), K Caravaggio (canvas texture PNG), L Van Gogh (4 painting PNGs), M Ukiyo-e (4 woodblock motif PNGs).

For L and M, **the PNG assets need to come from somewhere**. Options:

- Generate them via image-generation MCP (if available)
- Extract from the bundle's existing screenshots in `frontmatter-cards/project/screenshots/` (cropped + repurposed)
- Source from public-domain originals (Van Gogh's paintings are PD; Hokusai's Great Wave is PD)
- Approximate with SVG paths / CSS gradients (less faithful but no asset dependency)

Decide per-direction in Phase 4.

## Verification

After each phase:

```bash
# 1. Default (no env var) renders unchanged
./scripts/md-to-pdf.sh design/frontmatter/samples/1-memory.md
diff /home/will/tmp/1-memory.html design/frontmatter/current/1-memory.html
# Expected: identical (or only the new data-attrs added, no visual change)

# 2. Style flag picks the right pack
FRONTMATTER_STYLE=d-min ./scripts/md-to-pdf.sh design/frontmatter/samples/{1-memory,2-skill,3-subagent,4-slash-command}.md
# Each render uses D · Modern Minimalist; per-type colours come through

# 3. List works
./scripts/md-to-pdf.sh --list-styles
# Prints: a-arcane, b-holo, c-gem, d-min, e-max, f-future, g-editorial, h-mondrian, i-nin, j-bladerunner, k-caravaggio, l-vangogh, m-ukiyoe

# 4. Bad style fails cleanly
FRONTMATTER_STYLE=nonexistent ./scripts/md-to-pdf.sh foo.md
# Expected: "Error: no style pack at …/styles/nonexistent" + exit 1

# 5. Visual comparison
# Render each direction × each sample file → 13 × 4 = 52 cards.
# Stack into a comparison grid by either:
#   (a) updating design/frontmatter/README.md to add a "styles/" section with thumbnails, OR
#   (b) generating an overview HTML similar to themed-cards.html that includes all 13 inline
# Compare against the bundle's screenshots in frontmatter-cards/project/screenshots/preview-hq.png
# for visual parity.
```

## Scope (decided)

**All four phases — all 13 directions**, wired into the existing frontmatter-detection special-case in `md-to-pdf.sh` (the code path at lines 114–183 that already notices the `---` fence + detects the file type via top-level keys + emits the icon corner). The new style-pack system plugs into that same emission — same detection logic, same `data-type` derivation, but with the option to layer on one of the 13 directions' CSS via `FRONTMATTER_STYLE=<dir>`.

Execution order stays as planned (Phase 1 → 2 → 3 → 4) so the architecture is locked in before the painterly directions force asset-sourcing decisions. After each phase, commit and let the user spot-check before continuing.

**Phase 4 asset-sourcing decision** is deferred until we get there — at minimum, public-domain sources cover L (Van Gogh paintings) and M (Hokusai's Great Wave + similar woodblocks). Texture noise for I and canvas for K can be procedurally generated via SVG `<feTurbulence>` filter (no PNG needed). Decide per-direction when porting.
