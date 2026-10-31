#!/usr/bin/env node
// Fail if any page scrolls horizontally at phone width (390 px).
//
// Usage: node scripts/check-mobile-overflow.mjs <baseUrl> <path> [<path> ...]
//   e.g. (serve ./dist first, e.g. python3 -m http.server 4324 --directory dist)
//        node scripts/check-mobile-overflow.mjs http://127.0.0.1:4324 /apps/world-foundry-v2/debug-bridge/
// Drives headless Chrome over CDP (no dependencies beyond Node 22 and Chrome).
// Exit 0 = every page fits; exit 1 = at least one overflows, with the elements that stick out.
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const args = process.argv.slice(2);
if (args.includes('-h') || args.includes('--help') || args.length < 2) {
  console.log('Usage: node scripts/check-mobile-overflow.mjs <baseUrl> <path> [<path> ...]');
  process.exit(args.length < 2 && !args.includes('-h') && !args.includes('--help') ? 2 : 0);
}
const [base, ...paths] = args;
const PORT = Number(process.env.CDP_PORT ?? 9333);
const CHROME = process.env.CHROME ?? '/opt/google/chrome/chrome';
const WIDTH = 390;

const chrome = spawn(CHROME, [
  '--headless=new', '--no-sandbox', '--disable-gpu', `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${mkdtempSync(join(tmpdir(), 'mobile-overflow-'))}`, 'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failed = false;
try {
  let targets = [];
  for (let i = 0; i < 50 && !targets.length; i++) {
    try { targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); } catch { await sleep(200); }
  }
  const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0;
  const pending = new Map();
  ws.onmessage = (m) => { const d = JSON.parse(m.data); pending.get(d.id)?.(d); pending.delete(d.id); };
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });

  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: WIDTH, height: 844, deviceScaleFactor: 2, mobile: true });

  for (const path of paths) {
    await send('Page.navigate', { url: base + path });
    await sleep(2500);
    const { result: { result } } = await send('Runtime.evaluate', {
      returnByValue: true,
      expression: `(() => {
        const vw = document.documentElement.clientWidth;
        const out = [];
        for (const el of document.querySelectorAll('body *')) {
          const b = el.getBoundingClientRect();
          const pos = getComputedStyle(el).position;
          if (b.width > 0 && b.right > vw + 1 && pos !== 'fixed' && pos !== 'absolute') {
            out.push(el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\\s+/)[0] : '') + ' right=' + Math.round(b.right));
          }
        }
        return { vw, scrollWidth: document.documentElement.scrollWidth, offenders: out.slice(0, 8) };
      })()`,
    });
    const { vw, scrollWidth, offenders } = result.value;
    const ok = scrollWidth <= vw;
    failed ||= !ok;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${path}  viewport=${vw} scrollWidth=${scrollWidth}`);
    if (!ok) offenders.forEach((o) => console.log('      ' + o));
  }
  ws.close();
} finally {
  chrome.kill();
}
process.exit(failed ? 1 : 0);
