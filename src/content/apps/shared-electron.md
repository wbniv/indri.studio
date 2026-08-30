---
title: Shared Electron
date: 2026-08-30
summary: One maintained Electron runtime shared by multiple desktop applications.
draft: false
---

Shared Electron packages desktop applications without making every application
carry another complete Chromium runtime. The initial Ubuntu 26.04 amd64 release
pairs Electron 42.9.3 with LosslessCut 3.69.0 and draw.io Desktop 31.3.1.

## Install

This is an unofficial third-party repository, not part of Ubuntu or Debian.

```sh
curl -fsSL https://apt.wald3n.com/shared-electron/key.gpg \
  | sudo gpg --dearmor -o /etc/apt/keyrings/shared-electron.gpg
echo "deb [arch=amd64 signed-by=/etc/apt/keyrings/shared-electron.gpg] https://apt.wald3n.com/shared-electron resolute main" \
  | sudo tee /etc/apt/sources.list.d/shared-electron.list
sudo apt update
sudo apt install losslesscut drawio-desktop
```

The applications depend on `electron-runtime-42`; APT installs that runtime
once. Chromium sandboxing remains enabled, and application self-updaters are
disabled so runtime and application upgrades stay coherent.

## Initial packages

| Package | Version | Role |
|---|---:|---|
| `electron-runtime-42` | 42.9.3 | Versioned Electron and Chromium runtime |
| `losslesscut` | 3.69.0 | Lossless video and audio editor |
| `drawio-desktop` | 31.3.1 | Diagram editor with desktop and CLI export |

The supported target is Ubuntu 26.04 LTS on amd64. Kubuntu 26.04 and Foundry's
Ubuntu 26.04 base consume the same build and are tested separately. Other
releases and architectures are not claimed yet.

Repository signing fingerprint:
`0D77 B60F 37B8 A4AA B404 626D F567 ACF6 B6B8 F861`.

[Read the technical report](https://biohack.net/shared-electron/) or inspect the
[signed package repository](https://apt.wald3n.com/shared-electron/).
