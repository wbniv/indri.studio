import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fywFrameAncestors } from '../worker/fyw-frame-policy.mjs';
test('allows same-origin framing only for a content-addressed FYW frame', () => {
  assert.equal(fywFrameAncestors('/apps/llvm-mos-65816/play/component/bundles/bgp1-'+'a'.repeat(24)+'/frame.html'), "'self'");
  const frame='/apps/finding-your-way/play/bundles/v0.8-f0f6420cb797e119/frame';
  assert.equal(fywFrameAncestors('/apps/finding-your-way/play/bundles/bgp1-'+'a'.repeat(24)+'/frame.html'), "'self'");
  assert.equal(fywFrameAncestors(frame), "'self'");
  assert.equal(fywFrameAncestors(frame+'.html'), "'self'");
  for(const path of ['/', '/apps/finding-your-way/', '/apps/finding-your-way/play/', frame+'/extra', frame.replace('f0f6420cb797e119','invalid'), '/apps/llvm-mos-65816/play/frame.html'])
    assert.equal(fywFrameAncestors(path), "'none'");
});
