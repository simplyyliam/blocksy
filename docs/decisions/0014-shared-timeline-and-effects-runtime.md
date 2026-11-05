# 0014: Shared timeline package and own effect runtime

- Status: proposed
- Date: 2026-11-05

## Context

Effects, animated textures, the animator, GUI transitions, machine states and boss phases all need stages, tracks and triggers. CooParticlesAPI is 1.21.1 only and GPL-3.0 on GitHub but All Rights Reserved on Modrinth (conflict); Lodestone and Satin are 1.21.x only.

Details: `docs/research/` (local) libraries.md, effects.md, gui-creation.md.

## Decision

Build one `packages/timeline` model and widget used by every editor. Build the Effect Studio runtime (`EffectPlayer`, `PlayEffect` payload, data files) ourselves from vanilla systems; no particle library dependency.

## Consequences

One timeline to learn and test. We own the runtime and its performance budget. Photon and CooParticlesAPI are studied for structure only.
