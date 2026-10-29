import { test } from 'node:test';
import assert from 'node:assert/strict';
import { contentSecurityPolicy } from '../worker/content-security-policy.mjs';

test('allows the SNES chooser to be framed from biohack.net', () => {
  const policy = contentSecurityPolicy('test-nonce', '/apps/bsnes-jg-wasm/');
  assert.match(policy, /frame-src 'self' https:\/\/biohack\.net/);
});

test('keeps the site framing restriction scoped to approved player frames', () => {
  const framePath = '/apps/finding-your-way/play/bundles/bgp1-' + 'a'.repeat(24) + '/frame.html';
  assert.match(contentSecurityPolicy('test-nonce', framePath), /frame-ancestors 'self'/);
  assert.match(contentSecurityPolicy('test-nonce', '/'), /frame-ancestors 'none'/);
});
