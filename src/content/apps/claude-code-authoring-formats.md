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

Below: the same memory file rendered against each of the fifteen. Click any tile to open it full-size.

<style>
  .fm-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin: 2rem 0; }
  .fm-grid button { background: none; border: 0; padding: 0; margin: 0; text-align: left; cursor: zoom-in; color: inherit; font: inherit; }
  .fm-grid button:focus-visible { outline: 2px solid currentColor; outline-offset: 4px; }
  .fm-grid img { margin: 0; width: 100%; height: auto; border-radius: 4px; display: block; transition: transform 0.15s ease; }
  .fm-grid button:hover img { transform: scale(1.02); }
  .fm-grid figcaption { font-size: 0.85rem; opacity: 0.7; margin-top: 0.3rem; }
  dialog#fm-lightbox { position: fixed; inset: 0; width: 100vw; height: 100vh; max-width: 100vw; max-height: 100vh; padding: 2rem 4rem 5rem 4rem; border: 0; background: transparent; color: var(--color-on-background, #f5f0e8); display: flex; align-items: center; justify-content: center; box-sizing: border-box; }
  dialog#fm-lightbox::backdrop { background: rgba(61, 56, 51, 0.96); backdrop-filter: blur(6px); }
  dialog#fm-lightbox figure { margin: 0; display: flex; flex-direction: column; align-items: center; gap: 1rem; max-width: 100%; max-height: 100%; }
  dialog#fm-lightbox img { max-width: 100%; max-height: calc(100vh - 12rem); width: auto; height: auto; object-fit: contain; border-radius: 4px; box-shadow: 0 24px 60px rgba(0,0,0,0.5); }
  dialog#fm-lightbox figcaption { font-size: 0.95rem; color: rgba(245,240,232,0.8); text-align: center; max-width: 70ch; line-height: 1.5; padding: 0 1rem; flex-shrink: 0; }
  dialog#fm-lightbox .fm-close,
  dialog#fm-lightbox .fm-nav { position: fixed; top: 50%; transform: translateY(-50%); background: rgba(245,240,232,0.1); color: rgba(245,240,232,0.95); border: 1px solid rgba(245,240,232,0.25); border-radius: 999px; width: 2.75rem; height: 2.75rem; font-size: 1.4rem; cursor: pointer; line-height: 1; display: flex; align-items: center; justify-content: center; }
  dialog#fm-lightbox .fm-close { top: 1.5rem; right: 1.5rem; transform: none; }
  dialog#fm-lightbox .fm-prev { left: 1.5rem; }
  dialog#fm-lightbox .fm-next { right: 1.5rem; }
  dialog#fm-lightbox .fm-close:hover,
  dialog#fm-lightbox .fm-nav:hover { background: rgba(245,240,232,0.2); }
  dialog#fm-lightbox .fm-hint { position: fixed; bottom: 1.5rem; left: 50%; transform: translateX(-50%); font-size: 0.78rem; letter-spacing: 0.18em; color: rgba(245,240,232,0.5); text-transform: uppercase; }
</style>

<div class="fm-grid">
  <button data-full="/screenshots/claude-code-authoring-formats/style-a-arcane-full.png" data-cap="A · Arcane Codex — illuminated-manuscript framing, Cinzel serif, drop-cap medallion, Latin type-words." aria-label="View A · Arcane Codex full-size"><figure><img src="/screenshots/claude-code-authoring-formats/style-a-arcane.png" alt="A · Arcane Codex" /><figcaption>A · Arcane Codex — illuminated-manuscript framing, Cinzel serif, drop-cap medallion, Latin type-words.</figcaption></figure></button>
  <button data-full="/screenshots/claude-code-authoring-formats/style-b-holo-full.png" data-cap="B · Holo Foil ID — cyberpunk security card with conic-gradient holo strip and hex-grid icon panel." aria-label="View B · Holo Foil ID full-size"><figure><img src="/screenshots/claude-code-authoring-formats/style-b-holo.png" alt="B · Holo Foil ID" /><figcaption>B · Holo Foil ID — cyberpunk security card with conic-gradient holo strip and hex-grid icon panel.</figcaption></figure></button>
  <button data-full="/screenshots/claude-code-authoring-formats/style-c-gem-full.png" data-cap="C · Hearthstone Gem — painterly card, gem-socketed icon, ribbon banner across the top." aria-label="View C · Hearthstone Gem full-size"><figure><img src="/screenshots/claude-code-authoring-formats/style-c-gem.png" alt="C · Hearthstone Gem" /><figcaption>C · Hearthstone Gem — painterly card, gem-socketed icon, ribbon banner across the top.</figcaption></figure></button>
  <button data-full="/screenshots/claude-code-authoring-formats/style-d-min-full.png" data-cap="D · Modern Minimalist — white card, hairlines, thin-line geometric SVG glyphs, mono ID stamps." aria-label="View D · Modern Minimalist full-size"><figure><img src="/screenshots/claude-code-authoring-formats/style-d-min.png" alt="D · Modern Minimalist" /><figcaption>D · Modern Minimalist — white card, hairlines, thin-line geometric SVG glyphs, mono ID stamps.</figcaption></figure></button>
  <button data-full="/screenshots/claude-code-authoring-formats/style-e-max-full.png" data-cap="E · Modern Maximalist — cream paper, saturated icon panel with circular wax seal, hard offset shadow." aria-label="View E · Modern Maximalist full-size"><figure><img src="/screenshots/claude-code-authoring-formats/style-e-max.png" alt="E · Modern Maximalist" /><figcaption>E · Modern Maximalist — cream paper, saturated icon panel with circular wax seal, hard offset shadow.</figcaption></figure></button>
  <button data-full="/screenshots/claude-code-authoring-formats/style-f-future-full.png" data-cap="F · Future Minimalist — pastel gradient card, glassy thin borders, large radii, fintech-quiet." aria-label="View F · Future Minimalist full-size"><figure><img src="/screenshots/claude-code-authoring-formats/style-f-future.png" alt="F · Future Minimalist" /><figcaption>F · Future Minimalist — pastel gradient card, glassy thin borders, large radii, fintech-quiet.</figcaption></figure></button>
  <button data-full="/screenshots/claude-code-authoring-formats/style-g-editorial-full.png" data-cap="G · Editorial Riso — tinted pastel card with halftone overlay, blob icon panel, italic Instrument Serif." aria-label="View G · Editorial Riso full-size"><figure><img src="/screenshots/claude-code-authoring-formats/style-g-editorial.png" alt="G · Editorial Riso" /><figcaption>G · Editorial Riso — tinted pastel card with halftone overlay, blob icon panel, italic Instrument Serif.</figcaption></figure></button>
  <button data-full="/screenshots/claude-code-authoring-formats/style-h-mondrian-full.png" data-cap="H · Mondrian — primaries on bright white with thick black grid lines drawn as gaps on black." aria-label="View H · Mondrian full-size"><figure><img src="/screenshots/claude-code-authoring-formats/style-h-mondrian.png" alt="H · Mondrian" /><figcaption>H · Mondrian — primaries on bright white with thick black grid lines drawn as gaps on black.</figcaption></figure></button>
  <button data-full="/screenshots/claude-code-authoring-formats/style-i-nin-full.png" data-cap="I · NIN Industrial — deep black with chromatic-aberration display titles, hazard chevrons, scratch noise." aria-label="View I · NIN Industrial full-size"><figure><img src="/screenshots/claude-code-authoring-formats/style-i-nin.png" alt="I · NIN Industrial" /><figcaption>I · NIN Industrial — deep black with chromatic-aberration display titles, hazard chevrons, scratch noise.</figcaption></figure></button>
  <button data-full="/screenshots/claude-code-authoring-formats/style-j-bladerunner-full.png" data-cap="J · Blade Runner — smoky amber haze, per-type neon, CJK kanji watermark, ESPER icon panel." aria-label="View J · Blade Runner full-size"><figure><img src="/screenshots/claude-code-authoring-formats/style-j-bladerunner.png" alt="J · Blade Runner" /><figcaption>J · Blade Runner — smoky amber haze, per-type neon, CJK kanji watermark, ESPER icon panel.</figcaption></figure></button>
  <button data-full="/screenshots/claude-code-authoring-formats/style-k-caravaggio-full.png" data-cap="K · Caravaggio — velvet-black tenebrism, single warm light, gilt-framed icon niche, Italian italics." aria-label="View K · Caravaggio full-size"><figure><img src="/screenshots/claude-code-authoring-formats/style-k-caravaggio.png" alt="K · Caravaggio" /><figcaption>K · Caravaggio — velvet-black tenebrism, single warm light, gilt-framed icon niche, Italian italics.</figcaption></figure></button>
  <button data-full="/screenshots/claude-code-authoring-formats/style-l-vangogh-full.png" data-cap="L · Van Gogh — each type as a painting (Starry Night, Sunflowers, Irises, Wheatfield), handwritten captions." aria-label="View L · Van Gogh full-size"><figure><img src="/screenshots/claude-code-authoring-formats/style-l-vangogh.png" alt="L · Van Gogh" /><figcaption>L · Van Gogh — each type as a painting (Starry Night, Sunflowers, Irises, Wheatfield), handwritten captions.</figcaption></figure></button>
  <button data-full="/screenshots/claude-code-authoring-formats/style-m-ukiyoe-full.png" data-cap="M · Ukiyo-e — washi paper, woodblock motifs, vertical kanji, red hanko seals, Shippori Mincho." aria-label="View M · Ukiyo-e full-size"><figure><img src="/screenshots/claude-code-authoring-formats/style-m-ukiyoe.png" alt="M · Ukiyo-e" /><figcaption>M · Ukiyo-e — washi paper, woodblock motifs, vertical kanji, red hanko seals, Shippori Mincho.</figcaption></figure></button>
  <button data-full="/screenshots/claude-code-authoring-formats/style-n-miro-full.png" data-cap="N · Joan Miró · Constel·lacions — cream paper, primary colours, biomorphic blob icon, Caveat cursive titles, Catalan/French captions." aria-label="View N · Joan Miró full-size"><figure><img src="/screenshots/claude-code-authoring-formats/style-n-miro.png" alt="N · Joan Miró" /><figcaption>N · Joan Miró · Constel·lacions — cream paper, primary colours, biomorphic blob, Catalan titles.</figcaption></figure></button>
  <button data-full="/screenshots/claude-code-authoring-formats/style-o-picasso-full.png" data-cap="O · Pablo Picasso · Cubismo — fractured cubist planes, mask-like glyph, Spanish titling, period stamp, “Picasso.” signature." aria-label="View O · Pablo Picasso full-size"><figure><img src="/screenshots/claude-code-authoring-formats/style-o-picasso.png" alt="O · Pablo Picasso" /><figcaption>O · Pablo Picasso · Cubismo — fractured planes, mask-like glyph, period stamp, “Picasso.” signature.</figcaption></figure></button>
</div>

<dialog id="fm-lightbox" aria-label="Style preview">
  <button class="fm-nav fm-prev" type="button" aria-label="Previous style">‹</button>
  <button class="fm-nav fm-next" type="button" aria-label="Next style">›</button>
  <button class="fm-close" type="button" aria-label="Close preview">×</button>
  <figure>
    <img alt="" />
    <figcaption></figcaption>
  </figure>
  <div class="fm-hint">← → to navigate · Esc to close</div>
</dialog>

<script>
  (function() {
    const dlg = document.getElementById('fm-lightbox');
    if (!dlg) return;
    const img = dlg.querySelector('img');
    const cap = dlg.querySelector('figcaption');
    const closeBtn = dlg.querySelector('.fm-close');
    const prevBtn = dlg.querySelector('.fm-prev');
    const nextBtn = dlg.querySelector('.fm-next');
    const buttons = Array.from(document.querySelectorAll('.fm-grid button[data-full]'));
    let currentIdx = -1;
    let opener = null;

    function open(idx) {
      currentIdx = idx;
      const btn = buttons[idx];
      if (!btn) return;
      img.src = btn.dataset.full;
      img.alt = btn.querySelector('img')?.alt || '';
      cap.textContent = btn.dataset.cap || '';
      if (!dlg.open && typeof dlg.showModal === 'function') dlg.showModal();
    }

    function step(delta) {
      if (currentIdx < 0) return;
      const next = (currentIdx + delta + buttons.length) % buttons.length;
      open(next);
    }

    buttons.forEach((btn, idx) => {
      btn.addEventListener('click', () => { opener = btn; open(idx); });
    });
    closeBtn.addEventListener('click', () => dlg.close());
    prevBtn.addEventListener('click', () => step(-1));
    nextBtn.addEventListener('click', () => step(1));

    dlg.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    });

    dlg.addEventListener('click', (e) => {
      // Backdrop click — the click target is the dialog element itself.
      if (e.target === dlg) dlg.close();
    });

    dlg.addEventListener('close', () => {
      currentIdx = -1;
      if (opener && typeof opener.focus === 'function') opener.focus();
      img.removeAttribute('src');
    });
  })();
</script>

## Where it lives

Part of the shared `python-tui-lib` toolchain at `~/SRC/python-tui-lib/`. Drop the script into any project, point it at a Markdown file, set `FRONTMATTER_STYLE=<name>`, and ship a PDF that knows what kind of document it is.
