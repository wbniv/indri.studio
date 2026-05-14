#!/usr/bin/env node
// Walks public/screenshots/ for *.png / *.jpg / *.jpeg, emits AVIF + WebP
// siblings next to each source, and writes src/data/screenshot-dims.json —
// a flat map of public-path → {width, height} consumed by Screenshot.astro
// to set explicit <img> dimensions (eliminates CLS).
//
// Idempotent: variants are skipped when they already exist AND their mtime
// is newer than the source's. The dims manifest is rewritten every run.
//
// Usage:  node scripts/optimize-screenshots.mjs [--force] [-h|--help]
//   --force   regenerate variants even if up-to-date

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const HELP = `optimize-screenshots — generate AVIF + WebP variants and a dimensions manifest

usage: node scripts/optimize-screenshots.mjs [--force] [-h|--help]

  --force   regenerate variants even when newer than source (default: skip)
`;

const argv = process.argv.slice(2);
if (argv.includes("-h") || argv.includes("--help")) {
	process.stdout.write(HELP);
	process.exit(0);
}
const force = argv.includes("--force");

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const screenshotsDir = path.join(repoRoot, "public", "screenshots");
const manifestPath = path.join(repoRoot, "src", "data", "screenshot-dims.json");

const AVIF_OPTS = { quality: 60, effort: 6 };
const WEBP_OPTS = { quality: 75 };

async function walk(dir) {
	const out = [];
	for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) out.push(...(await walk(full)));
		else if (/\.(png|jpe?g)$/i.test(entry.name)) out.push(full);
	}
	return out;
}

async function isUpToDate(variantPath, sourceMtimeMs) {
	try {
		const stat = await fs.stat(variantPath);
		return stat.mtimeMs >= sourceMtimeMs;
	} catch {
		return false;
	}
}

async function convert(src, dst, encoder, opts) {
	await sharp(src)[encoder](opts).toFile(dst);
}

function toPublicPath(absPath) {
	const publicDir = path.join(repoRoot, "public");
	return "/" + path.relative(publicDir, absPath).split(path.sep).join("/");
}

const ts = () => new Date().toISOString();

const sources = await walk(screenshotsDir);
if (sources.length === 0) {
	// Empty source dir is benign for a fresh clone / CI cache miss. Warn
	// and let the build proceed with an empty manifest rather than
	// hard-failing.
	console.warn(`${ts()} warning: no source images found under ${screenshotsDir}`);
	await fs.mkdir(path.dirname(manifestPath), { recursive: true });
	await fs.writeFile(manifestPath, JSON.stringify({}, null, "\t") + "\n");
	process.exit(0);
}

let generated = 0;
let skipped = 0;
const dims = {};

for (const src of sources.sort()) {
	const srcStat = await fs.stat(src);
	const stem = src.replace(/\.(png|jpe?g)$/i, "");

	const meta = await sharp(src).metadata();
	if (!meta.width || !meta.height) {
		console.error(`${ts()} skipping ${src} (no dimensions in metadata)`);
		continue;
	}
	dims[toPublicPath(src)] = { width: meta.width, height: meta.height };

	for (const [ext, encoder, opts] of [
		["avif", "avif", AVIF_OPTS],
		["webp", "webp", WEBP_OPTS],
	]) {
		const dst = `${stem}.${ext}`;
		if (!force && (await isUpToDate(dst, srcStat.mtimeMs))) {
			skipped++;
			continue;
		}
		await convert(src, dst, encoder, opts);
		generated++;
		const dstStat = await fs.stat(dst);
		const pct = ((1 - dstStat.size / srcStat.size) * 100).toFixed(0);
		console.log(`${ts()} ${path.relative(repoRoot, dst)}  ${(dstStat.size / 1024).toFixed(0)} KB  (${pct}% smaller)`);
	}
}

await fs.mkdir(path.dirname(manifestPath), { recursive: true });
await fs.writeFile(manifestPath, JSON.stringify(dims, null, "\t") + "\n");

console.log(
	`${ts()} done: ${sources.length} sources, ${generated} variants generated, ${skipped} up-to-date, manifest → ${path.relative(repoRoot, manifestPath)}`,
);
