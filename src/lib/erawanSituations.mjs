// Consistency check between the Erawan landing page's situations (index.astro) and the
// recorded replays (src/data/erawan-replays.json). Both name the same twelve situations;
// nothing else ties them together, so a rename or a new scenario in one would otherwise
// leave the other silently stale.
//
// Errors (fail the build): an id on only one side, or the same id in different families.
// Warnings (printed, build continues): the same id with a different title.

/**
 * @param {{id: string, family: string, title: string}[]} page   situations as the page lists them
 * @param {{id: string, family: string, title: string}[]} replays scenarios from erawan-replays.json
 * @returns {{errors: string[], warnings: string[]}}
 */
export function checkSituations(page, replays) {
	const errors = [];
	const warnings = [];
	const byId = new Map(replays.map((r) => [r.id, r]));
	const onPage = new Set(page.map((p) => p.id));
	for (const p of page) {
		const r = byId.get(p.id);
		if (!r) {
			errors.push(`${p.id} is on the page but missing from erawan-replays.json`);
			continue;
		}
		if (r.family !== p.family) errors.push(`${p.id} is in family "${p.family}" on the page but "${r.family}" in erawan-replays.json`);
		if (r.title !== p.title) warnings.push(`${p.id} title differs: page "${p.title}" vs replay "${r.title}"`);
	}
	for (const r of replays) if (!onPage.has(r.id)) errors.push(`${r.id} is in erawan-replays.json but not on the page`);
	return { errors, warnings };
}
