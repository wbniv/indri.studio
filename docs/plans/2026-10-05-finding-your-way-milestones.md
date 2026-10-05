# Finding Your Way Android milestones

Publish the two archived Android milestones as compact expandable rows on `/apps/finding-your-way/`. Retain the original summary, journey description and four screenshots. Update the page and homepage gallery artwork with uppercase Greek pi, Π.

## Implementation

- [x] Add `FindingYourWayMilestones.astro`, with archive manifests, direct APK links and file sizes derived from the APK bytes.
- [x] Copy the Temple/Love v0.1 and Love/Reason v0.2 archives unchanged into `public/apps/finding-your-way/milestones/`.
- [x] Keep rows collapsed by default, with one desktop line and two mobile lines. Expand to show route, provenance, input limitations, known issues and checksums.
- [x] Add Π banner/icon artwork; preserve the screenshot gallery and use the branding artwork for the homepage card.
- [x] Static build and existing test suite pass; 11 tests, zero failures.
- [x] Browser checks pass at 1440 px and 390 px: summary heights 52 px and 55.5 px, direct downloads without disclosure toggling, keyboard operation, independent expansion, no horizontal overflow and all four screenshots present.
- [x] Both archive checksum sets pass; all ten files in the built site match the source archives byte for byte.
- [x] Published v0.1.161 (9c892ef); Cloudflare deployment succeeded. Live page is HTTP 200 and all ten archive files match the local archives byte for byte.

## Previews

[![Desktop compact rows](2026-10-05-finding-your-way-milestones/desktop.png)](2026-10-05-finding-your-way-milestones/desktop.html)

[![Mobile compact rows](2026-10-05-finding-your-way-milestones/mobile.png)](2026-10-05-finding-your-way-milestones/mobile.html)

[![Expanded details](2026-10-05-finding-your-way-milestones/archive-expanded.png)](2026-10-05-finding-your-way-milestones/archive-expanded.html)

The HTML files are illustrative mockups. [Actual browser checks](2026-10-05-finding-your-way-milestones/browser-checks.json) record implementation verification.

## Scope

Android distribution only. Phone touch and letterboxed tablet acceptance are future build work; these historical APKs are not rebuilt or relabelled as tablet-ready. Updated native launcher art is prepared in the Finding Your Way build generator for the next build. Web/PWA icon sources are updated in that repository. This release publishes the Indri catalogue page and artwork.

AI assistance: Codex. Exact model/version, tool version and reasoning effort were not available in verified session metadata and are not inferred.

## Published verification

[Live archive checksums and HTTP results](2026-10-05-finding-your-way-milestones/live-download-checks.json).

## Verification — PASS

1. Static build: PASS.

   ```text
   [build] 172 page(s) built in 15.73s
   [build] Complete!
   ```

2. Existing test suite: PASS.

   ```text
   # tests 11
   # pass 11
   # fail 0
   ```

3. Desktop/mobile browser behavior: PASS. Summary heights are 52 px and 55.5 px; direct download, keyboard operation, independent expansion, preserved screenshots and overflow checks all pass. Raw results are in `browser-checks.json`.

4. Live archive integrity: PASS.

   ```text
   PASS: live page contains both compact milestones and original journey text; all ten archive downloads match byte for byte.
   ```

5. GitHub release workflow: PASS. Run 37300649698 completed with conclusion `success`; Cloudflare deployment step succeeded.

## Versioned APK filenames

Both local and published APKs are now named `parmenides-v0.1-b7b49515f3998c85.apk` and `parmenides-v0.2-a6194561e7a05eea.apk`. The manifests, archive receipt paths, checksum lists and explicit HTML download filenames match. Original build paths are retained as provenance in the receipts. APK bytes and hashes are unchanged. Old asset filenames are removed, with no redirects or aliases.

Verification: PASS. Both updated archive checksum sets pass; the static build includes only the new APK filenames. Live browser download verification follows publication.

## Truth v0.3 and ascending timeline

- [x] Publish the tested Love/Reason/Truth v0.3 archive with versioned filename `parmenides-v0.3-a5e28d489566587a.apk`; preserve its original bytes, source checkpoint `20c4820e263ce8c27b507e6a562008eb681feda1`, source/Blender snapshot, verification evidence and signature report.
- [x] Sort milestones numerically by explicit version metadata, oldest first: v0.1 → v0.2 → v0.3.
- [x] Add a thin connecting timeline rail and hollow historical dots, with a filled final dot. Keep each row compact, its download visible and its native disclosure independently expandable.
- [x] Update desktop/mobile/expanded mockups; retain the existing introduction and four screenshots. God is the next realm.

Verification — PASS: Astro built 172 pages, all 11 existing tests passed, and archive checksums passed. Desktop/mobile browser checks confirm ascending order, 52px/55.5px compact rows, collapsed downloads, keyboard/independent expansion and no horizontal overflow. Full playthrough review and phone/tablet acceptance remain open.

## Four realms v0.4 — 2026-10-06

- [x] Add Four realms v0.4 after v0.3, with its actual 2026-10-06 archive date and versioned filename `parmenides-v0.4-7fd2a9d1655591d7.apk`.
- [x] Publish original APK bytes, source/Blender snapshot, test evidence, signature report, build receipt, manifest and checksums. APK SHA-256: `7fd2a9d1655591d79a036d37d81c4566ffc34778011d6bf0055a82de8132a069`.
- [x] Record chapter checkpoint `4c8c488` and engine checkpoint `1aecfbe`; describe God and the native texture-atlas fix accurately. Ending scenes remain previews, and phone/tablet acceptance remains pending.
- [x] Update all three mockups and next-step copy; derive displayed dates from archive metadata and expose verification/signature links when available.

Verification — PASS: all archive checksums pass; Astro builds 172 pages; all 11 existing tests pass. Desktop/mobile browser checks show four ascending rows with 52px/55.5px heights, collapsed downloads, independent keyboard disclosures, no overflow and all four original screenshots preserved. Live download verification follows publication.
