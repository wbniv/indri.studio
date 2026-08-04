// src/data/snes-demos.ts — shared metadata for all 113 llvm-mos-65816 SNES demo ROMs.
//
// Extracted from biohack.net's src/pages/snes/*.astro pages (title/desc/keys/category/controls)
// and public/play/roms/manifest.json (selfcheck) so this site's gallery renders the same content
// through ONE dynamic route instead of 113 hand-written files. `bugFound` is present only on the
// 11 demos that guard a real pre-existing-compiler bug (see llvm-mos-65816's
// docs/plans/2026-07-26-full-rom-galleries-both-sites.md "Bug provenance" section for the full
// scope rationale -- deliberately excludes bugs in code the fork itself wrote for the
// +mos-a16/+mos-xy16 feature, only pre-existing-compiler defects).

export interface SnesDemoSelfcheck {
  off: string;
  len: number;
  want: string;
  frames: number;
  label: string;
}

export interface SnesDemoBugFound {
  patch: string;
  summary: string;
  fixSummary: string;
  fixCommitUrl: string;
  demoPlanLink: string;
}

export interface SnesDemo {
  slug: string;
  displayMode?: 7;
  title: string;
  desc: string;
  keys: string;
  category: string;
  controls: [string, string][] | null;
  selfcheck: SnesDemoSelfcheck;
  bugFound?: SnesDemoBugFound;
  works?: [string, string, string?][];
}

export const SNES_DEMOS: SnesDemo[] = [
  {
    "slug": "mandel-display",
    "displayMode": 7,
    "title": "Mode 7 Mandelbrot",
    "desc": "A fixed-point Mandelbrot computed live on the 65816 and revealed through Mode 7 — every pixel round-trips through a 24-bit far pointer into high WRAM, the broadest single codegen exercise the publish gate runs. The canonical #321 tester.",
    "keys": "Self-running — reveals coarse-to-fine, then spins and zooms",
    "category": "fractals",
    "controls": null,
    "selfcheck": {
      "off": "0x200",
      "len": 2,
      "want": "0x204F",
      "frames": 5800,
      "label": "gate jgxcheck CRC (corpus_result @ WRAM $0200)"
    }
  },
  {
    "slug": "mandel-oop",
    "displayMode": 7,
    "title": "Mode 7 Mandelbrot (OOP)",
    "desc": "The same fixed-point Mandelbrot, rebuilt through the snesgfx object-oriented C interface (Mode 7 as a polymorphic Drawable) instead of procedural calls — a formal verification client proving the OOP pattern costs nothing on real hardware.",
    "keys": "Self-running — animated build, coarse-to-fine reveal, then Mode 7 spin and zoom",
    "category": "fractals",
    "controls": null,
    "selfcheck": {
      "off": "0x895",
      "len": 2,
      "want": "0x204F",
      "frames": 5800,
      "label": "gate jgxcheck CRC (corpus_result @ WRAM $0895)"
    }
  },
  {
    "slug": "cpu6502",
    "title": "6502 CPU Simulator",
    "desc": "A 6502/65C02 processor emulated on the SNES: a scrolling disassembly listing steps through a program one instruction at a time while the matching ALU logic gate lights up. The emulator’s 256-entry opcode switch is lowered to a jump table on the 65816. Compiler stress-test #102 (Round 6).",
    "keys": "Self-running — the disassembly scrolls, ALU gates light up",
    "category": "classics",
    "controls": null,
    "selfcheck": {
      "off": "0xADD",
      "len": 2,
      "want": "0xAC8A",
      "frames": 1000,
      "label": "corpus_result CRC"
    }
  },
  {
    "slug": "crcwall",
    "title": "Bit-Serial CRC Wall",
    "desc": "Three CRC checksums (8/16/32-bit) computed bit-by-bit as software shift-registers, interleaved under heavy register pressure — re-running a fix for a default-8-bit register-allocator bug that once stranded a loop-carried CRC byte. A flowing hash marble. Compiler stress-test #105 (Round 6).",
    "keys": "Self-running — a bit-serial CRC hash marble flows",
    "category": "ciphers",
    "controls": null,
    "selfcheck": {
      "off": "0x68",
      "len": 2,
      "want": "0x8E47",
      "frames": 500,
      "label": "crcwall bit-serial CRC gate host==bsnes-jg"
    },
    "bugFound": {
      "patch": "0010",
      "summary": "a default-8-bit (no +mos-a16 needed) silent miscompile: the register coalescer could merge two shift/rotate-referenced values into the A-only Ac register class, stranding a loop-carried byte in Y while the loop's back-edge ROL read a stale A. Both -verify-machineinstrs and -verify-coalescing passed clean — this was silent, not a crash.",
      "fixSummary": "Teach MOSRegisterInfo::shouldCoalesce to refuse that join whenever the target class is Ac and both operands are rotate-referenced, plus a -run-pass=register-coalescer regression test.",
      "fixCommitUrl": "https://github.com/wbniv/llvm-mos-65816/commit/b75dd46",
      "demoPlanLink": "https://github.com/wbniv/llvm-mos-65816/blob/main/docs/plans/2026-07-02-105-snes-crcwall.md"
    }
  },
  {
    "slug": "lfsr2",
    "title": "Dual-LFSR Scrambler",
    "desc": "A Galois and a Fibonacci LFSR stepped together — two loop-carried shift registers folded through rotates at once. Re-runs a default-build register-coalescer bug in loop-carried rotate code, under double pressure. Compiler stress-test #106 (Round 6).",
    "keys": "Self-running — two interleaved pseudo-noise fields scroll",
    "category": "ciphers",
    "controls": null,
    "selfcheck": {
      "off": "0x67",
      "len": 2,
      "want": "0x6AA3",
      "frames": 500,
      "label": "lfsr2"
    },
    "bugFound": {
      "patch": "0010",
      "summary": "a default-8-bit (no +mos-a16 needed) silent miscompile: the register coalescer could merge two shift/rotate-referenced values into the A-only Ac register class, stranding a loop-carried byte in Y while the loop's back-edge ROL read a stale A. Both -verify-machineinstrs and -verify-coalescing passed clean — this was silent, not a crash.",
      "fixSummary": "Teach MOSRegisterInfo::shouldCoalesce to refuse that join whenever the target class is Ac and both operands are rotate-referenced, plus a -run-pass=register-coalescer regression test.",
      "fixCommitUrl": "https://github.com/wbniv/llvm-mos-65816/commit/b75dd46",
      "demoPlanLink": "https://github.com/wbniv/llvm-mos-65816/blob/main/docs/plans/2026-07-02-106-snes-lfsr2.md"
    }
  },
  {
    "slug": "bitweave",
    "title": "Serial Bit-Reversal Weave",
    "desc": "Bit reversal done one bit at a time through a rotate-carry loop — a loop-carried result rotated on every back edge, deliberately not the bit-reverse builtin. Re-runs a default-build register-coalescer bug in loop-carried rotate code. Compiler stress-test #107 (Round 6).",
    "keys": "Self-running — a gradient shown through its bit-reversed order",
    "category": "ciphers",
    "controls": null,
    "selfcheck": {
      "off": "0x6d",
      "len": 2,
      "want": "0x0E03",
      "frames": 500,
      "label": "bitweave"
    },
    "bugFound": {
      "patch": "0010",
      "summary": "a default-8-bit (no +mos-a16 needed) silent miscompile: the register coalescer could merge two shift/rotate-referenced values into the A-only Ac register class, stranding a loop-carried byte in Y while the loop's back-edge ROL read a stale A. Both -verify-machineinstrs and -verify-coalescing passed clean — this was silent, not a crash.",
      "fixSummary": "Teach MOSRegisterInfo::shouldCoalesce to refuse that join whenever the target class is Ac and both operands are rotate-referenced, plus a -run-pass=register-coalescer regression test.",
      "fixCommitUrl": "https://github.com/wbniv/llvm-mos-65816/commit/b75dd46",
      "demoPlanLink": "https://github.com/wbniv/llvm-mos-65816/blob/main/docs/plans/2026-07-02-107-snes-bitweave.md"
    }
  },
  {
    "slug": "uarteye",
    "title": "Bit-Banged UART Eye",
    "desc": "A software UART bit-banged through carry-rotated transmit and receive registers, drawn as an oscilloscope eye diagram. Re-runs a default-build register-coalescer bug in loop-carried rotate code. Compiler stress-test #108 (Round 6).",
    "keys": "Self-running — a serial eye diagram, rails and crossings shimmer",
    "category": "ciphers",
    "controls": null,
    "selfcheck": {
      "off": "0x67",
      "len": 2,
      "want": "0x3F09",
      "frames": 500,
      "label": "uarteye"
    },
    "bugFound": {
      "patch": "0010",
      "summary": "a default-8-bit (no +mos-a16 needed) silent miscompile: the register coalescer could merge two shift/rotate-referenced values into the A-only Ac register class, stranding a loop-carried byte in Y while the loop's back-edge ROL read a stale A. Both -verify-machineinstrs and -verify-coalescing passed clean — this was silent, not a crash.",
      "fixSummary": "Teach MOSRegisterInfo::shouldCoalesce to refuse that join whenever the target class is Ac and both operands are rotate-referenced, plus a -run-pass=register-coalescer regression test.",
      "fixCommitUrl": "https://github.com/wbniv/llvm-mos-65816/commit/b75dd46",
      "demoPlanLink": "https://github.com/wbniv/llvm-mos-65816/blob/main/docs/plans/2026-07-02-108-snes-uarteye.md"
    }
  },
  {
    "slug": "spaceship",
    "title": "Width-Sweep Sort Gallery",
    "desc": "Four bar panels sort in lockstep, each driven by the C spaceship comparator (a>b)-(a<b) at a different key width — 8/16/32/64-bit. Re-runs the fix that taught the 65816 to lower the three-way-compare (G_SCMP), now at the 32- and 64-bit widths the original never reached. Compiler stress-test #97 (Round 6).",
    "keys": "Self-running — four panels sort, reshuffle, and sort again",
    "category": "algorithms",
    "controls": null,
    "selfcheck": {
      "off": "0x58",
      "len": 2,
      "want": "0xF20F",
      "frames": 500,
      "label": "spaceship G_SCMP gate CRC host==bsnes-jg"
    },
    "bugFound": {
      "patch": "0016",
      "summary": "a fully generic gap present in every build mode (default 8-bit included — nothing to do with the 16-bit-accumulator feature): the C \"spaceship\" three-way-compare idiom (x>y)-(x<y), which libc qsort comparators commonly use, canonicalizes to a G_SCMP/G_UCMP machine-IR opcode that the backend's legalizer had zero rule for, at any width — an unable to legalize abort, in every mode, with or without LTO.",
      "fixSummary": "One line: mark G_SCMP/G_UCMP as .lower(), routing them through LLVM's existing built-in three-way-compare expansion — no new codegen needed.",
      "fixCommitUrl": "https://github.com/wbniv/llvm-mos-65816/commit/3c2c7a5",
      "demoPlanLink": "https://github.com/wbniv/llvm-mos-65816/blob/main/docs/plans/2026-07-02-97-snes-spaceship.md"
    }
  },
  {
    "slug": "ovmove",
    "title": "Overlap-Move Mosaic",
    "desc": "A 384-byte mosaic scrolled in place by four overlapping memmoves per step — both copy directions, each over a 16-bit-indexed buffer. Re-runs the exact scenario a real +mos-xy16 in-place-memmove bug once corrupted, larger and both ways, and confirms the fix holds. Compiler stress-test #93 (Round 6).",
    "keys": "Self-running — the mosaic shears down-right, then up-left",
    "category": "algorithms",
    "controls": null,
    "selfcheck": {
      "off": "0x67",
      "len": 2,
      "want": "0xA990",
      "frames": 500,
      "label": "ovmove overlapping-memmove gate CRC host==bsnes-jg"
    }
  },
  {
    "slug": "rotslab",
    "title": "In-Place Block Rotate",
    "desc": "A 384-entry barber-pole buffer rotated in place by the three-reversal trick — 16-bit-indexed swaps sweeping across the register-width boundary. Re-runs the +mos-xy16 index-width fix a second way, with no memmove library call, so both angles onto the same bug are guarded. Compiler stress-test #94 (Round 6).",
    "keys": "Self-running — the barber-pole marquee rotates in place",
    "category": "algorithms",
    "controls": null,
    "selfcheck": {
      "off": "0x69",
      "len": 2,
      "want": "0xB93A",
      "frames": 500,
      "label": "rotslab"
    }
  },
  {
    "slug": "permscat",
    "title": "Gather-Scatter Permutation",
    "desc": "A 576-cell grid shuffled by a bijective scatter dst[perm[i]]=src[i] — two 16-bit indices live at once, a data-dependent scatter index lowering to sta abs,X. Re-runs the +mos-xy16 index-width fix on its sharpest addressing form. Compiler stress-test #95 (Round 6).",
    "keys": "Self-running — the grid shuffles kaleidoscopically",
    "category": "algorithms",
    "controls": null,
    "selfcheck": {
      "off": "0x67",
      "len": 2,
      "want": "0x0C2C",
      "frames": 500,
      "label": "permscat"
    }
  },
  {
    "slug": "ropeedit",
    "title": "Gap-Buffer Rope Editor",
    "desc": "A text gap buffer whose cursor moves memmove text across the gap — both directions, past the 256-byte boundary. Re-runs the +mos-xy16 index-width fix at scale, as a real editor primitive rather than a synthetic loop. Compiler stress-test #96 (Round 6).",
    "keys": "Self-running — text blocks slide across the gap",
    "category": "algorithms",
    "controls": null,
    "selfcheck": {
      "off": "0x6a",
      "len": 2,
      "want": "0x2361",
      "frames": 500,
      "label": "ropeedit"
    }
  },
  {
    "slug": "ucmprank",
    "title": "Unsigned Rank Percentile Field",
    "desc": "A field recoloured by each cell's unsigned rank, computed with the three-way compare (a>b)-(a<b) at uint16/uint32/uint64. Re-runs the unsigned half of the spaceship-operator fix — the 64-bit unsigned compare the signed sort never emitted. Compiler stress-test #98 (Round 6).",
    "keys": "Self-running — the field recolours by unsigned rank",
    "category": "algorithms",
    "controls": null,
    "selfcheck": {
      "off": "0x67",
      "len": 2,
      "want": "0x4CDD",
      "frames": 500,
      "label": "ucmprank"
    },
    "bugFound": {
      "patch": "0016",
      "summary": "a fully generic gap present in every build mode (default 8-bit included — nothing to do with the 16-bit-accumulator feature): the C \"spaceship\" three-way-compare idiom (x>y)-(x<y), which libc qsort comparators commonly use, canonicalizes to a G_SCMP/G_UCMP machine-IR opcode that the backend's legalizer had zero rule for, at any width — an unable to legalize abort, in every mode, with or without LTO.",
      "fixSummary": "One line: mark G_SCMP/G_UCMP as .lower(), routing them through LLVM's existing built-in three-way-compare expansion — no new codegen needed.",
      "fixCommitUrl": "https://github.com/wbniv/llvm-mos-65816/commit/3c2c7a5",
      "demoPlanLink": "https://github.com/wbniv/llvm-mos-65816/blob/main/docs/plans/2026-07-02-98-snes-ucmprank.md"
    }
  },
  {
    "slug": "trimerge",
    "title": "Three-Way Merge Diff",
    "desc": "A merge of sorted streams where the three-way compare (a>b)-(a<b) selects the branch — advance-left, advance-right, or emit-both. Uses the spaceship result as control flow, not a sort key, confirming the fix holds whatever reads its output. Compiler stress-test #99 (Round 6).",
    "keys": "Self-running — teal/orange/gold braid the merge branches",
    "category": "algorithms",
    "controls": null,
    "selfcheck": {
      "off": "0x46",
      "len": 2,
      "want": "0xCCCC",
      "frames": 500,
      "label": "trimerge"
    },
    "bugFound": {
      "patch": "0016",
      "summary": "a fully generic gap present in every build mode (default 8-bit included — nothing to do with the 16-bit-accumulator feature): the C \"spaceship\" three-way-compare idiom (x>y)-(x<y), which libc qsort comparators commonly use, canonicalizes to a G_SCMP/G_UCMP machine-IR opcode that the backend's legalizer had zero rule for, at any width — an unable to legalize abort, in every mode, with or without LTO.",
      "fixSummary": "One line: mark G_SCMP/G_UCMP as .lower(), routing them through LLVM's existing built-in three-way-compare expansion — no new codegen needed.",
      "fixCommitUrl": "https://github.com/wbniv/llvm-mos-65816/commit/3c2c7a5",
      "demoPlanLink": "https://github.com/wbniv/llvm-mos-65816/blob/main/docs/plans/2026-07-02-99-snes-trimerge.md"
    }
  },
  {
    "slug": "keycmp64",
    "title": "64-bit Multi-Key Record Sort",
    "desc": "Records sorted by a primary 64-bit key then a secondary tie-break — two 64-bit three-way compares per comparison. The widest, densest form of the spaceship-operator fix, stacked two deep in qsort. Compiler stress-test #100 (Round 6).",
    "keys": "Self-running — rows resort under a two-level 64-bit key",
    "category": "algorithms",
    "controls": null,
    "selfcheck": {
      "off": "0x69",
      "len": 2,
      "want": "0xB8AD",
      "frames": 500,
      "label": "keycmp64"
    },
    "bugFound": {
      "patch": "0016",
      "summary": "a fully generic gap present in every build mode (default 8-bit included — nothing to do with the 16-bit-accumulator feature): the C \"spaceship\" three-way-compare idiom (x>y)-(x<y), which libc qsort comparators commonly use, canonicalizes to a G_SCMP/G_UCMP machine-IR opcode that the backend's legalizer had zero rule for, at any width — an unable to legalize abort, in every mode, with or without LTO.",
      "fixSummary": "One line: mark G_SCMP/G_UCMP as .lower(), routing them through LLVM's existing built-in three-way-compare expansion — no new codegen needed.",
      "fixCommitUrl": "https://github.com/wbniv/llvm-mos-65816/commit/3c2c7a5",
      "demoPlanLink": "https://github.com/wbniv/llvm-mos-65816/blob/main/docs/plans/2026-07-02-100-snes-keycmp64.md"
    }
  },
  {
    "slug": "oddmask",
    "title": "Odd-Width Mask Sculptor",
    "desc": "Values masked to odd widths — 20, 24, 28 bits — zero-extended to 64 bits and multiplied. Re-runs the odd-width extend and 64-bit split that once crashed the 16-bit-accumulator backend. Compiler stress-test #103 (Round 6).",
    "keys": "Self-running — four mask-width bands terrace and flow",
    "category": "algorithms",
    "controls": null,
    "selfcheck": {
      "off": "0x6b",
      "len": 2,
      "want": "0x1FD9",
      "frames": 500,
      "label": "oddmask"
    }
  },
  {
    "slug": "pcooker",
    "title": "Pressure-Cooker Fixed-Point Evaluator",
    "desc": "A per-pixel fixed-point expression whose comparison flag is decided early but used only after a storm of multiplies and divides. Re-runs a register-scavenger fix for a flag held live across calls under a jammed register file. Compiler stress-test #109 (Round 6).",
    "keys": "Self-running — an implicit surface with a level-set boundary",
    "category": "algorithms",
    "controls": null,
    "selfcheck": {
      "off": "0x71",
      "len": 2,
      "want": "0xEE6D",
      "frames": 1500,
      "label": "pcooker"
    },
    "bugFound": {
      "patch": "0011",
      "summary": "a +mos-a16/+mos-xy16 backend crash: a 16-bit compare kept the N/Z flags live across a frame-carry spill, forcing the carry-flag pseudo-register $p to be preserved across an unbalanced range — but $p (register class Cc) has no general-purpose-register home, so the register scavenger emitted an illegal spill of $p / read an undefined $p. The scavenger logic predates the 16-bit-accumulator feature; this was the first code path to hit its $p-has-no-home gap.",
      "fixSummary": "Route $p hard-stack-neutrally through a dead index register into a spare register class, and drop a now-stale liveness assumption in the scavenger.",
      "fixCommitUrl": "https://github.com/wbniv/llvm-mos-65816/commit/a320cbd",
      "demoPlanLink": "https://github.com/wbniv/llvm-mos-65816/blob/main/docs/plans/2026-07-02-109-snes-pcooker.md"
    }
  },
  {
    "slug": "modexp256",
    "title": "256-bit Modular Exponentiation",
    "desc": "A 256-bit Diffie-Hellman key exchange built from 32-bit limbs and 64-bit multiply-accumulate. Hammers the 64-bit (un)merge glue that once crashed the backend, hundreds of times over. Compiler stress-test #104 (Round 6).",
    "keys": "Self-running — the 256-bit shared secret as a colour field",
    "category": "algorithms",
    "controls": null,
    "selfcheck": {
      "off": "0x31",
      "len": 2,
      "want": "0x31D4",
      "frames": 1500,
      "label": "modexp256"
    }
  },
  {
    "slug": "mulov64",
    "title": "64-bit Multiply-Overflow",
    "desc": "Six orbiters carry a 64-bit momentum scaled until it overflows, then teleport and spark. The first demo to form an s64 multiply-high / multiply-overflow (G_UMULH/G_UMULO) — the one untested s64 lowering path, composed from 32-bit pieces without widening to 128 bits. Compiler stress-test #101 (Round 6).",
    "keys": "Self-running — orbiters spark on 64-bit overflow",
    "category": "bignums",
    "controls": null,
    "selfcheck": {
      "off": "0x58",
      "len": 2,
      "want": "0x3A69",
      "frames": 700,
      "label": "mulov64 s64 mul-overflow gate CRC host==bsnes-jg"
    }
  },
  {
    "slug": "borrowlad",
    "title": "Borrow-Ladder Odometer",
    "desc": "A 128-bit number counting down through a limb-by-limb borrow chain, borrows rippling upward like an odometer. Re-runs the set-carry lowering that every multi-precision subtract begins with. Compiler stress-test #110 (Round 6).",
    "keys": "Self-running — a 128-bit binary counter ticks down",
    "category": "bignums",
    "controls": null,
    "selfcheck": {
      "off": "0x6a",
      "len": 2,
      "want": "0x1BE3",
      "frames": 500,
      "label": "borrowlad"
    },
    "bugFound": {
      "patch": "0012",
      "summary": "a pre-existing gap in the machine-code lowering for carry-flag immediates: the lowering only handled the encodings for \"clear\" (0) and \"set\" (-1), but a set carry-in can also arrive as the literal value 1 (e.g. the carry-in for a 16-bit subtract) — hitting an unreachable assertion on debug builds, and undefined behaviour (that happened to still produce the right instruction) on release builds. Surfaced only once a separate fix (patch 0011) let compilation reach this stage at all.",
      "fixSummary": "Lower any nonzero carry-flag immediate as \"set carry\", not just -1 — a differential-neutral fix.",
      "fixCommitUrl": "https://github.com/wbniv/llvm-mos-65816/commit/a320cbd",
      "demoPlanLink": "https://github.com/wbniv/llvm-mos-65816/blob/main/docs/plans/2026-07-02-110-snes-borrowlad.md"
    }
  },
  {
    "slug": "mvscrl",
    "title": "Memmove Scroll Slabs",
    "desc": "Two counter-scrolling slab bands driven by overlapping memmove calls. Upper band uses memmove(dst+1,dst,N) where dst>src (descending path); lower band uses the ascending path. Both G_MEMMOVE sub-paths exercised. Compiler stress-test #79.",
    "keys": "Self-running — upper band scrolls down, lower scrolls up",
    "category": "algorithms",
    "controls": null,
    "selfcheck": {
      "off": "0x68",
      "len": 2,
      "want": "0x72A7",
      "frames": 500,
      "label": "MVSCRL"
    }
  },
  {
    "slug": "sbitfld",
    "title": "Signed-Bitfield Terrain",
    "desc": "An animated eroding terrain where each cell packs int16_t height:5/slope:4/flow:4 signed fields. Reading them fires G_SEXT_INREG (sign-extend in register). Indigo valleys prove the sign-extension lowering is correct. Compiler stress-test #78.",
    "keys": "Self-running — ridges erode and valleys fill each frame",
    "category": "algorithms",
    "controls": null,
    "selfcheck": {
      "off": "0x6b",
      "len": 2,
      "want": "0x40C5",
      "frames": 500,
      "label": "SBITFLD"
    }
  },
  {
    "slug": "satcast",
    "title": "Saturating-Cast Kaleidoscope",
    "desc": "A 6-fold hex kaleidoscope where tile colours are float intensities clamped to int16 via fminf/fmaxf and truncated. Exercises G_FMINNUM + G_FMAXNUM + G_FPTOSI with legalizer-inserted NaN guard. Compiler stress-test #77.",
    "keys": "Self-running — saturation boundary pulses as phase sweeps",
    "category": "rendering",
    "controls": null,
    "selfcheck": {
      "off": "0x80",
      "len": 2,
      "want": "0xC8CF",
      "frames": 500,
      "label": "SATCAST"
    }
  },
  {
    "slug": "rotkal",
    "title": "Rotate-Register Kaleidoscope",
    "desc": "An 8-fold mandala driven by circular bit rotations: eight ring registers rotate at different constant speeds (__builtin_rotateleft8/right8), while a 16-bit outer word rotates by a runtime amount. Exercises G_ROTL/G_ROTR ConstantAmt path and S8 special case. Compiler stress-test #74.",
    "keys": "Self-running — ring registers precess producing counter-rotating petals",
    "category": "rendering",
    "controls": null,
    "selfcheck": {
      "off": "0x6b",
      "len": 2,
      "want": "0x300C",
      "frames": 500,
      "label": "ROTKAL"
    }
  },
  {
    "slug": "satcomet",
    "title": "Saturating Comet Trails",
    "desc": "Six comets leave glowing trails that saturate to white where they cross, then fade cleanly to black — no wrap-around. Uses __builtin_elementwise_add_sat/sub_sat on uint8 and int16 to exercise all four saturating-arithmetic nodes. Compiler stress-test #75.",
    "keys": "Self-running — comets streak and cross, saturating to white",
    "category": "motion",
    "controls": null,
    "selfcheck": {
      "off": "0x6f",
      "len": 2,
      "want": "0xC2AF",
      "frames": 500,
      "label": "sat-comet"
    }
  },
  {
    "slug": "smulorbit",
    "title": "Signed Multiply-Overflow Orbit",
    "desc": "Six orbiters trace paths on the canvas; when a signed 16-bit multiply overflows, the orbiter teleports to the mirror quadrant and sparks orange. Uses __builtin_mul_overflow to exercise G_SMULO (signed multiply-overflow lowerMulo). Compiler stress-test #76.",
    "keys": "Self-running — trails build up and sparks fire on overflow",
    "category": "motion",
    "controls": null,
    "selfcheck": {
      "off": "0x57",
      "len": 2,
      "want": "0xD81B",
      "frames": 500,
      "label": "smul-overflow"
    }
  },
  {
    "slug": "plyoracle",
    "title": "PlyOracle",
    "desc": "A negamax + alpha-beta tic-tac-toe AI playing itself — the negate-on-return recursion (G_SUB 0,x) with a running G_SMAX and alpha-beta cutoffs. Compiler stress-test #92.",
    "keys": "Self-running · AI self-play; HUD tallies X/O/draw",
    "category": "classics",
    "controls": null,
    "selfcheck": {
      "off": "0x75",
      "len": 2,
      "want": "0x6146",
      "frames": 500,
      "label": "negamax CRC"
    }
  },
  {
    "slug": "matcascade",
    "title": "Matrix Cascade",
    "desc": "A spinning wireframe lattice driven by chained by-value 2x2 matrix multiplies — the sret hidden-pointer struct-return ABI (mat2 is 8 bytes, over the register-return threshold). Compiler stress-test #91.",
    "keys": "Self-running · wireframe lattice tumbles under matrix transforms",
    "category": "rendering",
    "controls": null,
    "selfcheck": {
      "off": "0x77",
      "len": 2,
      "want": "0x8064",
      "frames": 500,
      "label": "sret CRC"
    }
  },
  {
    "slug": "scopeguard",
    "title": "Scope-Guard Ripple Tank",
    "desc": "A fixed-point ripple tank whose compiler stress is __attribute__((cleanup)) — synthesized scope-exit calls fanned out to every control-flow exit in reverse order. Compiler stress-test #90.",
    "keys": "Self-running · ripples spread; HUD shows cleanup count",
    "category": "algorithms",
    "controls": null,
    "selfcheck": {
      "off": "0x66",
      "len": 2,
      "want": "0x05A3",
      "frames": 500,
      "label": "cleanup CRC"
    }
  },
  {
    "slug": "adpcm",
    "title": "ADPCM Waverider",
    "desc": "An IMA-ADPCM audio decoder — a saturating predictor (G_SADDSAT/G_SSUBSAT) in a serial feedback loop with a step-size LUT walk, drawn as a scrolling oscilloscope. Compiler stress-test #89.",
    "keys": "Self-running · decoded ADPCM waveform on a scope",
    "category": "signals",
    "controls": null,
    "selfcheck": {
      "off": "0x67",
      "len": 2,
      "want": "0xCA56",
      "frames": 500,
      "label": "adpcm CRC"
    }
  },
  {
    "slug": "dctbloom",
    "title": "DCT Bloom",
    "desc": "An 8×8 integer Discrete Cosine Transform — dense int32 multiply-accumulate with a signed fixed-point descale, shown as a source block beside its coefficient heat grid. Compiler stress-test #88.",
    "keys": "Self-running · source block + DCT coefficient heat grid",
    "category": "signals",
    "controls": null,
    "selfcheck": {
      "off": "0x43",
      "len": 2,
      "want": "0x5364",
      "frames": 500,
      "label": "dct CRC"
    }
  },
  {
    "slug": "sobel",
    "title": "Sobelscope",
    "desc": "A signed 3×3 Sobel edge detector — signed multiply-accumulate gradients with a saturating magnitude (G_SADDSAT/G_USUBSAT). Live edge-detected animated field. Compiler stress-test #87.",
    "keys": "Self-running · brighter = stronger detected edges",
    "category": "rendering",
    "controls": null,
    "selfcheck": {
      "off": "0x66",
      "len": 2,
      "want": "0x2849",
      "frames": 500,
      "label": "edge CRC"
    }
  },
  {
    "slug": "rangecode",
    "title": "Range Coder",
    "desc": "A binary arithmetic (range) coder — interval split by a 32-bit multiply, byte-wise renormalization carry loop, adaptive probability. The primitive behind LZMA/CABAC. Compiler stress-test #86.",
    "keys": "Self-running · range bar + emitted-byte waterfall",
    "category": "algorithms",
    "controls": null,
    "selfcheck": {
      "off": "0x66",
      "len": 2,
      "want": "0x6D21",
      "frames": 500,
      "label": "rangecoder CRC"
    }
  },
  {
    "slug": "ulam",
    "title": "Ulam Prime Sieve",
    "desc": "A Sieve of Eratosthenes in a packed bit-array (arr[i>>3] |= 1u<<(i&7), runtime-variable shifts) rendered as an Ulam spiral — primes cluster on diagonals. Compiler stress-test #85.",
    "keys": "Self-running · Ulam spiral of primes revealing outward",
    "category": "algorithms",
    "controls": null,
    "selfcheck": {
      "off": "0x64",
      "len": 2,
      "want": "0x1F2F",
      "frames": 500,
      "label": "sieve CRC"
    }
  },
  {
    "slug": "montorbit",
    "title": "Montgomery Orbit",
    "desc": "A multiplicative-group star polygon computed with Montgomery REDC modular multiplication — a·b mod N with no divide (multiply + shift + mask + conditional subtract). Compiler stress-test #84.",
    "keys": "Self-running · division-free modmul star polygon",
    "category": "ciphers",
    "controls": null,
    "selfcheck": {
      "off": "0x69",
      "len": 2,
      "want": "0xBA9B",
      "frames": 500,
      "label": "modmul CRC"
    }
  },
  {
    "slug": "truncstair",
    "title": "Truncation Staircase",
    "desc": "Three bands compare truncate/floor/round on a scrolling ramp, built from __fixsfsi/__floatsisf (G_FPTOSI/G_SITOFP) since floorf/ceilf/truncf are unsupported. Compiler stress-test #83.",
    "keys": "Self-running · trunc / floor / round diverge on negatives",
    "category": "algorithms",
    "controls": null,
    "selfcheck": {
      "off": "0x67",
      "len": 2,
      "want": "0x02CA",
      "frames": 500,
      "label": "rounding CRC"
    }
  },
  {
    "slug": "speedcap",
    "title": "Fmin/Fmax Speed Cap",
    "desc": "12 particles attracted to center, velocity double-clamped by __builtin_fminf/__builtin_fmaxf (G_FMINNUM/G_FMAXNUM → libcall). NaN-quieting: a NaN-injected particle recovers via fmaxf. Compiler stress-test #82.",
    "keys": "Self-running · teal=normal · orange=capped · red=NaN-recovered",
    "category": "physics",
    "controls": null,
    "selfcheck": {
      "off": "0x69",
      "len": 2,
      "want": "0x0116",
      "frames": 500,
      "label": "speed-gov CRC"
    }
  },
  {
    "slug": "compass",
    "title": "Copysign Compass",
    "desc": "A rotating 16×16 quadrant vector field driven by __builtin_copysignf — the backend's G_FCOPYSIGN inline sign-bit transplant (lowerFCopySign). Sign-zero crossings swirl as the phase sweeps. Compiler stress-test #81.",
    "keys": "Self-running — quadrant boundaries rotate as phase sweeps",
    "category": "motion",
    "controls": null,
    "selfcheck": {
      "off": "0x64",
      "len": 2,
      "want": "0xB9CB",
      "frames": 500,
      "label": "corpus_result Sign-bit CRC"
    }
  },
  {
    "slug": "fabsridge",
    "title": "Fabs Ridgeline",
    "desc": "An animated terrain ridgeline driven by the tent-map iteration using __builtin_fabsf as the hot op, targeting the backend's inline sign-bit AND path (legalizeFAbs). V-notch peaks and valleys drift each frame. Compiler stress-test #80.",
    "keys": "Self-running — the terrain undulates as seeds drift",
    "category": "rendering",
    "controls": null,
    "selfcheck": {
      "off": "0x59",
      "len": 2,
      "want": "0x161A",
      "frames": 500,
      "label": "fabs-ridgeline"
    }
  },
  {
    "slug": "grid3d",
    "title": "3-D Grid Voxel Life",
    "desc": "A 3-D cellular automaton in a true uint8 grid[6][6][6] array, tumbling as a depth-shaded voxel cube — every grid[z][y][x] makes the compiler generate the z*36+y*6+x stride arithmetic. Compiler stress-test #72.",
    "keys": "Self-running — a 3-D automaton tumbles as a voxel cube",
    "category": "cellular",
    "controls": null,
    "selfcheck": {
      "off": "0x69",
      "len": 2,
      "want": "0xFCDE",
      "frames": 800,
      "label": "grid3d"
    }
  },
  {
    "slug": "msquares",
    "title": "Marching Squares",
    "desc": "Iso-contours of a moving metaball field extracted by marching squares — a 16-case edge lookup indexed by the four corner signs, plus edge-crossing interpolation. Blobs merge and split under a traced outline. Compiler stress-test #71.",
    "keys": "Self-running — blobs merge and split under a contour",
    "category": "cellular",
    "controls": null,
    "selfcheck": {
      "off": "0x72",
      "len": 2,
      "want": "0x86A7",
      "frames": 1800,
      "label": "msquares"
    }
  },
  {
    "slug": "dither",
    "title": "Floyd-Steinberg Dither",
    "desc": "A smooth gradient resolving into a four-level dither by Floyd-Steinberg error diffusion — each pixel's signed quantisation residual is spread to its down-right neighbours (7/16, 3/16, 5/16, 1/16). Compiler stress-test #70.",
    "keys": "Self-running — the gradient resolves into dither",
    "category": "rendering",
    "controls": null,
    "selfcheck": {
      "off": "0x30",
      "len": 2,
      "want": "0x80C4",
      "frames": 2000,
      "label": "dither"
    }
  },
  {
    "slug": "gouraud",
    "title": "Gouraud Triangle",
    "desc": "A tumbling, smoothly colour-interpolated triangle drawn by barycentric edge-function rasterisation — three signed cross-product edge functions decide inside/outside and their values shade each pixel. Compiler stress-test #69.",
    "keys": "Self-running — the shaded triangle tumbles",
    "category": "rendering",
    "controls": null,
    "selfcheck": {
      "off": "0x7c",
      "len": 2,
      "want": "0xC5E9",
      "frames": 1500,
      "label": "gouraud"
    }
  },
  {
    "slug": "perlin",
    "title": "Perlin Noise",
    "desc": "A flowing smoke/marble field coloured by fixed-point Perlin gradient noise — a permutation table, the 6t^5-15t^4+10t^3 fade polynomial, gradient dot products and lerp. Compiler stress-test #68.",
    "keys": "Self-running — the noise field drifts like smoke",
    "category": "rendering",
    "controls": null,
    "selfcheck": {
      "off": "0x73",
      "len": 2,
      "want": "0xA72D",
      "frames": 500,
      "label": "perlin"
    }
  },
  {
    "slug": "huffman",
    "title": "Huffman Decode",
    "desc": "A Huffman-coded image decoding in bit by bit — a bit-granular stream reader threading a prefix tree, left on a 0 and right on a 1, the classic progressive image reveal. Compiler stress-test #67.",
    "keys": "Self-running — the coded image decodes in, then replays",
    "category": "algorithms",
    "controls": null,
    "selfcheck": {
      "off": "0x84",
      "len": 2,
      "want": "0xE8E4",
      "frames": 500,
      "label": "huffman"
    }
  },
  {
    "slug": "editdist",
    "title": "Edit-Distance DP",
    "desc": "The Levenshtein edit-distance table filled in and backtracked — a 2-D dynamic-programming grid with a min-of-three recurrence, drawn as a cost heat-map with the optimal alignment path traced through it. Compiler stress-test #66.",
    "keys": "Self-running — the table and path cycle through word pairs",
    "category": "algorithms",
    "controls": null,
    "selfcheck": {
      "off": "0x73",
      "len": 2,
      "want": "0xFB59",
      "frames": 500,
      "label": "editdist"
    }
  },
  {
    "slug": "hull",
    "title": "Convex Hull",
    "desc": "A drifting point cloud wrapped by a rubber-band convex hull, recomputed each frame by gift-wrapping — built entirely from the sign of a 2-D cross product (left turn or right turn?). Compiler stress-test #65.",
    "keys": "Self-running — the hull rubber-bands around the points",
    "category": "algorithms",
    "controls": null,
    "selfcheck": {
      "off": "0x73",
      "len": 2,
      "want": "0x84E3",
      "frames": 500,
      "label": "hull"
    }
  },
  {
    "slug": "radix",
    "title": "Radix Sort",
    "desc": "A non-comparison sort: bars re-bucketed by counting sort — histogram, prefix-sum, stable scatter — one digit at a time until they land in a clean ascending gradient. No comparisons anywhere. Compiler stress-test #64.",
    "keys": "Self-running — bars re-bucket pass by pass, then reshuffle",
    "category": "algorithms",
    "controls": null,
    "selfcheck": {
      "off": "0x73",
      "len": 2,
      "want": "0x123E",
      "frames": 500,
      "label": "radix"
    }
  },
  {
    "slug": "fenwick",
    "title": "Fenwick Tree",
    "desc": "A binary-indexed tree maintaining the running integral of a live signal, driven by the i & -i low-bit-isolation trick — hopping up and down a virtual tree of partial sums. Compiler stress-test #63.",
    "keys": "Self-running — the signal moves, its integral reshapes",
    "category": "algorithms",
    "controls": null,
    "selfcheck": {
      "off": "0x80",
      "len": 2,
      "want": "0x3454",
      "frames": 500,
      "label": "fenwick"
    }
  },
  {
    "slug": "percol",
    "title": "Union-Find Percolation",
    "desc": "Random bonds join neighbouring cells; a wet region spreads from the top until it percolates to the bottom, tracked by a disjoint-set (union-find) with path compression — pointer-chasing that flattens the path in place. Compiler stress-test #62.",
    "keys": "Self-running — the wet region spreads, then reseeds",
    "category": "cellular",
    "controls": null,
    "selfcheck": {
      "off": "0x7d",
      "len": 2,
      "want": "0x025B",
      "frames": 500,
      "label": "percol"
    }
  },
  {
    "slug": "dhmix",
    "title": "Diffie-Hellman Colour-Mixer",
    "desc": "Two parties agree on a shared secret colour via 64-bit modular exponentiation — the key exchange behind HTTPS. The 64-bit maths crashed the backend until this demo found and fixed the bug (patch 0017). Compiler stress-test #61.",
    "keys": "Self-running — the shared secret is always agreed",
    "category": "bignums",
    "controls": null,
    "selfcheck": {
      "off": "0x73",
      "len": 2,
      "want": "0x69AA",
      "frames": 500,
      "label": "dhmix"
    }
  },
  {
    "slug": "multibase",
    "title": "Multi-Base Clock",
    "desc": "One counter shown in decimal, dozenal, hex and sexagesimal at once, each digit split with the standard-library div() returning a div_t (quotient+remainder) struct by value, plus a 64-bit odometer via lldiv(). Compiler stress-test #60.",
    "keys": "Self-running — the same instant ticks in four bases",
    "category": "bignums",
    "controls": null,
    "selfcheck": {
      "off": "0x46",
      "len": 2,
      "want": "0x371A",
      "frames": 500,
      "label": "multibase"
    }
  },
  {
    "slug": "cosmzoom",
    "title": "Cosmic Zoom Ruler",
    "desc": "A 64-bit scale growing through the powers of ten, swept across a logarithmic ruler by converting it to float (__floatundisf) and back (__fixunssfdi) — the 64-bit-integer-to-float conversion. Compiler stress-test #59.",
    "keys": "Self-running — the bar sweeps up the powers of ten",
    "category": "bignums",
    "controls": null,
    "selfcheck": {
      "off": "0x54",
      "len": 2,
      "want": "0x502F",
      "frames": 500,
      "label": "cosmzoom"
    }
  },
  {
    "slug": "domcol",
    "title": "Domain Colouring",
    "desc": "The poles of a rational complex map (z*z-1)/(z*z+c) painted on a Super Nintendo, detected with NaN / unordered floating-point comparisons (x != x). Software float, no FPU; develops a row at a time, then shimmers. Compiler stress-test #58.",
    "keys": "Self-running — the field develops, then the palette shimmers",
    "category": "fractals",
    "controls": null,
    "selfcheck": {
      "off": "0x72",
      "len": 2,
      "want": "0xF3FD",
      "frames": 500,
      "label": "domcol"
    }
  },
  {
    "slug": "medfilt",
    "title": "Median Denoiser",
    "desc": "Salt-and-pepper noise cleaned by a 3x3 median filter, computed as a 19-comparator branchless min/max sorting network (no multiply, no divide). A sweeping wipe shows denoised vs raw. Compiler stress-test #57.",
    "keys": "Self-running — the wipe sweeps between noisy and clean",
    "category": "rendering",
    "controls": null,
    "selfcheck": {
      "off": "0x7b",
      "len": 2,
      "want": "0x87FE",
      "frames": 500,
      "label": "medfilt"
    }
  },
  {
    "slug": "rotozoom",
    "title": "Rotozoom",
    "desc": "The demoscene spin-zoom: each cell samples a procedural texture at a Q16.16 rotated/scaled coordinate, using the widening multiply-high (keep the middle of a 64-bit product). On a chip with no multiply, it measures how that lowers. Compiler stress-test #56.",
    "keys": "Self-running — the texture spins and breathes",
    "category": "rendering",
    "controls": null,
    "selfcheck": {
      "off": "0x64",
      "len": 2,
      "want": "0x391B",
      "frames": 700,
      "label": "rotozoom"
    }
  },
  {
    "slug": "gf256",
    "title": "GF(2⁸) Galois Field",
    "desc": "A morphing finite-field plaid coloured by GF(2⁸) carryless multiplies — the arithmetic under Reed-Solomon and QR codes: log/antilog tables and xor, no carry chain. A live RS syndrome lights up when a symbol is corrupted. Compiler stress-test #55.",
    "keys": "Self-running — the field plaid morphs, the syndrome updates",
    "category": "ciphers",
    "controls": null,
    "selfcheck": {
      "off": "0x68",
      "len": 2,
      "want": "0xC028",
      "frames": 500,
      "label": "gf256"
    }
  },
  {
    "slug": "bitshuffle",
    "title": "Perfect-Shuffle Transition",
    "desc": "An image scrambles into its bit-reversed \"butterfly\" order and reassembles — the perfect shuffle from the FFT — driven by __builtin_bitreverse32 (its own inverse) and __builtin_bswap32, which inline-lower on the 65816. Compiler stress-test #54.",
    "keys": "Self-running — the image scrambles and reassembles",
    "category": "ciphers",
    "controls": null,
    "selfcheck": {
      "off": "0x52",
      "len": 2,
      "want": "0x2A4A",
      "frames": 500,
      "label": "bitshuffle"
    }
  },
  {
    "slug": "funnelkal",
    "title": "Funnel-Shift Kaleidoscope",
    "desc": "An 8-fold kaleidoscope driven by two-source funnel shifts — fshl(A,B,k) and fshr(B,A,k) with A≠B — forcing the LLVM backend's \"terrible\" double-source shift+OR expansion that no prior demo triggered. Compiler stress-test #73.",
    "keys": "Self-running — the mandala animates as the shift count sweeps",
    "category": "rendering",
    "controls": null,
    "selfcheck": {
      "off": "0x5c",
      "len": 2,
      "want": "0xEED4",
      "frames": 500,
      "label": "funnelkal"
    }
  },
  {
    "slug": "bitcensus",
    "title": "Bit-Census Field",
    "desc": "Every cell's colour is a bit-population count of its coordinates — popcount, count-leading-zeros, count-trailing-zeros, parity — cycling the four __builtin_*ll intrinsics, which inline-lower to SWAR bit-count trees. XOR fractal, magnitude bands, ruler, checker. Compiler stress-test #53.",
    "keys": "Self-running — the field scrolls and the intrinsic cycles",
    "category": "ciphers",
    "controls": null,
    "selfcheck": {
      "off": "0x5b",
      "len": 2,
      "want": "0x9516",
      "frames": 500,
      "label": "bitcensus"
    }
  },
  {
    "slug": "disbits",
    "title": "Cross-Byte Bitfields",
    "desc": "A 65816 instruction decoder packs eight fields into a 32-bit word — two of them straddle byte boundaries (group crosses bit 16, flags crosses bit 24), forcing multi-byte shift and mask. Compiler stress-test #52.",
    "keys": "Self-running — decoded fields colour a scrolling map",
    "category": "ciphers",
    "controls": null,
    "selfcheck": {
      "off": "0x77",
      "len": 2,
      "want": "0x31D7",
      "frames": 500,
      "label": "disbits"
    }
  },
  {
    "slug": "critters",
    "title": "Protothread Critters",
    "desc": "A swarm of critters, each a resumable protothread (coroutine) that yields every frame and resumes its scripted patrol via a saved continuation index — case labels inside loops. Compiler stress-test #51.",
    "keys": "Self-running — each critter runs its own patrol",
    "category": "classics",
    "controls": null,
    "selfcheck": {
      "off": "0x79",
      "len": 2,
      "want": "0xAD9F",
      "frames": 500,
      "label": "critters"
    }
  },
  {
    "slug": "cgrade",
    "title": "Many-Arg Color Grade",
    "desc": "A ten-coefficient color grade re-grades a gradient through looks. So many arguments that the extras spill onto the soft stack — the register-overflow calling convention. Compiler stress-test #50.",
    "keys": "Self-running — the scene re-grades through looks",
    "category": "rendering",
    "controls": null,
    "selfcheck": {
      "off": "0x77",
      "len": 2,
      "want": "0x783F",
      "frames": 500,
      "label": "cgrade"
    }
  },
  {
    "slug": "lzdec",
    "title": "LZ77 Decompress Reveal",
    "desc": "A compressed diamond image loads in on-screen, decoded by an LZ77 byte-stream decoder that copies back-references from its own output buffer (sliding window, overlap = RLE). Compiler stress-test #49.",
    "keys": "Self-running — the compressed image decodes and reveals",
    "category": "algorithms",
    "controls": null,
    "selfcheck": {
      "off": "0x6f",
      "len": 2,
      "want": "0x0100",
      "frames": 500,
      "label": "lzdec"
    }
  },
  {
    "slug": "nrecip",
    "title": "Newton Reciprocal Floor",
    "desc": "A scrolling perspective checkerboard floor whose 1/z depth is a multiply-only Newton-Raphson fixed-point reciprocal — no hardware divide, no divide libcall. Compiler stress-test #47.",
    "keys": "Self-running — the floor scrolls toward the horizon",
    "category": "rendering",
    "controls": null,
    "selfcheck": {
      "off": "0x6e",
      "len": 2,
      "want": "0x044A",
      "frames": 500,
      "label": "nrecip"
    }
  },
  {
    "slug": "qsortviz",
    "title": "qsort Sort Visualizer",
    "desc": "Bars reshuffle then re-sort under libc qsort with a rotating function-pointer comparator. Building it caught a real backend crash — an unlegalized G_SCMP three-way compare — since fixed. Compiler stress-test #46.",
    "keys": "Self-running — bars reshuffle then re-sort",
    "category": "algorithms",
    "controls": null,
    "selfcheck": {
      "off": "0x139b",
      "len": 2,
      "want": "0x8EA5",
      "frames": 500,
      "label": "qsortviz"
    },
    "bugFound": {
      "patch": "0016",
      "summary": "a fully generic gap present in every build mode (default 8-bit included — nothing to do with the 16-bit-accumulator feature): the C \"spaceship\" three-way-compare idiom (x>y)-(x<y), which libc qsort comparators commonly use, canonicalizes to a G_SCMP/G_UCMP machine-IR opcode that the backend's legalizer had zero rule for, at any width — an unable to legalize abort, in every mode, with or without LTO.",
      "fixSummary": "One line: mark G_SCMP/G_UCMP as .lower(), routing them through LLVM's existing built-in three-way-compare expansion — no new codegen needed.",
      "fixCommitUrl": "https://github.com/wbniv/llvm-mos-65816/commit/3c2c7a5",
      "demoPlanLink": "https://github.com/wbniv/llvm-mos-65816/blob/main/docs/plans/2026-06-30-46-snes-qsortviz.md"
    }
  },
  {
    "slug": "metaball",
    "title": "Type-Pun Metaballs",
    "desc": "Gooey blobs merge and split, their 1/dist glow computed by the Quake III fast inverse square root — the union{float;uint32} bit hack with magic constant 0x5f3759df. Compiler stress-test #45.",
    "keys": "Self-running — the blobs merge and split on their own",
    "category": "rendering",
    "controls": null,
    "selfcheck": {
      "off": "0x6e",
      "len": 2,
      "want": "0xAEBE",
      "frames": 500,
      "label": "metaball"
    }
  },
  {
    "slug": "sodo",
    "title": "Signed 64-bit Odometer",
    "desc": "A vast signed odometer ticks through zero, each value split into decimal digits by the v%10 / v/=10 loop — exercising the sign-corrected 64-bit divide+modulo libcall __divmoddi4 on a CPU with no hardware divide. Compiler stress-test #43.",
    "keys": "Self-running — the odometer tape ticks through zero",
    "category": "bignums",
    "controls": null,
    "selfcheck": {
      "off": "0x3a",
      "len": 2,
      "want": "0xD2A2",
      "frames": 500,
      "label": "sodo"
    }
  },
  {
    "slug": "duff",
    "title": "Duff Dissolve",
    "desc": "One image dissolves into the next in scattered bursts, each tile copied by the classic Duff's device — a switch whose case labels land in the middle of a do/while loop, forming irreducible control flow. Compiler stress-test #42.",
    "keys": "Self-running — one image dissolves into the next",
    "category": "algorithms",
    "controls": null,
    "selfcheck": {
      "off": "0x6a",
      "len": 2,
      "want": "0x5531",
      "frames": 500,
      "label": "duff"
    }
  },
  {
    "slug": "poolfx",
    "title": "Free-List Pool Allocator",
    "desc": "A sparking particle fountain whose 48 fixed slots are recycled through a manual singly-linked LIFO free list threaded through the slots — alloc pops the head, free pushes it back, no malloc. Compiler stress-test #41.",
    "keys": "Self-running — sparks are born and die as the pool recycles slots",
    "category": "classics",
    "controls": null,
    "selfcheck": {
      "off": "0x72",
      "len": 2,
      "want": "0x2B9B",
      "frames": 500,
      "label": "poolfx"
    }
  },
  {
    "slug": "crctex",
    "title": "CRC32 Hash-Marble Texture",
    "desc": "A flowing procedural field where every cell's colour is a real CRC32 (poly 0xEDB88320) of its coordinates, computed by the byte-at-a-time table algorithm with a 256-entry const look-up table in ROM. Compiler stress-test #40.",
    "keys": "Self-running — the hash field flows and mutates on its own",
    "category": "rendering",
    "controls": null,
    "selfcheck": {
      "off": "0x6d",
      "len": 2,
      "want": "0xDBBA",
      "frames": 500,
      "label": "crctex"
    }
  },
  {
    "slug": "divclock",
    "title": "Division Clock + Odometer",
    "desc": "A sweeping analog clock + rolling odometer, splitting a counter into h:m:s and base-10 digits with compile-time constant divides. A probe for magic-reciprocal strength reduction — with the measured finding that llvm-mos keeps the __udiv libcall on this soft-multiply target. Compiler stress-test #39.",
    "keys": "Self-running — the clock sweeps and the odometer rolls on their own",
    "category": "classics",
    "controls": null,
    "selfcheck": {
      "off": "0x57",
      "len": 2,
      "want": "0xF72E",
      "frames": 500,
      "label": "divclock"
    }
  },
  {
    "slug": "seqvm",
    "title": "Step-Sequencer VM (Sparse Switch)",
    "desc": "A tiny register VM runs a looping bytecode song driving an 8-bar equalizer; its opcode dispatch is a sparse switch (14 non-contiguous cases) the compiler must lower to a binary-search comparison tree, not a jump table. Compiler stress-test #37.",
    "keys": "Self-running — the VM plays its bytecode song on its own",
    "category": "signals",
    "controls": null,
    "selfcheck": {
      "off": "0x6c",
      "len": 2,
      "want": "0xE8C5",
      "frames": 500,
      "label": "seqvm"
    }
  },
  {
    "slug": "polyfill",
    "title": "Polygon Scanline Fill (VLA)",
    "desc": "A filled star tumbles and morphs its point count while an even-odd scanline fill rasterises it — the per-scanline crossing table is a C99 variable-length array (int16_t xs[nv]), a runtime-sized stack frame (alloca/VLA). Compiler stress-test #36.",
    "keys": "Self-running — the star tumbles and morphs on its own",
    "category": "rendering",
    "controls": null,
    "selfcheck": {
      "off": "0x5c",
      "len": 2,
      "want": "0x8ED9",
      "frames": 700,
      "label": "polyfill"
    }
  },
  {
    "slug": "iir-scope",
    "title": "IIR Resonant-Filter Scope",
    "desc": "Four 2-pole IIR resonators plucked into a live oscilloscope — a recursive feedback chain (y[n] from y[n-1], y[n-2]) that, unlike a feed-forward FFT, cannot be reordered. Compiler stress-test #48.",
    "keys": "Self-running — the resonators are plucked and ring on their own",
    "category": "signals",
    "controls": null,
    "selfcheck": {
      "off": "0xbe",
      "len": 2,
      "want": "0x49BD",
      "frames": 700,
      "label": "iir-scope"
    }
  },
  {
    "slug": "hdr-bloom",
    "title": "HDR Additive Bloom",
    "desc": "Six drifting lights summed per cell with saturating (overflow-checked) add — where they overlap the field blows out to white, the HDR bloom look, in 8-bit integers via __builtin_add_overflow. Compiler stress-test #44.",
    "keys": "Self-running — the lights drift and blow out on their own",
    "category": "rendering",
    "controls": null,
    "selfcheck": {
      "off": "0x6a",
      "len": 2,
      "want": "0xF951",
      "frames": 500,
      "label": "hdr-bloom"
    }
  },
  {
    "slug": "bf-vm",
    "title": "Brainfuck Threaded-Code VM",
    "desc": "A Brainfuck interpreter on the SNES dispatching each opcode with a computed goto (goto *handlers[op] → an indirect jump — the \"threaded code\" loop). Watch it compute HELLO WORLD one byte at a time. Compiler stress-test #38.",
    "keys": "Self-running — the VM interprets Hello World on a loop",
    "category": "classics",
    "controls": null,
    "selfcheck": {
      "off": "0x51",
      "len": 2,
      "want": "0x9954",
      "frames": 400,
      "label": "bf-vm"
    }
  },
  {
    "slug": "blossom",
    "displayMode": 7,
    "title": "Blossom",
    "desc": "Barry Martin's Hopalong strange attractor rendered live on SNES and flown around with the joypad. Accumulates into a hit-count grid in WRAM, displayed through Mode 7 with an HDMA colour split.",
    "keys": "← ↑ ↓ → pan · Q/W zoom · X/A attractor · Shift colour",
    "category": "classics",
    "controls": [
      [
        "← ↑ ↓ →",
        "Pan the view"
      ],
      [
        "Q / W",
        "Zoom out / in"
      ],
      [
        "X / A",
        "Next / previous attractor"
      ],
      [
        "Shift",
        "Cycle colour mode"
      ],
      [
        "Enter",
        "Reset view + attractor"
      ]
    ],
    "selfcheck": {
      "off": "0x54",
      "len": 2,
      "want": "0x9047",
      "frames": 3000,
      "label": "gate grid hash (corpus @ WRAM 0x54)"
    }
  },
  {
    "slug": "space-invaders",
    "title": "Space Invaders",
    "desc": "The arcade classic on Super Nintendo — marching aliens, falling bombs, destructible bunkers, bonus UFO. Written in C on an OOP rendering library; boots into a self-playing attract demo.",
    "keys": "← → move · Z/X/A fire · Enter play · Shift attract",
    "category": "classics",
    "controls": [
      [
        "← →",
        "Move the cannon"
      ],
      [
        "Z / X / A",
        "Fire"
      ],
      [
        "Enter",
        "Start — take over the demo"
      ],
      [
        "Shift",
        "Select — back to the attract demo"
      ]
    ],
    "selfcheck": {
      "off": "0x2c",
      "len": 2,
      "want": "0x9D57",
      "frames": 1800,
      "label": "attract CRC host==MAME==bsnes-jg"
    }
  },
  {
    "slug": "spirograph",
    "title": "Spirograph",
    "desc": "Interactive hypotrochoid curves: four curve families (hypotrochoid, epitrochoid, rose, Lissajous) bloom live into a bitmap canvas with real-time parameter control from the joypad.",
    "keys": "↑ ↓ ring · ← → wheel · Q/W pen · X/A family · Shift preset",
    "category": "motion",
    "controls": [
      [
        "↑ / ↓",
        "Ring radius R  + / −"
      ],
      [
        "← / →",
        "Wheel radius r  − / +"
      ],
      [
        "Q / W",
        "Pen offset d  − / +"
      ],
      [
        "X / A",
        "Next / previous curve family"
      ],
      [
        "Shift",
        "Cycle gear preset"
      ],
      [
        "Enter",
        "Reset"
      ]
    ],
    "selfcheck": {
      "off": "0x1381",
      "len": 2,
      "want": "0x32D4",
      "frames": 500,
      "label": "curve-math hash"
    }
  },
  {
    "slug": "3d-wireframe",
    "title": "Wireframe 3-D Solid",
    "desc": "A spinning polyhedron (tetrahedron → cube → octahedron → icosahedron). Each frame: 3×3 rotation matrix, perspective divide, and integer Bresenham lines into a 2bpp bitmap canvas. Compiler stress-test #16.",
    "keys": "↑ ↓ spin Y · ← → spin X · Q/W dolly · X/A solid · S palette · Shift trail",
    "category": "physics",
    "controls": [
      [
        "↑ / ↓",
        "Speed Y-axis  + / −"
      ],
      [
        "← / →",
        "Speed X-axis  + / −"
      ],
      [
        "Q / W",
        "Dolly distance  − / +"
      ],
      [
        "A / X",
        "Previous / next solid (tetra → cube → octa → icosa)"
      ],
      [
        "S",
        "Cycle palette"
      ],
      [
        "Shift",
        "Toggle trail / crisp"
      ],
      [
        "Enter",
        "Reset"
      ]
    ],
    "selfcheck": {
      "off": "0x55",
      "len": 2,
      "want": "0xE737",
      "frames": 300,
      "label": "3-D math hash"
    }
  },
  {
    "slug": "spigot",
    "title": "π Spigot + Monte-Carlo",
    "desc": "Two π algorithms running simultaneously on the SNES: the Rabinowitz-Wagon spigot streams decimal digits via a 76-cell carry chain (32-bit div+mod per cell), while Monte-Carlo darts accumulate in the right panel. Self-running.",
    "keys": "Self-running — no controls",
    "category": "bignums",
    "controls": null,
    "selfcheck": {
      "off": "0x1698",
      "len": 2,
      "want": "0x7711",
      "frames": 500,
      "label": "pi gate CRC"
    }
  },
  {
    "slug": "double-pendulum",
    "title": "Double Pendulum (Chaos)",
    "desc": "Two double pendulums with nearly-identical starting angles swing from a shared pivot. Their mass-2 paths trace white and cyan trails into a bitmap canvas — diverging exponentially, the visual signature of chaos. Compiler stress-test #14.",
    "keys": "Self-running — no controls",
    "category": "physics",
    "controls": null,
    "selfcheck": {
      "off": "0x12e1",
      "len": 2,
      "want": "0xE859",
      "frames": 500,
      "label": "chaos gate CRC"
    }
  },
  {
    "slug": "1d-ca",
    "title": "1-D Cellular Automaton",
    "desc": "Rule 90 draws the Sierpinski triangle; Rule 110 is Turing-complete chaos. Each pixel row is one generation scrolling down — the screen IS the computation. Pure shift+boolean, no multiply. Compiler stress-test #6.",
    "keys": "X toggle rule · Enter reset",
    "category": "cellular",
    "controls": [
      [
        "X",
        "Toggle Rule 90 ↔ Rule 110"
      ],
      [
        "Enter",
        "Reset (restart from seed)"
      ]
    ],
    "selfcheck": {
      "off": "0x20",
      "len": 2,
      "want": "0xAB2C",
      "frames": 400,
      "label": "1d-ca gate"
    }
  },
  {
    "slug": "n-body",
    "title": "N-body Orbits",
    "desc": "Sun, Earth, and Jupiter orbit each other under Newtonian 1/r² gravity. Symplectic Euler integration in Q8.8 fixed-point; trails fade via CGRAM palette dimming. Compiler stress-test #13.",
    "keys": "Self-running — no controls",
    "category": "physics",
    "controls": null,
    "selfcheck": {
      "off": "0x1501",
      "len": 2,
      "want": "0xCC65",
      "frames": 500,
      "label": "N-body (N=3) Symplectic Euler 32 steps hash=0xCC65"
    }
  },
  {
    "slug": "rdiff",
    "title": "Reaction-Diffusion",
    "desc": "Gray-Scott activator-inhibitor PDE growing Turing-instability worm patterns from a 2×2 seed on a 32×28 toroidal grid. 384 32-bit multiplies per frame. Compiler stress-test #8.",
    "keys": "Self-running — no controls",
    "category": "cellular",
    "controls": null,
    "selfcheck": {
      "off": "0x20",
      "len": 2,
      "want": "0x5555",
      "frames": 500,
      "label": "rdiff gate"
    }
  },
  {
    "slug": "factorial",
    "title": "Bignum Factorial",
    "desc": "n! computed live in base-10000 bignum arithmetic — 700 uint16 cells, schoolbook carry-mul. The growing decimal number fills 27 rows as n climbs toward 1000. Stresses __mulsi3 + __udivmodsi4. Compiler stress-test #20.",
    "keys": "Self-running — no controls",
    "category": "bignums",
    "controls": null,
    "selfcheck": {
      "off": "0xf46",
      "len": 2,
      "want": "0x772F",
      "frames": 500,
      "label": "factorial"
    }
  },
  {
    "slug": "newton",
    "title": "Newton's Fractal",
    "desc": "Newton's method on z³−1 colours the complex plane into three basins of attraction — one per cube root of unity — shaded by convergence speed. One full complex division per tile. Compiler stress-test #2.",
    "keys": "Self-running — no controls",
    "category": "fractals",
    "controls": null,
    "selfcheck": {
      "off": "0x20",
      "len": 2,
      "want": "0x4D8B",
      "frames": 500,
      "label": "newton"
    }
  },
  {
    "slug": "buddhabrot",
    "displayMode": 7,
    "title": "Buddhabrot",
    "desc": "The Mandelbrot set’s ghost: random points iterated z²+c, and every escaping orbit is tallied into a 16 KiB density buffer in high WRAM via far scatter-writes. PRNG + far read-modify-write under +mos-a16. Compiler stress-test #4.",
    "keys": "Self-running — no controls",
    "category": "fractals",
    "controls": null,
    "selfcheck": {
      "off": "0x22",
      "len": 2,
      "want": "0x7C31",
      "frames": 6000,
      "label": "gate grid hash (corpus @ WRAM 0x22)"
    }
  },
  {
    "slug": "cordic",
    "title": "CORDIC Rotator",
    "desc": "sin/cos/atan computed with CORDIC — shift-and-add only, no multiply and no divide. A rotating hand sweeps a vector field while a live atan2 reads its angle back. The multiply-free compiler stress-test #12.",
    "keys": "Self-running — no controls",
    "category": "motion",
    "controls": null,
    "selfcheck": {
      "off": "0x135f",
      "len": 2,
      "want": "0x4D41",
      "frames": 500,
      "label": "cordic_gate_crc"
    }
  },
  {
    "slug": "doom-fire",
    "title": "Doom Fire",
    "desc": "The classic PSX-Doom fire effect: a 32×28 heat field rises and flickers from a max-heat source row through a 16-colour ramp. Deliberately multiply-free — stresses indexed 8-bit array sweep + a 16-bit xorshift PRNG. Compiler stress-test #7.",
    "keys": "Self-running — no controls",
    "category": "cellular",
    "controls": null,
    "selfcheck": {
      "off": "0x22",
      "len": 2,
      "want": "0x3C59",
      "frames": 500,
      "label": "doom-fire"
    }
  },
  {
    "slug": "sort-race",
    "title": "Sorting Race",
    "desc": "Quicksort vs heapsort vs mergesort race to sort three bar arrays in real time. The two recursive sorts stress the 65816 soft stack / frame ABI; heapsort is the iterative contrast. Compiler stress-test #17.",
    "keys": "Self-running — no controls",
    "category": "algorithms",
    "controls": null,
    "selfcheck": {
      "off": "0x16ad",
      "len": 2,
      "want": "0xB28F",
      "frames": 500,
      "label": "race CRC host==bsnes-jg (corpus @ WRAM 0x16ad)"
    }
  },
  {
    "slug": "maze",
    "title": "Maze Generate + Solve",
    "desc": "A maze carved by recursive division then solved by A* with an indexed binary-heap priority queue. Stresses genuine recursion (soft-stack frame ABI) + a heap data structure; multiply/divide-free. Compiler stress-test #18.",
    "keys": "Self-running — no controls",
    "category": "algorithms",
    "controls": null,
    "selfcheck": {
      "off": "0xdbc",
      "len": 2,
      "want": "0x0749",
      "frames": 400,
      "label": "maze gen+solve gate CRC"
    }
  },
  {
    "slug": "epicycles",
    "title": "Fourier Epicycles",
    "desc": "A chain of rotating vectors (the Fourier series of a 5-pointed star) draws the star outline live. The many-multiply member: four 16×16→32 multiplies per harmonic, no divide. Compiler stress-test #10.",
    "keys": "Self-running — no controls",
    "category": "motion",
    "controls": null,
    "selfcheck": {
      "off": "0x1366",
      "len": 2,
      "want": "0x4F6C",
      "frames": 500,
      "label": "epicycle-math gate CRC"
    }
  },
  {
    "slug": "life",
    "title": "Conway's Game of Life",
    "desc": "A Gosper glider gun fires gliders into a settling random soup on a 128×112 bit-packed grid. Neighbour counts are summed bit-parallel (SWAR half-adders) — multiply-free boolean logic. Compiler stress-test #5.",
    "keys": "Self-running — no controls",
    "category": "cellular",
    "controls": null,
    "selfcheck": {
      "off": "0x68",
      "len": 2,
      "want": "0xDDF1",
      "frames": 500,
      "label": "LIFE"
    }
  },
  {
    "slug": "harmonograph",
    "title": "Lissajous Harmonograph",
    "desc": "Four damped pendulums trace a Lissajous figure that precesses and spirals inward as the exponential damping decays. Eight fixed-point multiplies per sample (sin·env + env·decay), no divide. Compiler stress-test #9.",
    "keys": "Self-running — no controls",
    "category": "motion",
    "controls": null,
    "selfcheck": {
      "off": "0x5a",
      "len": 2,
      "want": "0x0EBB",
      "frames": 500,
      "label": "HARMO"
    }
  },
  {
    "slug": "julia",
    "displayMode": 7,
    "title": "Julia Set Explorer",
    "desc": "A morphing Julia fractal — z² + c in Q5.10 fixed point, three 32-bit multiplies per iteration, far-stored into high WRAM and drawn through Mode 7 as c orbits a path. The affine matrix spins it while the multiply grind morphs it. Compiler stress-test #1.",
    "keys": "Self-running — no controls",
    "category": "fractals",
    "controls": null,
    "selfcheck": {
      "off": "0x200",
      "len": 2,
      "want": "0x3490",
      "frames": 300,
      "label": "Julia z^2+c"
    }
  },
  {
    "slug": "raycaster",
    "title": "Raycaster Maze",
    "desc": "A Wolfenstein-style grid raycaster: a first-person camera auto-walks a 16×16 maze, one DDA-cast ray per column with a per-column 1/distance divide. The battery’s division member — three __udivsi3 per column. Compiler stress-test #15.",
    "keys": "Self-running — no controls",
    "category": "physics",
    "controls": null,
    "selfcheck": {
      "off": "0x64",
      "len": 2,
      "want": "0xB200",
      "frames": 500,
      "label": "RAY"
    }
  },
  {
    "slug": "burning-ship",
    "title": "Burning Ship Fractal",
    "desc": "The Mandelbrot’s folded cousin — z = (|Re z| + i|Im z|)² + c — rendered as escape-time colour bands with the iconic black ship silhouette. Three multiplies per iteration plus the abs fold; multiply-only. Compiler stress-test #3.",
    "keys": "Self-running — no controls",
    "category": "fractals",
    "controls": null,
    "selfcheck": {
      "off": "0x40",
      "len": 2,
      "want": "0x6F2D",
      "frames": 1500,
      "label": "SHIP"
    }
  },
  {
    "slug": "mandel-float",
    "displayMode": 7,
    "title": "Soft-Float Mandelbrot",
    "desc": "The Mandelbrot set in IEEE-754 single-precision float — on a CPU with no FPU, so every multiply, add and compare is a software-float libcall. The chunky image grinds in because each fat pixel is hundreds of __mulsf3/__addsf3; bit-for-bit identical to host x86. Compiler stress-test #21.",
    "keys": "Self-running — no controls",
    "category": "fractals",
    "controls": null,
    "selfcheck": {
      "off": "0x200",
      "len": 2,
      "want": "0x4169",
      "frames": 1700,
      "label": "soft-float"
    }
  },
  {
    "slug": "mandel-double",
    "displayMode": 7,
    "title": "Double-Precision Mandelbrot",
    "desc": "The Mandelbrot set in 64-bit IEEE-754 double (top half) beside a 32-bit float twin (bottom half). No FPU, so every double op is a soft-float libcall (__muldf3/__adddf3/__gtdf2); the escape buffer is bit-for-bit identical to host x86 across every codegen mode. Compiler stress-test #33.",
    "keys": "Self-running — no controls",
    "category": "fractals",
    "controls": null,
    "selfcheck": {
      "off": "0x20",
      "len": 2,
      "want": "0x0EDF",
      "frames": 2200,
      "label": "mandel-double"
    }
  },
  {
    "slug": "avalanche",
    "displayMode": 7,
    "title": "64-Bit Avalanche",
    "desc": "A 64-bit splitmix64 hash visualised as an avalanche matrix — cell (i,j) = output bit j of hash64(seed^(1<<i)). On a 16-bit CPU every op is a multi-limb libcall (__muldi3/__udivdi3/64-bit shifts); a correct mixer gives a ~50%-dense rainbow field, bit-for-bit identical to host x86. Compiler stress-test #22.",
    "keys": "Self-running — no controls",
    "category": "bignums",
    "controls": null,
    "selfcheck": {
      "off": "0x20",
      "len": 2,
      "want": "0x27EA",
      "frames": 700,
      "label": "64-bit"
    }
  },
  {
    "slug": "boids",
    "title": "Boids Flock",
    "desc": "Reynolds flocking built on a vec2 struct passed and returned BY VALUE — on the 16-bit 65816 that forces the aggregate-return ABI (register pair vs sret), run O(N²) per frame. The coherent, heading-coloured flock is bit-for-bit identical to host x86. Compiler stress-test #26.",
    "keys": "Self-running — no controls",
    "category": "physics",
    "controls": null,
    "selfcheck": {
      "off": "0x38",
      "len": 2,
      "want": "0xA8AB",
      "frames": 1400,
      "label": "struct-abi"
    }
  },
  {
    "slug": "turtle-vm",
    "title": "Bytecode-VM Turtle",
    "desc": "A stack-machine bytecode interpreter drawing LOGO turtle graphics — its switch(op) compiles to a JMP (abs,X) jump table and its ALU ops dispatch through a function-pointer opcode table (indirect/computed control flow no other demo runs). The woven rosette is bit-for-bit identical to host x86. Compiler stress-test #29a.",
    "keys": "Self-running — no controls",
    "category": "classics",
    "controls": null,
    "selfcheck": {
      "off": "0x20",
      "len": 2,
      "want": "0x4007",
      "frames": 600,
      "label": "vm-dispatch"
    }
  },
  {
    "slug": "truchet",
    "title": "Truchet · Packed Bitfields",
    "desc": "The 10-PRINT / Truchet diagonal maze, but every cell is a 16-bit C bitfield struct (orient/style/hue/phase/mark/energy in one word). A colour wave ripples through, stressing the bitfield insert/extract codegen — and/ora/shift, no libcalls — bit-for-bit identical host vs target. Compiler stress-test #29b.",
    "keys": "Self-running — no controls",
    "category": "ciphers",
    "controls": null,
    "selfcheck": {
      "off": "0x9a",
      "len": 2,
      "want": "0xB3E6",
      "frames": 800,
      "label": "bitfields"
    }
  },
  {
    "slug": "lsystem",
    "title": "L-System Plant",
    "desc": "An L-system fractal plant grown by string rewriting — five generations of in-place memmove + memcpy + strlen over a 1 700-byte buffer, then a turtle walks the result with a bracket push/pop stack. The first demo in the battery to call the string libcalls. Bit-for-bit identical to host x86. Compiler stress-test #23.",
    "keys": "Self-running — no controls",
    "category": "fractals",
    "controls": null,
    "selfcheck": {
      "off": "0x42",
      "len": 2,
      "want": "0x8073",
      "frames": 1200,
      "label": "lsystem"
    }
  },
  {
    "slug": "fn-plot",
    "title": "Function Plotter",
    "desc": "A recursive-descent parser evaluates math expressions on the SNES using soft-float arithmetic — every +, *, / is a software libcall (~3 000 cycles). The parser recurses 7 levels deep per pixel, stressing the soft-stack ABI. Four curves cycle automatically. Compiler stress-test #24.",
    "keys": "Self-running — no controls",
    "category": "fractals",
    "controls": null,
    "selfcheck": {
      "off": "0x002a",
      "len": 2,
      "want": "0x2EBE",
      "frames": 500,
      "label": "fn-plot"
    }
  },
  {
    "slug": "bhut",
    "title": "Barnes-Hut Galaxy",
    "desc": "8-body gravity via a recursively built-and-walked quadtree, chased through runtime child indices — the first demo to exercise pointer-chasing dynamic trees. Stars draw trails as the galaxy collapses. Compiler stress-test #31.",
    "keys": "Self-running — no controls",
    "category": "physics",
    "controls": null,
    "selfcheck": {
      "off": "0x60",
      "len": 2,
      "want": "0xEF0B",
      "frames": 500,
      "label": "bhut"
    }
  },
  {
    "slug": "vaprintf",
    "title": "VA_ARG Formatter",
    "desc": "mini_sprintf() formats Lissajous HUD parameters via va_arg — the first demo to exercise the variadic calling convention on the 65816. 9 va_arg reads per gate; 6 curve pairs cycle. Compiler stress-test #32.",
    "keys": "Self-running — no controls",
    "category": "motion",
    "controls": null,
    "selfcheck": {
      "off": "0x3c",
      "len": 2,
      "want": "0xE1F3",
      "frames": 500,
      "label": "vaprintf"
    }
  },
  {
    "slug": "fft",
    "title": "FFT Spectrum Analyser",
    "desc": "32-point radix-2 DIT FFT runs every frame; 16 frequency bars track a sweeping sine tone. Butterfly twiddle multiply = 320 __mulsi3 per frame. Exercises bit-reversal permutation. Compiler stress-test #25.",
    "keys": "Self-running — no controls",
    "category": "signals",
    "controls": null,
    "selfcheck": {
      "off": "0x5c",
      "len": 2,
      "want": "0x6D7A",
      "frames": 500,
      "label": "fft"
    }
  },
  {
    "slug": "hilbert",
    "title": "Hilbert Curve",
    "desc": "An order-4 Hilbert space-filling curve traces 256 grid positions in one connected path. The d2xy kernel uses variable-count 32-bit shifts (__ashlsi3), the corner TEA #30 missed. Compiler stress-test #28.",
    "keys": "Self-running — no controls",
    "category": "motion",
    "controls": null,
    "selfcheck": {
      "off": "0x200",
      "len": 2,
      "want": "0x5999",
      "frames": 500,
      "label": "hilbert gate CRC host==bsnes-jg"
    }
  },
  {
    "slug": "tea",
    "title": "TEA Cipher Avalanche",
    "desc": "32 rounds of the Tiny Encryption Algorithm paint a 16×16 tile grid; 16 key variants each differing by 1 bit demonstrate the avalanche effect live. Hot loop is pure 32-bit shift/add/XOR — no multiply. Compiler stress-test #30.",
    "keys": "Self-running — no controls",
    "category": "ciphers",
    "controls": null,
    "selfcheck": {
      "off": "0x3b",
      "len": 2,
      "want": "0xDF0E",
      "frames": 500,
      "label": "tea"
    }
  },
  {
    "slug": "cardioid",
    "title": "Times-table Cardioid",
    "desc": "200 circle points, chords from i to (k·i) mod N — k animates 2–30 tracing cardioids, nephroids, and epicycloid envelopes. The inner loop runs __mulsi3 + __umodsi3 per chord. Compiler stress-test #27.",
    "keys": "Self-running — no controls",
    "category": "motion",
    "controls": null,
    "selfcheck": {
      "off": "0x20",
      "len": 2,
      "want": "0x523B",
      "frames": 500,
      "label": "cardioid"
    }
  }
,
  {
    "slug": "apollo-daylight",
    "displayMode": 7,
    "title": "Apollo 11 Daylight Launch",
    "desc": "The Saturn V climbing out of the smoke cloud on 16 mm 1969 film — the SVX2 codec's hardest realistic input, at 78.9% compression and a locked true 59.94 fps.",
    "keys": "No controls — the 600-frame loop plays continuously at one frame per VBlank.",
    "category": "video",
    "controls": null,
    "selfcheck": {
      "off": "0x2C",
      "len": 4,
      "want": "0x00000000",
      "frames": 2000,
      "label": "two clean playback loops with zero decode failures"
    }
  },
  {
    "slug": "cartsize-exhirom-6m",
    "title": "ExHiROM 48 Mbit Cartridge Test",
    "desc": "A 6 MiB extended-mapping cartridge — physically 32 Mbit + 16 Mbit — that reads across the 4 MiB device boundary the ordinary SNES maps cannot reach past. The Tales of Phantasia configuration, generated from a port of the bsnes-jg cartridge bus.",
    "keys": "Self-running — no controls",
    "category": "cartridge",
    "controls": null,
    "selfcheck": {
      "off": "0x4c",
      "len": 2,
      "want": "0xA274",
      "frames": 1800,
      "label": "canary oracle (corpus @ WRAM 0x4c)"
    }
  },
  {
    "slug": "cartsize-exhirom-8m",
    "title": "ExHiROM 64 Mbit Cartridge Test",
    "desc": "An 8 MiB ExHiROM cartridge at the extended map's ceiling — including the 64 KiB that is physically present but addressable by nothing, because banks $7E/$7F are WRAM. The model reports those holes and refuses to place data in them.",
    "keys": "Self-running — no controls",
    "category": "cartridge",
    "controls": null,
    "selfcheck": {
      "off": "0x43",
      "len": 2,
      "want": "0x29B9",
      "frames": 1800,
      "label": "canary oracle (corpus @ WRAM 0x43)"
    }
  },
  {
    "slug": "cartsize-hirom-4m",
    "title": "HiROM 32 Mbit Cartridge Test",
    "desc": "A 4 MiB HiROM cartridge that proves its own address decoder: every decoded window, every accepted mirror, and byte runs crossing one and several 64 KiB banks, all checked against a host model of the bsnes-jg cartridge bus. Green screen = every byte landed where the model said.",
    "keys": "Self-running — no controls",
    "category": "cartridge",
    "controls": null,
    "selfcheck": {
      "off": "0x53",
      "len": 2,
      "want": "0x48EE",
      "frames": 1800,
      "label": "canary oracle (corpus @ WRAM 0x53)"
    }
  },
  {
    "slug": "seamdemo",
    "title": "Seam Demo — Three-Act Boundary Cartridge",
    "desc": "A 48 Mbit ExHiROM cartridge that reads all six of its megabytes three different ways: a VM executing the cartridge as one bytecode stream, an adversarial pointer-graph walk touching every decode cell, and a Mode 7 flyover over a cart-spanning atlas. One instruction is split across the physical boundary between the two mask ROMs.",
    "keys": "Self-running — no controls",
    "category": "cartridge",
    "controls": null,
    "selfcheck": {
      "off": "0x65",
      "len": 2,
      "want": "0x3277",
      "frames": 7200,
      "label": "three-act fold (corpus @ WRAM 0x65)"
    }
  },
  {
    "slug": "svx2-fastrom-video",
    "displayMode": 7,
    "title": "SVX2 FastROM Animated Video",
    "desc": "Twenty seconds of NASA launch imagery: two Artemis animations at 2× plus genuine 59.94p Apollo 11 footage, with zero-slip SVX2 decoding.",
    "keys": "Start pause/resume · A resume · L/R frame step · ←/→ seek or hold to shuttle",
    "category": "rendering",
    "controls": [
      ["Start", "Pause or resume"],
      ["A", "Resume after seeking"],
      ["L / R", "Step one frame"],
      ["← / →", "Seek one second; hold for 2×/4×/8× shuttle"]
    ],
    "selfcheck": {
      "off": "0x206",
      "len": 4,
      "want": "0x00000000",
      "frames": 4000,
      "label": "1,200-frame Fast ExHiROM SVX2 composite health"
    }
  },
  {
    "slug": "lzss-gallery",
    "displayMode": 7,
    "title": "LZSS Mode 7 Gallery",
    "desc": "A complete LZSS compressor/decompressor benchmark on the 65816. Sixty-two public-domain artworks use full-composition, aspect-preserving Mode 7 rasters with up to 219 artwork colors, then recompress and verify byte-for-byte on-console. Left/Right or the bounded on-screen chevrons navigate. Compiler stress-test #119.",
    "keys": "Left/Right or tap/click a visible chevron: previous/next work — progress is measured work; D/C/V report stage frames",
    "category": "algorithms",
    "works": [
      ["Katsushika Hokusai","Under the Wave off Kanagawa","https://www.artic.edu/artworks/24645"],
      ["Vincent van Gogh","The Bedroom","https://www.artic.edu/artworks/28560"],
      ["Georges Seurat","A Sunday on La Grande Jatte — 1884","https://www.artic.edu/artworks/27992"],
      ["Pierre-Auguste Renoir","Two Sisters (On the Terrace)","https://www.artic.edu/artworks/14655"],
      ["Claude Monet","Water Lilies","https://www.artic.edu/artworks/16568"],
      ["Paul Cézanne","The Basket of Apples","https://www.artic.edu/artworks/111436"],
      ["Claude Monet","Stack of Wheat","https://www.artic.edu/artworks/111318"],
      ["Vincent van Gogh","Self-Portrait","https://www.artic.edu/artworks/80607"],
      ["Gustave Caillebotte","Paris Street; Rainy Day","https://www.artic.edu/artworks/20684"],
      ["Claude Monet","Poppy Field (Giverny)","https://www.artic.edu/artworks/4783"],
      ["Hieronymus Bosch","The Garden of Earthly Delights","https://www.museodelprado.es/en/the-collection/art-work/the-garden-of-earthly-delights-triptych/02388242-6d6a-4e9e-a992-e1311eab3609"],
      ["Edvard Munch","The Scream","https://www.nasjonalmuseet.no/en/collection/object/NG.M.00939"],
      ["Francisco de Goya","The Third of May 1808","https://www.museodelprado.es/en/the-collection/art-work/the-3rd-of-may-1808-in-madrid-or-the-executions/5e177409-2993-4240-97fb-847a02c6496c"],
      ["Gustav Klimt","The Kiss (Lovers)","https://www.belvedere.at/en/kiss-gustav-klimt"],
      ["Johannes Vermeer","View of Delft","https://www.mauritshuis.nl/en/our-collection/artworks/92-view-of-delft"],
      ["Jacob van Ruisdael","The Windmill at Wijk bij Duurstede","https://www.rijksmuseum.nl/en/collection/SK-C-211"],
      ["Ambrosius Bosschaert the Elder","Flower Still Life","https://www.getty.edu/art/collection/object/103REY"],
      ["Vincent van Gogh","Sunflowers","https://www.nationalgallery.org.uk/paintings/vincent-van-gogh-sunflowers"],
      ["Piet Mondriaan","Tableau No. VII","https://commons.wikimedia.org/wiki/File:Piet_Mondrian_Tableau_N_VII.jpg"],
      ["Hendrick Avercamp","Winter Landscape with Ice Skaters","https://www.rijksmuseum.nl/en/collection/SK-A-1718"],
      ["George Inness","The Home of the Heron","https://www.artic.edu/artworks/64724/the-home-of-the-heron"],
      ["Artist unknown","Dragon","https://www.artic.edu/artworks/140610/dragon"],
      ["After Gao Kegong","Scholar in Landscape","https://www.artic.edu/artworks/12314/scholar-in-landscape"],
      ["Claude Monet","Houses of Parliament, London","https://www.artic.edu/artworks/16584/houses-of-parliament-london"],
      ["John Singer Sargent","Thistles","https://www.artic.edu/artworks/145807/thistles"],
      ["Vincent van Gogh","The Starry Night","https://www.moma.org/collection/works/79802"],
      ["Aert van der Neer","River View by Moonlight","https://id.rijksmuseum.nl/200107781"],
      ["Jacob van Ruisdael","Mountainous Landscape with Waterfall","https://id.rijksmuseum.nl/200108484"],
      ["Meindert Hobbema","Wooded Landscape with Merrymakers in a Cart","https://id.rijksmuseum.nl/200445746"],
      ["Jan van Goyen","Panoramic View of a Wide River","https://id.rijksmuseum.nl/200109337"],
      ["Salomon van Ruysdael","Sailing Vessels on an Inland Body of Water","https://id.rijksmuseum.nl/20026241"],
      ["Willem van de Velde","Ships near the Coast during a Calm","https://id.rijksmuseum.nl/20026835"],
      ["Pieter de Hooch","Interior with Women beside a Linen Cupboard","https://id.rijksmuseum.nl/2003051"],
      ["Pieter Saenredam","Interior of the Sint-Odulphuskerk in Assendelft","https://id.rijksmuseum.nl/200107965"],
      ["Rachel Ruysch","Still Life with Flowers on a Marble Tabletop","https://id.rijksmuseum.nl/20027537"],
      ["Jan Davidsz. de Heem","Still Life with Flowers in a Glass Vase","https://id.rijksmuseum.nl/20029045"],
      ["Thomas Cole","The Voyage of Life: Childhood","https://www.nga.gov/artworks/52450-voyage-life-childhood"],
      ["Thomas Cole","The Voyage of Life: Youth","https://www.nga.gov/artworks/52451-voyage-life-youth"],
      ["Thomas Cole","The Voyage of Life: Manhood","https://www.nga.gov/artworks/52452-voyage-life-manhood"],
      ["Thomas Cole","The Voyage of Life: Old Age","https://www.nga.gov/artworks/52453-voyage-life-old-age"],
      ["Thomas Cole","Tornado in an American Forest","https://www.nga.gov/artworks/195574-tornado-american-forest"],
      ["Frederic Edwin Church","Niagara","https://www.nga.gov/artworks/166436-niagara"],
      ["Frederic Edwin Church","Fog off Mount Desert","https://www.nga.gov/artworks/126132-fog-mount-desert"],
      ["Albert Bierstadt","Buffalo Trail: The Impending Storm","https://www.nga.gov/artworks/166427-buffalo-trail-impending-storm"],
      ["Albert Bierstadt","Mount Corcoran","https://www.nga.gov/artworks/166428-mount-corcoran"],
      ["George Inness","Sunset in the Woods","https://www.nga.gov/artworks/166496-sunset-woods"],
      ["George Inness","Harvest Moon","https://www.nga.gov/artworks/178273-harvest-moon"],
      ["Winslow Homer","East Hampton Beach, Long Island","https://www.nga.gov/artworks/157923-east-hampton-beach-long-island"],
      ["John Constable","Wivenhoe Park, Essex","https://www.nga.gov/artworks/1147-wivenhoe-park-essex"],
      ["John Constable","Cloud Study: Stormy Sunset","https://www.nga.gov/artworks/104243-cloud-study-stormy-sunset"],
      ["Joseph Mallord William Turner","Keelmen Heaving in Coals by Moonlight","https://www.nga.gov/artworks/1225-keelmen-heaving-coals-moonlight"],
      ["Joseph Mallord William Turner","Approach to Venice","https://www.nga.gov/artworks/117-approach-venice"],
      ["Joseph Mallord William Turner","Mortlake Terrace","https://www.nga.gov/artworks/116-mortlake-terrace"],
      ["Giovanni Paolo Panini","Interior of the Pantheon, Rome","https://www.nga.gov/artworks/165-interior-pantheon-rome"],
      ["Canaletto","Entrance to the Grand Canal from the Molo, Venice","https://www.nga.gov/artworks/32589-entrance-grand-canal-molo-venice"],
      ["Camille Pissarro","The Louvre, Afternoon, Rainy Weather","https://www.nga.gov/artworks/195850-louvre-afternoon-rainy-weather"],
      ["Alfred Sisley","Marly-le-Roi","https://www.nga.gov/artworks/177090-marly-le-roi"],
      ["Claude Monet","The Willows","https://www.nga.gov/artworks/178254-willows"],
      ["Ando Hiroshige","Distant View of Mount Akiha, Kakegawa","https://www.nga.gov/artworks/224457-distant-view-mount-akiha-kakegawa"],
      ["Ando Hiroshige","Fujisawa-shuku","https://www.nga.gov/artworks/181425-fujisawa-shuku"]
    ],
    "controls": [
      ["←", "Previous work"],
      ["→", "Next work"]
    ],
    "touchNav": {
      "left": [0, 70, 24, 24],
      "right": [232, 70, 24, 24]
    },
    "selfcheck": {
      "off": "0x46e",
      "len": 2,
      "want": "0x5CF0",
      "frames": 200000,
      "label": "lzss-gallery"
    }
  },
  {
    "slug": "nmitally",
    "title": "VBlank Interrupt Tally",
    "desc": "A real C VBlank interrupt handler updating 16- and 32-bit counters while native-width mainline code runs. This ROM exposed the 65816 ISR entry-width bug and now guards the fixed full-register save contract. Compiler stress-test #123 (Round 7).",
    "keys": "Self-running — 120 interrupts fill the tally, then the verified result holds",
    "category": "signals",
    "controls": null,
    "selfcheck": {
      "off": "0x34",
      "len": 2,
      "want": "0xDA3B",
      "frames": 500,
      "label": "120-NMI width-state tally (corpus @ WRAM 0x34)"
    }
  },
  {
    "slug": "mixedwidth",
    "title": "Split-Personality Link",
    "desc": "A call-ping-pong chain crossing between per-function A16 and forced-A8 code. IR and disassembly prove the feature sets differ while the shared ABI keeps every result bit-exact. Compiler stress-test #126 (Round 7).",
    "keys": "Self-running — the split field visualizes calls crossing the A8/A16 boundary",
    "category": "signals",
    "controls": null,
    "selfcheck": {
      "off": "0x13E7",
      "len": 2,
      "want": "0x83B7",
      "frames": 300,
      "label": "per-function A8/A16 call-boundary CRC (corpus @ WRAM 0x13E7)"
    }
  },
  {
    "slug": "asmisland",
    "title": "Inline-Asm Island",
    "desc": "Native-width C arithmetic crosses an opaque inline-assembly island that changes M, clobbers A and flags, and uses explicitly encoded A8/A16 immediates. Compiler stress-test #125 (Round 7).",
    "keys": "Self-running — moving scan lines cross the red assembly island",
    "category": "signals",
    "controls": null,
    "selfcheck": {
      "off": "0xBE",
      "len": 2,
      "want": "0x260B",
      "frames": 300,
      "label": "opaque inline-asm width-state CRC (corpus @ WRAM 0xBE)"
    }
  }
];
