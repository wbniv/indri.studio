---
title: SNES C Compiler
date: 2026-06-25
summary: Write modern C — boot it on a Super Nintendo.
draft: false
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

## Install

Linux x86-64. Add the apt repository, then install the toolchain:

```sh
curl -fsSL https://apt.indri.studio/key.gpg | sudo gpg --dearmor -o /etc/apt/keyrings/indri.gpg
echo "deb [signed-by=/etc/apt/keyrings/indri.gpg] https://apt.indri.studio stable main" \
  | sudo tee /etc/apt/sources.list.d/indri.list
sudo apt update && sudo apt install llvm-mos-65816
```

Then turn C into a bootable ROM:

```sh
mos-snes-clang -Os -o hello.sfc hello.c
```

Prefer no package manager? The same build is a relocatable
[tarball](https://apt.indri.studio/sources/) — extract anywhere and run
`bin/mos-snes-clang`. This is an interim preview, published while the codegen
patches make their way upstream into llvm-mos.

## Documentation

- [65816 opcode reference](/docs/65816-opcodes/) — the instruction set as the backend encodes it
- [SNES hardware summary](/docs/snes-hardware/) — CPU, PPU, memory map, DMA
- [SNES register map](/docs/snes-registers/) — every CPU-visible I/O register
- [Object-oriented C and assembly](/docs/oop-in-c/) — vtables and polymorphism on the 65816
- [SNES bootup sequence](/docs/snes-bootup/) — power-on to `main()`
- [Capturing SNES screenshots, headless](/docs/emulator-screenshots/) — true PPU output for CI
