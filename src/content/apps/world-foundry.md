---
title: World Foundry v2
date: 2026-12-01
summary: A classic 3D engine, rebuilt for modern worlds.
draft: false
storeLinks:
  github: "https://github.com/wbniv/WorldFoundry"
logo: ../../assets/screenshots/world-foundry/logo.png
screenshots:
  - { src: "../../assets/screenshots/world-foundry/blender-house.png", alt: "Blender → World Foundry roundtrip render" }
  - { src: "../../assets/screenshots/world-foundry/uv-seams.png", alt: "UV seam handling" }
  - { src: "../../assets/screenshots/world-foundry/smb_firestar_03_star_enemy_defeated.png", alt: "Star + fire power defeats enemy" }
  - { src: "../../assets/screenshots/world-foundry/2026-05-22-undo-del.png", alt: "Editor: undo delete" }
---

World Foundry v2 brings a classic 3D game engine forward with modern rendering, Jolt physics, programmable behavior, and live controls. Its compact, data-driven approach puts the world, its rules, and its settings in the hands of the creator.

## Modern rendering, more places to run

The engine runs through OpenGL on Linux, OpenGL ES on Android, and WebGL 2 in the browser through WebAssembly. A native Metal renderer brings textured, depth-tested rendering to macOS.

Baked OpenGL meshes use a compact **28-byte vertex format** where supported, with a fallback for incompatible data or custom shaders. Static back-face culling uses precomputed triangle data, and the 32-bit ARM path tests four faces at a time with NEON. These changes reduce storage and repeated per-frame work while retaining the existing streaming path for dynamic geometry.

## Modern physics, connected to gameplay

**Jolt physics** powers collision and movement, with contact events connected to actor behavior. Scripts can respond to collisions, move actors through their position properties, and spawn or remove objects at runtime.

Shared model geometry also feeds static physics meshes, reducing duplicate geometry handling between the renderer and the physics system.

## Small scripts, expressive behavior

**Forth scripting** gives actors their own behavior, with access to engine properties and cross-actor communication. Per-actor scaling supports squash-and-stretch animation, and the debug bridge can reload zForth scripts during development without restarting the whole game.

The optional **Neural Forth** module adds fuzzy logic, neural-network operations, automatic differentiation, and trainable slots to zForth. It provides building blocks for experimenting with adaptive behavior directly in the scripting environment.

## Live settings, defined by the world

The runtime builds settings forms from authored object-property definitions. Choices, toggles, sliders, text and number fields, and color controls let creators expose meaningful adjustments without hand-building a separate interface for every scene.

Controller navigation is joined by direct touch controls and responsive phone and tablet layouts. Android text and number entry use native editors, while Apply and Cancel keep changes explicit. Touch support is implemented; deeper device checks are still in progress.

## Better tools for understanding each frame

Frame profiling reports rendering work and separates static vertex-buffer memory from index-buffer memory. Back-face counters show which culling paths are doing the work, and a fixed-pitch FPS display keeps changing values from shifting the layout.

The debug bridge exposes running engine state for inspection and automation. Deterministic frame stepping and captured render comparisons help catch regressions across backends.

## Built for modern Android devices

The Android runtime supports TV remotes and touch input, alongside a screensaver host for running engine worlds while a TV is idle. Runtime settings can be exposed through a common catalog, and screensaver orientation is configurable.

APK validation checks native-library and package alignment for **16 KiB memory pages**, catching incompatible builds before they are shipped.

World Foundry v2 is in active development. Explore the [engine source](https://github.com/wbniv/WorldFoundry) or [run the browser build](https://worldfoundry.org/v2/play/) to follow its progress.
