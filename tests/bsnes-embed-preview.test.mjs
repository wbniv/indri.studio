import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// define:vars scripts are served inline without TypeScript transpilation.
const component = readFileSync(new URL('../src/components/BsnesEmbedExamples.astro', import.meta.url), 'utf8');
const inline = component.match(/<script define:vars=\{\{ examples, frame \}\}>([\s\S]*?)<\/script>/)[1];

function setup(checked = false) {
  const elements = new Map();
  const listeners = new Map();
  const messages = [];
  function element(id) {
    if (!elements.has(id)) elements.set(id, {
      value: 'html', checked, textContent: '', style: {},
      handlers: {}, addEventListener(type, callback) { this.handlers[type] = callback; },
      contentWindow: { postMessage(message) { messages.push(message); } },
    });
    return elements.get(id);
  }
  const context = {
    examples: { html: { controls: 'controls source', bare: 'bare source' }, astro: { controls: 'astro controls', bare: 'astro bare' } },
    frame: '/bundle/frame.html',
    document: { querySelector: element },
    window: { addEventListener(type, callback) { listeners.set(type, callback); } },
    location: { origin: 'https://indri.studio' },
  };
  vm.runInNewContext(inline, context);
  return { element, listeners, messages };
}

test('inline preview initializes, loads on focus, and follows the controls checkbox', () => {
  const { element, listeners, messages } = setup();
  assert.equal(element('#example-source').textContent, 'bare source');
  assert.equal(element('#example-preview').src, undefined);
  listeners.get('bsnes-player-focus')({ detail: { id: 'format-preview' } });
  assert.match(element('#example-preview').src, /game=raycaster&display=bare/);
  const checkbox = element('#example-controls');
  checkbox.checked = true;
  checkbox.handlers.change();
  assert.equal(element('#example-filename').textContent, 'with-controls.html');
  assert.equal(element('#preview-format').textContent, 'HTML · with controls');
  assert.equal(element('#example-source').textContent, 'controls source');
  assert.doesNotMatch(element('#example-preview').src, /display=bare/);
  checkbox.checked = false;
  checkbox.handlers.change();
  assert.match(element('#example-preview').src, /display=bare/);
  listeners.get('bsnes-player-focus')({ detail: { id: 'suite' } });
  assert.equal(messages.at(-1).command, 'pause');
});

test('initialization honors a browser-restored checked checkbox', () => {
  const { element, listeners } = setup(true);
  assert.equal(element('#example-source').textContent, 'controls source');
  assert.equal(element('#example-filename').textContent, 'with-controls.html');
  listeners.get('bsnes-player-focus')({ detail: { id: 'format-preview' } });
  assert.doesNotMatch(element('#example-preview').src, /display=bare/);
});
