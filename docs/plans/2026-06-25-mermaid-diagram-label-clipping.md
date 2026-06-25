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
