import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * astro-mermaid-inject
 *
 * Mermaid diagrams are pre-rendered to SVG by scripts/sync-65816-docs.sh and
 * embedded in the doc markdown as base64 in a `data-mermaid-b64` attribute on an
 * (otherwise empty) `<div class="mermaid-diagram">`.
 *
 * We deliberately do NOT inline the SVG markup in the markdown: Astro's
 * rehype-raw round-trip corrupts inline <svg> that contains <foreignObject> HTML
 * labels. It doubles `<br/>` into `<br></br>` (browsers read that as TWO breaks,
 * so multi-line labels overflow their baked box and clip) and it foster-parents
 * the `<g class="nodes">` group out of the SVG into the surrounding prose (every
 * label then renders twice — once in its box, once as stray body text). The
 * pristine mermaid.ink SVG is well-formed and renders correctly; only the
 * re-serialisation breaks it, and a user rehype plugin can't intercept it because
 * Astro runs user `rehypePlugins` *before* its internal rehype-raw.
 *
 * Attribute values pass through rehype verbatim, so the base64 reaches the built
 * HTML untouched. This integration runs AFTER the build, decodes it, and writes
 * the pristine SVG straight into the built `.html` — bypassing rehype entirely, so
 * the browser parses mermaid.ink's exact bytes. No client JS, fully static.
 *
 * (The separate Inter-font label-clip is fixed by the `.mermaid-diagram` CSS in
 * src/pages/docs/[...slug].astro.)
 *
 * Note: runs on `astro build` only (not `astro dev`), so the dev preview shows an
 * empty diagram box; production (the deployed build) is correct. The proper
 * pipeline fix is the Astro 7 / Sätteri migration tracked in
 * docs/plans/2026-06-25-astro-7-mermaid-verbatim-migration.md.
 */
const DIV_RE = /<div class="mermaid-diagram" data-mermaid-b64="([^"]+)"><\/div>/g;

async function* htmlFiles(dir) {
	for (const ent of await readdir(dir, { withFileTypes: true })) {
		const p = join(dir, ent.name);
		if (ent.isDirectory()) yield* htmlFiles(p);
		else if (ent.name.endsWith('.html')) yield p;
	}
}

export default function mermaidInject() {
	return {
		name: 'mermaid-inject',
		hooks: {
			'astro:build:done': async ({ dir, logger }) => {
				const root = fileURLToPath(dir);
				let diagrams = 0;
				let pages = 0;
				for await (const file of htmlFiles(root)) {
					const html = await readFile(file, 'utf8');
					if (!html.includes('data-mermaid-b64=')) continue;
					const out = html.replace(DIV_RE, (_m, b64) => {
						diagrams++;
						return `<div class="mermaid-diagram">${Buffer.from(b64, 'base64').toString('utf8')}</div>`;
					});
					if (out !== html) {
						await writeFile(file, out);
						pages++;
					}
				}
				logger.info(`injected ${diagrams} diagram(s) across ${pages} page(s)`);
			},
		},
	};
}
