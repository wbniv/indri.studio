# Bootstrap apt.indri.studio + publish claude-usage

**Date:** 2026-05-21
**Topic:** Stand up a signed APT repo at `https://apt.indri.studio/` and publish `claude-usage` as the first package.

---

## Why

Will distributes `claude-usage` (a GNOME panel indicator for Claude.ai usage) via a hand-rolled .deb today. A web-hosted, signed APT repo is the proper distribution channel — users add a `sources.list` line and get version upgrades through `apt update`/`apt upgrade`.

`apt.indri.studio` becomes the Indri studio's umbrella distribution surface for any future native packages.

## Architecture

Mirrors the existing `apt.worldfoundry.org` pattern (monorepo + Cloudflare R2 + aptly + GitHub Actions tag-driven deploy):

| Component | Choice |
|---|---|
| Layout | **Monorepo** inside this repo (`indri.studio/apt/`) |
| Source-package format | `apt/packages/<name>/debian/` — canonical Debian source layout (3.0 native for metapackages, 3.0 quilt for vendored upstreams) |
| Builder | `apt-builder:local` Docker image, `ubuntu:26.04` base, layer-cached in CI via GHA cache |
| Repo manager | aptly (state under `apt/.aptly/`, bind-mounted into container) |
| Storage | Cloudflare R2 bucket `indri-apt` (public read via `apt.indri.studio` custom domain) |
| DNS / Edge | Cloudflare DNS CNAME `apt` → R2; transform rule for trailing-`/` → `index.html` |
| Signing | GPG 4096-bit RSA, 2yr expiry, key id "Indri Packages <packages@indri.studio>" |
| CI | `.github/workflows/publish.yml` triggered on `apt-v*` tags |
| Secrets backup | R2 bucket `indri-studio-secrets` (project-scoped, not GH-org-scoped — multiple apt repos under one GH org must not share a secrets bucket) |
| Tag namespace | `apt-v*` (website deploy uses `v*`; `deploy.yml` updated to exclude `apt-v*`) |

## Derived config (bootstrap-apt.sh)

```
GH_ORG=wbniv                              # GitHub org/owner — the only wbniv-scoped value
PKG_NAME=indri-apt
GH_REPO=wbniv/indri.studio                # monorepo
APT_SUBDIR=apt
REPO_NAME=indri                            # override; algo would give wbniv
SUITE=stable
R2_BUCKET=indri-apt
SECRETS_BUCKET=indri-studio-secrets        # project-scoped, NOT wbniv-scoped
CUSTOM_DOMAIN=apt.indri.studio
CF_ZONE_NAME=indri.studio
CF_OPERATOR_TOKEN_NAME=apt.indri.studio    # token name = custom domain (memorable)
R2_TOKEN_NAME=indri-apt-ci
BOOTSTRAP_CACHE=/tmp/indri-studio-bootstrap.env  # project-scoped local cache
KEY_NAME="Indri Packages"
KEY_EMAIL=packages@indri.studio
TAG_PREFIX=apt-
```

**Decision (2026-05-21, mid-bootstrap):** the skill's original defaults
(`SECRETS_BUCKET=${GH_ORG}-secrets`, `BOOTSTRAP_CACHE=/tmp/${GH_ORG}-bootstrap.env`,
`CF_OPERATOR_TOKEN_NAME=${GH_ORG}-operator`) wrongly assumed one GH org → one apt
repo. wbniv hosts (today) indri.studio's apt and (planned) biohack.net's apt;
they MUST not share state. New convention: scope these off `<zone-slug>`
(`indri-studio`, `biohack-net`) and use `<CUSTOM_DOMAIN>` for the CF token name.
Skill defaults updated to match.

## First package: claude-usage

Current state at `~/SRC/claude-usage/packaging/`:

```
packaging/
├── build-deb.sh              # ad-hoc builder (does NOT produce a source package)
├── control                   # bare control file (no Source: stanza, no debian/ layout)
├── postinst, postrm          # maintainer scripts
├── test-deb-*.sh, *.Dockerfile  # local container tests
└── claude-usage-setup        # post-install helper
```

Target shape: `apt/packages/claude-usage/debian/`

```
apt/packages/claude-usage/
└── debian/
    ├── changelog            # parsed by dpkg-parsechangelog; version from packaging/control (0.11.20)
    ├── control              # adds Source: claude-usage stanza on top of existing Package: stanza
    ├── copyright            # MIT (matches LICENSE in claude-usage)
    ├── rules                # debhelper-driven; runs the install logic from build-deb.sh
    ├── source/format        # 3.0 (native) — sources live in this tree
    ├── postinst, postrm     # straight copy from packaging/
    └── install or rules-driven payload copy from ~/SRC/claude-usage/  (TBD during step 3)
```

**Decision (2026-05-21):** wrap the upstream `packaging/build-deb.sh` via
`apt/packages/claude-usage/build.sh` rather than porting to canonical
`debian/{control,changelog,rules,install}`. The wrapper pattern is exactly what
worldfoundry.org's `apt/packages/iffcomp/build.sh` does for vendored upstreams:
fetch a sha256-pinned GitHub tarball, run the upstream's build script, move the
.deb into `apt/dist/`. Shipping today; canonical debian/ layout is a follow-up
when we need PPA distribution (`apt source claude-usage`, lintian, .dsc).

Payload sourcing: 3.0-quilt via GitHub release tarball, sha256-pinned in
`build.sh`. Tag `v0.11.20` already exists at
`github.com/wbniv/claude-usage` (sha256 `42de54bb…`).

Builder image needs `python3-cairo`, `python3-pil`, `rsync` for the upstream's
icon bake + payload copy. Added to `apt/Dockerfile`.

Follow-up plan candidate: port to canonical `debian/` layout once we have a
second package or want to push to a PPA.

**Known cosmetic regression on container-built .deb:** the upstream's
`generate-icon.py` baseline-bake step needs an existing claude-usage install
on the build host to source the base star icon from. In a fresh
apt-builder container, the bake fails and `packaging/build-deb.sh` falls
back to shipping the raw star PNG at `/usr/share/pixmaps/claude-usage.png`
(see build output: "⚠ Baseline icon bake failed; shipping raw star PNG").
Functionally fine — the icon is correct, just not the rounded-rect +
orange composite. Follow-up: vendor a baseline PNG into
`apt/packages/claude-usage/` so the build is self-contained.

## Steps

1. Instantiate apt skill templates into `apt/` (monorepo layout). **DONE** before plan was written — see `apt/` directory.
2. Update `.github/workflows/deploy.yml` to exclude `apt-v*` tags. **DONE.**
3. Reshape claude-usage:
   - Read `~/SRC/claude-usage/packaging/` end-to-end.
   - Decide payload-sourcing strategy (see flag above).
   - Write canonical `apt/packages/claude-usage/debian/` tree.
   - Local build: `task -d apt build` produces `apt/dist/claude-usage_0.11.20_all.deb`.
   - Compare `dpkg -c` output against current hand-rolled .deb.
4. Run `bash scripts/bootstrap-apt.sh --dry-run`. Inspect.
5. Run `bash scripts/bootstrap-apt.sh` for real:
   - Confirms CF token reuse (cached).
   - Creates GPG key for "Indri Packages <packages@indri.studio>".
   - Creates R2 bucket `indri-apt`, custom domain `apt.indri.studio`, DNS CNAME, transform rule.
   - Uploads public key to `r2://indri-apt/key.gpg`.
   - Patches `apt/gen/config.py` with fingerprint.
   - Stores `GPG_PRIVATE_KEY`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` as GH Actions secrets on `wbniv/indri.studio`.
   - Mirrors all secrets into `r2://indri-studio-secrets/`.
6. Push first tag: `task -d apt bump` → `apt-v0.1.0`. Watch `publish.yml` go green.
7. Verify:
   - `curl -sI https://apt.indri.studio/` → 200 text/html
   - `curl -sI https://apt.indri.studio/key.gpg` → 200
   - `curl -fsSL https://apt.indri.studio/dists/stable/Release` → signed Release file present
   - `apt-get install claude-usage` works on a fresh Ubuntu 26.04 container after adding the sources line.

## Verification (run after step 7)

1. **Landing page reachable.**
   ```
   curl -sI https://apt.indri.studio/
   ```
   Expect `HTTP/2 200` + `content-type: text/html`.

2. **Public key reachable.**
   ```
   curl -sI https://apt.indri.studio/key.gpg
   ```
   Expect `HTTP/2 200`.

3. **Release file present and signed.**
   ```
   curl -fsSL https://apt.indri.studio/dists/stable/Release | head -10
   curl -fsSL https://apt.indri.studio/dists/stable/Release.gpg | gpg --verify - <(curl -fsSL https://apt.indri.studio/dists/stable/Release)
   ```
   Expect Release header with `Suite: stable`, signature verifies OK against the fingerprint in `apt/gen/config.py`.

4. **End-to-end install on a clean Ubuntu 26.04 container.**
   ```
   docker run --rm -it ubuntu:26.04 bash -c '
     apt-get update && apt-get install -y curl gnupg
     install -d /etc/apt/keyrings
     curl -fsSL https://apt.indri.studio/key.gpg | gpg --dearmor -o /etc/apt/keyrings/indri.gpg
     echo "deb [signed-by=/etc/apt/keyrings/indri.gpg] https://apt.indri.studio stable main" \
       > /etc/apt/sources.list.d/indri.list
     apt-get update
     apt-cache show claude-usage
   '
   ```
   Expect `apt-cache show` to print the package stanza (full install will fail in a
   barebones container because of gnome-shell dep, which is fine for this check).

## Costs

R2 free tier covers this comfortably (10 GB storage, 10M Class A ops/mo, 1M Class B ops/mo
free). A 5 MB .deb published once a week sits in single-digit-MB territory. No NAT, no EC2,
no DNS fees beyond the existing Cloudflare free plan zone.

## Risks / known gotchas

- **Per-project state isolation.** This bootstrap creates project-scoped resources
  (`indri-studio-secrets`, `/tmp/indri-studio-bootstrap.env`, CF token `apt.indri.studio`).
  When `apt.biohack.net` lands later it MUST get its own equivalents (`biohack-net-secrets`,
  `/tmp/biohack-net-bootstrap.env`, CF token `apt.biohack.net`) — never share state across
  projects under the same GH org. Skill defaults updated to enforce this 2026-05-21.
- **rclone bucket-create probe.** Templates already ship `--s3-no-check-bucket`. Confirm
  it's present in `publish.yml` before tagging.
- **claude-usage payload sourcing** (step 3) — see decision above. Wrapped via build.sh;
  port to canonical `debian/` is the follow-up.
