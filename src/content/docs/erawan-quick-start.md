---
title: "Erawan Quick Start"
summary: "Watch a backup copy and verify, bring selected folders together, and find repeated files — each with a preview before anything changes."
app: "erawan"
sourceRepo: "erawan"
sourceCommit: "0bcee89+uncommitted"
license: "MIT"
downloads: false
order: 1
---

**Watch the copy. See the verification. Explore where the bytes are.**

![Erawan live backup view: blue-to-cyan file progress, amber-to-green byte progress, a transfer-rate sparkline, and individual active files. Demo data rendered by the actual progress screen.](/apps/erawan/quick-start/gradient-copy-progress.svg)

The blue bar tracks selected paths; the amber-to-green bar tracks bytes. The route below them shows where your files are going. Open this view with `erawan backup watch` while a backup runs.

Start with [a backup](#backup), [selected folders to consolidate](#consolidate), or [duplicate files to review](#duplicates).

## Before you start

Use Linux, Python 3.10 or newer, and `erawan` on your `PATH`. For a source checkout, add its `bin` directory to `PATH`. Backups need `rclone` and a dedicated destination directory or configured remote. SSH destinations also need SSH tools and `rsync`; see setup requirements.

The gradient screens use labelled demo data passed through Erawan’s actual progress and size-view renderers. Terminal output panels use disposable local files, with paths shortened to `/demo`. Diagrams illustrate the workflow; the outcome report is from an earlier local demo. Use a terminal with truecolor support to see the gradients.

<a id="backup"></a>

## 1 · Back up one source

![Backup journey: choose source and destination, preview the plan, watch copying and verification, then check completed status.](/apps/erawan/quick-start/backup-workflow.svg)

**Choose.** Run `erawan wizard` → **Back up one source**. Pick your source and a dedicated destination. The wizard prints the next commands; it does not start the backup.

**Preview.** Run the printed `erawan backup plan …` command. Check the source, destination, selected files, verification mode, and any destination removals.

![Real backup preview: two selected files will be copied or skipped and verified; no source deletions are planned.](/apps/erawan/quick-start/backup-preview.svg)

**Run and watch.** Run the wizard’s printed `erawan backup run …` command. In another terminal, open `erawan backup watch`. Copying is followed by verification; after it finishes, use `erawan backup status --job NAME`.

**Copying is followed by verification.** The extra bars show successful file checks and content read from both copies:

![Erawan verification view: copy bars have reached 100 percent while cyan-green verified-file progress and purple-to-cyan content-read progress are still advancing. Demo data rendered by the actual progress screen.](/apps/erawan/quick-start/gradient-verification.svg)

Every run probes whether the destination can preserve and restore the selected attributes. If it pauses, inspect `erawan backup fidelity --job NAME`. See backup and restore details.

### Explore the size tree and map

Run `erawan directories browse /data/photos`. Local folder sizes scan in the background; use `t` to focus the tree or map, Enter to open a folder, and `h` to go up. The bars show shares of parent folders, while tile area shows logical bytes. A folder keeps its colour as you navigate.

![Detail of Erawan’s real browser size renderer: folder bars and nested gradient tiles for Travel, Family, Projects, and Phone. Labelled demo data; this is a cropped size-view detail.](/apps/erawan/quick-start/gradient-size-map.svg)

<a id="consolidate"></a>

## 2 · Bring selected folders together

Choose one **KEEP** folder and one or more **FROM** folders. Here is what a conflict-free consolidation does:

![Before and after consolidation: archive already contains beach.jpg and notes.txt; garden.jpg and birthday.jpg are copied and verified from two FROM folders. Both source folders remain.](/apps/erawan/quick-start/consolidation-example.svg)

**Compare:** `erawan directories compare /data/archive /mnt/laptop /mnt/drive`

**Preview:** `erawan directories consolidate --keep /data/archive --from /mnt/laptop --from /mnt/drive`

Review the exact roots, missing files, and conflicts. These commands change nothing. Resolve different content at the same path before applying.

**Apply:** rerun the consolidation command with `--apply`. It copies missing files, verifies retained content, and prints a **Run ID** and **Journal** path. FROM folders remain in place by default.

**See the result:** `erawan directories report --journal /path/printed/by/apply/journal.json --format html`

![Actual HTML consolidation report showing the run result, verified coverage, copied files, and source removal left off.](/apps/erawan/quick-start/consolidation-report.png)

Open the report file printed by that command. **Complete**, **partial**, or **interrupted** describes the recorded attempt. Source removal requires a separate explicit choice; see consolidation and recovery.

<a id="duplicates"></a>

## 3 · Find repeated files

![Three files with different names share the same content. Scan and review first, then leave unmarked, link, or delete reviewed extra copies.](/apps/erawan/quick-start/duplicates-example.svg)

**Scan:** `erawan directories duplicates /data/photos /mnt/old-drive`

The interactive review shows groups and a map of reclaimable bytes by directory. Prefer plain output? Add `--text`. The scan changes nothing. By default, files smaller than 1 MiB are skipped; use `--min-size 64K` to include smaller files.

![Real read-only duplicate scan of two demo folders, showing verified matching groups, kept copies, and reclaimable bytes.](/apps/erawan/quick-start/duplicates-output.svg)

| In the review | What happens |
| --- | --- |
| `↑` / `↓`, then `Enter` | Inspect a group and its member paths. |
| `k` | Choose the copy to keep. |
| `a` | Cycle the selected group through available actions: link, delete, unmarked. |
| `w` | Write the reviewed JSON report. |

**Preview marked actions:** `erawan directories duplicates --apply /path/to/reviewed.json --dry-run`

**Apply after review:** rerun without `--dry-run`. The keeper stays. Linking shares data blocks and makes linked files read-only; deleting removes eligible extra copies. The summary prints an undo command. See action protections and undo before applying.

For options and backend-specific behavior, use the full user guide or `erawan --help`.
