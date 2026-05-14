// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import rehypeExternalLinks from 'rehype-external-links';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
	site: 'https://indri.studio',
	integrations: [sitemap()],
	build: {
		// Inline all compiled CSS into each HTML response. Eliminates the
		// render-blocking <link rel="stylesheet" href="/_astro/Base.*.css">
		// that Lighthouse flagged as the dominant FCP cost in pass-1 + pass-2.
		// Trade-off (~7 KB gz per page) and rationale in
		// docs/plans/2026-05-13-inline-critical-css.md.
		inlineStylesheets: "always",
	},
	// Self-host Space Grotesk + Inter via the Astro Fonts API. Downloads
	// the woff2 files at build time, Latin-subsetted, into
	// dist/_astro/fonts/, served from the same origin as the HTML. The
	// <Font /> components in Base.astro emit @font-face declarations
	// inline + auto-preload tags. Replaces the cross-origin
	// fonts.googleapis.com + fonts.gstatic.com round-trip that
	// Lighthouse's render-blocking-insight flagged as ~1.35 s of wasted
	// critical time on every page. font-display: optional preserved
	// per-family so the no-FOUT/no-CLS contract holds. Ending each
	// fallbacks array with a generic family name (sans-serif) triggers
	// optimizedFallbacks — Astro derives a metric-matched fallback face
	// from the *actual* downloaded woff2's @capsizecss/unpack metrics,
	// which replaces the hand-tuned "Space Grotesk Fallback" / "Inter
	// Fallback" blocks previously in global.css. Plan:
	// docs/plans/2026-05-14-self-host-fonts.md.
	fonts: [
		{
			provider: fontProviders.google(),
			name: "Space Grotesk",
			cssVariable: "--font-space-grotesk",
			weights: ["300", "400", "500", "600", "700"],
			styles: ["normal"],
			subsets: ["latin"],
			display: "optional",
			fallbacks: ["system-ui", "-apple-system", "Segoe UI", "sans-serif"],
		},
		{
			provider: fontProviders.google(),
			name: "Inter",
			cssVariable: "--font-inter",
			weights: ["300", "400", "500", "600"],
			styles: ["normal"],
			subsets: ["latin"],
			display: "optional",
			fallbacks: ["system-ui", "-apple-system", "Segoe UI", "sans-serif"],
		},
	],
	vite: {
		plugins: [tailwindcss()],
	},
	markdown: {
		rehypePlugins: [
			[
				rehypeExternalLinks,
				{
					target: '_blank',
					rel: ['noopener', 'noreferrer'],
					// Marker attribute the prose CSS keys off to render the ↗ glyph.
					properties: { 'data-external': 'true' },
				},
			],
		],
	},
});
