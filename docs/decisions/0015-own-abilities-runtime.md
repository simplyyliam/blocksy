# 0015: Build our own data-driven abilities runtime

- Status: proposed
- Date: 2026-11-05

## Context

Spell Engine is GPL-3.0-only (supports 26.1.2 to 26.3). Depending on it could force the user's mod to GPL.

Details: `docs/research/` (local) libraries.md, effects.md, gui-creation.md.

## Decision

Study Spell Engine for behaviour only. Generate a small abilities runtime (trigger, charge, cost, cooldown, actions) from Blocksy data.

## Consequences

No licensing risk. More to build in the Combat and bosses release.
