// mode7-contract.mjs — the build-time Mode 7 data contract for the SNES gallery.
//
// Specified by llvm-mos-65816 docs/plans/2026-07-26-123-mode7-gallery-filter.md, "Data contract".
// Added 2026-08-04 after that plan's 2026-08-03 verification found the assertion had never been
// implemented on either site: commits cdaa6f4 (svx2-fastrom-video) and ad87374 (apollo-daylight)
// legitimately added two Mode 7 demos, and the badge/filter set drifted from 9 to 11 with nothing
// failing. This file is that missing tripwire.
//
// THIS FILE IS BYTE-IDENTICAL ON biohack.net AND indri.studio.
// It is the plan's "the two sites use the same expected set" requirement: both galleries import it,
// both assert against it at build time, and MODE7_PARITY_DIGEST is the token that proves the two
// committed ledgers are the same list. Change it in one repo => change it in the other, same day.
//
// The rendered badge/filter COUNT IS NEVER HARDCODED. It is always derived from the demo registry
// (biohack.net: the `snes` content collection; indri.studio: SNES_DEMOS) via mode7SlugsOf(). The
// ledger below is not the source of the count — it is the deliberate-review gate that a count
// change has to pass through.

/**
 * The committed expected Mode 7 set.
 *
 * Adding a Mode 7 demo is a legitimate act, and this list is how it stays a *visible* one: the
 * build fails until the slug is added here (and on the other site) in the same commit that adds
 * the demo. Keep it sorted and unique.
 */
export const EXPECTED_MODE7_SLUGS = Object.freeze([
  'apollo-daylight',
  'avalanche',
  'blossom',
  'buddhabrot',
  'julia',
  'lzss-gallery',
  'mandel-display',
  'mandel-double',
  'mandel-float',
  'mandel-oop',
  'svx2-fastrom-video',
]);

/**
 * FNV-1a/32 of EXPECTED_MODE7_SLUGS.join(',') — the cross-site parity token.
 *
 * A pure-JS hash on purpose: no node:crypto import, so nothing here can follow the gallery script
 * into a client bundle. It is a drift tripwire, not a security primitive.
 */
export const MODE7_PARITY_DIGEST = '34484ac9';

/** FNV-1a/32, lowercase 8-hex-digit. */
export function mode7Digest(slugs) {
  const s = [...slugs].join(',');
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

/**
 * Derive the Mode 7 slug set from the demo registry. `displayMode` is the sole predicate — the
 * plan forbids a second hard-coded slug list anywhere in browser JavaScript or in the templates.
 */
export function mode7SlugsOf(demos) {
  return [...new Set(demos.filter((d) => d.displayMode === 7).map((d) => d.slug))].sort();
}

const list = (a) => (a.length ? a.join(', ') : '(none)');

/**
 * Build-time assertion. Throws (failing the Astro build) when the gallery's Mode 7 surface has
 * drifted from the committed contract.
 *
 * @param {object}   o
 * @param {string}   o.site             site name, for the error message
 * @param {object[]} o.demos            the whole demo registry
 * @param {object[]} o.renderedRecords  the records the page is about to render as cards. A record
 *                                      may appear more than once (biohack.net repeats recent demos
 *                                      in its "Newest Releases" shelf); duplicates are allowed but
 *                                      every expected slug must render at least once, because the
 *                                      `data-display-mode` hook and the visible `7` badge are both
 *                                      emitted from that record's `displayMode`.
 * @returns {{slugs: string[], count: number, renderedCount: number}}
 */
export function assertMode7Contract({ site, demos, renderedRecords }) {
  const errors = [];

  const slugs = mode7SlugsOf(demos);                       // derived, never a literal
  const expected = [...EXPECTED_MODE7_SLUGS];

  const added = slugs.filter((s) => !expected.includes(s));
  const removed = expected.filter((s) => !slugs.includes(s));
  if (added.length || removed.length) {
    errors.push(
      `registry Mode 7 set (${slugs.length}) != committed expected set (${expected.length}).\n` +
        `    in registry but not in the ledger: ${list(added)}\n` +
        `    in the ledger but not in the registry: ${list(removed)}\n` +
        `    If this change is intended, update EXPECTED_MODE7_SLUGS + MODE7_PARITY_DIGEST in\n` +
        `    src/data/mode7-contract.mjs ON BOTH SITES in the same commit.`
    );
  }

  const digest = mode7Digest(expected);
  if (digest !== MODE7_PARITY_DIGEST) {
    errors.push(
      `MODE7_PARITY_DIGEST is stale: ledger hashes to ${digest}, file says ${MODE7_PARITY_DIGEST}.\n` +
        `    Set MODE7_PARITY_DIGEST = '${digest}' here and on the other site — the two sites are\n` +
        `    only known to share an expected set while these tokens match.`
    );
  }

  const rendered = (renderedRecords ?? []).filter((d) => d.displayMode === 7);
  const renderedSlugs = [...new Set(rendered.map((d) => d.slug))].sort();

  const notRendered = slugs.filter((s) => !renderedSlugs.includes(s));
  if (notRendered.length) {
    errors.push(
      `Mode 7 demos in the registry that render no card, so they get no ` +
        `data-display-mode="7" hook and no visible 7 badge: ${list(notRendered)}`
    );
  }

  const strays = renderedSlugs.filter((s) => !slugs.includes(s));
  if (strays.length) {
    errors.push(`cards render a Mode 7 badge for slugs absent from the registry set: ${list(strays)}`);
  }

  if (errors.length) {
    throw new Error(
      `[${site}] Mode 7 data contract failed (docs/plans/2026-07-26-123-mode7-gallery-filter.md):\n` +
        errors.map((e) => `  - ${e}`).join('\n')
    );
  }

  return { slugs, count: slugs.length, renderedCount: rendered.length };
}
