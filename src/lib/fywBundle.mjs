import { verifyManifest } from '@wbniv/browser-game-player/bundle';
// Verify the frozen chapter before emitting its player page.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
const releases = {
  '0.8': { apk: '1ee7d292dfb793b05087bd89485a8c7b730b5fe0c9cec213ebe20eeb0078dfe5' },
  '0.9': { apk: '3ef29dc87d55934a98d844e489f701c4d0c0893537ba6a5bd567ea609ddfb25b', engine: 'ba25f99bea241403c2865622c675711c7aaf0176' },
  '0.9.1': { apk: 'c3ad1ffac1cc5ffe0f52873549aaa35d00ef4d4400518abdfccf098069baec54', engine: 'ba25f99bea241403c2865622c675711c7aaf0176' },
  '0.9.2': { apk: 'f704f5a2648cbb8e8c8f604b0d7ce9292e2b0dfb28e8066d7a2a9668f4b6bde0', engine: 'ba25f99bea241403c2865622c675711c7aaf0176' },
  '0.9.3': { apk: '5a3f879c1a0be268709e213305c0bcc5569e2caf90b00ba06004be601806a72a', engine: 'ba25f99bea241403c2865622c675711c7aaf0176' },
};
const required = ['config.json', 'frame.html', 'player.css', 'player.js', 'title-preview.jpg', 'wf_game.data', 'wf_game.js', 'wf_game.wasm'];
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
// Match the build receipt's Python json.dumps(files, sort_keys=True) identity.
const canonical = value => value && typeof value === 'object'
  ? '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ': ' + canonical(value[key])).join(', ') + '}'
  : JSON.stringify(value);
export function verifyFywBundle(base) {
  const manifest = JSON.parse(readFileSync(join(base, 'manifest.json'), 'utf8'));
  if (/^bgp1-[a-f0-9]{24}$/.test(manifest.bundleId)) {
    const player = verifyManifest(base, '/apps/finding-your-way/play');
    const source = player.receipt.provenance?.sourceBundle;
    if (typeof source !== 'string') throw Error('Finding Your Way source provenance is required');
    const original = verifyLegacyBundle(base, { bundleId: source });
    for (const name of ['wf_game.js', 'wf_game.wasm', 'wf_game.data']) {
      if (JSON.stringify(player.receipt.files[name]) !== JSON.stringify(original.receipt.files[name])) throw Error('Finding Your Way runtime differs from accepted release');
    }
    const config = JSON.parse(readFileSync(join(base, 'bundles', player.receipt.bundleId, 'config.json'), 'utf8'));
    if (config.adapter !== 'worldfoundry' || JSON.stringify(config.arguments) !== JSON.stringify(original.receipt.runtimeArguments) || player.receipt.provenance.engineCommit !== original.receipt.engineCommit || player.receipt.provenance.stackBytes !== 65536) throw Error('Finding Your Way launch/provenance mismatch');
    return { ...player, version: original.receipt.version };
  }
  return verifyLegacyBundle(base, manifest);
}
function verifyLegacyBundle(base, manifest) {
  if (!/^v0\.(?:8|9|9\.1|9\.2|9\.3)-[a-f0-9]{16}$/.test(manifest.bundleId)) throw Error('Invalid Finding Your Way bundle ID');
  const directory = join(base, 'bundles', manifest.bundleId);
  const receipt = JSON.parse(readFileSync(join(directory, 'receipt.json'), 'utf8'));
  const release = releases[receipt.version];
  if (!release || receipt.bundleId !== manifest.bundleId ||
      !/^[a-f0-9]{40}$/.test(receipt.engineCommit) ||
      receipt.apkSha256 !== release.apk ||
      (release.engine && receipt.engineCommit !== release.engine))
    throw Error('Finding Your Way release provenance mismatch');
  if (receipt.addressSanitizer !== false || receipt.stackBytes !== 65536 || receipt.stackOverflowCheck !== 2)
    throw Error('Finding Your Way requires the remediated 64 KiB release configuration');
  if (!receipt.files || Object.keys(receipt.files).sort().join() !== required.join() ||
      readdirSync(directory).sort().join() !== [...required, 'receipt.json'].sort().join())
    throw Error('Incomplete or unexpected Finding Your Way bundle files');
  if ('v' + receipt.version + '-' + digest(canonical(receipt.files)).slice(0, 16) !== receipt.bundleId)
    throw Error('Finding Your Way bundle identity mismatch');
  let total = 0;
  for (const name of required) {
    const info = receipt.files[name];
    if (!Number.isSafeInteger(info.bytes) || info.bytes < 1 || !/^[a-f0-9]{64}$/.test(info.sha256))
      throw Error(`Invalid Finding Your Way receipt entry: ${name}`);
    const bytes = readFileSync(join(directory, name));
    if (bytes.length !== info.bytes || digest(bytes) !== info.sha256)
      throw Error(`Finding Your Way artifact differs: ${name}`);
    total += bytes.length;
  }
  if (receipt.totalBytes !== total) throw Error('Finding Your Way bundle size mismatch');
  const config = JSON.parse(readFileSync(join(directory, 'config.json'), 'utf8'));
  if (config.version !== receipt.version || !Array.isArray(config.arguments) ||
      !config.arguments.every(arg => typeof arg === 'string') ||
      JSON.stringify(config.arguments) !== JSON.stringify(receipt.runtimeArguments))
    throw Error('Finding Your Way launch configuration mismatch');
  return { receipt, version: receipt.version, frame: `/apps/finding-your-way/play/bundles/${receipt.bundleId}/frame.html` };
}
