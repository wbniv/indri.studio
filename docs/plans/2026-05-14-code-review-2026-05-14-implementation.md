# Implement code review 2026-05-14

## Context

`docs/investigations/2026-05-14-code-review.md` is a 275-line walkthrough of the indri.studio repo at HEAD `82641f5`. It enumerates 24 actionable findings across four severities (P1 bugs, P2 doc drift, P3 hardening, P4 polish) plus S4 which is praise (no action). HEAD has advanced two commits since (`c7f8e89`), both confined to lemur/footer styling on `/colophon` — all 24 findings have been re-verified against the current tree and **all still hold**.

The reviewer also prescribes a recommended order of operations, which this plan follows. The goal is to close the entire list in a single working session, landing one commit per severity band so each PR is self-contained and easy to revert if needed. H5 (IAM token mismatch) is genuinely investigative — it gets a "verify-and-report" step rather than blind permission expansion, and may surface a follow-up plan.

The plan deliberately picks the **lightest-touch** option whenever the reviewer offered multiple paths, on the principle that the project today is small enough that hardening should be proportional. Where a stronger option meaningfully reduces future surprise, the plan picks the stronger option.

## Sources of truth

- The review: [`docs/investigations/2026-05-14-code-review.md`](../SRC/indri.studio/docs/investigations/2026-05-14-code-review.md) — finding numbers used below (B1-B5, D1-D5, H1-H9, S1-S5) match the review.
- CLAUDE.md / `~/SRC/CLAUDE.md`: cascading project conventions.
- `Taskfile.yml`: canonical command surface.

## Commit plan (5 commits, ordered by severity)

Use `TaskCreate` at the start of execution with one task per commit (5 tasks). Mark in_progress when starting each commit, completed when committed.

---

### Commit 1 — P1 user-visible (B1–B5)

User-facing bugs and the "lying colophon" first.

**B1 + B2 (coupled) — `featured` flag and `/about` route**

Decision: keep the `featured` schema field; gate the homepage team strip on it; **remove dangling `/about` references from docs** (don't build the page yet — out of scope for this pass, lives in the buildout plan for later).

- `src/pages/index.astro:16` — change `getCollection("team")` to `getCollection("team", ({ data }) => data.featured)`.
- `README.md:62` and `:79` — drop the `/about` references; rephrase the homepage team description as "subset where `featured: true`" and note the full `/about` page is planned, not shipped.
- `CLAUDE.md:71` — same edit: remove the implied claim that `/about` exists today.

**B3 — Store-badge `#` placeholders**

Decision: suppress the badge entirely when `link === "#"`.

- `src/components/StoreBadges.astro:32` — extend the filter from `links && links[e.key]` to `links && links[e.key] && links[e.key] !== "#"`.

**B4 — `secrets-pull.sh` `--force` claim**

Decision: fix the Taskfile description (the script works fine; the docs overpromise).

- `Taskfile.yml:45` — strip the "Refuses on drift unless --force" tail. Replace with the actual behaviour: "Render local .env from SSM (/indri-studio/cloudflare/*). Overwrites any existing .env."

**B5 — Colophon "served via Google Fonts" bullet**

Decision: rewrite to reflect self-hosted reality.

- `src/pages/colophon.astro:180-190` (the fourth bullet under SET IN) — new copy:
  > Space Grotesk and Inter are self-hosted: Astro's Fonts API downloads the woff2 files at build time into `dist/_astro/fonts/`, and Workers Static Assets serves them same-origin with `font-display: optional` plus metric-matched fallback faces, so first paint never blocks on the type. Material Symbols Outlined is still served from `fonts.googleapis.com` on the pages that use it.

Commit message: `Code review P1: featured gate, # badge skip, secrets-pull doc, colophon fonts`

---

### Commit 2 — P2 doc drift (D1–D5)

Pure doc edits; no behaviour change.

**D1 — CLAUDE.md grey palette table**

Decision: update the table to current values AND append a "source of truth" pointer line.

- `CLAUDE.md` grey palette table — replace the four shown values with current ones from `src/styles/global.css`:
    - `--color-grey-900` → `#3D3833` (Primary background)
    - `--color-grey-700` → `#4A4641` (Card surfaces)
    - `--color-grey-200` → `#C8C0B8` (Secondary text)
    - `--color-grey-50` → `#F5F0E8` (High-emphasis text)
- Add a note below: "Authoritative values live in `src/styles/global.css`; this table is a convenience snapshot."

**D2 — DEPLOY.md wrangler-action version**

- `docs/DEPLOY.md:15` — `@v3` → `@v4`.

**D3 — DEPLOY.md TF-vs-Worker split**

- `docs/DEPLOY.md` around line 67 — rewrite paragraph. TF-declared: Always-Use-HTTPS, custom-domain bindings, DNS. Worker-implemented: www→apex 301 (`worker/index.ts`). Cache TTL: `public/_headers`, not TF.

**D4 — Schema `date` docstring**

- `src/content.config.ts:21` — replace "Used to sort upcoming-first on the homepage gallery" with "Drives the 'Launching Soon' pill on per-app pages when in the future; homepage gallery sorts alphabetically by title (with finding-your-way pinned last)."

**D5 — claude-code-authoring-formats thirteen/fifteen**

- `src/content/apps/claude-code-authoring-formats.md:23` — change "Thirteen directions are bundled" to "Fifteen directions are bundled" (matches both line 25 and the 15-tile grid).

Run `task md -- src/content/apps/claude-code-authoring-formats.md` after the edit to preview.

Commit message: `Code review P2: doc drift — palette, wrangler v4, TF/Worker split, date doc, count`

---

### Commit 3 — P3 hardening (H1–H4, H6–H9; H5 separate)

The bulk of the engineering. H5 is broken out to commit 4 because it needs investigation.

**H1 — ScrollToTop listener leak**

Decision: option 2 from the review — rewrite as a non-`is:inline` module script so Astro bundles it and runs it once on initial load.

- `src/components/ScrollToTop.astro:59` — drop `is:inline`, leave the script as a regular `<script>`. Astro will hoist + bundle, single execution. Verify by reading the build output for `dist/colophon/index.html` after `task build` and confirming the IIFE is referenced via a `<script type="module" src="…">` not inlined.
- Also verify (no fix expected): `src/pages/apps/[...slug].astro:131-201` is already non-`is:inline` per the review — confirm during the same build pass.

**H2 — Theme string validation**

Decision: regex validation in the Zod schema (defence at the boundary).

- `src/content.config.ts` — wherever the `apps` collection theme schema lives (the review references it via `src/layouts/AppLayout.astro:29-38` consumption side; the schema declaration is in `content.config.ts`), add `.regex(/^[#a-zA-Z0-9()% ,.\-]+$/)` to each theme color string field. Reject anything with `;`, `{`, `}`, `:` (other than inside `oklch(...)` parens), backslashes, or other CSS-injection vectors.
- Build will fail loudly on invalid theme values, which is the right place to catch them.

**H3 — `/screenshots/*` cache headers**

Decision: drop `immutable`, shorten to 1 day. The reviewer's "two safer options" — hashing filenames would touch the asset pipeline; trading bandwidth for correctness is the proportional call.

- `public/_headers:22-23`:
    ```
    /screenshots/*
      Cache-Control: public, max-age=86400
    ```
- Update the comment block above the rules to record the rationale: "Screenshots aren't content-hashed (raw public/ files with stable URLs); use a 1-day TTL so in-place replacements propagate within a day. Switch to content-hashed names via Astro's asset pipeline if this becomes too chatty."

**H4 — CI screenshot regen**

Decision: add `node scripts/optimize-screenshots.mjs` as a pre-build step in the deploy workflow. Idempotent; cheap on CI when sources are unchanged.

- `.github/workflows/deploy.yml:40` — insert a new step before `pnpm build`:
    ```yaml
    - name: Regenerate screenshot variants
      run: node scripts/optimize-screenshots.mjs
    ```
- Note: this needs H9 (exit-0 on no sources) to land first or in the same commit, otherwise a freshly-cloned CI runner with no committed screenshots would fail. They're in the same commit so the ordering inside the commit is fine — both files change together.

**H6 — Unused `navLinkClass`**

- `src/layouts/Base.astro:23-29` — delete the entire `navLinkClass` declaration.

**H7 — Mailto `target`/`rel`**

- `src/layouts/Base.astro:187-192` — drop `target="_blank"` and `rel="noopener noreferrer"` from the `mailto:` `<a>`.

**H8 — Lemur intrinsic dimensions + resize for display (expanded scope)**

The original review only asked for intrinsic dimensions on the 404 lemur. Extending the scope per user: both lemur images are 1536×1024 PNGs (~1-1.5 MB each) and rendered at most 480px wide (404) or 384px wide (colophon). They ship 4-5× larger than needed. Fix: move the source PNGs out of `public/` into `src/assets/`, swap both `<img>` tags for Astro's `<Image />`, and let the build emit resized variants. Source files stay in the repo for future re-renders; only the resized derivatives ship to `dist/`.

- Move:
    - `public/lemur.png` → `src/assets/lemur.png` (1536×1024 source preserved)
    - `public/mascot-lemur.png` → `src/assets/mascot-lemur.png` (1536×1024 source preserved)
- `src/pages/404.astro:59-66`:
    ```astro
    ---
    import { Image } from "astro:assets";
    import lemur from "../assets/lemur.png";
    ---
    <Image
      src={lemur}
      alt=""
      width={480}
      densities={[1, 2]}
      class="lemur-idle block w-full max-w-[420px] md:max-w-[480px] mx-auto select-none"
      loading="eager"
      decoding="async"
    />
    ```
    `densities={[1, 2]}` emits 480w and 960w via srcset — retina-crisp without overshipping on 1× displays. Astro injects intrinsic `width`/`height` automatically. The `<Image />` `class` prop forwards to the inner `<img>`, so `lemur-idle` keeps animating.
- `src/pages/colophon.astro:452-461`: same treatment.
    ```astro
    ---
    import { Image } from "astro:assets";
    import mascotLemur from "../assets/mascot-lemur.png";
    ---
    <Image
      src={mascotLemur}
      alt="Indri mascot — a stylised ring-tailed lemur with neon purple eyes, tail looped over its head"
      width={384}
      densities={[1, 2]}
      class="lemur-idle relative top-2 w-full max-w-sm h-auto block"
      loading="lazy"
    />
    ```
- Verify with `task build` that:
    - `dist/404.html` references e.g. `/lemur.<hash>.webp` (or `.avif`/`.png`) at 480w + 960w in a srcset.
    - `dist/colophon/index.html` references `/mascot-lemur.<hash>.webp` at 384w + 768w.
    - Both built files include `width`/`height` attributes on the `<img>`.
    - Byte size of the largest variant is < 300 KB (down from ~1 MB+).

**H9 — `optimize-screenshots.mjs` exit code**

- `scripts/optimize-screenshots.mjs:70-73` — change `process.exit(1)` to `process.exit(0)`, downgrade the message from `console.error` to `console.warn`, prefix with "warning: ".

Commit message: `Code review P3: ScrollToTop bundling, theme schema, cache TTL, CI regen, polish`

---

### Commit 4 — P3 IAM token investigation (H5)

Investigative, not blind. Three possibilities per the review; the right action depends on which is real.

Steps:

1. Run `task tf-plan` from `infrastructure/cloudflare/global/` with the narrow token active (whatever the CI / Taskfile defaults to). Capture stdout/stderr.
2. If plan succeeds (no 403s): the narrow token has more permissions than `token.tf` claims. Cross-check actual API token in Cloudflare's dashboard against the `permission_groups` block. Update `token.tf` to match the real grants (or, if the dashboard shows extras that aren't needed by the resources, narrow there too).
3. If plan fails (any 403): the resources in `global/` cannot be applied with the narrow token. Two sub-paths:
    - Add the missing `permission_groups` to `token.tf` so the narrow token can manage everything `global/` declares. Re-apply.
    - Or split the configs: an `account-scoped` (zone, zone-settings, email-routing) module that uses a broader bootstrap-style token, and the existing `runtime` (DNS, Workers script, Workers custom domain) which the narrow token handles. The review notes this option but doesn't recommend it — too much restructuring for the current scale.
4. Write findings into `docs/investigations/2026-05-14-iam-token-audit.md` regardless of outcome — keeps the next maintainer from re-investigating.

If step 2 or 3a is the answer, the same commit lands the token expansion. If 3b is needed, this plan stops at the investigation doc and a follow-up plan covers the restructure.

Commit message will depend on outcome: either `Code review H5: expand iam-self token to match global/ resources` or `Code review H5: audit results — token currently bootstrap-scoped, follow-up plan filed`.

---

### Commit 5 — P4 polish (S1, S2, S3, S5; S4 needs no action)

Lowest stakes; all in one pass.

**S1 — `--color-surface-tint` → reference `--color-primary-container`**

- `src/styles/global.css:65` — `--color-surface-tint: #b026ff;` → `--color-surface-tint: var(--color-primary-container);`.
- Verify Tailwind v4 still resolves this (read the `dist/_astro/*.css` output after `task build` and check `--color-surface-tint` either resolves to the hex or stays as `var(...)`).

**S2 — `--text-headline-sm` letter-spacing**

- `src/styles/global.css:130-132` — add `--text-headline-sm--letter-spacing: <consistent value>;` using the same scaling rule as `lg`/`md`. Read the existing `lg` (line ~125) and `md` (line ~128) values to pick the proportional value for `sm`.

**S3 — README leads with task**

- `README.md:18-25` — flip ordering so `task dev` / `task build` / `task preview` are shown first; underneath each, footnote the underlying `pnpm` command in a small block (one-line per command, e.g. "wraps `pnpm dev`").
- Don't touch CLAUDE.md (its rule already says task is canonical — this commit just aligns README with it).

**S5 — `scroll-mt-20` adapting to header shrink**

Decision: implement, since it's a clean self-contained change.

- `src/styles/global.css` — register a custom property and a utility class:
    ```css
    @property --header-shrink {
      syntax: "<number>";
      initial-value: 0;
      inherits: true;
    }

    @utility scroll-mt-header {
      scroll-margin-top: calc(80px - 32px * var(--header-shrink, 0));
    }
    ```
    (Confirm Tailwind v4 `@utility` is the right pragma — alternative is a plain class declaration in a `@layer utilities` block.)
- Replace every `scroll-mt-20` in `src/pages/index.astro` (3 usages: `#apps`, `#about`, `#team`) and `src/pages/colophon.astro` (5 usages: `#set-in`, `#palette`, `#built-with`, `#motifs`, `#references`) with `scroll-mt-header`.

Commit message: `Code review P4: surface-tint var, headline-sm spacing, README task-first, anchor scroll-mt`

---

## Critical files to be modified

- `src/pages/index.astro` (B1, S5)
- `src/pages/colophon.astro` (B5, S5)
- `src/pages/404.astro` (H8)
- `src/pages/apps/[...slug].astro` (H1 verify only)
- `src/layouts/Base.astro` (H6, H7)
- `src/layouts/AppLayout.astro` (verified context for H2; no edit if schema-only)
- `src/components/StoreBadges.astro` (B3)
- `src/components/ScrollToTop.astro` (H1)
- `src/content.config.ts` (D4, H2)
- `src/content/apps/claude-code-authoring-formats.md` (D5)
- `src/styles/global.css` (S1, S2, S5)
- `README.md` (B1/B2, S3)
- `CLAUDE.md` (B1/B2, D1)
- `Taskfile.yml` (B4)
- `docs/DEPLOY.md` (D2, D3)
- `public/_headers` (H3)
- `.github/workflows/deploy.yml` (H4)
- `scripts/optimize-screenshots.mjs` (H9)
- `infrastructure/cloudflare/iam-self/token.tf` (H5, conditional on audit)
- `docs/investigations/2026-05-14-iam-token-audit.md` (H5, new file)

## Verification

Per `~/SRC/CLAUDE.md`'s "Plan verification format" rule — these are the numbered steps to run after each commit, with raw output captured back to this plan (or a sibling verification log).

### After commit 1 (P1)

1. `task build` — exits 0. Quote the `[build] Complete!` line.
2. `grep -c 'href="#"' dist/apps/*/index.html` — should be `0` (or only inside aria-labels). Quote the count.
3. `grep -n 'featured' dist/index.html` — homepage HTML should now reflect the filter; with all four founders already `featured: true`, count of rendered team cards should still equal 4. Quote.
4. `grep -i 'about\.astro\|/about' README.md CLAUDE.md` — should find zero or only updated/contextual mentions. Quote the lines found.
5. Open `dist/colophon/index.html` and grep for `Google Fonts` — should NOT match unless inside a quoted URL for Material Symbols. Quote.

### After commit 2 (P2)

1. `grep -A1 'color-grey' CLAUDE.md` — quote the table. Cross-reference against `grep -E 'color-grey-(900|700|200|50)' src/styles/global.css`. They must match.
2. `grep 'wrangler-action' docs/DEPLOY.md .github/workflows/deploy.yml` — both report `@v4`.
3. `grep -i 'thirteen\|fifteen' src/content/apps/claude-code-authoring-formats.md` — both occurrences say "fifteen" (or neither contradicts the other).
4. Open `dist/apps/claude-code-authoring-formats/index.html` and verify the rendered count matches.

### After commit 3 (P3 main)

1. `task build` exit 0.
2. Inspect `dist/colophon/index.html` for the ScrollToTop script — should appear as `<script type="module" src="/_astro/…">`, not inlined. Quote the line.
3. `grep -n 'target="_blank"\|noopener' src/layouts/Base.astro` — should match zero in the mailto context.
4. `grep -c 'navLinkClass' src/layouts/Base.astro` — should be `0`.
5. `grep 'width=' src/pages/404.astro` — should now show `width="…"` on the lemur img.
6. `grep -A1 '/screenshots/\*' public/_headers` — should show `max-age=86400`, no `immutable`.
7. `grep -A3 'optimize-screenshots' .github/workflows/deploy.yml` — should show a pre-build step.
8. `node scripts/optimize-screenshots.mjs` on a clean dir (mock by renaming `public/screenshots/` temporarily, or unit-test the empty branch) — should exit 0 with a warning, not exit 1.

### After commit 4 (H5)

1. Either: `task tf-plan` succeeds → quote the "X to add, Y to change, Z to destroy" summary. Confirm the new `token.tf` permission_groups match the resources in `global/`.
2. Or: investigation doc `docs/investigations/2026-05-14-iam-token-audit.md` exists, names which scenario was real, and links to a follow-up plan.

### After commit 5 (P4)

1. `task build` exit 0.
2. Inspect `dist/_astro/…css` for `--color-surface-tint` — should be either `#b026ff` (resolved) or `var(--color-primary-container)` (preserved). Either way, both surface-tint and primary-container should be identical when rendered.
3. `grep '\-\-text-headline-sm' src/styles/global.css` — three lines (font-size, line-height, font-weight, letter-spacing — total of four).
4. `grep 'scroll-mt-20' src/pages/*.astro` — should be `0` matches.
5. Manual: open dev server (`task dev`), scroll halfway down `/colophon`, click `#palette` in URL bar (or use the anchor on the homepage). The anchored heading should land just below the shrunken header, not under it nor far below.

## Execution notes

- `TaskCreate` 5 tasks at the start, one per commit. `in_progress` → `completed` as each lands.
- Each commit follows the project's standard rule (HEREDOC body, Co-Authored-By: Claude Opus 4.7 (1M context), no `--no-verify`, etc.).
- After each `.md` edit, run `task md -- <filename>` per project convention.
- Run `task build` at least once per commit to catch syntax errors before staging.
- After all commits land: append a one-line "code-review pass complete" entry to `TODO.md` done section, and add a closing note to `docs/investigations/2026-05-14-code-review.md` referencing the implementing commit SHAs.
