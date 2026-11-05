# 0016: Build our own weapon combat data and player pose layer

- Status: proposed
- Date: 2026-11-05

## Context

Better Combat is All Rights Reserved (Fabric, 26.3). PlayerAnimator is MIT but its newest build is 1.21.7 (no 26.x).

Details: `docs/research/` (local) libraries.md, effects.md, gui-creation.md.

## Decision

Study both. Build weapon attack profiles and a small player pose layer ourselves. Revisit PlayerAnimator when a 26.x build exists.

## Consequences

No dependency or license risk today; more work. The Libraries registry allows adding PlayerAnimator later.
