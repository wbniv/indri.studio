// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import rehypeExternalLinks from 'rehype-external-links';

// https://astro.build/config
export default defineConfig({
	build: {
		// Inline all compiled CSS into each HTML response. Eliminates the
		// render-blocking <link rel="stylesheet" href="/_astro/Base.*.css">
		// that Lighthouse flagged as the dominant FCP cost in pass-1 + pass-2.
		// Trade-off (~7 KB gz per page) and rationale in
		// docs/plans/2026-05-13-inline-critical-css.md.
		inlineStylesheets: "always",
	},
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
