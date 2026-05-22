# Host a `curl | bash` installer for claude-usage at `apt.indri.studio`

> Cross-repo plan: edits live in both `indri.studio/apt/…` and `claude-usage/`.
> Mirrored copy in `~/SRC/claude-usage/docs/plans/2026-05-22-curlbash-installer.md`.

## Context

`claude-usage` ships two install paths today (`MANUAL.md` §Installation):
- **Option A** — download `.deb` from GitHub releases, run `dpkg -i` + `claude-usage-setup`.
- **Option B (currently labelled "From source")** — `git clone` the repo, run `./install.sh`.

Despite the "from source" label, **nothing is actually compiled**. `install.sh` is a wire-up script: it copies JS + Python files into XDG paths, registers a systemd user unit + dock launcher, runs `glib-compile-schemas` (schema XML → binary), and regenerates one JS file from XML. No C compiler, no `pip install`, no `npm install`.

The `.deb` is already published at `apt.indri.studio` via the existing R2 + GitHub Actions pipeline. There is no equivalent one-liner for Option B — users still have to clone.

**Two goals, same turn:**
1. Add a hosted bootstrap installer at `https://apt.indri.studio/install-claude-usage.sh` so `curl … | bash` runs the wire-up end-to-end.
2. Tighten `install.sh`'s pre-flight dep checks so *every* install path (clone, .deb, curl|bash) fails fast and actionably on a box missing required tooling — closing today's gap where the script auto-handles `python3-cairo`/`pillow` but silently assumes `glib-compile-schemas`, `systemctl --user`, and `gnome-shell`.

## Today's dependency situation

| Dep | Used at | Checked by `install.sh` today? |
|---|---|---|
| `rsync` | `install.sh:166` | **Yes** — hard-fail (`:9-13`) |
| `python3-cairo` | `generate-icon.py` runtime | **Yes** — `import` probe + auto-install via apt/dnf/pacman (`:78-106`) |
| `python3-pil` | `generate-icon.py` runtime | **Yes** — same |
| `python3` | everywhere | No — assumed |
| `glib-compile-schemas` | `:121`, `:126` | **No** — ships in `libglib2.0-bin` / `glib2` |
| `systemctl --user` | `:196`, `:201`, `:206` | No — assumes systemd-user |
| `gnome-shell` 45–50 | extension runtime target | No — extension silently won't activate on the wrong version |
| `gsettings`, `gtk-update-icon-cache`, `update-desktop-database` | various | No (most trail `\|\| true`) |
| Chrome + Claude.ai session | manual final step | No — printed "Next step" message |

## Approach

### 1. Bootstrap installer (thin wrapper)

`apt/installers/claude-usage.sh` — ~30 lines:

- `set -euo pipefail` + `-h`/`--help` handler (SRC convention)
- Resolve the latest claude-usage release tag from `https://api.github.com/repos/wbniv/claude-usage/releases/latest` (parse `tag_name` via `python3 -c 'import json,sys; …'`)
- `mktemp -d -t claude-usage-XXXXXX` + `trap "rm -rf …" EXIT`
- Download `https://codeload.github.com/wbniv/claude-usage/tar.gz/refs/tags/<TAG>`, extract.
- `exec bash "$SRC/install.sh" "$@"` so flags pass through (`--uninstall`, `--help`).

User-facing one-liner:
```
curl -fsSL https://apt.indri.studio/install-claude-usage.sh | bash
```

Filename is fully-qualified — `apt.indri.studio` may host other packages' installers later.

### 2. Tighten `install.sh` pre-flight checks (upstream in claude-usage)

Pre-flight block right after the existing `rsync` check (around line 13), modelled on the Python-deps pattern below it. **All three checks land upstream**, so source-clone, curl|bash, and the .deb post-install (`claude-usage-setup`) all benefit equally.

- **`glib-compile-schemas`** — `command -v` probe; on miss, distro-aware install hint (`apt install libglib2.0-bin` / `dnf install glib2` / `pacman -S glib2`). Hard-fail.
- **`systemctl --user`** — probe via `systemctl --user --version`; on miss, print "systemd-user not available — required for the data-fetch service" and exit.
- **`gnome-shell`** — parse `gnome-shell --version` and *warn* (not fail) if outside 45–50.

Pre-flight runs before any file copy so a failure leaves the system untouched.

### 3. R2 publishing wiring (in indri.studio)

Source-of-truth: `apt/installers/claude-usage.sh`.
Published location: `apt/public/install-claude-usage.sh`.

Stage it inside `apt/scripts/publish-local.sh` (single integration point that both local builds and CI run — `.github/workflows/publish.yml:48`). Append one line after the `gen-index.py` block (`~:66`):

```bash
install -m 0755 installers/claude-usage.sh public/install-claude-usage.sh
```

The rclone sync at `.github/workflows/publish.yml:79` already syncs the whole `public/` tree and only excludes Release-family files, so the new file rides the existing pipeline. R2 already serves arbitrary file types alongside APT metadata (`key.gpg`, `index.html`).

Cache headers: existing sync sets `Cache-Control:no-store` on everything. Fine — bootstrap resolves "latest release" at runtime so there's no stale-tag risk.

### 4. MANUAL.md reframe (in claude-usage)

`claude-usage/MANUAL.md` §Installation:

- **Relabel Option B** from "From source" to "From a clone". Add a one-line clarification that there's no compilation — just file placement + service wiring.
- **Add Option C — One-liner**: `curl -fsSL https://apt.indri.studio/install-claude-usage.sh | bash`. Same wire-up as B, without the clone step.

The existing "Pick one install method" warning at `MANUAL.md:84` already covers conflicts; Option C falls under the same "source side" of that warning.

### Index/landing-page link (deferred)

`gen/gen-index.py` doesn't advertise non-APT files in the apt landing page today (only `key.gpg` in the footer at `:800`). Adding a "Get the installer" link from the apt index is an easy follow-up — defer until after the file is live and verified.

## Files to change

| Repo | File | Change |
|---|---|---|
| `claude-usage` | `install.sh` | +~30 lines: three pre-flight checks before existing Python-deps block |
| `claude-usage` | `MANUAL.md` | Relabel Option B; add Option C |
| `indri.studio` | `apt/installers/claude-usage.sh` | New (~30 lines) — bootstrap wrapper |
| `indri.studio` | `apt/scripts/publish-local.sh` | +1 line — stage bootstrap into `public/` |

No infra changes (no Terraform, no DNS, no new R2 bucket). No GitHub Actions workflow changes.

## Verification

1. **Pre-flight checks fire as expected on `install.sh` directly.**
    ```bash
    cd ~/SRC/claude-usage
    ./install.sh --help                      # short-circuits before checks
    env -i PATH=/tmp HOME="$HOME" ./install.sh   # hard-fails with actionable msg
    ```

2. **Local apt build includes the installer.**
    ```bash
    cd ~/SRC/indri.studio
    task -d apt clean
    task -d apt publish-local
    ls -la apt/public/install-claude-usage.sh   # exists, mode 0755
    bash -n apt/public/install-claude-usage.sh  # syntax OK
    ```

3. **Bootstrap reaches `install.sh --help` end-to-end (no install side effects).**
    ```bash
    bash apt/public/install-claude-usage.sh --help
    ```

4. **Tag + publish, verify served file.**
    ```bash
    task -d apt bump          # apt-vX.Y.Z tag
    gh run watch              # in indri.studio repo
    curl -fsSI https://apt.indri.studio/install-claude-usage.sh   # 200 OK
    curl -fsSL https://apt.indri.studio/install-claude-usage.sh | head -20
    ```

5. **End-to-end install on a clean box** (Distrobox / spare laptop, with any prior install cleaned via `install.sh --uninstall` first):
    ```bash
    curl -fsSL https://apt.indri.studio/install-claude-usage.sh | bash
    ```
    Expect: GNOME extension copied, systemd user unit enabled, dock entry registered, "Next step: load the Chrome extension" message printed.

6. **MANUAL.md preview.**
    ```bash
    cd ~/SRC/claude-usage
    task md -- MANUAL.md
    ```
