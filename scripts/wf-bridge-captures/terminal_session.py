#!/usr/bin/env python3
"""Drive a live wf_game over the debug bridge and record the real exchange.

Writes transcript.txt (what we sent, what came back) and frame.png (engine
screenshot taken through the bridge) into this directory.
"""
import json
import os
import resource
import socket
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path.home() / "WorldFoundry-wbniv"
OUT = Path(os.environ.get("BRIDGE_OUT", Path(__file__).resolve().parent)).resolve()
PORT = 17977
PLAYER = 9  # actor index from wflevels/aquarium_blue_shrimp/actor-map.json

env = os.environ.copy()
env["LD_LIBRARY_PATH"] = str(ROOT / "engine/libs") + ":" + env.get("LD_LIBRARY_PATH", "")
log = (OUT / "engine.log").open("w")
proc = subprocess.Popen(
    [str(ROOT / "engine/wf_game"),
     "-L" + str(ROOT / "wflevels/aquarium_blue_shrimp-standalone.iff"),
     "-rate20", "--debug-port", str(PORT), "--debug-bind", "127.0.0.1"],
    cwd=ROOT / "wflevels/aquarium_blue_shrimp", env=env,
    stdout=log, stderr=subprocess.STDOUT,
    preexec_fn=lambda: resource.setrlimit(resource.RLIMIT_CORE, (0, 0)),
)

lines = []
try:
    sock = None
    deadline = time.monotonic() + 40
    while time.monotonic() < deadline and sock is None:
        if proc.poll() is not None:
            sys.exit(f"engine exited early (rc={proc.returncode}); see engine.log")
        try:
            sock = socket.create_connection(("127.0.0.1", PORT), timeout=2)
        except OSError:
            time.sleep(0.5)
    if sock is None:
        sys.exit("bridge never came up")
    sock.settimeout(0.4)
    buf = b""

    def drain(wait):
        """Collect reply lines for `wait` seconds; keep the first of each op."""
        global buf
        got, seen = [], set()
        end = time.monotonic() + wait
        while time.monotonic() < end:
            try:
                chunk = sock.recv(65536)
            except socket.timeout:
                continue
            if not chunk:
                break
            buf += chunk
            while b"\n" in buf:
                line, buf = buf.split(b"\n", 1)
                try:
                    op = json.loads(line).get("op")
                except ValueError:
                    continue
                if op in seen:
                    continue
                seen.add(op)
                got.append(line.decode())
        return got

    def send(msg, wait=0.8):
        line = json.dumps(msg, separators=(",", ":"))
        sock.sendall((line + "\n").encode())
        lines.append("> " + line)
        for r in drain(wait):
            lines.append("< " + (r if len(r) < 150 else r[:147] + "..."))

    drain(1.5)  # let the first state/perf broadcasts arrive
    send({"op": "ping"})
    send({"op": "pause"})
    send({"op": "step", "frames": 5}, wait=1.0)
    send({"op": "watch", "idx": PLAYER, "mailbox": 1906}, wait=1.0)
    send({"op": "set_mailbox", "idx": PLAYER, "mailbox": 1906, "value": 0}, wait=0.6)
    send({"op": "screenshot", "filename": str(OUT / "frame.png")}, wait=2.5)
    send({"op": "resume"}, wait=0.6)
finally:
    proc.terminate()
    try:
        proc.wait(timeout=10)
    except subprocess.TimeoutExpired:
        proc.kill()

(OUT / "transcript.txt").write_text("\n".join(lines) + "\n")
print("\n".join(lines))
print("frame.png exists:", (OUT / "frame.png").exists())
