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
	loader: glob({ pattern: "**/*.md", base: "./src/content/apps" }),
	schema: z.object({
		title: z.string(),
		// Any JS-parseable date string in the frontmatter becomes a Date.
		// Used to sort upcoming-first on the homepage gallery.
		date: z.coerce.date(),
		// Short teaser line shown on the listing / home page (consumer-facing).
		summary: z.string().optional(),
		// Optional second teaser aimed at the supply side / B2B angle —
		// rendered below the summary on the gallery card, slightly muted.
		// E.g. ParkingSpace uses it to pitch lot owners.
		b2b: z.string().optional(),
		// Pull an app out of the published list without deleting the file.
		draft: z.boolean().default(false),
		// Screenshots rendered below the prose on the per-app landing page.
		// Paths are relative to /public — e.g. "/screenshots/splitledger/balances.png".
		// shape-aware framing (phone/tablet/console) is future work; for now
		// images render at their native aspect ratio inside a grid.
		screenshots: z
			.array(
				z.object({
					src: z.string(),
					alt: z.string().optional(),
				}),
			)
			.default([]),
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

export const collections = { apps, team };
