# Astro 7 migration (Sätteri pipeline)

## Status — PLANNED (not started)

Deferred modernisation chosen alongside the contained Mermaid fix (user: "ship
contained now, plan 7 later"). The contained fix (build-done SVG injection, v0.1.66)
is live and sufficient; this plan is the cleaner long-term pipeline upgrade.

## Why

1. **Pipeline modernisation.** Astro 7 ([astro.build/blog/astro-7](https://astro.build/blog/astro-7))
   makes **Sätteri** (native Rust: pulldown-cmark + Oxc) the default markdown pipeline,
   replacing the JS unified/remark-rehype stack. Faster builds; the old JS pipeline was
   often the slowest build phase.
2. **It removes the inline-SVG corruption at the source.** The Mermaid spill
   (`2026-06-25-mermaid-diagram-label-clipping.md`) is rehype-raw re-serialising inline
   `<svg>`+`<foreignObject>`. CommonMark passes **raw HTML blocks through verbatim**, and
   Sätteri (pulldown-cmark) is CommonMark — so inline SVG should survive **uncorrupted**,
   which would make `src/mermaid-inject-integration.mjs` **removable**. (Verify before
   deleting it — see V2.)

## The catch — it's not a drop-in

- Major bump (6.1.9 → 7.x): regression risk across the Fonts API, `inlineStylesheets`,
  the www→apex Worker, and the Lighthouse threshold gates.
- On Astro 7 default (Sätteri), **remark/rehype plugins are not included**. Staying on
  the deprecated `unified()` path keeps `rehypeExternalLinks` working **but reproduces the
  SVG bug** — so to get the benefit we must *adopt* Sätteri and **port
  `rehypeExternalLinks`** (the `data-external` ↗-glyph marker) to a Sätteri HAST plugin.

## Plan

1. Branch + bump `astro` to 7.x; run the official codemod / [upgrade guide](https://docs.astro.build/en/guides/upgrade-to/v7/).
2. Adopt the Sätteri pipeline (default). Do **not** fall back to `unified()` (it keeps the
   bug).
3. Port `rehypeExternalLinks` → a Sätteri HAST plugin that adds `target/rel` +
   `data-external` to external `<a>` (the prose CSS keys off `data-external`).
4. Revert the Mermaid carriage to plain inline SVG in `sync-65816-docs.sh` (drop the
   base64 attribute) **iff** V2 passes; then delete `mermaid-inject-integration.mjs` and
   its `astro.config` registration.
5. Keep the `.mermaid-diagram` label CSS in `[...slug].astro` (the Inter-font clip is
   independent of the pipeline).
6. **Also fix the stale `sync-65816-docs.sh` manifest** (it references the deleted
   `wt/321-snes-hwref` branch from the worktree consolidation, which currently breaks
   `task sync-docs`) — point the consolidated docs at `main`. This is independent of the
   Astro bump but blocks regenerating docs; do it here or sooner.

## Verification (fill when executed)

1. `pnpm build` succeeds on Astro 7; all 18 pages build.
2. **Inline SVG survives verbatim** — rebuild snes-bootup with plain inline SVG (no
   integration): `dist/.../snes-bootup/index.html` has exactly one `<svg id="mermaid-svg">`,
   one `<g class="nodes">`, no `<br></br>`, and no `<g>`/label text after `</svg></div>`.
   Served page: full diagram, no clip, no spilled prose. (If this fails, **keep** the
   integration.)
3. External links still render the ↗ glyph (`data-external` present) and open in a new tab.
4. `task lighthouse` — Phase-5 threshold gate (≥ 95) still green; CLS budget (≤ 0.05) holds.
5. www→apex redirect + sitemap unaffected.

## Risks / rollback

Tag-driven deploy means rollback = re-deploy a prior tag (`workflow_dispatch` on an old
`v*`). Land behind a branch + full Lighthouse run before tagging.
