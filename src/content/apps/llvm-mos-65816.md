---
title: SNES C Compiler
date: 2026-06-25
summary: Write modern C — boot it on a Super Nintendo.
draft: true
storeLinks:
  github: "https://github.com/wbniv/llvm-mos-65816"
screenshots:
  - { src: "../../assets/screenshots/llvm-mos-65816/mandel-jg.png", alt: "Mandelbrot rendered from C on the SNES (bsnes-jg)" }
  - { src: "../../assets/screenshots/llvm-mos-65816/mandel-mode7-jg.png", alt: "Mode 7 Mandelbrot rendered from C on the SNES (bsnes-jg)" }
  - { src: "../../assets/screenshots/llvm-mos-65816/mandel-compare.png", alt: "Host C reference vs the SNES render — pixel-for-pixel" }
---

An optimizing, open-source C compiler for the WDC&nbsp;65816 — the CPU at the
heart of the [Super Nintendo](https://en.wikipedia.org/wiki/Super_Nintendo_Entertainment_System) —
built on [llvm-mos](https://github.com/llvm-mos/llvm-mos).

It brings a modern, LLVM-based option to the 65816, complementing the
platform's long heritage of assemblers and commercial compilers: 24-bit
addressing, native 16-bit registers, and a complete SNES SDK (memory map, ROM
header, I/O registers, C runtime). Write C, get a bootable `.sfc` ROM —
verified pixel-for-pixel against two emulators (MAME and bsnes-jg).

The 65816 codegen is machine-agnostic, so the same compiler benefits other
65816 platforms (Apple IIgs) too. Open source under Apache-2.0 with LLVM
exceptions.
