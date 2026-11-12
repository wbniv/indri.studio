# Fix Mermaid diagram label clipping + spill on /docs/ pages

## Status — DONE + DEPLOYED (2026-06-25, v0.1.66)

Reported via screenshots of `indri.studio/docs/snes-bootup/`: first the node boxes
**clipped** the last line of multi-line labels, then (after a partial fix) every
label was **duplicated as plain prose below the diagram** (the "spill"). Two distinct
root causes; both fixed and verified. Final state: full diagram, no clip, no spill.

This was a long investigation with several wrong turns (recorded under *Dead ends*
so the next person doesn't repeat them).

## Context

`scripts/sync-65816-docs.sh` pre-renders each ```` ```mermaid ```` fence to SVG via
the mermaid.ink API at build time and embeds it in `src/content/docs/<slug>.md`.
The doc page (`src/pages/docs/[...slug].astro`) renders that markdown into
`<div class="prose">`. Only **snes-bootup** actually has a diagram. Introduced in
`2fc4c17`.

## Root cause — two independent causes

1. **Clip — Inter-font cascade.** `.prose :global(p)` sets `font-family: var(--font-body)`
   (= **Inter**, wider than mermaid's baked `trebuchet/verdana/arial` stack) and
   `line-height:1.7`. mermaid's labels are HTML `<p>` inside `<foreignObject>` with the
   box height baked at render time, so the inherited Inter/1.7 reflows them taller/wider
   than the box → `foreignObject` clips the overflow.

2. **Spill — rehype foster-parenting of inline SVG.** The SVG was embedded as inline
   markup in the markdown. Astro's `rehype-raw` round-trip **re-serialises** it: it
   doubles `<br/>` → `<br></br>` (two breaks → more clipping) and, decisively,
   **foster-parents the `<g class="nodes">` group out of the `<svg>`** into the prose,
   so every node label renders twice — once in its box, once as stray body text. The
   *pristine* mermaid.ink SVG is well-formed and renders cleanly inline; only the rehype
   re-serialisation corrupts it. A user `rehypePlugin` can't intercept it because **Astro
   runs user `rehypePlugins` before its internal `rehype-raw`** (confirmed: the plugin
   sees the diagram as an unparsed `raw` node, not an element).

## The fix

- **Cause 1 — CSS** (`src/pages/docs/[...slug].astro`, `f945cf3`, v0.1.64): scope the
  mermaid labels back to an Arial-width stack + `line-height:1.5` + `margin:0`.
- **Cause 2 — don't put SVG markup in the markdown** (`39a4947`, v0.1.66):
  - `sync-65816-docs.sh` embeds the SVG as **base64 in a `data-mermaid-b64` attribute**
    on an empty `<div class="mermaid-diagram">`. Attribute values pass through rehype
    verbatim, untouched.
  - A new **`astro:build:done` integration** (`src/mermaid-inject-integration.mjs`)
    decodes it and writes the pristine SVG straight into the built `.html`, bypassing
    rehype. The browser then parses mermaid.ink's exact bytes. No client JS, static.

## Files changed

| File | Commit | What |
|---|---|---|
| `src/pages/docs/[...slug].astro` | `f945cf3` | scoped `.mermaid-diagram` label CSS (clip) |
| `scripts/sync-65816-docs.sh` | `39a4947` | emit `<div data-mermaid-b64="…">` instead of inline SVG |
| `src/mermaid-inject-integration.mjs` | `39a4947` | `astro:build:done` — decode + inject pristine SVG |
| `astro.config.mjs` | `39a4947` | register the integration |
| `src/content/docs/snes-bootup.md` | `39a4947` | regenerated to the base64-div form |

Deploys: v0.1.64 (`f945cf3`, CSS) → ~~v0.1.65 (`b5d8929`, `</p><p>` — wrong, see Dead
ends)~~ → **v0.1.66 (`39a4947`, integration)**.

## Verification

1. **Pristine SVG is fine; rehype is the corruptor.** Pristine mermaid.ink SVG inline
   in a plain HTML doc: `<br></br>`=0, no foster-parented `<g>`. Through Astro's rehype:
   `<br/>`→`<br></br>` and a `<g class="nodes">` appears as a sibling of the diagram div.
   PASS — the SVG is good; the pipeline breaks it.

2. **Plugin ordering proves a user rehype plugin can't fix it.** A debug rehype plugin
   reports the diagram as `raw:1, div:0` — i.e. still an unparsed raw node when user
   plugins run (before rehype-raw). PASS — must bypass rehype, not plug into it.

3. **Clean build with base64-div + integration.**
   ```
   [mermaid-inject] injected 1 diagram(s) across 1 page(s)
   dist/docs/snes-bootup/index.html:  <svg id="mermaid-svg">=1  <g class="nodes">=1
   "Power-on / reset"=1   text after </svg></div> = "<p><code>.init.*</code> fragments…"
   ```
   PASS — one SVG, one nodes group, each label once, clean prose after the diagram.

4. **Served page (real CSS + Inter).** `pnpm preview` + headless screenshot of
   `/docs/snes-bootup/`: full diagram, every multi-line label intact (no clip), and
   clean article prose below the diagram (no duplicated labels). PASS.

5. **Live production after v0.1.66.** (recorded on deploy) — HTTP 200, fix present,
   diagram clean.

## Dead ends (do not retry)

- **`</p><p>` line-split (v0.1.65, `b5d8929`).** Replacing `<br/>` with `</p><p>` fixed
  the clip but made the spill *worse* (each line its own foster-parented paragraph). The
  spill was never about `<br>`.
- **`htmlLabels:false`.** mermaid.ink drops node text (only edge labels render) — unusable.
- **PNG render.** Rejected by user (loses crisp vector + selectable text + a11y).
- **`</p><p>` etc.** (above) — chasing the line-break, not the round-trip.

**Correction (the commit message `39a4947` got this wrong):** I initially claimed Astro
7 / Sätteri "wouldn't help." It *would* — see below. The foster-parenting is rehype
**corrupting the SVG at build time** (re-serialisation → malformed static HTML), NOT the
browser parsing a pristine SVG. Proof: the integration writes the pristine SVG into the
static HTML and the served/live pages render clean. So any approach that lands pristine
SVG in the static HTML works — the build-done integration **or** a verbatim-passthrough
pipeline (Sätteri).
- **Misreads:** an early "minimal is clean" was a bad probe (counted `<g>` only / a phrase
  that also appears in prose / matched the probe's own `<script>` literal). And the
  snes-bootup content file had accumulated a *stray inline SVG* across debug iterations —
  the regenerate in `39a4947` removed it. Ground truth came from screenshots, not probes.

## Follow-ups

- **`task sync-docs` is broken** — its manifest references the deleted `wt/321-snes-hwref`
  branch (from the worktree consolidation). Re-syncing all docs is blocked until the
  manifest points the consolidated docs at `main`. Tracked in TODO.
- **Astro 7 / Sätteri migration** — `docs/plans/2026-06-25-astro-7-migration.md`. Its
  verbatim raw-HTML handling would let inline SVG survive uncorrupted, making the
  build-done integration **removable** (simpler). Verify the verbatim claim during the
  migration before deleting the integration.
- **Dev mode** — the integration runs on `astro build` only, so `astro dev` shows an empty
  diagram box (production is correct). Acceptable; revisit if dev preview of diagrams is
  needed (a tiny client-side DOMParser hydrator would cover dev).

## Verification (2026-11-12)

Question: does the PDF / release-bundled docs path (`md-to-html.sh` → headless Chrome, used by `llvm-mos-65816/dev/build-release-docs.sh`) show the same `<br></br>` double-break / label-clip as the Astro web path? Only `snes-bootup` has a Mermaid diagram (`grep -c mermaid public/docs/*.md` → 1 for `snes-bootup.md`, 0 for the other five), so it is the only diagram on this path.

Setup note: the `llvm-mos-65816` checkout lives on `/run/media/will/worktrees`, which is not mounted today (`/home/will/llvm/llvm-mos-65816` is a dangling symlink), so `build-release-docs.sh` could not run as written. Its two steps were replayed by hand on a copy of `public/docs/snes-bootup.md` (the raw source that `sync-65816-docs.sh` snapshots) with all output in the scratchpad. Differences from the script: `MD_TO_HTML_OUT_DIR` points the HTML at the scratchpad, and stderr is left visible (the script sends it to `/dev/null`).

1. **Generate the HTML with `md-to-html.sh`, stderr visible.**
   ```
   $ MD_TO_PDF_NO_OPEN=1 MD_TO_HTML_OUT_DIR=$S/out bash ~/python-tui-lib/scripts/md-to-html.sh $S/in/snes-bootup.md
   Style: n-miro
   $S/out/snes-bootup.html (73 KB)
   ```
   No `Warning: mermaid.ink render failed` line, so the diagram rendered as SVG, not the `<pre>` fallback. PASS.

2. **Inspect the diagram markup in the intermediate HTML.**
   ```
   mermaid-diagram divs: 1
   <svg: 2  <g class="nodes": 1
   literal <br></br>: 0
   diagram block: 21520 bytes; </p><p>: 0  <br></br>: 0  <br />: 9
   foreignObject: 17
   label sample: <span class="nodeLabel "><p>Power-on / reset<br />65816 in 6502-emulation mode (E=1)</p></span>
   after the svg: <p><code>.init.*</code> fragments are emitted into ...
   ```
   Pristine mermaid.ink bytes: single `<br />`, one `<g class="nodes">`, no doubled break, no foster-parented group, clean prose after the diagram. PASS.

3. **Print to PDF with headless Chrome and render page 2 at 80 dpi, then a 160 dpi crop of the first three nodes.**
   ```
   $ ulimit -c 0; systemd-run --user --scope -q -p MemoryMax=4G google-chrome-stable --headless=new --no-sandbox --disable-gpu \
       --no-pdf-header-footer --print-to-pdf=$S/out/snes-bootup.pdf file://$S/out/snes-bootup.html
   216378 bytes written to file .../snes-bootup.pdf
   $ pdfinfo snes-bootup.pdf | grep -E 'Pages|Page size'
   Pages:           7
   Page size:       612 x 792 pts (letter)
   $ pdftoppm -r 80 -f 1 -l 2 -png snes-bootup.pdf pg
   ```
   Chrome crashes (`Trace/breakpoint trap`, rc 133) under `ulimit -v 4000000` because V8 reserves more address space than that, so the 4 GB cap was applied as a cgroup limit (`MemoryMax=4G`) instead. Page 2 ("The whole sequence at a glance") shows all nine nodes. Every multi-line label has a single line break between its parts, for example "Power-on / reset" over "65816 in 6502-emulation mode (E=1)". The longest label (`.init.50`, six lines) sits fully inside its box with margin on all sides. No text touches or crosses a node border, and `pdftotext` finds every label. PASS.

Verdict: PASS, no double break and no label clip on the PDF path. The path never goes through Astro's rehype round-trip, so the `<br/>` → `<br></br>` doubling cannot occur; the Inter-font cascade is also absent because `md-to-html.sh` styles the page itself. The `sync-65816-docs.sh` fix is not needed there.

Residual risks noticed, not defects of the render:

- `build-release-docs.sh` and `sync-65816-docs.sh` both run `md-to-html.sh` with `>/dev/null 2>&1 || true`. If mermaid.ink is down or rejects a diagram, the PDF is still produced with the diagram as a raw code block and no warning is shown.
- `build-release-docs.sh` pins three docs to `wt/321-snes-hwref`, a branch the "Follow-ups" section above says was deleted. Those three rows will be WARNed and skipped until the manifest points at `main`.
