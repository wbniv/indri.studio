import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { verifyFywBundle } from '../src/lib/fywBundle.mjs';
const hash = value => createHash('sha256').update(value).digest('hex');
function fixture(t, changes = {}) {
  const base = mkdtempSync(join(tmpdir(), 'fyw-bundle-'));
  t.after(() => rmSync(base, { recursive: true, force: true }));
  const args = ['-L/parmenides_slice-standalone.iff'];
  const contents = { 'config.json': JSON.stringify({version: '0.8', arguments: args, ...changes.config}),
    'frame.html': 'frame', 'player.css': 'css', 'player.js': 'player',
    'wf_game.data': 'data', 'wf_game.js': 'runtime', 'wf_game.wasm': 'wasm' };
  const files = Object.fromEntries(Object.keys(contents).sort().map(name => [name, {bytes: Buffer.byteLength(contents[name]), sha256: hash(contents[name])}]));
  // Independent serialization, matching Python's spaces and sorted entry keys.
  const encoded = '{' + Object.entries(files).map(([name, info]) => JSON.stringify(name) + ': {"bytes": ' + info.bytes + ', "sha256": "' + info.sha256 + '"}').join(', ') + '}';
  const bundleId = 'v0.8-' + hash(encoded).slice(0,16);
  const directory = join(base, 'bundles', bundleId); mkdirSync(directory, {recursive:true});
  for (const [name, content] of Object.entries(contents)) writeFileSync(join(directory, name), content);
  const receipt = {version:'0.8', bundleId, engineCommit:'a'.repeat(40),
    apkSha256:'1ee7d292dfb793b05087bd89485a8c7b730b5fe0c9cec213ebe20eeb0078dfe5',
    addressSanitizer:false, stackBytes:65536, stackOverflowCheck:2,
    runtimeArguments:args, files, totalBytes:Object.values(files).reduce((n,f)=>n+f.bytes,0), ...changes.receipt};
  writeFileSync(join(directory, 'receipt.json'), JSON.stringify(receipt));
  writeFileSync(join(base, 'manifest.json'), JSON.stringify({bundleId}));
  return {base, directory, bundleId};
}
test('accepts one complete content-addressed chapter bundle', t => {
  const f=fixture(t); assert.equal(verifyFywBundle(f.base).frame, '/apps/finding-your-way/play/bundles/'+f.bundleId+'/frame.html');
});
test('rejects changed runtime bytes', t => {
  const f=fixture(t); writeFileSync(join(f.directory,'wf_game.wasm'),'tampered');
  assert.throws(()=>verifyFywBundle(f.base), /artifact differs/);
});
test('rejects missing and unexpected bundle files', t => {
  const f=fixture(t); rmSync(join(f.directory,'wf_game.data'));
  assert.throws(()=>verifyFywBundle(f.base), /bundle files/);
  const g=fixture(t); writeFileSync(join(g.directory,'unverified.js'),'extra');
  assert.throws(()=>verifyFywBundle(g.base), /bundle files/);
});
test('rejects diagnostic stacks and sanitizer builds', t => {
  for (const receipt of [{stackBytes:1048576},{addressSanitizer:true},{stackOverflowCheck:0}]) {
    const f=fixture(t,{receipt}); assert.throws(()=>verifyFywBundle(f.base), /64 KiB release configuration/);
  }
});
test('rejects wrong release, identity and launch configuration', t => {
  const f=fixture(t,{receipt:{apkSha256:'0'.repeat(64)}}); assert.throws(()=>verifyFywBundle(f.base), /provenance/);
  const g=fixture(t,{receipt:{bundleId:'v0.8-'+'0'.repeat(16)}}); assert.throws(()=>verifyFywBundle(g.base), /provenance/);
  const h=fixture(t,{config:{arguments:['-L/wrong.iff']}}); assert.throws(()=>verifyFywBundle(h.base), /launch configuration/);
});
test('rejects manifest paths outside frozen bundles', t => {
  const f=fixture(t); writeFileSync(join(f.base,'manifest.json'), JSON.stringify({bundleId:'../elsewhere'}));
  assert.throws(()=>verifyFywBundle(f.base), /Invalid.*bundle ID/);
});
