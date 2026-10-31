"""Connect Blender's WF Live Bridge panel to a running engine and save a screenshot of it.

Run: BRIDGE_OUT=<dir> blender --factory-startup --python blender_panel.py
(engine already listening on :7777, e.g. wf_game --debug-port 7777)

Captures the Properties editor at its natural narrow width (widened to
PANEL_WIDTH px), so the panel's buttons are not stretched across a
maximised area. Writes blender-panel.png to BRIDGE_OUT.
"""
import os
import sys
from pathlib import Path

import bpy

OUT = Path(os.environ.get("BRIDGE_OUT", Path(__file__).resolve().parent)).resolve()
PANEL_WIDTH = int(os.environ.get("PANEL_WIDTH", "520"))
sys.path.insert(0, str(Path.home() / "WorldFoundry-wbniv/wftools"))

LOG = OUT / "blender.log"


def log(msg):
    with LOG.open("a") as f:
        f.write(msg + "\n")


LOG.write_text("")
try:
    import wf_blender
    wf_blender.register()
    log("registered wf_blender")
except Exception as e:  # noqa: BLE001 - report whatever stops us
    log(f"register failed: {e!r}")
    bpy.app.timers.register(lambda: bpy.ops.wm.quit_blender(), first_interval=1.0)

step = {"n": 0}


def areas():
    win = bpy.context.window_manager.windows[0]
    by_type = {a.type: a for a in win.screen.areas}
    return win, by_type


def tick():
    n = step["n"]
    step["n"] += 1
    win, by_type = areas()
    props, view = by_type["PROPERTIES"], by_type["VIEW_3D"]
    try:
        if n == 0:
            props.spaces.active.context = "SCENE"
            from wf_blender import debug_bridge as db
            b = db.get_bridge()
            b.connect("127.0.0.1", 7777)
            log(f"connected={b.connected} error={getattr(b, 'error', None)}")
            log(f"properties area before: {props.width}x{props.height}")
            # Drag the edge between the 3D view and the Properties column to the left.
            with bpy.context.temp_override(window=win, area=view):
                bpy.ops.screen.area_move(x=props.x, y=props.y + props.height // 2,
                                         delta=-(PANEL_WIDTH - props.width))
        elif n == 1:
            from wf_blender import debug_bridge as db
            db.get_bridge().send({"op": "watch", "idx": 9, "mailbox": 1906})
            log(f"properties area after: {props.width}x{props.height}")
            for a in win.screen.areas:
                a.tag_redraw()
        elif n >= 4:
            with bpy.context.temp_override(window=win, area=props):
                bpy.ops.screen.screenshot_area(filepath=str(OUT / "blender-panel.png"))
            log("screenshot saved")
            bpy.ops.wm.quit_blender()
            return None
    except Exception as e:  # noqa: BLE001
        log(f"tick {n} failed: {e!r}")
        if n >= 4:
            bpy.ops.wm.quit_blender()
            return None
    return 1.5


bpy.app.timers.register(tick, first_interval=3.0)
