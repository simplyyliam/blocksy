# 0018: Imported resources live in the project document

- Status: proposed
- Date: 2026-11-05

## Context

v0.4 adds typed imports: GUI textures, particle textures, sounds (.ogg) and models (.json, Blockbench .bbmodel), from the Resources menu and by dragging files from the desktop. Plan rules: documents are the only source of truth (rule 7), generated files are written by the pure generator (rule 2), Rust stays thin (rule 8).

## Decision

- A project has an optional `resources` list (`kind`, `name`, `ext`, base64 `data`). It is optional, so old projects open unchanged and `formatVersion` stays 1 (same approach as texture layers).
- `packages/core/src/resources.ts` holds every rule (format by file signature, size limits, safe names) and the `addResource` / `removeResource` commands, so imports are undoable and tested without the app.
- The generator writes the files: textures to `textures/gui` and `textures/particle`, sounds to `sounds/` plus a generated `sounds.json`, models to `models/imported/`. Blockbench sources go to `blockbench/` at the project root, outside the jar.
- Drag-and-drop uses the browser's File objects (`dragDropEnabled: false` in the window config), so no new Rust command is needed.

## Consequences

- `blocksy.json` grows by the imported bytes (limits: 64 KB particle, 512 KB GUI, 2 MB sound, 4 MB model). If this gets heavy, move bytes to a `resources/` folder and keep only paths in the document.
- Sounds are registered with one sound event per file; variants and subtitles belong to a later sounds editor.
