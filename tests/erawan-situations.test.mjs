import assert from "node:assert/strict";
import { test } from "node:test";
import { checkSituations } from "../src/lib/erawanSituations.mjs";

const s = (id, family = "backup", title = `Title ${id}`) => ({ id, family, title });

test("matching sets pass with nothing to report", () => {
	const r = checkSituations([s("B01"), s("C01", "consolidate")], [s("C01", "consolidate"), s("B01")]);
	assert.deepEqual(r, { errors: [], warnings: [] });
});

test("an id only on the page is an error", () => {
	const r = checkSituations([s("B01"), s("B04")], [s("B01")]);
	assert.deepEqual(r.errors, ["B04 is on the page but missing from erawan-replays.json"]);
});

test("an id only in the replays is an error", () => {
	const r = checkSituations([s("B01")], [s("B01"), s("D09", "duplicates")]);
	assert.deepEqual(r.errors, ["D09 is in erawan-replays.json but not on the page"]);
});

test("a family mismatch is an error", () => {
	const r = checkSituations([s("B01", "backup")], [s("B01", "consolidate")]);
	assert.equal(r.errors.length, 1);
	assert.match(r.errors[0], /B01 is in family "backup" on the page but "consolidate"/);
});

test("a title mismatch warns but does not fail", () => {
	const r = checkSituations([s("B06", "backup", "One server to another")], [s("B06", "backup", "One SFTP server to another")]);
	assert.deepEqual(r.errors, []);
	assert.equal(r.warnings.length, 1);
	assert.match(r.warnings[0], /B06 title differs/);
});
