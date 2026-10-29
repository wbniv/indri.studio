# Sources for the bsnes-jg Android app page

Accessed and measured 2026-10-29. This ledger covers only `src/content/apps/bsnes-jg-wasm.md`.

| Claim | Type | Source and location | Evidence, conditions, and units |
| --- | --- | --- | --- |
| Native library APK contains 152 ROM files and catalog artwork | Measured result | Local signed APK `android-tv/app/build/outputs/apk/native/release/bsnes-jg_llvm-65816-torture-test-suite-on-snes-v0.1.8.apk`; `unzip -Z1`; `android-tv/app/build.gradle.kts` artifact verification | Count of `assets/roms/*.sfc` entries is 152. Gradle's artifact check also validates matching card images. Applies to this exact v0.1.8 APK. |
| Library APK package ID, version name and code | Measured result | Same APK; Android SDK 34 `aapt dump badging` | `org.bsnesjg.tv.native.phase2`, versionName `0.1.8`, versionCode `9`. |
| Player APK package ID, version name and code | Measured result | Local signed APK `android-tv/app/build/outputs/apk/nativeplayer/release/bsnes-jg_mandelbrot-v0.1.8.apk`; `aapt dump badging` | `org.bsnesjg.tv.native`, versionName `0.1.8`, versionCode `9`. |
| Both APKs use the public release certificate | Measured result | Both local APKs; Android SDK 34 `apksigner verify --print-certs` | Both pass verification and report certificate SHA-256 `1bc3d0586ff02c6be1479785652484ba70efccdfee46ce451520d221802d9a5e`, DN `CN=bsnes-jg Android Release, O=Biohack`. |
| Library APK size and SHA-256 | Measured result | Local file and public HTTPS download at `https://downloads.biohack.net/bsnes-jg-wasm/releases/0.1.8/bsnes-jg_llvm-65816-torture-test-suite-on-snes-v0.1.8.apk`; `stat`, `sha256sum`, `curl` | 26,811,243 bytes; SHA-256 `55eca48e96cd2ba8d359689c5001fd62a4255af133bafe475fa43c4744a0f468`. The publicly downloaded bytes matched the local file. |
| Player APK size and SHA-256 | Measured result | Local file and public HTTPS download at `https://downloads.biohack.net/bsnes-jg-wasm/releases/0.1.8/bsnes-jg_mandelbrot-v0.1.8.apk`; `stat`, `sha256sum`, `curl` | 26,809,995 bytes; SHA-256 `907511eeaa8a77279a7c5e8a597b4b410ff94415ce637183aef1a56c3f2c21d3`. The publicly downloaded bytes matched the local file. |
| Native player runs standalone Mandelbrot; Native library provides published homebrew catalog | Source assertion supported by build configuration | `bsnes-jg-wasm/android-tv/app/build.gradle.kts`, `android-tv/README.md`, `android-tv/app/src/nativeplayer/assets/index.html` | Product flavors configure the separate package identities and library/player roles. The library build includes the published ROM assets. |
| Native engine is the intended public Android release; WASM APKs excluded | Project release policy | `bsnes-jg-wasm/docs/plans/2026-10-28-r2-apk-public-downloads.md`, “Current state” and “Public object layout” | Project policy based on observed Android WASM playback performance. This is a source assertion, not a benchmark reproduced for this page. |

The APKs were built from a worktree with uncommitted changes; the release manifest records `sourceWorktreeDirty: true` and its base commit. Exact source provenance remains unresolved until those changes are committed or otherwise archived.
