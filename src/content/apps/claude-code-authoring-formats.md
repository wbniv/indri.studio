---
title: Claude Code Authoring Formats
date: 2026-05-13
summary: Type-aware rendering for Claude Code authoring formats — memory, skill, subagent, slash command.
draft: false
screenshots: []
---

A typographic rendering system for Claude Code's four authoring formats — **memory**, **skill**, **subagent**, and **slash command** — emitted by `md-to-pdf.sh` from any plain Markdown file with frontmatter.

Each format gets its own colour identity, glyph, and chrome, so a document's type is legible at a glance before you read a word: charcoal brains for memories, warm umber tools for skills, deep purple sleuths for subagents, forest green keys for slash commands.

## How it works

`scripts/md-to-pdf.sh` reads a Markdown file's YAML frontmatter, detects its authoring type from a small set of signals (`type:` for memories, `description:` plus a `Skills/` path for skills, `model:` for subagents, `argument-hint:` or `allowed-tools:` for slash commands), and emits a self-contained HTML render with a typed card stamped above the prose. The same script handles inline image resolution, raster resizing, and produces output a browser can print to PDF.

The card layout — a large glyph on the left, a stack of `key · value` rows on the right — stays constant across types and across styles. Only the colour palette, glyph, and surrounding chrome change.

## Styles

A single environment variable — `FRONTMATTER_STYLE=<name>` — swaps the entire visual treatment without touching the source Markdown. Thirteen directions are bundled, ported from a [Claude Design](https://claude.ai/design) handoff and implemented as self-contained CSS packs (a few use inline-SVG mask glyphs; the painterly ones use SVG `feTurbulence` for procedural texture). Each pack defines its own per-type palette, typography, and chrome — the underlying HTML emission is identical across all of them.

Below: the same memory file rendered against each of the thirteen.

<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin: 2rem 0;">
  <figure style="margin: 0;"><img src="/screenshots/claude-code-authoring-formats/style-a-arcane.png" alt="A · Arcane Codex" style="margin: 0; width: 100%; height: auto; border-radius: 4px;" /><figcaption style="font-size: 0.85rem; opacity: 0.7; margin-top: 0.3rem;">A · Arcane Codex — illuminated-manuscript framing, Cinzel serif, drop-cap medallion, Latin type-words.</figcaption></figure>
  <figure style="margin: 0;"><img src="/screenshots/claude-code-authoring-formats/style-b-holo.png" alt="B · Holo Foil ID" style="margin: 0; width: 100%; height: auto; border-radius: 4px;" /><figcaption style="font-size: 0.85rem; opacity: 0.7; margin-top: 0.3rem;">B · Holo Foil ID — cyberpunk security card with conic-gradient holo strip and hex-grid icon panel.</figcaption></figure>
  <figure style="margin: 0;"><img src="/screenshots/claude-code-authoring-formats/style-c-gem.png" alt="C · Hearthstone Gem" style="margin: 0; width: 100%; height: auto; border-radius: 4px;" /><figcaption style="font-size: 0.85rem; opacity: 0.7; margin-top: 0.3rem;">C · Hearthstone Gem — painterly card, gem-socketed icon, ribbon banner across the top.</figcaption></figure>
  <figure style="margin: 0;"><img src="/screenshots/claude-code-authoring-formats/style-d-min.png" alt="D · Modern Minimalist" style="margin: 0; width: 100%; height: auto; border-radius: 4px;" /><figcaption style="font-size: 0.85rem; opacity: 0.7; margin-top: 0.3rem;">D · Modern Minimalist — white card, hairlines, thin-line geometric SVG glyphs, mono ID stamps.</figcaption></figure>
  <figure style="margin: 0;"><img src="/screenshots/claude-code-authoring-formats/style-e-max.png" alt="E · Modern Maximalist" style="margin: 0; width: 100%; height: auto; border-radius: 4px;" /><figcaption style="font-size: 0.85rem; opacity: 0.7; margin-top: 0.3rem;">E · Modern Maximalist — cream paper, saturated icon panel with circular wax seal, hard offset shadow.</figcaption></figure>
  <figure style="margin: 0;"><img src="/screenshots/claude-code-authoring-formats/style-f-future.png" alt="F · Future Minimalist" style="margin: 0; width: 100%; height: auto; border-radius: 4px;" /><figcaption style="font-size: 0.85rem; opacity: 0.7; margin-top: 0.3rem;">F · Future Minimalist — pastel gradient card, glassy thin borders, large radii, fintech-quiet.</figcaption></figure>
  <figure style="margin: 0;"><img src="/screenshots/claude-code-authoring-formats/style-g-editorial.png" alt="G · Editorial Riso" style="margin: 0; width: 100%; height: auto; border-radius: 4px;" /><figcaption style="font-size: 0.85rem; opacity: 0.7; margin-top: 0.3rem;">G · Editorial Riso — tinted pastel card with halftone overlay, blob icon panel, italic Instrument Serif.</figcaption></figure>
  <figure style="margin: 0;"><img src="/screenshots/claude-code-authoring-formats/style-h-mondrian.png" alt="H · Mondrian Composition" style="margin: 0; width: 100%; height: auto; border-radius: 4px;" /><figcaption style="font-size: 0.85rem; opacity: 0.7; margin-top: 0.3rem;">H · Mondrian — primaries on bright white with thick black grid lines drawn as gaps on black.</figcaption></figure>
  <figure style="margin: 0;"><img src="/screenshots/claude-code-authoring-formats/style-i-nin.png" alt="I · NIN Industrial" style="margin: 0; width: 100%; height: auto; border-radius: 4px;" /><figcaption style="font-size: 0.85rem; opacity: 0.7; margin-top: 0.3rem;">I · NIN Industrial — deep black with chromatic-aberration display titles, hazard chevrons, scratch noise.</figcaption></figure>
  <figure style="margin: 0;"><img src="/screenshots/claude-code-authoring-formats/style-j-bladerunner.png" alt="J · Blade Runner" style="margin: 0; width: 100%; height: auto; border-radius: 4px;" /><figcaption style="font-size: 0.85rem; opacity: 0.7; margin-top: 0.3rem;">J · Blade Runner — smoky amber haze, per-type neon, CJK kanji watermark, ESPER icon panel.</figcaption></figure>
  <figure style="margin: 0;"><img src="/screenshots/claude-code-authoring-formats/style-k-caravaggio.png" alt="K · Caravaggio" style="margin: 0; width: 100%; height: auto; border-radius: 4px;" /><figcaption style="font-size: 0.85rem; opacity: 0.7; margin-top: 0.3rem;">K · Caravaggio — velvet-black tenebrism, single warm light, gilt-framed icon niche, Italian italics.</figcaption></figure>
  <figure style="margin: 0;"><img src="/screenshots/claude-code-authoring-formats/style-l-vangogh.png" alt="L · Van Gogh" style="margin: 0; width: 100%; height: auto; border-radius: 4px;" /><figcaption style="font-size: 0.85rem; opacity: 0.7; margin-top: 0.3rem;">L · Van Gogh — each type as a painting (Starry Night, Sunflowers, Irises, Wheatfield), handwritten captions.</figcaption></figure>
  <figure style="margin: 0;"><img src="/screenshots/claude-code-authoring-formats/style-m-ukiyoe.png" alt="M · Ukiyo-e" style="margin: 0; width: 100%; height: auto; border-radius: 4px;" /><figcaption style="font-size: 0.85rem; opacity: 0.7; margin-top: 0.3rem;">M · Ukiyo-e — washi paper, woodblock motifs, vertical kanji, red hanko seals, Shippori Mincho.</figcaption></figure>
</div>

## Where it lives

Part of the shared `python-tui-lib` toolchain at `~/SRC/python-tui-lib/`. Drop the script into any project, point it at a Markdown file, set `FRONTMATTER_STYLE=<name>`, and ship a PDF that knows what kind of document it is.
