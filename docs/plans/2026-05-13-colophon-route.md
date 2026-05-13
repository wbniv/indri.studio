# Colophon route — `/colophon`

## Context

A **colophon** is the traditional "how this was made" page — the technical/craft notes about typography, palette, stack, and acknowledgments. Indri.studio doesn't have one yet. Two reasons to add one:

- A studio site benefits from showing its craft. The colophon is where the brand fingerprint gets to be intentional rather than hidden.
- It's a natural home for the design-system fingerprint that currently lives only in `CLAUDE.md` and `docs/plans/2026-05-13-initial-buildout.md`: the Phosphor purple accent, the ring-tailed-lemur grey palette, the stripe motif, the Space Grotesk + Inter pairing.

Energy match: bold-display sectional one-pager (Hoox rhythm), same uppercase `.section-label` cadence as the homepage. Not a wall of text.

## Approach

Single static page at `/colophon`, rendering through `Base.astro` (same as homepage and apps). Sectional layout: hero block + 6 content sections separated by the existing `.section-label` styling.

**Section order** (final): hero → SET IN → PALETTE → BUILT WITH → MOTIFS → REFERENCES. The ordering walks from craft details (type, palette, stack) into brand identity (motifs, references). The mascot itself doesn't get a dedicated section — it lives in `Base.astro` directly above the footer, so it sign-offs **every page** on the site (homepage, app pages, colophon).

No new components required. Reuses:

- `<Base>` layout (which already provides the header, footer, transition wiring, and brand tokens)
- Display typography via `font-display` + `text-primary-container`
- `.section-label`, `.glass-card`, `.app-card-title` patterns already defined in `src/styles/global.css`

**Hookup**: add a `colophon` link to the footer. Footer currently has only the wordmark and `© year`; this is its first navigation. Use the same `font-display uppercase text-[10px] tracking-[0.3em]` typography that the copyright row already uses, so the link reads as part of the existing footer rhythm.

## Content sketch

### Hero

- Display heading: **COLOPHON** (uppercase, Space Grotesk Black, `text-primary-container` purple, same scale as the homepage hero's `for everyone.` line — `text-3xl sm:text-4xl md:text-5xl`)
- Pull-quote underneath (left-border, same `.border-l-2 border-primary-container pl-6` treatment as the homepage):

  > Greys, neon purple, a ring-tailed lemur, and the open web. Here's how it's built.

### SET IN

Four-item list with `◯` Phosphor ring bullets:

- Display headlines, the wordmark, and section labels are set in [**Space Grotesk**](https://fonts.google.com/specimen/Space+Grotesk) by [Florian Karsten](https://floriankarsten.com) (2018, open-source via [GitHub](https://github.com/floriankarsten/space-grotesk)), weights 300–700. A proportional-width descendant of Colophon Foundry's [**Space Mono**](https://fonts.google.com/specimen/Space+Mono) (2016) — it keeps Space Mono's geometric quirks but widens the letterforms for prose use. No italics (Space Grotesk has none); emphasis is carried by weight and uppercasing instead.
- Body copy and UI are set in [**Inter**](https://fonts.google.com/specimen/Inter) by [Rasmus Andersson](https://rsms.me) (2016, open-source), weights 300–600. Inter is screen-optimized: it ships [tabular figures](https://rsms.me/inter/#features/tnum), contextual alternates, and a sister face [**Inter Display**](https://rsms.me/inter/#display) tuned for larger sizes (not currently in use here — Space Grotesk handles display).
- Icons are drawn from [**Material Symbols Outlined**](https://fonts.google.com/icons) by [Google](https://design.google) — a variable icon font with continuous weight, fill, and optical-size axes. Used sparingly; the rest of the UI furniture is hand-built in CSS.
- Both faces are served via [Google Fonts](https://fonts.google.com); preconnect hints to `fonts.googleapis.com` and `fonts.gstatic.com` are emitted from the base layout to keep the type weight from blocking first paint.

### PALETTE

A warm-tinted grey scale evoking the body and tail rings of *[Lemur catta](https://en.wikipedia.org/wiki/Ring-tailed_lemur)* (the ring-tailed lemur), against a single phosphor-bright purple accent.

Swatches rendered inline as small squares pulling their background from the live CSS custom properties — editing `src/styles/global.css` updates this page automatically.

- **Phosphor** &nbsp;`#B026FF`&nbsp; · &nbsp;`oklch(0.62 0.32 305)`
  
  The single accent colour. Picked from a brief of five neon-purple candidates ("Ultraviolet" `#6600FF`, "Electric violet" `#7300FF`, "Hot purple" `#A020F0`, **Phosphor** `#B026FF`, "Magenta-purple" `#CB00FF`) tested against the dark-grey ground for legibility and energy. Used for the header band, the wordmark's small square mark, hover glows on app cards, link colour, and the uppercase `.section-label` tags throughout the site.

- **Ringtail greys** (warm-tinted, light → dark):
  - `grey-50` &nbsp;`#F5F0E8`&nbsp; · &nbsp;`oklch(0.95 0.01 80)` — cream, high-emphasis text
  - `grey-200` &nbsp;`#C8C0B8`&nbsp; · &nbsp;`oklch(0.78 0.01 70)` — soft warm grey, secondary text
  - `grey-400` &nbsp;`#8E8780`&nbsp; · &nbsp;`oklch(0.58 0.01 70)` — mid grey, low-contrast dividers
  - `grey-700` &nbsp;`#4A4641`&nbsp; · &nbsp;`oklch(0.30 0.01 60)` — charcoal, card surfaces (`--color-surface-container`)
  - `grey-900` &nbsp;`#2B2723`&nbsp; · &nbsp;`oklch(0.15 0.01 60)` — page background (`--color-surface`)
  - `grey-1000` &nbsp;`#1A1815`&nbsp; · &nbsp;`oklch(0.08 0.01 60)` — pitch, footer base and deepest accents

### BUILT WITH

Each tool on its own line, prefixed by a `▌` Phosphor-coloured bullet (the stripe motif applied to UI furniture):

- The site is generated by [**Astro 6**](https://astro.build) — a content-driven static site generator that compiles to plain HTML+CSS+JS with minimal client-side runtime. Pages live as `.astro` files, content (apps, team) as Markdown in content collections. Cross-page navigation uses Astro's [**ClientRouter**](https://docs.astro.build/en/guides/view-transitions/) for view transitions; persistent elements (header, footer) survive page changes.
- Styling is [**Tailwind CSS v4**](https://tailwindcss.com) using its CSS-first configuration — palette tokens, type scales, and breakpoints all declared in `@theme` blocks rather than a JS config. Custom properties registered via [`@property`](https://developer.mozilla.org/en-US/docs/Web/CSS/@property) where they need to animate (the scroll-driven header shrink is one).
- Hosted on [**Cloudflare Workers + Static Assets**](https://developers.cloudflare.com/workers/static-assets/).
- Full Cloudflare configuration (zone, custom-domain bindings, redirect rules, API tokens) declared in [**Terraform**](https://www.terraform.io).
- Secrets live in [**AWS SSM Parameter Store**](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html).
- Build and deploy run through [**GitHub Actions**](https://github.com/features/actions).
- Package manager is [**pnpm**](https://pnpm.io).

### MOTIFS

The ring-tailed lemur isn't pictured anywhere on the site, but its body shows up structurally. Each motif name prefixed by a `◯` Phosphor ring (echoing the ring-flare motif itself):

- **Stripes**. Pinstripe page backgrounds drift slowly across the page on two independent timelines (drift + rotation); section dividers alternate `grey-900 ↔ grey-700` bands; app-card hover states draw a thin accent line along the bottom edge. The tail abstracted into UI furniture.
- **Header breathe**. The Phosphor-purple header band carries a slow radial-gradient pulse — `screen` blended over the band, opacity oscillating across a 2.5-second cycle. Quiet ambient motion; off under `prefers-reduced-motion: reduce`.
- **Ring-flare** (homepage only). Sparse Phosphor-coloured rings expand and fade across the studio front, set to a long randomised cadence. Off on per-app pages so each app's brand has room.

### REFERENCES

The visual anchor for this site is [**Hoox**](https://landingfolio.com/inspiration/hoox) (now offline; preserved in the [landingfolio.com](https://landingfolio.com) archive). Hoox set the rhythm: dark theme, single bold accent, content-rich sectional layout — each section a distinct visual card rather than generic columns. [**clerk.com**](https://clerk.com) is the live, currently-shipping reference for the same DNA. The pixel-grid motion vocabulary comes from [**droneland.au**](https://droneland.au).

### Mascot (site-wide, in Base.astro)

The mascot lives in `Base.astro` directly above the footer rather than as a section on the colophon. Effect: the lemur signs off **every page** — homepage, app pages, colophon — as the visual closer before the footer band.

Asset: `public/mascot-lemur.png` — a stylised ring-tailed lemur with neon purple eyes, tail looped above its head. Rendered at 1536×1024 intrinsic (3:2). Centered, capped at `max-w-sm`, lazy-loaded, with no caption (the lemur stands on its own).

Footer micro-note (optional): a place line if you want one — e.g. *"Built in Bangkok."* Not a hard requirement.

## Files

| File | Change |
|---|---|
| `src/pages/colophon.astro` | **New.** `<Base title="colophon">` wrapper. Hero block + 5 sections in this order: `SET IN`, `PALETTE`, `BUILT WITH`, `MOTIFS`, `REFERENCES`. Wingding bullets per list: `◯` (Phosphor ring) for SET IN and MOTIFS; `▌` (stripe motif, Phosphor) for BUILT WITH. Every external product/typeface/site name rendered as a clickable link to its canonical page. |
| `src/layouts/Base.astro` | (a) Add `colophon` link to the right side of the footer, just before the `© year` span. Same `font-display uppercase text-[10px] tracking-[0.3em]` styling. (b) Add the mascot image (`public/mascot-lemur.png`) in a centred container directly above the footer — site-wide; appears on every page. |
| `public/mascot-lemur.png` | **New.** Mascot image — stylised ring-tailed lemur with neon purple (Phosphor) eyes, tail looped over head. Intrinsic 1536×1024 (3:2). |

## Verification

`task dev` running on [localhost:4321](http://localhost:4321).

From a fresh hard-refresh on each test:

1. **Direct visit (dev).** Navigate to [localhost:4321/colophon](http://localhost:4321/colophon). All sections render in order: hero with COLOPHON heading and pull-quote, then SET IN → PALETTE → BUILT WITH → MOTIFS → REFERENCES. The mascot image appears just above the footer (lives in Base.astro, not in a section).
2. **Mascot site-wide.** Visit [localhost:4321/](http://localhost:4321/), an [app page](http://localhost:4321/apps/splitledger/), and [/colophon](http://localhost:4321/colophon). Scroll to the bottom of each — the mascot lemur image appears just above the footer on all three.
3. **Footer link.** From [the homepage](http://localhost:4321/), scroll to footer. Click "colophon". Lands on `/colophon` via Astro view transition (the header height animation we just shipped should fire here on the way in too).
4. **Cross-page footer link.** From [/apps/splitledger/](http://localhost:4321/apps/splitledger/), scroll to footer, click "colophon". Same smooth transition; lands on `/colophon`.
5. **Palette swatches reflect actual tokens.** Open DevTools, inspect a swatch — its background should resolve via `var(--color-grey-50)` etc., not be hardcoded. Editing the token in `global.css` should change the swatch.
6. **Every external reference is a clickable link.** Hover each product name in SET IN, BUILT WITH, and REFERENCES — the cursor should change to a pointer and the destination URL should appear in the browser's status bar. Bare unlinked names anywhere = bug.
7. **Mobile width.** Narrow Chrome to 375px. Sections stack cleanly; no horizontal scroll; pull-quote wraps. Mascot image scales down with the viewport.
8. **Reduced motion.** Chrome devtools → Rendering → Emulate `prefers-reduced-motion: reduce`. Page renders fine; no animations.
9. **`task md` preview of this plan.** After writing, run `task md -- docs/plans/2026-05-13-colophon-route.md`.
10. **Production smoke test (post-deploy).** After the next `v*` tag deploys, visit [https://indri.studio/colophon](https://indri.studio/colophon). Page resolves with valid TLS, all sections render, every external link in the page works. Same check on [https://www.indri.studio/colophon](https://www.indri.studio/colophon) — should 301 to the apex.

After all pass, commit the plan + the route together.
