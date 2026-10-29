# bsnes-jg-wasm product page layout

**Status:** Implemented; awaiting publish  
**Reference:** [Claude artifact: bsnes-jg-wasm page layout](https://claude.ai/artifact/JsE14DkmWqdDewN722ibmK#page-dcb81aee8d83)  
**Target:** `https://indri.studio/apps/bsnes-jg-wasm/`

## Goal

Reshape the page content around the browser SNES emulator and its reusable player package, while keeping the Native Android APKs visible as example integrations. Use the reference artifact's broad content area, restrained hierarchy, release facts strip, and paired download cards. The existing Indri chrome is outside the redesign boundary and must remain exactly as it is.

## What the reference contributes

At a 1920 px desktop viewport, the artifact uses a centered content region about 87% of the viewport width, a dark warm background, and a bright lime accent for primary headings and links. A four-column bordered facts strip summarizes Android release, player package, supported platforms, and manifest. The download section has a large uppercase heading and two equally sized Native APK cards side by side, with substantial padding and a quiet outline. Sections have generous vertical separation so the page reads as a product page rather than a stack of unrelated embeds. Do not copy the artifact's top-level header or navigation: preserve the existing INDRI bar and page chrome verbatim.

## Proposed page order

1. **Existing site chrome — unchanged:** Keep the current INDRI header, Previous control, Board Game Arena Title Tray, All apps control, Next control, and Claude Code Authoring Formats exactly as they are. Do not redesign, replace, restyle, reorder, or add to this top chrome. Begin this plan's layout changes below it.
2. **Page introduction:** Keep the current `bsnes-jg-wasm` title and concise lead. Lead with “Embed the SNES emulator in your browser.” Explain that the reusable browser player is the main product and the Android apps demonstrate native integration.
3. **At-a-glance strip:** Browser WebAssembly, Native Android, Native package version, and source repository. Keep this short and avoid repeating a version in every section.
4. **Browser player:** Show the compact Mandelbrot SNES display beside the GitHub badge with no controls, as already specified for the hero. Follow with the browser embed and catalog examples.
5. **Download the APKs:** Present Native suite and Native Mandelbrot as matching cards in a two-column desktop grid. Each card has a short purpose line, package ID, version, size, SHA-256, and one clear download action. Keep file-size detail visually secondary to the purpose and action.
6. **Integrate the player:** Keep format and controls selectors together in the header. Put the live preview above the source card. The source card uses the full section width, with the copy icon at its upper right. Source wraps without horizontal scrolling; vertical scrolling may bound long examples.
7. **Source and updates:** Repository, package release, release manifest, and update/signing notes in a compact closing section.

## Desktop wireframe

```text
┌────────────────────────────────────────────────────────────────────────────┐
│ EXISTING INDRI CHROME — UNCHANGED                                         │
│ INDRI · Previous · Board Game Arena Title Tray · All apps · Next ·         │
│ Claude Code Authoring Formats                                              │
│                                                                            │
│ bsnes-jg-wasm                                                              │
│ Embed the SNES emulator in your browser.                                   │
│ Browser player + native Android integration examples.          GitHub     │
│                                                                            │
│ ┌─────────────────┬─────────────────┬─────────────────┬────────────────┐ │
│ │ BROWSER PLAYER  │ PLAYER PACKAGE  │ RUNS ON         │ SOURCE         │ │
│ │ WebAssembly     │ v0.1.11         │ Browser · Android│ GitHub         │ │
│ └─────────────────┴─────────────────┴─────────────────┴────────────────┘ │
│                                                                            │
│ [small bare Mandelbrot display]                                            │
│                                                                            │
│ DOWNLOAD THE APKS                                                          │
│ ┌────────────────────────────────┐ ┌───────────────────────────────────┐ │
│ │ NATIVE SUITE APK               │ │ NATIVE MANDELBROT APK             │ │
│ │ Browse the LLVM 65816 suite    │ │ Launch the standalone Mandelbrot  │ │
│ │ package · version · size/hash  │ │ package · version · size/hash     │ │
│ │ [Download]                     │ │ [Download]                        │ │
│ └────────────────────────────────┘ └───────────────────────────────────┘ │
│                                                                            │
│ CHOOSE YOUR FORMAT                                                         │
│ Format [HTML ▾]   [✓] Include controls                       [copy icon]   │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │ Live player preview                                                    │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │ with-controls.html                                             [copy]  │ │
│ │ full-width, wrapping source                                             │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────┘
```

## Responsive behavior

- At wide desktop widths, keep the APK cards in two equal columns and the facts strip in four columns.
- At tablet widths, use two facts columns and keep the APK cards side by side while each card remains readable.
- On narrow phones, stack facts and APK cards; make the download action easy to tap.
- Keep the preview above the source at every width. The source card fills the content width and wraps long lines instead of requiring horizontal panning.
- Keep the compact hero player from growing to the width of the content column. Preserve the SNES display's 4:3 presentation ratio.

## Visual and content rules

- Reuse Indri's warm charcoal, off-white, and lime palette; use the lime for a small number of high-value headings, links, and selected controls.
- Match the reference's generous section spacing and card padding, but keep the first browser-player demo visible without a long run of introductory copy.
- Use one main title and ordered section headings. Avoid repeating “browser-first”/“Native Android” positioning in every block.
- Keep the Native APKs labeled as example integrations. The browser player package is the reusable product.
- Do not claim the 8:7 source grid is the display ratio. The SNES source is 256×224 samples (8:7); render the complete image in a 4:3 television display.
- Keep current working APK links until the matching versioned R2 objects are available over HTTPS. The local Native Mandelbrot v0.1.9 build is 7,323,847 bytes, but its public URL currently returns 404; do not link it as downloadable until it is uploaded and hash-verified.

## Acceptance criteria

- The first screen identifies browser SNES emulation as the main capability and exposes a playable example promptly.
- A compact facts strip and paired APK cards follow the reference's visual rhythm without pushing all playable content below the fold.
- The two APK cards have equal visual weight and clearly distinguish the suite chooser from the standalone Mandelbrot player.
- The format selector, controls checkbox, preview, full-width source, and copy action work together; preview remains above code on desktop and mobile.
- Example source has no horizontal scrollbar at common desktop or phone widths.
- All displayed versions, byte sizes, hashes, and download links match published artifacts. Broken or not-yet-uploaded R2 URLs are not shown as working downloads.
