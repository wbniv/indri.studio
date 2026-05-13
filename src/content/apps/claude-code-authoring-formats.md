---
title: Claude Code Authoring Formats
date: 2026-05-13
summary: Type-aware rendering for Claude Code authoring formats — memory, skill, subagent, slash command.
draft: false
screenshots:
  - { src: "/screenshots/claude-code-authoring-formats/memory.png", alt: "Memory card — charcoal, brain glyph" }
  - { src: "/screenshots/claude-code-authoring-formats/skill.png", alt: "Skill card — warm umber, crossed hammer-and-wrench glyph" }
  - { src: "/screenshots/claude-code-authoring-formats/subagent.png", alt: "Subagent card — deep purple, detective-with-magnifier glyph" }
  - { src: "/screenshots/claude-code-authoring-formats/slash-command.png", alt: "Slash command card — forest green, keyboard glyph" }
---

A typographic rendering system for Claude Code's four authoring formats — **memory**, **skill**, **subagent**, and **slash command** — emitted by `md-to-pdf.sh` from any plain Markdown file with frontmatter.

Each format gets its own colour identity, glyph, and chrome, so a document's type is legible at a glance before you read a word: charcoal brains for memories, warm umber tools for skills, deep purple sleuths for subagents, forest green keys for slash commands.

<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin: 2.5rem 0;">
  <img src="/screenshots/claude-code-authoring-formats/memory.png" alt="Memory card" style="margin: 0; max-width: 100%; height: auto;" />
  <img src="/screenshots/claude-code-authoring-formats/skill.png" alt="Skill card" style="margin: 0; max-width: 100%; height: auto;" />
  <img src="/screenshots/claude-code-authoring-formats/subagent.png" alt="Subagent card" style="margin: 0; max-width: 100%; height: auto;" />
  <img src="/screenshots/claude-code-authoring-formats/slash-command.png" alt="Slash command card" style="margin: 0; max-width: 100%; height: auto;" />
</div>

## How it works

`scripts/md-to-pdf.sh` reads a Markdown file's YAML frontmatter, detects its authoring type from a small set of signals (`type:` for memories, `description:` plus a `Skills/` path for skills, `model:` for subagents, `argument-hint:` or `allowed-tools:` for slash commands), and emits a self-contained HTML render with a typed card stamped above the prose. The same script handles inline image resolution, raster resizing, and produces output a browser can print to PDF.

The card layout — a large glyph on the left, a stack of `key · value` rows on the right — stays constant across types and across styles. Only the colour palette, glyph, and surrounding chrome change.

## Styles

A single environment variable swaps the entire visual treatment without touching the source file:

- **Themed per type** (shown above) — each authoring format owns its colour.
- **Manuscript** — no card, editorial hairline rules, small-caps keys.
- **Spec sheet** — API-reference table, right-aligned mono keys.
- **Trading card** — full-bleed glyph, soft shadow, hero proportions.
- **Brutalist** — black slab, inverted glyph, hard-offset shadow.
- **Newspaper** — Georgia masthead, byline-style attribution.
- **Postage stamp** — cream paper, perforated border, sepia plate.

…and the [Claude Design](https://claude.ai/) bundle of thirteen further directions (Arcane Codex, Holo Foil ID, Hearthstone Gem, NIN Industrial, Blade Runner, Caravaggio, Modern Minimalist, Modern Maximalist, Future Minimalist, and more) — each implementable in pure CSS over the same HTML emission.

## Where it lives

Part of the shared `python-tui-lib` toolchain at `~/SRC/python-tui-lib/`. Drop the script into any project, point it at a Markdown file, set `FRONTMATTER_STYLE=<name>`, and ship a PDF that knows what kind of document it is.
