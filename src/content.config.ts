// Astro 6 content collections — "Content Layer" API.
//
// Two collections:
//   - apps   : each Indri app gets a Markdown entry under src/content/apps/
//   - team   : each founder/employee under src/content/team/
//
// Schemas start minimal (matching the rapid-raccoon-site seed pattern) and
// gain fields incrementally as the per-app rendering wires up screenshots,
// store links, etc. The richer schema in docs/plans/2026-05-13-initial-buildout.md
// is the target — not the v1 starting point.

import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const apps = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/apps" }),
	schema: ({ image }) => z.object({
		title: z.string(),
		// Any JS-parseable date string in the frontmatter becomes a Date.
		// Drives the "Launching Soon" pill on per-app pages when in the
		// future; the homepage gallery sorts alphabetically by title (with
		// finding-your-way pinned last), not by date.
		date: z.coerce.date(),
		// Short teaser line shown on the listing / home page (consumer-facing).
		summary: z.string().optional(),
		// Optional second teaser aimed at the supply side / B2B angle —
		// rendered below the summary on the gallery card, slightly muted.
		// E.g. ParkingSpace uses it to pitch lot owners.
		b2b: z.string().optional(),
		// Pull an app out of the published list without deleting the file.
		draft: z.boolean().default(false),
		// Optional app logo rendered at natural size in the page header,
		// above the title. Use for wordmarks/icons that are too small or
		// wrong aspect ratio to work as screenshots.
		logo: image().optional(),
		// Screenshots rendered below the prose on the per-app landing page.
		// Paths are relative to the markdown file — e.g.
		// "../../assets/screenshots/splitledger/balances.png". `image()`
		// resolves them to ImageMetadata objects that Astro's <Picture>
		// hashes + derives AVIF/WebP variants from at build time.
		screenshots: z
			.array(
				z.object({
					src: image(),
					alt: z.string().optional(),
				}),
			)
			.default([]),
		// Thematic stand-in imagery used only as the home-gallery card's
		// blurred background when an app has no real screenshots yet. Never
		// rendered on the per-app detail page (those are reserved for actual
		// app screenshots). Same {src, alt} shape as `screenshots`.
		cardImages: z
			.array(
				z.object({
					src: image(),
					alt: z.string().optional(),
				}),
			)
			.default([]),
		// Store / download links — one URL per platform. Each present key
		// renders the platform's badge below the app header. Use "#" as a
		// placeholder when the actual store listing doesn't exist yet (a
		// badge still renders, the link just no-ops).
		// External site URL. When set the homepage card links here (new tab)
		// instead of the internal /apps/<slug>/ page, and no static page is
		// generated for this entry.
		externalUrl: z.string().url().optional(),
		storeLinks: z
			.object({
				appStore: z.string().optional(),
				googlePlay: z.string().optional(),
				steam: z.string().optional(),
				blenderExtensions: z.string().optional(),
				github: z.string().optional(),
			})
			.optional(),
		// Per-card overrides for the secondary background image treatment.
		// When fullBleed is true the image covers the whole card instead of
		// sitting in the bottom-right corner; scale and rotation are applied
		// as CSS transform (rotation defaults to the computed grid value).
		cardSecondaryStyle: z
			.object({
				scale: z.number().optional(),
				rotation: z.number().optional(),
				fullBleed: z.boolean().optional(),
				offsetY: z.number().optional(),
				// CSS object-position value — controls which part of the image is
				// visible when object-cover crops it. E.g. "top", "center top".
				objectPosition: z.string().optional(),
			})
			.optional(),
		// Per-app brand kit. Any field set here is written by AppLayout as
		// an override of the studio CSS custom property of the same role:
		//   primary    → --color-primary-container  (accent)
		//   secondary  → --color-primary            (secondary accent / lighter accent)
		//   background → --color-surface            (page bg)
		//   text       → --color-on-surface         (body text)
		//   fontDisplay → --font-display
		//   fontBody    → --font-body
		// Unset fields inherit the studio brand. CSS color values; fonts as
		// full font-family stacks ("Geist, system-ui, sans-serif").
		theme: (() => {
			// Theme color and font-family values get interpolated directly
			// into AppLayout's `style="…"` attribute. Author-controlled
			// today, but block the obvious CSS-injection vectors (a value
			// containing `;` could append rules; `{}<>` could break out of
			// the attribute) so the safety doesn't depend on remembering.
			// Quote marks are allowed because font-family stacks like
			// `"Times New Roman", system-ui` need them.
			const cssSafe = z
				.string()
				.regex(/^[^;{}<>\\]+$/, "theme value must not contain ; { } < > or \\");
			return z
				.object({
					primary: cssSafe.optional(),
					secondary: cssSafe.optional(),
					background: cssSafe.optional(),
					text: cssSafe.optional(),
					fontDisplay: cssSafe.optional(),
					fontBody: cssSafe.optional(),
					// Stylesheet URLs to inject into <head> on this app's pages —
					// typically a single Google Fonts URL covering both faces.
					// Loaded only on pages using this app's theme; studio pages
					// stay slim (just Space Grotesk + Inter from Base).
					// IMPORTANT: each URL's origin must also appear in the CSP
					// `style-src` directive in worker/index.ts. Adding a non-
					// Google Fonts URL here without updating the CSP causes the
					// font to load in dev (no CSP applied) but fail silently in
					// production. Currently only fonts.googleapis.com is allowed.
					fontImports: z.array(z.string().url()).optional(),
				})
				.optional();
		})(),
	}),
});

// Long-form technical docs rendered at /docs/<slug>/ and linked from product
// pages (currently the SNES C Compiler / llvm-mos-65816 entry). Snapshot-copied
// from the llvm-mos-65816 repo by scripts/sync-65816-docs.sh; sourceCommit
// records provenance. Each page also offers .md + .pdf downloads from public/docs/.
const docs = defineCollection({
	loader: glob({ pattern: "**/*.md", base: "./src/content/docs" }),
	schema: z.object({
		title: z.string(),
		// One-line teaser shown in the page header and any docs index.
		summary: z.string().optional(),
		// Which product this doc belongs to (slug under src/content/apps).
		app: z.string().default("llvm-mos-65816"),
		// Provenance: source repo + short commit the markdown was snapshot from.
		sourceRepo: z.string().optional(),
		sourceCommit: z.string().optional(),
		// Sort order within the product's documentation list (ascending).
		order: z.number().default(0),
	}),
});

const team = defineCollection({
	loader: glob({ pattern: "**/*.md", base: "./src/content/team" }),
	schema: z.object({
		name: z.string(),
		role: z.string(),
		// 1–3 sentence bio.
		bio: z.string(),
		// Display order on /about (ascending). Featured subset on homepage
		// uses the `featured` flag below.
		order: z.number(),
		// If true, included in the homepage "team strip" (small preview).
		featured: z.boolean().default(false),
		// Optional social links — render any provided keys as icon links.
		socials: z
			.object({
				twitter: z.string().url().optional(),
				github: z.string().url().optional(),
				mastodon: z.string().url().optional(),
				bluesky: z.string().url().optional(),
				linkedin: z.string().url().optional(),
				email: z.string().email().optional(),
				site: z.string().url().optional(),
			})
			.optional(),
	}),
});

export const collections = { apps, docs, team };
