---
title: Board Game Arena Title Tray
date: 2026-10-17
summary: Keep your Board Game Arena tab beside the KDE tray, and catch game offers while you browse.
draft: false
storeLinks:
  github: https://github.com/wbniv/bga-title-tray
cardImages:
  - { src: "../../assets/screenshots/bga-title-tray/card.svg", alt: "" }
---

<figure class="bga-demo" data-bga-demo>
  <div class="bga-demo-stage">
    <a class="bga-demo-launch" href="/apps/bga-title-tray/bga-title-tray-demo.mp4" aria-label="Play the Board Game Arena Title Tray demo">
      <img src="/apps/bga-title-tray/bga-title-tray-demo-poster.jpg" alt="Game ready caption and illustrative Play alert on the captured KDE panel">
      <span class="bga-demo-play" aria-hidden="true">
        <svg viewBox="0 0 48 48" focusable="false" aria-hidden="true"><path d="M15 8v32l27-16z" fill="currentColor"/></svg>
      </span>
    </a>
    <video controls playsinline muted preload="none" hidden poster="/apps/bga-title-tray/bga-title-tray-demo-poster.jpg" aria-label="Board Game Arena Title Tray demonstration">
      <source src="/apps/bga-title-tray/bga-title-tray-demo.mp4" type="video/mp4">
      <p>Your browser cannot play this video. <a href="/apps/bga-title-tray/bga-title-tray-demo.mp4">Download the demo</a>.</p>
    </video>
  </div>
  <figcaption>Silent illustration using captured KDE panel frames and Will's BGA browser screenshot. Window cards, countdown, and alert titles are composited.</figcaption>
</figure>

The title of your selected [Board Game Arena](https://boardgamearena.com/) tab lives beside the KDE system tray. When a game offer arrives while BGA is in the background, the padded title area flashes white with black text. It pauses when you focus BGA and stops when the offer disappears, even if Chrome still calls the tab “Play.” Click the title to bring that existing tab to the front, or right-click it to choose a BGA tab and refresh. The panel shows “Play now!” when BGA returns to its lobby while Chrome still reports “Play.”

This is an independent companion for Board Game Arena, not a Board Game Arena product. It uses a Chrome extension to read the tab title and the visible game-offer and lobby states, plus a small local host and Plasma widget to display them. The panel title is the alert and click target. Clicking it brings the existing BGA window and tab forward.

<p><a class="download-cta" href="https://github.com/wbniv/bga-title-tray/releases/latest">Download v0.4.7 ↗</a></p>

## Supported setup

Linux with **KDE Plasma 6** and **Google Chrome or Chromium**. The installer also needs Python 3 with PyQt6, `socat`, `kpackagetool6`, and `qdbus6`; your distribution's package manager may use different package names. Other desktops, browsers, Windows, and macOS are not supported by this release.

## Install

1. On the [latest release page](https://github.com/wbniv/bga-title-tray/releases/latest), download the `.tar.gz` archive and its adjacent `.sha256` file. Verify the archive using the checksum command in the package's illustrated guide.
2. Extract the archive and open `START_HERE.html` in your browser. It shows the commands and screenshots for your browser. Run `./bin/install.sh --browser chrome` from the extracted folder, or choose `chromium` for Chromium. The installer prints the extension folder to select.
3. Open Chrome's [Extensions page](chrome://extensions/), enable **Developer mode**, click **Load unpacked**, and choose the printed folder. If that link is blocked, paste `chrome://extensions/` into Chrome's address bar. Open or refresh a [Board Game Arena](https://boardgamearena.com/) tab; its title should appear beside the Plasma system tray.

The release archive includes an illustrated HTML guide with screenshots of the installed extension and panel. For updates and removal, follow that guide or the [project's installation notes](https://github.com/wbniv/bga-title-tray/blob/main/INSTALL.md).
