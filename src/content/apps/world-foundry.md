---
title: World Foundry v2
date: 2026-12-01
summary: Big worlds. Small machines.
draft: false
storeLinks:
  github: "https://github.com/wbniv/WorldFoundry"
logo: ../../assets/screenshots/world-foundry/logo.png
screenshots:
  - { src: "../../assets/screenshots/world-foundry/stained-glass-temple.png", alt: "Stained-glass windows in Finding Your Way’s temple" }
  - { src: "../../assets/screenshots/world-foundry/clownfish-anemone.png", alt: "Clownfish and sea anemone rendered in World Foundry" }
  - { src: "../../assets/screenshots/world-foundry/treemap.png", alt: "A file hierarchy visualized as a 3D treemap" }
  - { src: "../../assets/screenshots/world-foundry/uv-seams.png", alt: "UV seam handling" }
  - { src: "../../assets/screenshots/world-foundry/smb_firestar_03_star_enemy_defeated.png", alt: "Star + fire power defeats enemy" }
  - { src: "../../assets/screenshots/world-foundry/2026-05-22-undo-del.png", alt: "Editor: undo delete" }
---

World Foundry v2 is a 3D engine built with small machines in mind. Its roots are in early PlayStation-class hardware, where memory and CPU budgets were tiny by today’s standards. That resource-conscious design is central to v2, alongside modern rendering backends, programmable behavior, and live controls.

## Modern rendering, more places to run

<img src="/apps/world-foundry/rendering.svg" alt="World Foundry rendering backends" width="640" height="318" loading="lazy" decoding="async" />

The engine runs through OpenGL on Linux, OpenGL ES on Android, and WebGL 2 in the browser through WebAssembly. A shared native Metal renderer brings textured, depth-tested rendering to macOS and iOS. The iOS port is under active development, with device validation still in progress.

## Modern physics, connected to gameplay

<img src="/apps/world-foundry/physics.svg" alt="From collision to behavior" width="640" height="240" loading="lazy" decoding="async" />

**Jolt physics** powers collision and movement, with contact events connected to actor behavior. Scripts can respond to collisions, move actors through their position properties, and spawn or remove objects at runtime.

## Better tools for understanding each frame

<img src="/apps/world-foundry/debug.svg" alt="Debugging and repeatable verification" width="640" height="258" loading="lazy" decoding="async" />

The debug bridge exposes running engine state for inspection and automation. Deterministic frame stepping and captured render comparisons help catch regressions across backends.

<img src="/apps/world-foundry/profiling.svg" alt="Inspect buffers, geometry and timing" width="640" height="268" loading="lazy" decoding="async" />

Frame profiling reports rendering work and separates static vertex-buffer memory from index-buffer memory. Back-face counters show which culling paths are doing the work, and a fixed-pitch FPS display keeps changing values from shifting the layout.

## Small scripts, expressive behavior

<img src="/apps/world-foundry/scripting.svg" alt="Actor behavior in Forth" width="640" height="268" loading="lazy" decoding="async" />

**Forth scripting** gives actors their own behavior, with access to engine properties and cross-actor communication. Per-actor scaling supports squash-and-stretch animation, and the debug bridge can reload zForth scripts during development without restarting the whole game.

<img src="/apps/world-foundry/neural.svg" alt="Forth and Neural Forth" width="640" height="300" loading="lazy" decoding="async" />

The optional **Neural Forth** module adds fuzzy logic, neural-network operations, automatic differentiation, and trainable slots to zForth. It provides building blocks for experimenting with adaptive behavior directly in the scripting environment.

## Live settings, defined by the world

<img src="/apps/world-foundry/settings.svg" alt="Properties become runtime controls" width="640" height="332" loading="lazy" decoding="async" />

The runtime builds settings forms from authored object-property definitions. Choices, toggles, sliders, text and number fields, and color controls let creators expose meaningful adjustments without hand-building a separate interface for every scene.

<img src="/apps/world-foundry/input.svg" alt="Touch and controller settings" width="640" height="276" loading="lazy" decoding="async" />

Controller navigation is joined by direct touch controls and responsive phone and tablet layouts. Android text and number entry use native editors, while Apply and Cancel keep changes explicit. Touch support is implemented; deeper device checks are still in progress.

## Built for modern Android devices

<img src="/apps/world-foundry/android.svg" alt="Android input and screensaver hosting" width="640" height="242" loading="lazy" decoding="async" />

The Android runtime supports TV remotes and touch input, alongside a screensaver host for running engine worlds while a TV is idle. Runtime settings can be exposed through a common catalog, and screensaver orientation is configurable.

## Compact geometry, less per-frame work

<img src="/apps/world-foundry/compact.svg" alt="Compact meshes and parallel culling" width="640" height="244" loading="lazy" decoding="async" />

Baked OpenGL meshes use a compact **28-byte vertex format** where supported, with a fallback for incompatible data or custom shaders. Static back-face culling uses precomputed triangle data, and the 32-bit ARM path tests four faces at a time with NEON. These changes reduce storage and repeated per-frame work while retaining the existing streaming path for dynamic geometry.

World Foundry v2 is in active development. Explore the [engine source](https://github.com/wbniv/WorldFoundry) or [run the browser build](https://worldfoundry.org/v2/play/) to follow its progress.
