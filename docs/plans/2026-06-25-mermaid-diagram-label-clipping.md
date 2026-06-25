# Fix Mermaid diagram label clipping on /docs/ pages

## Status — DONE + DEPLOYED (2026-06-25, v0.1.65)

Reported by the user with a screenshot of `indri.studio/docs/snes-bootup/`: the
flowchart's node boxes were cutting off the last line of every multi-line label
(e.g. "65816 in 6502-emulation mode (E=1)" → "mode (E=1)" missing; "…point the
soft stack at $2000" → "the soft stack at $2000" missing). Two independent causes;
both fixed and verified live. Final state: **0/10 labels overflow** on the live
production SVG.

## Context

Doc pages are built from `src/content/docs/<slug>.md`, which `scripts/sync-65816-docs.sh`
generates from the `../llvm-mos-65816` reader docs. That script **pre-renders**
each ```` ```mermaid ```` fence to inline SVG at build time via the mermaid.ink API
(forcing the dark theme) and wraps it in `<div class="mermaid-diagram">…</div>`.
The page (`src/pages/docs/[...slug].astro`) renders the markdown into `<div class="prose">`.

Introduced in commit `2fc4c17` ("docs(65816): render Mermaid diagrams + reorder doc
list"). The SVG geometry from mermaid.ink is itself correct — the bug is entirely in
how the labels are styled/serialised once embedded in the page.

## Root cause — two stacked causes

mermaid renders node labels as **HTML inside `<foreignObject>`** (`<span class="nodeLabel"><p>…</p></span>`),
with each node's box (`<rect>` + `<foreignObject height=…>`) baked at render time from
mermaid.ink's own font metrics (`trebuchet ms`/`verdana`/`arial` @16px, line-height 1.5).
`foreignObject` **clips** content taller than its baked height. Two things made the
labels render taller than the baked box:

1. **Font cascade.** `src/pages/docs/[...slug].astro` has
   `.prose :global(p){ font-family: var(--font-body); line-height:1.7 }`, and
   `--font-body` is **Inter** (`src/styles/global.css:116`) — wider than the baked
   sans stack. That rule cascades into the foreignObject `<p>` labels, so they wrap to
   more lines and each line is taller → overflow → clip.

2. **`<br></br>` double line-break (dominant).** mermaid.ink emits multi-line labels as
   `<p>a<br/>b</p>`. Astro's markdown → HTML pipeline (rehype) **re-serialises that
   `<br/>` as `<br></br>`**, which browsers parse as **two** `<br>` → every multi-line
   label gains a blank line → overflow. The font fix alone left this unaddressed.

## The fix

- **Cause 1 — CSS** (`src/pages/docs/[...slug].astro`, commit `f945cf3`, v0.1.64):
  scope the mermaid labels back to an Arial-width stack matching the bake
  (`verdana` dropped so wide-Verdana macOS/Windows clients don't re-wrap), restore
  `line-height:1.5` and `margin:0`, make the SVG responsive:
  ```css
  .prose :global(.mermaid-diagram p),
  .prose :global(.mermaid-diagram .nodeLabel),
  .prose :global(.mermaid-diagram .edgeLabel) {
      font-family: "trebuchet ms", arial, "Liberation Sans", sans-serif;
      line-height: 1.5; margin: 0;
  }
  ```
- **Cause 2 — sync script** (`scripts/sync-65816-docs.sh` `svg_for()`, commit `b5d8929`, v0.1.65):
  split multi-line labels into separate `<p>` instead of `<br>` (no void element for
  rehype to mangle); the CSS above gives them `margin:0` so they stack tightly:
  ```python
  return re.sub(r'<br\s*/?>', '</p><p>', svg)
  ```
  `src/content/docs/snes-bootup.md` regenerated (the only doc with multi-line labels).

Pure presentation change — works with the existing pre-rendered SVGs; no diagram
re-fetch from mermaid.ink needed.

## Files changed

| File | Commit | What |
|---|---|---|
| `src/pages/docs/[...slug].astro` | `f945cf3` | scoped `.mermaid-diagram` label CSS |
| `scripts/sync-65816-docs.sh` | `b5d8929` | `svg_for()` splits `<br/>` → `</p><p>` |
| `src/content/docs/snes-bootup.md` | `b5d8929` | regenerated (only doc with multi-line labels) |

Deploys: **v0.1.64** (`f945cf3`, run 28169559509) then **v0.1.65** (`b5d8929`, run 28170271972),
both via `task publish` (tag-driven Cloudflare deploy). The `<br></br>` cause was
caught during post-deploy verification of v0.1.64 — the CSS-only fix measured 8/10.

## Verification

Method: extract the diagram `<svg>`, render it under the **real** page CSS (Inter
`.prose p` @ lh1.7 + the deployed mermaid fix) with Inter loaded from
`.astro/fonts/`, and count `foreignObject`s whose inner label `scrollHeight`
exceeds the baked box `height` (= clipped). Headless Chrome.

1. **Diagnose the cascade — confirm `.prose p` uses a wide font.**
   ```
   src/pages/docs/[...slug].astro:149  .prose :global(p){ font-family: var(--font-body); line-height:1.7 }
   src/styles/global.css:116           --font-body: var(--font-inter), system-ui, …  → Inter
   ```
   PASS — Inter (wide) + line-height 1.7 cascade into the SVG labels.

2. **Reproduce the clip + prove the CSS fix on the real SVG** (harness, content-file SVG with `<br/>`).
   ```
   CURRENT (.prose p / Inter):  CLIPS 10/10 labels overflow  [27>24, 82>72, 82>72, 163>144, 82>72, 109>96, 82>72, 54>48, 27>24, 82>72]
   FIX  (scoped label CSS):     OK    0/10
   ```
   PASS — matches the user's screenshot; the CSS fix clears it on a single-`<br/>` SVG.

3. **Find the second cause — diff content-file SVG vs the deployed page SVG.**
   ```
   IDENTICAL: False
   CONTENT: …Power-on / reset<br />65816 in 6502-emulation mode (E=1)</p>
   LIVE:    …Power-on / reset<br></br>65816 in 6502-emulation mode (E=1)</p>
   live svg <br></br> count: 9
   ```
   PASS — the deployed SVG has `<br></br>` (double break); the content source has `<br />`.

4. **Isolate the line-break fix on the live SVG** (with the deployed CSS fix applied).
   ```
   A deployed-as-is (<br></br> + font-fix):  overflow 8/10
   B single <br>            (font-fix):       overflow 0/10
   C </p><p> split          (font-fix):       overflow 0/10
   ```
   PASS — eliminating the double-break is required; `</p><p>` clears it.

5. **Prove `</p><p>` survives the real Astro build** (edit content, `pnpm build`, measure the built page).
   ```
   br forms in content file after: (none)
   <br></br> count in dist/docs/snes-bootup/index.html: 0
   BUILT page overflow (real pipeline + deployed CSS): 0/10
   ```
   PASS — rehype no longer doubles anything; built page is clean.

6. **Whole-site rebuild — no doubling anywhere.**
   ```
   18 page(s) built — Complete!
   ✓ zero <br></br> across all built docs
   ```
   PASS.

7. **Live production after v0.1.65** (cache-busted fetch from `https://indri.studio/docs/snes-bootup/`).
   ```
   live page <br></br> count: 0
   fix CSS present: trebuchet ms,arial,Liberation Sans
   LIVE production overflow: 0/10
   ```
   PASS — fix is live; every formerly-clipped line ("…mode (E=1)", "…PPU force-blank",
   "…the soft stack at $2000") is fully visible (see screenshot in the session).

## Follow-ups / not done

- **PDF + release-bundled docs** render via a *different* path (`md-to-html.sh` in
  `../python-tui-lib`, used by `../llvm-mos-65816/dev/build-release-docs.sh`), not the
  Astro pipeline. They may or may not share the `<br></br>` / font issue — unverified.
  The `scripts/sync-65816-docs.sh` `</p><p>` change does **not** touch that path. Check
  a generated `.pdf` before assuming it's clean.
- **Cross-OS font residual.** The label text "65816 in 6502-emulation mode (E=1)" sits
  right at the 200px foreignObject wrap boundary. The fix pins an Arial-width stack
  (`trebuchet ms, arial, Liberation Sans, sans-serif`) that matches mermaid.ink's
  server bake on Linux/Windows/Mac; `verdana` was deliberately dropped (wide, installed
  on Mac/Windows). If a future label is added that's even tighter, prefer shorter label
  text over relying on the wrap margin.
