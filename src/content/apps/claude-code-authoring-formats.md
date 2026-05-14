---
title: Claude Code Authoring Formats
date: 2026-05-13
summary: Type-aware rendering for Claude Code authoring formats — memory, skill, subagent, slash command.
draft: false
storeLinks:
  github: "#"
screenshots: []
---

A typographic rendering system for Claude Code's four authoring formats — **memory**, **skill**, **subagent**, and **slash command** — emitted by `md-to-pdf.sh` from any plain Markdown file with frontmatter.

Each format gets its own colour identity, glyph, and chrome, so a document's type is legible at a glance before you read a word: charcoal brains for memories, warm umber tools for skills, deep purple sleuths for subagents, forest green keys for slash commands.

## How it works

`scripts/md-to-pdf.sh` reads a Markdown file's YAML frontmatter, detects its authoring type from a small set of signals (`type:` for memories, `description:` plus a `Skills/` path for skills, `model:` for subagents, `argument-hint:` or `allowed-tools:` for slash commands), and emits a self-contained HTML render with a typed card stamped above the prose. The same script handles inline image resolution, raster resizing, and produces output a browser can print to PDF.

The card layout — a large glyph on the left, a stack of `key · value` rows on the right — stays constant across types and across styles. Only the colour palette, glyph, and surrounding chrome change.

## Styles

A single environment variable — `FRONTMATTER_STYLE=<name>` — swaps the entire visual treatment without touching the source Markdown. Fifteen directions are bundled, ported from a [Claude Design](https://claude.ai/design) handoff and implemented as self-contained CSS packs (a few use inline-SVG mask glyphs; the painterly ones use SVG `feTurbulence` for procedural texture). Each pack defines its own per-type palette, typography, and chrome — the underlying HTML emission is identical across all of them.

Below: each of the fifteen rendered against one of the four authoring formats. Click any tile to open it full-size — then **← →** moves between styles, **↑ ↓** between formats (memory · skill · subagent · slash command).

<style>
  .fm-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin: 2rem 0; }
  .fm-grid button { background: none; border: 0; padding: 0; margin: 0; text-align: left; cursor: zoom-in; color: inherit; font: inherit; }
  .fm-grid button:focus-visible { outline: 2px solid currentColor; outline-offset: 4px; }
  .fm-grid img { margin: 0; width: 100%; height: auto; border-radius: 4px; display: block; transition: transform 0.15s ease; }
  .fm-grid button:hover img { transform: scale(1.02); }
  .fm-grid figcaption { font-size: 0.85rem; opacity: 0.7; margin-top: 0.3rem; }
  dialog#fm-lightbox { margin: auto; padding: 2rem; border: 0; background: transparent; color: var(--color-on-background, #f5f0e8); max-width: 92vw; max-height: 92vh; }
  dialog#fm-lightbox::backdrop { background: rgba(61, 56, 51, 0.97); backdrop-filter: blur(4px); }
  dialog#fm-lightbox figure { margin: 0; display: flex; flex-direction: column; align-items: center; gap: 1rem; }
  dialog#fm-lightbox img { display: block; max-width: 88vw; max-height: 70vh; width: auto; height: auto; object-fit: contain; border-radius: 4px; box-shadow: 0 24px 60px rgba(0,0,0,0.5); }
  dialog#fm-lightbox figcaption { font-size: 0.95rem; color: rgba(245,240,232,0.85); text-align: center; max-width: 70ch; line-height: 1.5; padding: 0 1rem; }
  dialog#fm-lightbox .fm-close,
  dialog#fm-lightbox .fm-nav { position: fixed; background: rgba(245,240,232,0.1); color: rgba(245,240,232,0.95); border: 1px solid rgba(245,240,232,0.25); border-radius: 999px; width: 2.75rem; height: 2.75rem; font-size: 1.4rem; cursor: pointer; line-height: 1; display: flex; align-items: center; justify-content: center; }
  dialog#fm-lightbox .fm-close { top: 1.5rem; right: 1.5rem; }
  dialog#fm-lightbox .fm-prev { left: 1.5rem; top: 50%; transform: translateY(-50%); }
  dialog#fm-lightbox .fm-next { right: 1.5rem; top: 50%; transform: translateY(-50%); }
  dialog#fm-lightbox .fm-up { top: 1.5rem; left: 50%; transform: translateX(-50%); }
  dialog#fm-lightbox .fm-down { bottom: 4rem; left: 50%; transform: translateX(-50%); }
  dialog#fm-lightbox .fm-close:hover,
  dialog#fm-lightbox .fm-nav:hover { background: rgba(245,240,232,0.2); }
  dialog#fm-lightbox .fm-hint { position: fixed; bottom: 1.5rem; left: 50%; transform: translateX(-50%); font-size: 0.78rem; letter-spacing: 0.18em; color: rgba(245,240,232,0.5); text-transform: uppercase; text-align: center; }
</style>

<div class="fm-grid">
  <button data-style="a-arcane" data-type="memory" data-title="A · Arcane Codex" data-desc="illuminated-manuscript framing, Cinzel serif, drop-cap medallion, Latin type-words." aria-label="View A · Arcane Codex full-size"><figure><img src="/img/cca-styles/style-a-arcane.png" alt="A · Arcane Codex (memory)" /><figcaption>A · Arcane Codex — illuminated-manuscript framing, Cinzel serif, drop-cap medallion, Latin type-words.</figcaption></figure></button>
  <button data-style="b-holo" data-type="skill" data-title="B · Holo Foil ID" data-desc="cyberpunk security card with conic-gradient holo strip and hex-grid icon panel." aria-label="View B · Holo Foil ID full-size"><figure><img src="/img/cca-styles/style-b-holo-skill.png" alt="B · Holo Foil ID (skill)" /><figcaption>B · Holo Foil ID — cyberpunk security card with conic-gradient holo strip and hex-grid icon panel.</figcaption></figure></button>
  <button data-style="c-gem" data-type="subagent" data-title="C · Hearthstone Gem" data-desc="painterly card, gem-socketed icon, ribbon banner across the top." aria-label="View C · Hearthstone Gem full-size"><figure><img src="/img/cca-styles/style-c-gem-subagent.png" alt="C · Hearthstone Gem (subagent)" /><figcaption>C · Hearthstone Gem — painterly card, gem-socketed icon, ribbon banner across the top.</figcaption></figure></button>
  <button data-style="d-min" data-type="slash-command" data-title="D · Modern Minimalist" data-desc="white card, hairlines, thin-line geometric SVG glyphs, mono ID stamps." aria-label="View D · Modern Minimalist full-size"><figure><img src="/img/cca-styles/style-d-min-slash-command.png" alt="D · Modern Minimalist (slash command)" /><figcaption>D · Modern Minimalist — white card, hairlines, thin-line geometric SVG glyphs, mono ID stamps.</figcaption></figure></button>
  <button data-style="e-max" data-type="memory" data-title="E · Modern Maximalist" data-desc="cream paper, saturated icon panel with circular wax seal, hard offset shadow." aria-label="View E · Modern Maximalist full-size"><figure><img src="/img/cca-styles/style-e-max.png" alt="E · Modern Maximalist (memory)" /><figcaption>E · Modern Maximalist — cream paper, saturated icon panel with circular wax seal, hard offset shadow.</figcaption></figure></button>
  <button data-style="f-future" data-type="skill" data-title="F · Future Minimalist" data-desc="pastel gradient card, glassy thin borders, large radii, fintech-quiet." aria-label="View F · Future Minimalist full-size"><figure><img src="/img/cca-styles/style-f-future-skill.png" alt="F · Future Minimalist (skill)" /><figcaption>F · Future Minimalist — pastel gradient card, glassy thin borders, large radii, fintech-quiet.</figcaption></figure></button>
  <button data-style="g-editorial" data-type="subagent" data-title="G · Editorial Riso" data-desc="tinted pastel card with halftone overlay, blob icon panel, italic Instrument Serif." aria-label="View G · Editorial Riso full-size"><figure><img src="/img/cca-styles/style-g-editorial-subagent.png" alt="G · Editorial Riso (subagent)" /><figcaption>G · Editorial Riso — tinted pastel card with halftone overlay, blob icon panel, italic Instrument Serif.</figcaption></figure></button>
  <button data-style="h-mondrian" data-type="slash-command" data-title="H · Mondriaan" data-desc="primaries on bright white with thick black grid lines drawn as gaps on black." aria-label="View H · Mondriaan full-size"><figure><img src="/img/cca-styles/style-h-mondrian-slash-command.png" alt="H · Mondriaan (slash command)" /><figcaption>H · Mondriaan — primaries on bright white with thick black grid lines drawn as gaps on black.</figcaption></figure></button>
  <button data-style="i-nin" data-type="memory" data-title="I · NIN Industrial" data-desc="deep black with chromatic-aberration display titles, hazard chevrons, scratch noise." aria-label="View I · NIN Industrial full-size"><figure><img src="/img/cca-styles/style-i-nin.png" alt="I · NIN Industrial (memory)" /><figcaption>I · NIN Industrial — deep black with chromatic-aberration display titles, hazard chevrons, scratch noise.</figcaption></figure></button>
  <button data-style="j-bladerunner" data-type="skill" data-title="J · Blade Runner" data-desc="smoky amber haze, per-type neon, CJK kanji watermark, ESPER icon panel." aria-label="View J · Blade Runner full-size"><figure><img src="/img/cca-styles/style-j-bladerunner-skill.png" alt="J · Blade Runner (skill)" /><figcaption>J · Blade Runner — smoky amber haze, per-type neon, CJK kanji watermark, ESPER icon panel.</figcaption></figure></button>
  <button data-style="k-caravaggio" data-type="subagent" data-title="K · Caravaggio" data-desc="velvet-black tenebrism, single warm light, gilt-framed icon niche, Italian italics." aria-label="View K · Caravaggio full-size"><figure><img src="/img/cca-styles/style-k-caravaggio-subagent.png" alt="K · Caravaggio (subagent)" /><figcaption>K · Caravaggio — velvet-black tenebrism, single warm light, gilt-framed icon niche, Italian italics.</figcaption></figure></button>
  <button data-style="l-vangogh" data-type="slash-command" data-title="L · Van Gogh" data-desc="each type as a painting (Starry Night, Sunflowers, Irises, Wheatfield), handwritten captions." aria-label="View L · Van Gogh full-size"><figure><img src="/img/cca-styles/style-l-vangogh-slash-command.png" alt="L · Van Gogh (slash command)" /><figcaption>L · Van Gogh — each type as a painting (Starry Night, Sunflowers, Irises, Wheatfield), handwritten captions.</figcaption></figure></button>
  <button data-style="m-ukiyoe" data-type="memory" data-title="M · Ukiyo-e" data-desc="washi paper, woodblock motifs, vertical kanji, red hanko seals, Shippori Mincho." aria-label="View M · Ukiyo-e full-size"><figure><img src="/img/cca-styles/style-m-ukiyoe.png" alt="M · Ukiyo-e (memory)" /><figcaption>M · Ukiyo-e — washi paper, woodblock motifs, vertical kanji, red hanko seals, Shippori Mincho.</figcaption></figure></button>
  <button data-style="n-miro" data-type="skill" data-title="N · Joan Miró · Constel·lacions" data-desc="cream paper, primary colours, biomorphic blob, Catalan titles." aria-label="View N · Joan Miró full-size"><figure><img src="/img/cca-styles/style-n-miro-skill.png" alt="N · Joan Miró (skill)" /><figcaption>N · Joan Miró · Constel·lacions — cream paper, primary colours, biomorphic blob, Catalan titles.</figcaption></figure></button>
  <button data-style="o-picasso" data-type="subagent" data-title="O · Pablo Picasso · Cubismo" data-desc="fractured planes, mask-like glyph, period stamp, &ldquo;Picasso.&rdquo; signature." aria-label="View O · Pablo Picasso full-size"><figure><img src="/img/cca-styles/style-o-picasso-subagent.png" alt="O · Pablo Picasso (subagent)" /><figcaption>O · Pablo Picasso · Cubismo — fractured planes, mask-like glyph, period stamp, &ldquo;Picasso.&rdquo; signature.</figcaption></figure></button>
</div>

<dialog id="fm-lightbox" aria-label="Style preview">
  <button class="fm-nav fm-up" type="button" aria-label="Previous authoring format">▲</button>
  <button class="fm-nav fm-prev" type="button" aria-label="Previous style">‹</button>
  <button class="fm-nav fm-next" type="button" aria-label="Next style">›</button>
  <button class="fm-nav fm-down" type="button" aria-label="Next authoring format">▼</button>
  <button class="fm-close" type="button" aria-label="Close preview">×</button>
  <figure>
    <img alt="" />
    <figcaption></figcaption>
  </figure>
  <div class="fm-hint">← → style · ↑ ↓ format · Esc to close</div>
</dialog>

<script data-astro-rerun>
  (function() {
    const dlg = document.getElementById('fm-lightbox');
    if (!dlg) return;
    const img = dlg.querySelector('img');
    const cap = dlg.querySelector('figcaption');
    const closeBtn = dlg.querySelector('.fm-close');
    const prevBtn = dlg.querySelector('.fm-prev');
    const nextBtn = dlg.querySelector('.fm-next');
    const upBtn = dlg.querySelector('.fm-up');
    const downBtn = dlg.querySelector('.fm-down');
    const buttons = Array.from(document.querySelectorAll('.fm-grid button[data-style]'));
    const TYPES = ['memory', 'skill', 'subagent', 'slash-command'];
    const TYPE_LABEL = { memory: 'memory', skill: 'skill', subagent: 'subagent', 'slash-command': 'slash command' };
    let styleIdx = -1;
    let typeIdx = 0;
    let opener = null;

    function urlFor(style, type, full) {
      const suffix = full ? '-full' : '';
      const typePart = type === 'memory' ? '' : `-${type}`;
      return `/img/cca-styles/style-${style}${typePart}${suffix}.png`;
    }

    function render() {
      if (styleIdx < 0) return;
      const btn = buttons[styleIdx];
      const style = btn.dataset.style;
      const type = TYPES[typeIdx];
      img.src = urlFor(style, type, true);
      img.alt = `${btn.dataset.title} (${TYPE_LABEL[type]})`;
      cap.textContent = `${btn.dataset.title} · ${TYPE_LABEL[type]} — ${btn.dataset.desc}`;
      if (!dlg.open && typeof dlg.showModal === 'function') dlg.showModal();
    }

    function step(dStyle, dType) {
      if (styleIdx < 0) return;
      if (dStyle) styleIdx = (styleIdx + dStyle + buttons.length) % buttons.length;
      if (dType) typeIdx = (typeIdx + dType + TYPES.length) % TYPES.length;
      render();
    }

    buttons.forEach((btn, idx) => {
      btn.addEventListener('click', () => {
        opener = btn;
        styleIdx = idx;
        typeIdx = TYPES.indexOf(btn.dataset.type);
        if (typeIdx < 0) typeIdx = 0;
        render();
      });
    });
    closeBtn.addEventListener('click', () => dlg.close());
    prevBtn.addEventListener('click', () => step(-1, 0));
    nextBtn.addEventListener('click', () => step(1, 0));
    upBtn.addEventListener('click', () => step(0, -1));
    downBtn.addEventListener('click', () => step(0, 1));

    dlg.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1, 0); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); step(1, 0); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); step(0, -1); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); step(0, 1); }
    });

    dlg.addEventListener('click', (e) => {
      if (e.target === dlg) dlg.close();
    });

    dlg.addEventListener('close', () => {
      styleIdx = -1;
      if (opener && typeof opener.focus === 'function') opener.focus();
      img.removeAttribute('src');
    });
  })();
</script>

## Where it lives

Part of the shared `python-tui-lib` toolchain at `~/SRC/python-tui-lib/`. Drop the script into any project, point it at a Markdown file, set `FRONTMATTER_STYLE=<name>`, and ship a PDF that knows what kind of document it is.
