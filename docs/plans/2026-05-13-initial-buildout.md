# Plan: indri.studio — Indri Mobile App Studio Site

## Context

User is building the marketing site for **Indri**, an indie studio publishing multiple apps and games across phones, tablets, and consoles. Domain: **indri.studio**.

The site serves two jobs:

1. **Public face / portfolio** — homepage with overview + gallery of all apps; each app gets its own landing page with store links and screenshots.
2. **Legal home** — privacy policy and terms of service for every app, hosted under that app's URL and styled in that app's identity. Apple/Google/Steam/console store listings link here for the legal requirements.

## Brief

| Dimension | Direction |
|---|---|
| **Domain** | indri.studio |
| **Apps** | 6 ready: ParkingSpace, World Foundry, SplitLedger, Finding Your Way, Gustos Colores, Pinball Construction Set. More coming. |
| **Platforms** | Mixed: phone only, phone + tablet, console, possibly Mac/web/Windows |
| **Aesthetic** | **Hoox-like**: dark theme + single bold accent colour, bold sans-serif typography, content-rich sectional one-pager. Expressive marketing energy, not restrained. |
| **Screenshots** | Centrepiece. Multiple aspect ratios (phone portrait, tablet, console 16:9). |
| **Motion** | Subtle, in 1–2 zones of homepage background. NOT full-bleed motion. On dark, a faint accent-coloured pixel grid drifting works well. |
| **Tech** | Tailwind CSS v4 (confirmed) |

User explicitly ruled out earlier "professional/boring/white" framing — disregard those notes if revisited.

## Reference sites

### Primary visual reference: **Hoox** (user's own find)

The aesthetic anchor: dark + bright single accent (lime green for Hoox — Indri picks its own), bold sans-serif type, content-rich sectional rhythm (hero → reasons-grid → graph/proof → testimonial → case studies → comparison table → FAQ → final CTA). The site is offline now; the captured screenshot lives in `landingfolio.com`'s archive.

What to borrow from Hoox specifically:
- Confident single-accent palette on dark; the accent does heavy lifting
- Bold display type; tight line-height; large headlines
- Each section a distinct "card" with its own internal layout — not generic columns
- Photography of people / product UI used as content, not decoration
- Comparison-table / "vs" section as a structural element
- Testimonials with portraits, final CTA — sections that earn their place (FAQ accordion not borrowed; see note under "Sectional rhythm to borrow from Hoox")

### Closest analog from the recommended set: **clerk.com** ⭐ (user's favourite)

Same DNA as Hoox: dark + bold purple accent + content-rich + bold typography + sectional rhythm. **Achievable with code + screenshots alone** — no cinematic photography or motion-graphics budget needed. Use clerk.com as the live, currently-shipping reference to triangulate Hoox patterns against modern execution.

### Indri studio brand: greys + neon purple (the ringtail lens)

The Indri studio brand draws from the ring-tailed lemur — soft greys in stripe gradations + one vivid pop of **neon purple**. **Stripes are a recurring motif** in the studio chrome (section dividers, pixel-grid motion bands, hover treatments) — the lemur's tail showing up in the UI furniture.

**Grey palette** (warm-tinted, light → dark, mimics ringtail body + tail rings):

| Token | Hex | oklch | Use |
|---|---|---|---|
| `--grey-50` | `#F5F0E8` | `oklch(0.95 0.01 80)` | Pale cream — high-emphasis text on dark, occasional accents |
| `--grey-200` | `#C8C0B8` | `oklch(0.78 0.01 70)` | Soft warm grey — secondary text |
| `--grey-400` | `#8E8780` | `oklch(0.58 0.01 70)` | Mid grey — muted text, low-contrast dividers |
| `--grey-700` | `#3D3833` | `oklch(0.30 0.01 60)` | Charcoal — card surfaces |
| `--grey-900` | `#1A1815` | `oklch(0.15 0.01 60)` | Near-black — primary page background |
| `--grey-1000` | `#0A0908` | `oklch(0.08 0.01 60)` | Pitch — deepest-contrast surfaces |

**Neon purple accent — pick one** (rendered on Indri's `--grey-900` background, the actual context of use):

<table style="width:100%; border-collapse:collapse; background:#3D3833; margin:1em 0;">
<tr>
<td style="padding:24px 12px; text-align:center; color:#F5F0E8; font-family:monospace; background:#3D3833;">
<div style="width:96px; height:96px; background:#6600FF; border-radius:8px; margin:0 auto; box-shadow:0 0 16px rgba(102,0,255,0.4);"></div>
<div style="margin-top:12px; font-size:14px;"><b>Ultraviolet</b><br>#6600FF</div>
<div style="margin-top:8px; font-size:11px; color:#8E8780;">deepest<br>"tech serious"</div>
</td>
<td style="padding:24px 12px; text-align:center; color:#F5F0E8; font-family:monospace; background:#3D3833;">
<div style="width:96px; height:96px; background:#7300FF; border-radius:8px; margin:0 auto; box-shadow:0 0 16px rgba(115,0,255,0.4);"></div>
<div style="margin-top:12px; font-size:14px;"><b>Electric violet</b><br>#7300FF</div>
<div style="margin-top:8px; font-size:11px; color:#8E8780;">cyber<br>blue-leaning</div>
</td>
<td style="padding:24px 12px; text-align:center; color:#F5F0E8; font-family:monospace; background:#3D3833;">
<div style="width:96px; height:96px; background:#A020F0; border-radius:8px; margin:0 auto; box-shadow:0 0 16px rgba(160,32,240,0.4);"></div>
<div style="margin-top:12px; font-size:14px;"><b>Hot purple</b><br>#A020F0</div>
<div style="margin-top:8px; font-size:11px; color:#8E8780;">classic neon<br>balanced</div>
</td>
<td style="padding:24px 12px; text-align:center; color:#F5F0E8; font-family:monospace; background:#3D3833; border:2px solid #B026FF;">
<div style="width:96px; height:96px; background:#B026FF; border-radius:8px; margin:0 auto; box-shadow:0 0 20px rgba(176,38,255,0.6);"></div>
<div style="margin-top:12px; font-size:14px;"><b>Phosphor ⭐</b><br>#B026FF</div>
<div style="margin-top:8px; font-size:11px; color:#B026FF;">synthwave bright<br>RECOMMENDED</div>
</td>
<td style="padding:24px 12px; text-align:center; color:#F5F0E8; font-family:monospace; background:#3D3833;">
<div style="width:96px; height:96px; background:#CB00FF; border-radius:8px; margin:0 auto; box-shadow:0 0 16px rgba(203,0,255,0.4);"></div>
<div style="margin-top:12px; font-size:14px;"><b>Magenta-purple</b><br>#CB00FF</div>
<div style="margin-top:8px; font-size:11px; color:#8E8780;">magenta-leaning<br>almost pink</div>
</td>
</tr>
</table>

| Name | Hex | oklch |
|---|---|---|
| Ultraviolet | `#6600FF` | `oklch(0.46 0.36 290)` |
| Electric violet | `#7300FF` | `oklch(0.50 0.34 295)` |
| Hot purple | `#A020F0` | `oklch(0.55 0.30 305)` |
| **Phosphor** ⭐ | `#B026FF` | `oklch(0.62 0.32 305)` |
| Magenta-purple | `#CB00FF` | `oklch(0.62 0.34 315)` |

**Recommendation: Phosphor `#B026FF`** — best balance of "unmistakably neon purple" + legibility on dark grey. Runners-up: Electric violet (cooler, more serious), Hot purple (classic neon). Decide visually by rendering a CTA + heading in each on the live `--grey-900` background.

**Stripe motif applications**:
- Section dividers as alternating bands `--grey-900` ↔ `--grey-700` (subtle, low contrast)
- Pixel-grid motion arranged in **horizontal stripe rows** — alternate cell density / opacity between rows; occasional neon-purple cells flicker across as accents (this *is* the ringtail tail, abstracted into motion)
- App-gallery card hover: thin striped accent line along the bottom edge
- Optional: ringtail-tail-inspired loading indicator — alternating dashes, drifting

### Secondary references (still useful, different facets)

- **supabase.com** — dark + green; useful for multi-product navigation patterns
- **resend.com** — dark + orange gradient; useful for gradient treatments
- **vercel.com** — dark + sharp; useful for typography precision

### Long-term aspiration (not for v1)

- **annapurnainteractive.com** — game-publisher portfolio with cinematic energy. **Not reachable for v1** — needs game trailers, professional photography, and a content budget Indri doesn't have yet. Revisit once any of the Indri apps (especially World Foundry / Bubba) have shippable trailers and key art.

### Sectional rhythm to borrow from Hoox

- Bold hero statement → "N reasons" or feature grid → screenshot/demo card → metrics/proof → comparison table → testimonials with portraits → FAQ → final CTA.
- For Indri: hero → app gallery → featured screenshots → studio statement → newsletter/contact → CTA ("try our apps").

**FAQ section deliberately dropped from the Indri rhythm** (2026-05-13). The Hoox/clerk.com FAQ pattern fits a single-product landing where users have predictable operational questions (pricing, cancellation, integrations). On a studio-portfolio one-pager, those questions are per-app and belong on the per-app pages (where the privacy/terms/store-link context already lives). The studio-level questions ("who are you", "what are you working on") are softer and handled by the about-statement strip and `/colophon`. Don't re-add at studio root; consider per-app FAQ blocks later if real questions accumulate.

### Visual-texture vocabulary

- **droneland.au** — pixel-grid graphics still useful as the motion texture (faint accent-coloured grid cells in 1–2 zones; not full-bleed).

## Site structure

```
/                                Studio homepage — overview + app gallery + brief team strip
/apps/<slug>/                    Per-app landing page
/apps/<slug>/privacy-policy      Privacy policy in app's style
/apps/<slug>/terms-of-service    Terms of service in app's style
/about                           Studio statement + full team (3–4 founders/employees) — dropped; colophon covers this
```

App-page navigation between adjacent catalogue entries — three-cell breadcrumb (`‹ prev | apps · All apps | next ›`), slide-with-fade view-transition, swipe support on touch, prefetch of neighbours — is its own sub-plan: [`2026-05-13-app-page-transitions.md`](2026-05-13-app-page-transitions.md).

## Aesthetic strategy

| Surface | Branding | Notes |
|---|---|---|
| Studio homepage | Indri brand: dark theme + bold accent colour (TBD, picked at implementation start) | Bold sans-serif type, content-rich sectional structure (Hoox rhythm), subtle motion in 1–2 zones, app gallery as centrepiece. |
| Per-app landing | App's own brand | Each app picks its own palette + typography. Can mirror studio energy or diverge fully — up to the app. |
| Per-app privacy | App brand | Same fonts/colours as the app's landing, long-form readable text. |
| Per-app terms | App brand | Same as privacy. |

The studio carries a strong unified identity (Hoox-like); apps each get their own world.

## Subtle motion (homepage)

For dark theme + bold accent, recommend:

1. **Pixel grid in faint accent colour on dark** (preferred) — cells (~16–24 px) in 5–15 % accent-tinted dark, individual cells slowly drift through opacity / tint on staggered timers. Matches Droneland's actual look transposed to dark. Confined to hero zone and one interior strip.
2. **Drifting accent-coloured gradient blob** — single large radial gradient slowly translating + rotating, low opacity. Resend.com-style.
3. **Particle/dot field in accent** — sparse points slowly drifting; canvas if cell count > a few hundred.

Decide between these during implementation by sketching all three. All approaches:
- Pure CSS where possible; minimal canvas only if needed
- Confined to 1–2 zones (hero band + one interior strip)
- Respect `prefers-reduced-motion: reduce` (static when set)

## Mockups

These are ASCII sketches of the proposed layouts — the visual rhythm and component placement, not the final design. Pixel-grid motion zones marked with `░`.

### 1. Studio homepage — `indri.studio/`

Dark Hoox-style. Bold sans-serif. Subtle pixel-grid motion in hero zone and one interior strip. App gallery is the centrepiece.

```
┌──────────────────────────────────────────────────────────────────────────┐
│  INDRI                            apps   about   contact  [ try one → ]  │
└──────────────────────────────────────────────────────────────────────────┘

   ░ ░░  ░ ░  ░░ ░  ░ ░░  ░  ░ ░ ░ ░  ░░ ░  ░ ░  ░ ░░  ░ ░ ░  ░ ░  ░ ░
    ░  ░ ░  ░ ░ ░  ░  ░ ░  ░ ░  ░ ░  ░ ░ ░  ░ ░  ░  ░ ░ ░  ░ ░ ░ ░  ░

         SOFTWARE
         for everyone.

         We build apps people use every day —
         coloring, bookkeeping, parking, play.

         [   browse our apps  →   ]

   ░ ░ ░  ░  ░ ░  ░  ░ ░ ░  ░ ░  ░ ░ ░  ░  ░ ░  ░ ░  ░ ░ ░  ░  ░ ░

   ─────────────────────────────────────────────────────────────────────
   our apps
   ─────────────────────────────────────────────────────────────────────

   ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
   │ ▣                │  │ ▣                │  │ ▣                │
   │                  │  │                  │  │                  │
   │ SplitLedger      │  │ Gustos Colores   │  │ Finding Your Way │
   │ Split bills,     │  │ Mindful coloring │  │ A hypertext      │
   │ settle accounts. │  │ for grown-ups.   │  │ through Being.   │
   │                  │  │                  │  │                  │
   │ iOS · Droid · Mac│  │ iOS · Droid · Pad│  │ Web · PWA        │
   │              →   │  │              →   │  │              →   │
   └──────────────────┘  └──────────────────┘  └──────────────────┘

   ┌──────────────────┐  ┌──────────────────┐
   │ ▣                │  │ ▣                │
   │                  │  │                  │
   │ ParkingSpace     │  │ World Foundry    │
   │ Arrive, park,    │  │ Build worlds,    │
   │ pay. Done.       │  │ run games.       │
   │                  │  │                  │
   │ Android · Web    │  │ Steam · PC · iOS │
   │              →   │  │              →   │
   └──────────────────┘  └──────────────────┘

   ─────────────────────────────────────────────────────────────────────
   about indri
   ─────────────────────────────────────────────────────────────────────

   Indri is a small studio. We pick problems that matter, ship
   something tight, then come back and make it better.

   ░  ░ ░ ░  ░ ░  ░ ░ ░ ░  ░  ░ ░ ░  ░ ░ ░  ░ ░  ░ ░  ░ ░ ░  ░ ░

   ─────────────────────────────────────────────────────────────────────
   try one
   ─────────────────────────────────────────────────────────────────────

      [ App Store ]   [ Play Store ]   [ Steam ]   [ Mac ]

   ─────────────────────────────────────────────────────────────────────
   indri.studio · privacy · terms · contact · @indri
```

### 2. App landing — `indri.studio/apps/splitledger/` (light brand)

Inherits SplitLedger's "warm fintech" tokens: orange `#f25e0b` + teal `#0e8e6a` + cream `#fbf8f1`, Geist + Fraunces. Bright, calm, money-focused. Note this looks *visually different* from the studio homepage — same site, different brand.

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ← indri      SplitLedger          features  download  privacy  terms    │
└──────────────────────────────────────────────────────────────────────────┘

  Split bills.                       ┌─────────────────────────┐
  Settle accounts.                   │  ▣ SplitLedger          │
  In any currency.                   │  Transactions           │
                                     │  ─────────────────────  │
  SplitLedger keeps track of who     │  M Hua Hin driver       │
  owes whom — across currencies,     │    apr 25  ฿3000        │
  across continents, across years.   │    +$82.67  confirmed   │
                                     │  ─────────────────────  │
  [ App Store ]  [ Play Store ]      │  D Delta airline ticket │
  [ Mac App Store ]  [ Web app ]     │    apr 24  $691.60      │
                                     │              confirmed  │
                                     │  ─────────────────────  │
                                     │  M 205/688 Rent april   │
                                     │    apr 18  ฿7000        │
                                     │    +$219.62  confirmed  │
                                     └─────────────────────────┘

  ──────────────────────────────────────────────────────────────────────
  features
  ──────────────────────────────────────────────────────────────────────

  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
  │  Multi-currency     │  │  Recurring          │  │  Everywhere         │
  │                     │  │                     │  │                     │
  │  THB, USD, EUR.     │  │  Rent, utilities,   │  │  iPhone, Android,   │
  │  Auto-reconcile.    │  │  groceries — once.  │  │  Mac, Web. Synced.  │
  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘

  ──────────────────────────────────────────────────────────────────────
  see it in action
  ──────────────────────────────────────────────────────────────────────

    [phone shot]  [phone shot]  [tablet shot ──────]  [phone shot]

  ──────────────────────────────────────────────────────────────────────
  download
  ──────────────────────────────────────────────────────────────────────

     [ App Store ]   [ Play Store ]   [ Mac App Store ]   [ Web app ]

  ── indri.studio · privacy · terms · all our apps ─────────────────────
```

### 3. App landing — `indri.studio/apps/world-foundry/` (dark brand)

World Foundry's red-on-black industrial palette. Same site, different world. The contrast with SplitLedger is the demonstration of per-app theming.

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ← indri      WORLD FOUNDRY     games  engine  download  privacy  terms  │
└──────────────────────────────────────────────────────────────────────────┘

           ████  ████   ████  █     ████      ┌──────────────────────┐
           █     █  █  █  █   █     █  █      │                      │
           ███   █  █  ████   █     █  █      │  [game screenshot]   │
           █     █  █  █  █   █     █  █      │                      │
           █     ████   █  █  ████  ████      │                      │
                                              │                      │
           BUILD WORLDS.                      │                      │
           RUN GAMES.                         │                      │
           ANYWHERE.                          └──────────────────────┘

           A 3D engine + a game ecosystem.
           Forth-scripted. Cross-platform.

           [ Steam ]  [ App Store ]  [ Play Store ]

  ══════════════════════════════════════════════════════════════════════
  games
  ══════════════════════════════════════════════════════════════════════

  ┌──────────────────────┐  ┌──────────────────────┐
  │  [Bubba screenshot]  │  │  [next game]         │
  │                      │  │                      │
  │  BUBBA               │  │  ...                 │
  │  Pick something tight│  │                      │
  │                  →   │  │                  →   │
  └──────────────────────┘  └──────────────────────┘

  ══════════════════════════════════════════════════════════════════════
  the engine
  ══════════════════════════════════════════════════════════════════════

  • C++17 core, Jolt physics, OpenGL / Metal
  • zForth scripting — levels are tiny, hot-reloadable
  • Linux, Android, iOS, plus desktop builds
  • Open asset pipeline: .lev → .lvl → .iff

  ══════════════════════════════════════════════════════════════════════
  get it
  ══════════════════════════════════════════════════════════════════════

     [ Steam ]   [ App Store ]   [ Play Store ]   [ Itch.io ]

  ══ indri.studio · privacy · terms · all our apps ════════════════════
```

### 4. App landing — `indri.studio/apps/parking-space/` (light Material, functional)

Clean Material light theme, blue/grey functional palette. Thai market — currency, Play Store, web app at motorbike-parking.info.

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ← indri      ParkingSpace          features  download  privacy  terms    │
└──────────────────────────────────────────────────────────────────────────┘

  Arrive.                            ┌──────────────────────────┐
  Park.                              │  ParkingSpace            │
  Pay.                               │                          │
  Done.                              │  History                 │
                                     │  ──────────────────────  │
  Motorbike parking the way it       │  132                     │
  should be — a 30-second            │  Mar 5  6:11 PM   ฿20.00 │
  transaction, no booth, no cash.    │  ──────────────────────  │
                                     │  131                     │
  [ Google Play ]  [ Open web app ]  │  Mar 4  9:22 AM   ฿20.00 │
                                     │                          │
  Operating in Thailand 🇹🇭          │  [Home] [History*] [Me]  │
                                     └──────────────────────────┘

  ──────────────────────────────────────────────────────────────────────
  features
  ──────────────────────────────────────────────────────────────────────

  ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐
  │  Pay as you arrive │  │  Your full history │  │  Operator side too │
  │                    │  │                    │  │                    │
  │  Scan, park, pay.  │  │  Receipts, totals, │  │  Lots, attendants, │
  │  No envelopes, no  │  │  by lot and date.  │  │  daily settlement, │
  │  paper, no booth.  │  │                    │  │  admin dashboard.  │
  └────────────────────┘  └────────────────────┘  └────────────────────┘

  ──────────────────────────────────────────────────────────────────────
  see it in action
  ──────────────────────────────────────────────────────────────────────

    [consumer]   [history]   [operator]   [admin]

  ──────────────────────────────────────────────────────────────────────
  download
  ──────────────────────────────────────────────────────────────────────

     [ Google Play ]   [ motorbike-parking.info ]

  ── indri.studio · privacy · terms · all our apps ─────────────────────
```

### 5. App landing — `indri.studio/apps/finding-your-way/` (parchment, book typography)

Inherits FYW's "digital illuminated manuscript" tokens: parchment `#e8dbc1`, dark sepia text, golden drop caps and CTAs. Reads like a book.

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ← indri      FINDING YOUR WAY        the journey · about · privacy · terms│
└──────────────────────────────────────────────────────────────────────────┘


     ╔════╗
     ║ Y  ║our eyes
     ╚════╝open.

     You are in a temple. Four pillars hold a       ┌──────────────────┐
     shattered dome, revealing the pitch black      │                  │
     of a starless night. Worn paths reveal         │ [page capture:   │
     portions of a beautiful mosaic beneath.        │  intro page with │
                                                    │  drop cap "Y"]   │
     A philosophical hypertext through Love,        │                  │
     Reason, Truth, and God.                        │                  │
                                                    │  ( Proceed → )   │
     ( Begin → )                                    └──────────────────┘


  ──────────────────────────────────────────────────────────────────────
  the journey
  ──────────────────────────────────────────────────────────────────────

      L · LOVE        R · REASON        T · TRUTH        G · GOD

     Four realms. Each asks whether you affirm or deny Being.
     Your accumulated choices unlock one of three endings at the gate.

  ──────────────────────────────────────────────────────────────────────
  features
  ──────────────────────────────────────────────────────────────────────

  ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐
  │  Book typography   │  │  Offline & PWA     │  │  Procedural audio  │
  │                    │  │                    │  │                    │
  │  Drop caps,        │  │  Installable.      │  │  Per-realm ambient │
  │  hanging punctua-  │  │  No account,       │  │  via Web Audio API │
  │  tion, the works.  │  │  no server.        │  │  no asset files.   │
  └────────────────────┘  └────────────────────┘  └────────────────────┘

  ──────────────────────────────────────────────────────────────────────
  begin
  ──────────────────────────────────────────────────────────────────────

     ( Open Finding Your Way → )      runs in any browser. PWA installable.

  ── indri.studio · privacy · terms · all our apps ─────────────────────
```

### 6. App landing — `indri.studio/apps/gustos-colores/` (dark, geometric)

Dark UI shell with cream-card geometric content. The 20+ themed packs are the showcase.

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ← indri      GUSTOS COLORES        packs · download · privacy · terms    │
└──────────────────────────────────────────────────────────────────────────┘

   MINDFUL COLORING                       ┌──────────────────────────┐
   for grown-ups.                         │  Gustos Colores      ⚙   │
                                          │  Starter Pack  19 pages  │
   Twenty-plus themed packs —             │  ──────────────────────  │
   mandalas, stained glass,               │  ╭────────╮  ╭────────╮  │
   cottagecore, queer tarot, gnomes,      │  │ ❀❀❀❀❀ │  │ ▣▣▣▣▣ │  │
   Mexican folk art, Islamic geometric,   │  │ Bloom  │  │ Hex    │  │
   and many more.                         │  ╰────────╯  ╰────────╯  │
                                          │  ╭────────╮  ╭────────╮  │
   Tap to fill. Save your work.           │  │ ◈◈◈◈◈ │  │ ✦✦✦✦✦ │  │
   Sync across all your devices.          │  │ Solar  │  │ Nova   │  │
                                          │  ╰────────╯  ╰────────╯  │
   [ Play Store ]  [ App Store ]          └──────────────────────────┘
   Android · iOS · iPad

  ══════════════════════════════════════════════════════════════════════
  the packs
  ══════════════════════════════════════════════════════════════════════

    mandala         stained glass     mehndi          queer tarot
    cottagecore     gnomes            art nouveau     mexican folk
    mid-century     feline mythos     gothic arch.    islamic geom.
    literary lands. historical maps   ADHD            soft landing
    drag queens     fairy tales       camp kitsch     ... and more

  ══════════════════════════════════════════════════════════════════════
  features
  ══════════════════════════════════════════════════════════════════════

  ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐
  │  Cloud sync       │  │  Phone or tablet  │  │  Share finished   │
  │                   │  │                   │  │                   │
  │  Google Drive,    │  │  7" and 10"       │  │  PNG export,      │
  │  appDataFolder    │  │  optimised, plus  │  │  OS share sheet.  │
  │  scope only.      │  │  phone portrait.  │  │                   │
  └───────────────────┘  └───────────────────┘  └───────────────────┘

  ══════════════════════════════════════════════════════════════════════
  download
  ══════════════════════════════════════════════════════════════════════

     [ Play Store ]   [ App Store ]

  ══ indri.studio · privacy · terms · all our apps ════════════════════
```

### 7. Legal page — `indri.studio/apps/<slug>/privacy-policy` and `/terms`

Inherits app's brand. Long-form markdown. Header anchors the document; body is generated from `privacy-policy.md` / `terms-of-service.md`. Footer links back to the app.

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ← indri      SplitLedger          features  download  privacy  terms    │
└──────────────────────────────────────────────────────────────────────────┘

  Privacy Policy
  ──────────────
  SplitLedger    ·    effective 2026-04-01

  ─────────────────────────────────────────────────────────────────────

  1. What we collect

  We collect the minimum needed to make SplitLedger work for you …

  2. How we use it

  …

  3. Third-party services

  • Google Drive (optional cloud sync) — drive.appDataFolder scope only
  • Apple Sign In — used only to authenticate you
  • Stripe — processes any paid subscription
  …

  ─────────────────────────────────────────────────────────────────────
  ← back to SplitLedger    ·    terms    ·    indri.studio
```

The same template, rendered with `world-foundry`'s frontmatter, would render in red/black/cream with the WORLD FOUNDRY wordmark instead. One template, many worlds.

## Tech

- **Astro** — perfect fit for content-collection-driven multi-page static site. Matches the rapid-raccoon-site precedent.
- **Tailwind CSS v4** — CSS-first config, `@theme` blocks for per-app variable scoping.
- **Per-app theming**: app frontmatter declares brand kit → `AppLayout` writes CSS custom properties → subtree inherits.
- **Markdown for legal text** — privacy and terms per app as `.md`.
- **Hosting**: **Cloudflare Workers + Static Assets**, **fully Terraform-controlled**. The new repo combines:
  - **Astro/Wrangler scaffolding seeded from `~/SRC/rapid-raccoon-site/`** (Astro config, build setup, `wrangler.toml`, Taskfile, package shape) — the actively-replaced predecessor site, already-working pattern.
  - **Terraform IaC layout mirroring `~/SRC/finding-your-way/infrastructure/`** — finding-your-way's `aws/{bootstrap,global,iam-self}` becomes `cloudflare/{bootstrap,global,iam-self}` for indri.studio. Every Cloudflare resource declared in code; nothing manual.
  - Net result: rapid-raccoon's deployment simplicity **plus** finding-your-way's IaC discipline.

  **Terraform owns** (declarative, reproducible):
  - The Cloudflare zone for `indri.studio` (resource or data ref)
  - Workers custom-domain binding (`cloudflare_workers_custom_domain`) for `indri.studio` and `www.indri.studio`
  - Any zone-level config: DNSSEC, cache rules, page rules, redirect rules (esp. the `rapid-raccoon.com → indri.studio` redirect when sunsetting the old domain)
  - Per-project IAM/API token policy (`cloudflare/iam-self/`)
  - TF state in the same S3 backend as other projects (consistency with user's existing convention)

  **Wrangler owns** (the deploy mechanism):
  - Building the Worker and uploading static assets via `wrangler deploy`
  - `wrangler.toml` declares `name`, `compatibility_date`, `[assets]`. The `[[routes]]` block is omitted (or `custom_domain = false`) so it doesn't fight Terraform for the domain binding.

  **Rationale for Cloudflare over AWS**:
  1. **AWS public IPv4 surcharge** ($3.60/mo per address) — recurring tax on any AWS-fronted host (finding-your-way pays it). Cloudflare has no per-IP cost.
  2. Cloudflare free tier covers a marketing site at any plausible Indri traffic level.
  3. User already has a Cloudflare account in active use.

  **AWS / Cloudflare split** holds for stateful backends: SplitLedger's Serverpod backend, ParkingSpace's API, etc. stay on AWS. The studio marketing site is the static surface where Cloudflare wins on cost and simplicity. Both clouds are Terraform-managed.

  **Per-project Cloudflare API token** (matches your AWS per-project IAM pattern):
  - Create an `indri-cf-token` scoped to: Zone `indri.studio` — Workers Scripts:Edit, DNS:Edit, Workers Routes:Edit, Zone:Read. Nothing more.
  - Managed declaratively via `cloudflare_api_token` resource in `infrastructure/cloudflare/iam-self/` (mirrors `finding-your-way/infrastructure/aws/iam-self/`). A one-time bootstrap account-token creates the narrowed project token; the bootstrap then gets rotated/deleted.
  - **SSM is the source of truth** for the token value: `/indri-studio/cloudflare/api_token` as `SecureString` (same naming pattern as the parking-space / SplitLedger projects). Any local cache (`.env`, `~/.cloudflare/`) is read-only, regenerated from SSM via `task secrets-pull`. Never hand-edit; rotation happens in SSM and propagates from there.

  **One-time prerequisite**: add the `indri.studio` zone to Cloudflare (via TF or one-time manual import), point the domain registrar's nameservers at Cloudflare, generate the bootstrap token. Then `terraform apply` is the entirety of the infra side.

  **HTTPS + canonical-host policy** (must hold at deploy time):
  - Canonical host: **`https://indri.studio`** (apex). All other variants redirect to it.
  - Redirect map (all 301, all declared in Terraform):
    - `http://indri.studio` → `https://indri.studio` (Always Use HTTPS, zone-level)
    - `http://www.indri.studio` → `https://indri.studio` (Always Use HTTPS + apex redirect, combined)
    - `https://www.indri.studio` → `https://indri.studio` (`cloudflare_ruleset` redirect rule in `redirects.tf`)
  - Both `indri.studio` and `www.indri.studio` get Workers custom-domain bindings (`cloudflare_workers_custom_domain` × 2 in `workers.tf`) so DNS, TLS, and the www→apex redirect are all Terraform-owned.
  - Universal SSL (free) covers both hostnames automatically once they're on the zone.
  - "Always Use HTTPS" set via `cloudflare_zone_setting` in `zone.tf` so it survives manual UI changes.

## Content model

Two content collections: `apps` (the catalogue) and `team` (founders/employees).

```ts
// src/content/config.ts

const team = defineCollection({
  type: 'content',
  schema: ({ image }) => z.object({
    name: z.string(),
    role: z.string(),
    bio: z.string(),                       // 1–3 sentences
    portrait: image(),
    socials: z.object({
      twitter: z.string().url().optional(),
      github: z.string().url().optional(),
      mastodon: z.string().url().optional(),
      bluesky: z.string().url().optional(),
      linkedin: z.string().url().optional(),
      email: z.string().email().optional(),
      site: z.string().url().optional(),
    }).optional(),
    order: z.number(),                     // display order on /about
    featured: z.boolean().default(false),  // shown on homepage strip
  }),
});

const apps = defineCollection({
  type: 'content',
  schema: ({ image }) => z.object({
    name: z.string(),
    tagline: z.string(),
    description: z.string(),
    icon: image(),

    // Screenshots — tagged so the gallery can frame each appropriately
    screenshots: z.array(z.object({
      src: image(),
      shape: z.enum(['phone', 'tablet', 'console', 'desktop', 'square']),
      caption: z.string().optional(),
    })),

    // Store links — flexible array, supports any platform
    storeLinks: z.array(z.object({
      platform: z.enum([
        'ios', 'ipad', 'mac',
        'android', 'androidTablet',
        'steam', 'switch', 'playstation', 'xbox',
        'windows', 'web',
      ]),
      url: z.string().url(),
      label: z.string().optional(),
    })),

    // Per-app brand kit
    theme: z.object({
      primary: z.string(),
      background: z.string(),
      text: z.string(),
      fontDisplay: z.string(),
      fontBody: z.string(),
    }),

    privacyEffectiveDate: z.string(),
    termsEffectiveDate: z.string(),
    releaseStatus: z.enum(['upcoming', 'released']).default('upcoming'),
  }),
});
```

Per-app folder layout:

```
src/content/apps/<slug>/
├── index.md         (landing page copy)
├── privacy-policy.md
├── terms-of-service.md
├── icon.png
└── screenshots/
```

Minimum needed at v1 scaffold. Anything not listed (transcripts/, investigations/, runbooks/, tests/, additional docs) is added when first needed, not pre-created.

```
indri.studio/
├── CLAUDE.md                                      (project conventions: brand, theming, workflow)
├── README.md
├── Taskfile.yml                                   (md, dev, build, tf-plan, tf-apply, deploy,
│                                                   secrets-pull, secrets-bootstrap)
├── astro.config.mjs
├── wrangler.toml                                  (seeded from rapid-raccoon-site)
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
│
├── docs/
│   └── plans/
│       └── 2026-05-13-initial-buildout.md         (this file)
│
├── infrastructure/
│   └── cloudflare/                                (mirrors finding-your-way/infrastructure/aws/)
│       ├── bootstrap/main.tf                      (state backend init, one-time)
│       ├── global/                                (zone, workers, DNS, redirect rules)
│       │   ├── providers.tf
│       │   ├── backend.tf                         (S3 backend, shared with other projects)
│       │   ├── variables.tf
│       │   ├── zone.tf
│       │   ├── workers.tf                         (cloudflare_workers_custom_domain × 2)
│       │   ├── redirects.tf                       (rapid-raccoon.com → indri.studio cutover)
│       │   └── outputs.tf
│       └── iam-self/                              (self-narrowed API token)
│           ├── providers.tf
│           ├── backend.tf
│           └── token.tf
│
├── scripts/                                       (set -euo pipefail; -h/--help on all)
│   ├── secrets-pull.sh                            (SSM → local .env; matches bumper2bumper)
│   └── secrets-bootstrap.sh                       (local → SSM, one-time; matches bumper2bumper)
│
├── src/
│   ├── pages/
│   │   ├── index.astro                            (studio homepage)
│   │   ├── about.astro                            (studio + team page)
│   │   └── apps/
│   │       ├── [slug].astro                       (per-app landing)
│   │       └── [slug]/
│   │           ├── privacy-policy.astro
│   │           └── terms-of-service.astro
│   ├── layouts/
│   │   ├── StudioLayout.astro
│   │   ├── AppLayout.astro                        (sets CSS vars from frontmatter)
│   │   └── LegalLayout.astro                      (wraps AppLayout with prose styles)
│   ├── components/
│   │   ├── AppGallery.astro
│   │   ├── StripedGridMotion.astro                (ringtail motion module)
│   │   ├── AppHero.astro
│   │   ├── ScreenshotGallery.astro                (shape-aware: phone/tablet/console/desktop)
│   │   ├── StoreLinks.astro
│   │   ├── PlatformIcon.astro
│   │   ├── TeamGrid.astro                         (full team for /about)
│   │   └── TeamStrip.astro                        (featured subset for homepage)
│   ├── content/
│   │   ├── config.ts
│   │   ├── apps/<slug>/
│   │   │   ├── index.md                           (landing copy)
│   │   │   ├── privacy-policy.md
│   │   │   ├── terms-of-service.md
│   │   │   └── (icon, screenshots — paths in frontmatter)
│   │   └── team/
│   │       └── <slug>.md                          (one per person; portrait in same dir or public/)
│   └── styles/
│       └── global.css                             (Tailwind v4 + Indri grey/purple + stripes)
│
└── public/                                        (favicons, OG images, robots.txt)
```

### SSM path convention

Following the sibling-project pattern (parking-space uses `/parkingspace/...`, SplitLedger uses `/splitledger/...`):

- **Project root path**: `/indri-studio/` (kebab-case)
- **Cloudflare API token** (`SecureString`): `/indri-studio/cloudflare/api_token`
- Future secrets follow the same shape: `/indri-studio/<component>/<key>` where keys are snake_case.

`task secrets-pull` reads from SSM and writes a local `.env` (read-only cache; refuses on drift, `--force` overwrites). `task secrets-bootstrap` pushes initial values into SSM. Both scripts mirror the simple bumper2bumper pair (`scripts/secrets-{pull,bootstrap}.sh`), not the heavier parking-space `seed-ssm.sh` + `backup-ssm.sh` pattern.

### Credentials & accounts: new-by-default

**Rule**: every service Indri touches gets a fresh account or project-scoped credential. Reuse with rapid-raccoon (or any other existing project) only when the free tier mechanically forces it. Sharing is explicit and documented — never a side effect of convenience.

| Service | Decision | Notes |
|---|---|---|
| **Cloudflare account** | **New Account** under existing login | CF supports multiple Accounts per login. Indri's zone, Workers, R2, Analytics all under a dedicated Account, separate from Rapid Raccoon's. |
| **Cloudflare API token** | **Per-project, narrowed** | `indri-cf-token` scoped to indri.studio zone + Workers only. Stored in SSM at `/indri-studio/cloudflare/api_token`. |
| **GitHub** | **New organization** | `indri-studio` (or chosen name). All Indri repos under one org. Free tier = unlimited public + private repos, separate secrets / Dependabot / Actions. |
| **AWS** | **Forced share** | Used only for TF state S3 backend. Cost of a new AWS Org isn't worth it for a single S3 bucket. Project-scoped IAM user `indri-terraform` (matches `sl-terraform`, `gc-terraform` pattern). |
| **Domain registrar** | **Cloudflare Registrar** | Move indri.studio to CF Registrar at-cost. No markup, integrates with the zone. |
| **Google Cloud / OAuth** | **New project** | `indri-studio` GCP project for any OAuth client IDs (Google Drive sync in Gustos Colores, Sign-In with Google if used). Existing Rapid Raccoon GCP project stays as-is. |
| **Apple Developer** | **Forced share** | $99/yr per legal entity. Apple's model is one account, many apps. Sub-divide via team roles + per-app provisioning profiles. |
| **Google Play Developer** | **Forced share** | $25 one-time per legal entity. Same model as Apple. |
| **Sentry** (if used) | **New organization** | Free tier supports new orgs trivially. Separate projects per app within the org. |
| **PagerDuty** (if used) | **Forced share** | Free tier: 5 users, single team. Share with existing monitoring setup. (User-cited example.) |
| **Email (transactional)** | **New account** | Mailgun / Postmark / Resend etc. New account per project where the free tier permits (most do). |
| **Analytics** | **Cloudflare Web Analytics** | Free, per-zone — automatically isolated. Nothing to migrate. |
| **npm / package registry** | TBD | Default user account; create `@indri-studio` scope if/when publishing components. |

**Discipline corollary**: never copy a `*.env` or `~/.cloudflare/` file from another project into this repo. Pull from SSM (`task secrets-pull`); if a secret doesn't exist, bootstrap it fresh via the SSM path convention above.

## Deployment

Two deploy paths, both targeting the same Cloudflare Workers + Static Assets bundle. Local-CLI is for one-off manual pushes; tagged CI is the canonical path.

### Local (manual) deploy

```bash
task secrets-pull               # fetch CLOUDFLARE_API_TOKEN from SSM into .env
task build                      # pnpm build (Astro → ./dist)
task deploy                     # wraps `npx wrangler deploy`
```

`task deploy` produces a URL on `<name>.<acct>.workers.dev` until the custom-domain bindings (managed by Terraform) point `indri.studio` + `www.indri.studio` at the same Worker.

### CI/CD: tag-driven

`.github/workflows/deploy.yml` (seeded from rapid-raccoon-site, unmodified except for the project name) deploys on any `v*` tag push:

```bash
git tag v0.1.0
git push --tags                 # GitHub Actions runs build + wrangler deploy
```

Manual re-deploy (rollback after rotation, or re-trigger without bumping the tag) is available via the **workflow_dispatch** button in the GitHub Actions UI — picks any prior commit. Concurrency group `deploy` queues simultaneous tag pushes so they don't race into the Workers API.

**Required GitHub Actions secrets** (set once per repo):

| Secret | Source | Notes |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` | SSM `/indri-studio/cloudflare/api_token` | Project-scoped, narrowed via `infrastructure/cloudflare/iam-self/` |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare dashboard (account home) | Public-ish; safe to also mirror in SSM at `/indri-studio/cloudflare/account_id` for reproducibility |

### Deploy flow end-to-end

1. **Code merges to `main`** — no deploy yet.
2. **Bump version + tag**: `git tag v0.1.0 && git push --tags`
3. **GitHub Actions** runs: checkout → pnpm install (frozen lockfile) → `pnpm build` → `wrangler deploy`.
4. Wrangler uploads `./dist/` as the Worker's static assets. New version is live immediately on the workers.dev hostname.
5. **Terraform-managed `cloudflare_workers_custom_domain` bindings** keep `indri.studio` and `www.indri.studio` pointed at the latest version of the Worker — no manual DNS change per deploy.
6. **Verify** with the redirect/HTTPS curl checks in the Verification section.

### First deploy (cold start)

Order of operations for the very first deploy (before custom-domain bindings exist):

1. Apply `infrastructure/cloudflare/bootstrap/` (one-time, sets up TF state).
2. Apply `infrastructure/cloudflare/iam-self/` (narrows the bootstrap token to project scope).
3. From local: `task secrets-pull` → `task build` → `task deploy`. Verifies the build pipeline on `indri-studio.<acct>.workers.dev`.
4. Apply `infrastructure/cloudflare/global/` (zone settings, custom-domain bindings, redirect rules).
5. DNS propagates — `https://indri.studio` and `https://www.indri.studio` start resolving.
6. Push `v0.1.0` tag → GitHub Actions takes over from here.

## Monthly cost

### indri.studio on Cloudflare (planned)

| Item | Unit cost | Monthly |
|---|---|---|
| Cloudflare zone (`indri.studio`) | $0 (free plan) | $0.00 |
| Cloudflare Workers + Static Assets (free tier: 100k requests/day, ~3M/mo) | $0 | $0.00 |
| TLS certificate (Universal SSL) | $0 | $0.00 |
| DNS queries (unlimited on free plan) | $0 | $0.00 |
| Workers custom-domain bindings (`indri.studio`, `www.indri.studio`) | $0 | $0.00 |
| Domain registration (`.studio` TLD, Cloudflare Registrar at cost) | ~$24/yr | $2.00 |
| **Total** | | **~$2.00/mo** |

Headroom: free Workers tier covers ~3M requests/mo. If traffic exceeds that, Workers Paid is $5/mo flat + $0.30 per additional million requests — i.e. a 10× traffic surge takes the bill from $2 to $7.

### Hypothetical AWS-equivalent (pure S3 + CloudFront)

| Item | Unit cost | Monthly est. (low-traffic site) |
|---|---|---|
| Route 53 hosted zone | $0.50/zone | $0.50 |
| ACM certificate | $0 | $0.00 |
| S3 storage (~100 MB) | $0.023/GB | $0.01 |
| S3 GET requests (~50k/mo) | $0.0004/1k | $0.02 |
| CloudFront data transfer (~10 GB/mo) | $0.085/GB | $0.85 |
| CloudFront HTTPS requests (~500k/mo) | $0.0100 per 10k | $0.50 |
| Domain registration (Route 53 Registrar, `.studio`) | ~$23/yr | $1.92 |
| **Total** | | **~$3.80/mo** |

Notes on the comparison:
- **AWS public IPv4 surcharge ($3.60/mo/IP)** does *not* directly hit a pure S3+CloudFront static site (CloudFront uses AWS-owned anycast IPs; S3 is name-resolved). The charge bites elsewhere in your stack — Lightsail instances (SplitLedger backend, ParkingSpace backend), NAT Gateways, ELBs. So the $3.60 isn't a savings line for the marketing site itself; it's a structural reason Cloudflare-fronted properties stay cheaper as scale grows.
- AWS gets slightly more expensive linearly with traffic; Cloudflare stays at $0 until the free-tier ceiling, then jumps to $5/mo.
- Both clouds: domain registration cost is essentially the same (~$2/mo amortised); registrar pricing for `.studio` is similar across providers.

### Net for this plan

**~$2.00/mo all-in for indri.studio** (just the domain — Cloudflare hosting is free at this traffic level).

### Out of scope (unchanged by this plan)

The per-app *backends* — SplitLedger's Serverpod backend on Lightsail, ParkingSpace's API, World Foundry game-asset hosting, finding-your-way's existing S3+CloudFront — keep their current hosting and cost. This plan only addresses the studio marketing site at `indri.studio` and per-app *landing/legal* pages, all of which are static.

## Implementation phases

### Phase 1 — Scaffold
- Create `~/SRC/indri.studio/` by copying the rapid-raccoon-site skeleton (config, build setup, Taskfile, deploy plumbing)
- Strip rapid-raccoon-specific pages/copy; keep layout patterns as scaffolding
- Edit `wrangler.toml`: `name` → `indri-studio`, `[[routes]]` → `indri.studio` / `www.indri.studio`
- Add Cloudflare zone for `indri.studio`; point registrar at CF nameservers
- Add Tailwind v4 if not already present in the rapid-raccoon-site setup (CSS-first config via `@import "tailwindcss"` + `@theme` blocks)
- Define Astro content collection schema for apps
- Stub one placeholder app in `src/content/apps/example/`
- First `wrangler deploy` to the workers.dev hostname to confirm pipeline before pointing the custom domain

### Phase 2 — Studio homepage
- `pages/index.astro`: hero, app gallery, footer
- `AppGallery` component reading `getCollection('apps')`, sorted with `released` first
- `DottedGridMotion` background in hero zone
- Indri brand tokens in `global.css`

### Phase 3 — Per-app landing
- `pages/apps/[slug].astro` rendering app frontmatter + markdown
- `AppLayout` writes CSS custom properties from `theme` frontmatter
- `AppHero` (name, tagline, icon, store buttons)
- `ScreenshotGallery` rendering each screenshot at its native aspect ratio with appropriate framing (phone screenshots get phone-shaped containers, console gets 16:9 panels, etc.)
- `StoreLinks` rendering platform-specific badges/buttons from the `storeLinks` array

### Phase 4 — Legal pages
- `pages/apps/[slug]/privacy-policy.astro` and `terms-of-service.astro`
- Render markdown through `LegalLayout` with app's typography
- Prose styles inherit app theme

### Phase 5 — Polish & deploy
- Cloudflare Pages deploy, point `indri.studio` DNS
- Per-app `<title>`, Open Graph tags, favicons
- ✅ **Studio favicon recoloured two-tone purple** (commit `6441f22`, 2026-05-13). All five files regenerated: `favicon.svg` (`#B026FF` shape + `#3A004B` eyes), `favicon.ico`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`.
- Lighthouse pass, cross-browser check

## App inventory (identified from `~/SRC/`)

The six apps confirmed as initial Indri catalogue:

### 1. ParkingSpace
- **Repo**: `~/SRC/parking-space/`
- **Existing presence**: motorbike-parking.info (live)
- **Product**: motorbike-parking management; consumer Arrive & Pay + operator + admin roles
- **Platforms**: Flutter (Android focus), web; market is Thailand (THB ฿)
- **Visual identity**: Light/clean Material default — no strong distinctive brand yet. Tabbed bottom nav, blue/grey accents, monochrome dark text. Indri landing should give it a *slightly* stronger frame (logo, palette).
- **Screenshot assets**: `parking-space/docs/screenshots/{consumer,operator,admin,login,public}/` (Android phone format)
- **Initial brand kit (suggested)**: primary `#1f6feb` (functional blue), background `#f5f7fb`, text `#1a1f2e`, fonts Inter + Inter Display

### 2. World Foundry
- **Repo**: `~/SRC/WorldFoundry-wbniv/`
- **Product**: 3D game engine + games (e.g. "Bubba"); Forth-scripted levels; physics via Jolt
- **Platforms**: Linux, Android, iOS, **plausibly Steam + consoles** (this is the "some on consoles" app)
- **Visual identity**: bold retro-industrial woodcut logo — red + black + white, crossed turret silhouettes over a globe. Strong, distinctive, almost 80s arcade-poster.
- **Screenshot assets**: `WorldFoundry-wbniv/wflogo.png`, blender renders in `wftools/wf_blender/docs/`. Per-game screenshots (Bubba) likely need to be captured fresh.
- **Initial brand kit (suggested)**: primary `#d52d2d` (logo red), background `#0d0d0d` near-black, text `#f6f1e1` cream, accent white, fonts a strong industrial sans (Inter Display Bold or a slab like IBM Plex Serif for game flavour)

### 3. SplitLedger
- **Repo**: `~/SRC/bumper2bumper/` (project repo, app name is SplitLedger)
- **Existing presence**: splitledger.rapid-raccoon.com (live, **under the Rapid Raccoon studio**)
- **Product**: multi-currency shared expense / debt tracking
- **Platforms**: Flutter (iOS, Android, Mac, web)
- **Visual identity**: well-defined "warm fintech"
  - Primary `#f25e0b` (orange-500), secondary `#0e8e6a` (teal-500)
  - Background `#fbf8f1` warm off-white
  - Geist (UI), Fraunces (display/serif), Geist Mono (tabular money)
- **Screenshot assets**: `bumper2bumper/docs/designs/legacy-stitch/` (Stitch mockups), `bumper2bumper/docs/designs/redesign-2026-04-{25,27,28}*/` (recent rounds)
- **Brand kit**: take verbatim from `bumper2bumper/CLAUDE.md` — already a polished design system
- **Migration note**: SplitLedger currently lives at splitledger.rapid-raccoon.com. **indri.studio replaces rapid-raccoon.com entirely.** SplitLedger's landing migrates to `indri.studio/apps/splitledger/`. The existing `~/SRC/rapid-raccoon-site/` repo is a content source (copy, screenshots, structure) — not a parallel deployment. DNS for `*.rapid-raccoon.com` to be decommissioned or redirected to the new home.

### 4. Finding Your Way (Parmenides)
- **Repo**: `~/SRC/finding-your-way/`
- **Existing presence**: d310bzn1p8934s.cloudfront.net (live, custom domain pending)
- **Product**: choice-based philosophical hypertext — 144-page journey through Love, Reason, Truth, God; affirm or deny *Being* across the realms; three endings. Author-commissioned port of a 2005 original.
- **Platforms**: web-only (PWA — installable, works offline after first load)
- **Visual identity**: book-quality — parchment cream background (~`#e8dbc1`), dark serif body text, golden drop caps and CTAs, hanging punctuation. Reads like a digital illuminated manuscript. Per-realm procedural ambient audio (Web Audio API).
- **Tech**: Astro 5 + Markdown + Zod, hosted on AWS S3 + CloudFront with Terraform (different hosting pattern than rapid-raccoon).
- **Screenshot assets**: `finding-your-way/docs/images/{intro-qr,goddess-quote}.png`, `finding-your-way/test-results/pages-*-phone/*-actual.png` (Playwright visual-regression captures of individual pages — usable as content screenshots), and atmospheric content imagery in `finding-your-way/public/images/` (doors, religious icons, courts — narrative imagery).
- **Initial brand kit**: primary `#c9a227` (golden accent), background `#e8dbc1` parchment, text `#2a2620` dark sepia, fonts a book serif for body (e.g. Cardo, EB Garamond, or PT Serif) + same serif for display.

### 6. Pinball Construction Set
- **Repo**: `~/SRC/pcs/`
- **Product**: cross-platform pinball construction set — drag flippers, slingshots, bumpers, ramps; physics simulates in real time; save/load locally, share tables.
- **Platforms**: Flutter. **Mobile**: App Store (iOS), Google Play (Android). **Desktop + handheld**: Steam (Linux, macOS, Windows, **Steam Deck**) — Steam is the right distribution channel for a desktop construction-set / game tool, not the Mac App Store. Steam Deck verification is the natural follow-on once the touch UI is dialed in.
- **Visual identity**: TBD — the in-repo specs describe deterministic 2D physics + a construction-set UI; brand kit not yet pinned. Likely candidates: high-contrast retro-arcade flavour (CRT scanlines, red+black+yellow), or modern flat construction-tool feel (grey + accent).
- **Design intent**: "fast, intuitive, deterministic, and fun — not realistic" (per `pinball_construction_set_full_spec.md`).
- **Initial brand kit (suggested)**: TBD; defer until first screenshots exist.
- **Screenshot assets**: not yet captured.

### 5. Gustos Colores
- **Repo**: `~/SRC/gustos-colores/`
- **Product**: adult / mindful coloring app; SVG → JSON pipeline; cloud-sync via Google Drive
- **Platforms**: Flutter (Android + tablet confirmed via 7" / 10" tablet screenshots; iOS likely)
- **Visual identity**: dark UI shell (deep navy/black background), thin-line geometric content (mandalas, Islamic geometric, stained glass, etc.) on cream cards
- **Screenshot assets**:
  - General: `gustos-colores/docs/images/{gallery,coloring-blank,coloring-inprogress,settings-sync,authoring-login,zoom}.png`
  - Tablet: `gustos-colores/docs/plans/screenshots/2026-05-07-tablet-{7in,10in}-{gallery,coloring}.png`
  - Per-cobrand: `gustos-colores/cobrands/<theme>/assets/{icon,favicon,gallery,coloring-inprogress,zoom}.png`
- **Initial brand kit (suggested)**: primary `#1c1c20` (near-black), accent depends on cobrand featured, background `#0a0a0c`, text `#ece7da` cream, fonts a calm humanist sans like Inter + a contemplative serif (Lora) for headers
- **⚠ Design question — cobrand model**: Gustos Colores has ~20 themed cobrands (mandala, stained-glass, queer-tarot, mehndi, cottagecore, gnomes, art-nouveau, etc.). Two options for Indri:
  - **A. Single product, internal showcase**: one `/apps/gustos-colores/` page that shows the cobrand variety as a feature. Cleaner studio gallery.
  - **B. One product per cobrand**: each cobrand is a separately-published app with its own page. Matches user's apparent Play Console pattern of "two apps" already, scales to 20+.
  - User to choose. **Recommendation: A initially** (less work, cleaner story); migrate to B later if individual cobrands get separate App Store listings.

## Brand voice / approved taglines

User-approved lines for studio copy (selected 2026-05-13 from a brainstorm of ~20). Use as a pool — the lead line goes in the homepage about-indri section; the others can land in footer taglines, /about page sub-statements, future manifesto strip, social profiles, etc.

| Line | Use |
|---|---|
| **"If it should exist and we'd use it, we build it."** | ⭐ **Lead.** Currently in homepage about-indri statement. |
| "Indri doesn't pick a vertical. Indri picks problems." | Available — strong positioning statement. Candidate for /about page sub-heading or social bio. |
| "Tools that don't grow up to be unicorns." | Available — anti-unicorn/SaaS-bloat stance. Candidate for footer tagline. |
| "Lemurs hold on. So do our apps." | Available — lemur-brand riff. Candidate for footer tagline or a manifesto strip between sections. |
| *"Indri makes apps. No business plan. We sleep fine."* | ✋ **Note but don't use** — user likes it as a sentiment but doesn't want it on the live site. Keep on file. |

Replaced and **retired** (not approved):
- ~~"We pick problems that matter, ship something tight, then come back and make it better."~~ — original placeholder, too generic.

## Studio migration: rapid-raccoon → indri

indri.studio **replaces** rapid-raccoon.com. The existing `~/SRC/rapid-raccoon-site/` becomes a content-mining source for the new site (page structure, copy, screenshots — particularly for SplitLedger's already-polished landing). Rapid Raccoon DNS to be redirected or sunset after cutover.

## Needed when implementation starts

- Indri studio logo + primary accent colour (to be designed if not existing)
- Resolution to the Gustos Colores cobrand model question (recommend A: single product, internal showcase)
- App Store / Play Store / Steam / console listing URLs (placeholders OK at first)
- Per-app finalised copy (tagline, description, feature blurbs) — mine `rapid-raccoon-site/` and each app's CLAUDE.md for starting material
- Privacy + terms text per app (legal content)
- Domain DNS access for indri.studio (Cloudflare nameservers or registrar A/CNAME records)
- Cutover plan for rapid-raccoon.com → indri.studio redirects

## Verification

1. `npm run build` produces clean static output with no warnings.
2. `/` renders the gallery with all apps; each item links to its app page.
3. Each `/apps/<slug>/` page renders with the app's theme tokens distinctly applied (different from the studio and from other apps).
4. `/apps/<slug>/privacy-policy` and `/terms` render markdown with the app's typography and palette.
5. `ScreenshotGallery` renders phone, tablet, and console screenshots side by side without distortion.
6. `StoreLinks` renders correct badges for whichever platforms an app supports (varies per app).
7. Dotted-grid motion runs on homepage; static when `prefers-reduced-motion: reduce`.
8. Lighthouse: Performance ≥ 95, Accessibility ≥ 95, Best Practices ≥ 95.
9. Renders without layout breaks in Safari, Chrome, Firefox, mobile Safari.
10. `https://indri.studio` AND `https://www.indri.studio` both resolve and serve the site with valid TLS.
11. `http://indri.studio` and `http://www.indri.studio` auto-redirect to their HTTPS counterparts (301 in `curl -I` output).
12. The non-canonical hostname (whichever isn't the apex) 301-redirects to the canonical one — verified with `curl -I https://www.indri.studio` returning `location: https://indri.studio/...`.
