---
title: Blender Asset Searcher
date: 2026-08-01
summary: Licensed 3D asset search inside Blender — with provenance baked in.
draft: false
storeLinks:
  blenderExtensions: "#"
screenshots:
  - { src: "/screenshots/blender-asset-searcher/gallery.png", alt: "Searching across four providers — Poly Haven CC0-1.0 result selected, OpenGameArt results carry a lower-trust marker" }
---

A [Blender](https://www.blender.org/) sidebar panel that searches licensed 3D assets across multiple online providers and records the **provenance** of everything you import — where it came from, who made it, under what terms, and what attribution you owe.

Whether you accept or reject a given licence is a policy choice. The tool's job is to make that choice informed and auditable.

## How it works

- **Search across providers.** [Poly Haven](https://polyhaven.com/), [OpenGameArt](https://opengameart.org/), [Sketchfab](https://sketchfab.com/), and more — one query, one results list, licence badges visible.
- **Per-project policy file.** Drop a `licence_policy.toml` into your project root. The plugin walks up from the active `.blend` until it finds one; filters results to what your policy allows.
- **Provenance, recorded.** Every imported asset gets a row in your project ledger: source URL, author, licence, attribution string, date imported. Audit trail by default.
- **Lower-trust markers.** Providers like OpenGameArt where licence claims aren't always verifiable get a visible ⚠ on results so the policy decision is informed.

The default policy is CC0-only — conservative on purpose. Configure it for your project; an open-source game might accept CC-BY-SA, a commercial title might accept paid Sketchfab subscriptions and waivers, a hobby project might accept everything.

For anyone shipping 3D assets and tired of forgetting where a barrel mesh came from three months later.
