# Finding Your Way link preview

## Goal

When someone shares the Finding Your Way page in WhatsApp or another app that reads Open Graph metadata, show a branded preview instead of the opening-page screenshot.

## Design

Use the existing temple-and-Π mark, the title, and the four realm names on a 1200 × 630 px dark card. Keep the parchment and gold colors from the app icon. Render an editable SVG source to PNG because link-preview clients need a widely supported image format. The preview below is the visual mockup and final asset.

![Finding Your Way branded share preview](../../public/apps/finding-your-way/share-card.png)

## Implementation

- [x] Add the share card SVG and 1200 × 630 PNG under `public/apps/finding-your-way/`.
- [x] Use the PNG as this app page's absolute `og:image`, leaving other app pages' previews alone.
- [x] Verify the built metadata and image dimensions, then verify the live image URL and page metadata after publishing as v0.1.185.

AI assistance: Codex. Exact model/version and tool metadata were not available in verified session metadata and are not inferred.
