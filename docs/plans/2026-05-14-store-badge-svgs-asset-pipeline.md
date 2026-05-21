# Store-badge SVGs through asset pipeline

## Context

Store-badge SVGs currently live in `public/img/store-badges/` and are served at stable
`/img/store-badges/*.svg` URLs with a 1-day `Cache-Control` (`max-age=86400,
stale-while-revalidate=604800`). Because they're in `public/`, Astro passes them through
unchanged — no content-hash, no immutable caching.

Moving them to `src/assets/store-badges/` and importing each with `?url` makes Vite emit
them as `/_astro/<name>.<hash>.svg`. They then inherit the existing `/_astro/*` immutable
1-year rule in `_headers` — same pattern already used for `cca-lightbox.js`.

`vite.build.assetsInlineLimit: 0` is already set in `astro.config.mjs`, so SVGs (which
are tiny text files well under the 4 KB threshold) won't be base64-inlined.

## Changes

### 1. Move SVG files
```
public/img/store-badges/ → src/assets/store-badges/
```
Five files: `app-store.svg`, `google-play.svg`, `steam.svg`, `blender-extensions.svg`, `github.svg`.

### 2. `src/components/StoreBadges.astro`

Replace the hardcoded `/img/store-badges/*.svg` paths in the `entries` array with `?url`
imports:

```astro
---
import appStoreUrl          from "../assets/store-badges/app-store.svg?url";
import googlePlayUrl        from "../assets/store-badges/google-play.svg?url";
import steamUrl             from "../assets/store-badges/steam.svg?url";
import blenderExtensionsUrl from "../assets/store-badges/blender-extensions.svg?url";
import githubUrl            from "../assets/store-badges/github.svg?url";

// … existing interface + props …

const entries = [
  { key: "appStore",          src: appStoreUrl,          alt: "Download on the App Store",         width: 135 },
  { key: "googlePlay",        src: googlePlayUrl,        alt: "Get it on Google Play",              width: 152 },
  { key: "steam",             src: steamUrl,             alt: "Available on Steam",                 width: 135 },
  { key: "blenderExtensions", src: blenderExtensionsUrl, alt: "Get it on Blender Extensions",       width: 165 },
  { key: "github",            src: githubUrl,            alt: "Get it on GitHub",                   width: 135 },
];
---
```

Rest of the template is unchanged.

### 3. `public/_headers`

Remove the `/img/store-badges/*` rule — the SVGs now live under `/_astro/*` and inherit
the immutable rule already there.

## Verification

1. `task build` — completes without errors.
2. `grep -r "store-badges" dist/` — no references to `/img/store-badges/`; all badge URLs
   are `/_astro/*.svg`.
3. `ls dist/_astro/*.svg` — five hashed SVG files present.
4. `grep "store-badges" public/_headers` — no output (rule removed).
5. `curl -sI https://indri.studio/` — smoke-check after publish; badge `<img>` src values
   in page HTML point to `/_astro/` paths.
