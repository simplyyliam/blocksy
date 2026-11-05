# 0017: Build our own screen effects instead of Satin API

- Status: proposed
- Date: 2026-11-05

## Context

Satin API is LGPL-3.0, Fabric, newest 1.21.4 (updated 2025-04-19); no 26.x build.

Details: `docs/research/` (local) libraries.md, effects.md, gui-creation.md.

## Decision

Use Minecraft's own post-effect chain and camera hooks in a small generated layer (flash, tint, vignette, aberration, shake). Study Satin and Orbital Railgun (MIT) for behaviour only.

## Consequences

Works on 26.1.2 and 26.3 without a dependency; the shader set is small at first.
