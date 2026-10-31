#!/usr/bin/env python3
"""Build the two self-contained mockups for the debug-bridge page plan.

Usage: python3 -I build-mockups.py
Writes bridge-page-desktop.html and bridge-page-narrow.html next to this file,
embedding the real captures as data URIs (inline-only, per the plan-bundle rules).
Render PNG thumbnails with headless Chrome (see the plan's Verification step 1).
"""
import base64
import subprocess
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
IMG = ROOT / "src/assets/screenshots/world-foundry/bridge"


def data_uri(path: Path, jpeg_width: int | None = None) -> str:
    """Inline an image; large screenshots are downsized to JPEG to stay under the 512 KB budget."""
    if jpeg_width:
        raw = subprocess.run(
            ["convert", str(path), "-resize", f"{jpeg_width}x", "-quality", "72", "jpeg:-"],
            check=True, capture_output=True).stdout
        return "data:image/jpeg;base64," + base64.b64encode(raw).decode()
    return "data:image/png;base64," + base64.b64encode(path.read_bytes()).decode()


BLENDER = data_uri(IMG / "blender-bridge-panel.png")
FRAME = data_uri(IMG / "frame.png", 560)
WFEDIT = data_uri(IMG / "wfedit-properties.png", 760)
SETTINGS = data_uri(IMG / "ingame-settings.png", 760)

TRANSCRIPT = """> {"op":"ping"}
< {"op":"pong"}
> {"op":"pause"}
< {"op":"paused"}
> {"op":"step","frames":5}
> {"op":"watch","idx":9,"mailbox":1906}
< {"op":"mailbox","idx":9,"mailbox":1906,"value":7.250010}
> {"op":"set_mailbox","idx":9,"mailbox":1906,"value":0}
> {"op":"screenshot","filename":"frame.png"}
< {"op":"screenshot_done","filename":"frame.png",...}
> {"op":"resume"}
< {"op":"resumed"}"""

CSS = """
:root{--bg:#3d3833;--card:#45403b;--card2:#4a4641;--text:#f5f0e8;--sec:#c8c0b8;--acc:#b8ef00;--line:#5b5650}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font:16px/1.65 system-ui,sans-serif}
a{color:var(--acc);text-underline-offset:3px}
.bar{display:flex;gap:24px;align-items:center;padding:14px 32px;background:#34302b;border-bottom:1px solid var(--line);font-size:14px}
.bar b{letter-spacing:.04em}
.wrap{max-width:960px;margin:0 auto;padding:28px 24px 64px}
.back{font-size:14px}
h1{font-size:40px;line-height:1.15;margin:14px 0 12px;letter-spacing:-.01em}
.lede{color:var(--sec);margin:0 0 20px;max-width:760px}
.glance{display:flex;flex-wrap:wrap;gap:10px;margin:0 0 34px}
.glance span{background:var(--card);border:1px solid var(--line);border-radius:999px;padding:5px 14px;font:13px ui-monospace,monospace;color:var(--sec)}
.view{margin:0 0 44px}
.head{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-bottom:6px}
.num{width:34px;height:34px;border-radius:10px;background:var(--card);color:var(--acc);display:grid;place-items:center;font-weight:700}
h2{font-size:24px;margin:0;text-transform:uppercase;letter-spacing:-.01em}
.chip{font-size:12px;padding:3px 10px;border-radius:999px;border:1px solid var(--line);color:var(--sec)}
.chip.ok{border-color:var(--acc);color:var(--acc)}
.chip.old{border-color:#e0b34a;color:#e0b34a}
.cap{color:var(--sec);margin:6px 0 14px;max-width:780px}
.fig{background:var(--card);border-radius:14px;padding:14px;overflow:hidden}
.fig img{display:block;max-width:100%;height:auto;border-radius:8px;margin:0 auto}
pre{margin:0;background:#2c2925;border-radius:10px;padding:16px;overflow-x:auto;font:13px/1.6 ui-monospace,monospace;color:#e8e2d8}
"""

BODY = f"""
<div class="bar"><b>INDRI</b><span>Apps</span><span>Studio</span></div>
<div class="wrap">
<a class="back" href="#">← World Foundry v2</a>
<h1>The debug bridge, up close</h1>
<p class="lede">A running World Foundry engine can be inspected and driven from outside, one line of JSON at a time.
These are the ways to look at it: tools that connect to it, and what comes back.</p>
<div class="glance"><span>127.0.0.1:7777</span><span>one JSON line per message</span><span>compiled in only when enabled</span></div>

<section class="view"><div class="head"><span class="num">1</span><h2>Blender live panel</h2><span class="chip ok">Captured from a live engine</span></div>
<p class="cap">Blender connected to a running game. Connection status, the engine's CPU time and actor count, Pause and Pick Object, and the mailbox watch list.</p>
<div class="fig"><img src="{BLENDER}" alt="Blender WF Live Bridge panel"></div></section>

<section class="view"><div class="head"><span class="num">2</span><h2>The editor</h2><span class="chip old">Existing screenshot</span></div>
<p class="cap">The in-engine editor, with outliner, live viewport and properties. It reaches the engine through its own in-process bridge rather than this TCP one, so it sits beside the debug bridge.</p>
<div class="fig"><img src="{WFEDIT}" alt="wf-edit editor with an actor selected"></div></section>

<section class="view"><div class="head"><span class="num">3</span><h2>A terminal session</h2><span class="chip ok">Captured from a live engine</span></div>
<p class="cap">Ping, pause, step, watch a mailbox, write one, take a screenshot, resume. Lines starting with <b>&gt;</b> are sent; <b>&lt;</b> are replies.</p>
<div class="fig"><pre>{TRANSCRIPT.replace("<", "&lt;").replace(">", "&gt;")}</pre></div></section>

<section class="view"><div class="head"><span class="num">4</span><h2>Frames through the bridge</h2><span class="chip ok">Captured from a live engine</span></div>
<p class="cap">The frame the engine wrote when asked for a screenshot, which is how renders get compared across backends.</p>
<div class="fig"><img src="{FRAME}" alt="Engine frame: blue shrimp in an aquarium" style="max-width:480px"></div></section>

<section class="view"><div class="head"><span class="num">5</span><h2>In-game settings forms</h2><span class="chip ok">Captured on a device</span></div>
<p class="cap">The settings dialog the engine builds from a level's object-property definitions, as it renders on a Chromecast running the baseline level. Numbers, sliders, choices, toggles and text, navigated with the arrow keys, edited with A and applied with Back.</p>
<div class="fig"><img src="{SETTINGS}" alt="The engine's Baseline settings dialog on a TV"></div></section>

</div>
"""


def page(inner: str, extra_css: str = "") -> str:
    return (f'<!doctype html><html lang="en"><head><meta charset="utf-8">'
            f'<meta name="viewport" content="width=device-width,initial-scale=1">'
            f'<title>Debug bridge page mockup</title><style>{CSS}{extra_css}</style></head>'
            f'<body>{inner}</body></html>')


(HERE / "bridge-page-desktop.html").write_text(page(BODY))

# Narrow state: the same page at phone width, centred in a 1440x900 canvas.
NARROW_CSS = """
html,body{height:100%;background:#1f1c19}
.phone{width:390px;height:860px;margin:20px auto;border:10px solid #111;border-radius:36px;overflow:auto;background:var(--bg)}
.phone .bar{padding:12px 16px}
.phone .wrap{padding:20px 16px 48px}
.phone h1{font-size:30px}
.phone h2{font-size:19px}
.phone .fig{padding:8px}
"""
(HERE / "bridge-page-narrow.html").write_text(page(f'<div class="phone">{BODY}</div>', NARROW_CSS))
print("wrote", *(p.name for p in sorted(HERE.glob("bridge-page-*.html"))))
