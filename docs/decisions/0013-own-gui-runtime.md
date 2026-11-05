# 0013: GUI output: plain widget code and a small Blocksy UI runtime

- Status: proposed
- Date: 2026-11-05

## Context

GUI Studio must generate code. owo-ui (MIT, 26.1.2 verified, 26.3 unverified) offers XML and a runtime; Blocksy also teaches Java and wants readable output.

Details: `docs/research/` (local) libraries.md, effects.md, gui-creation.md.

## Decision

Generate plain, commented widget code plus a small Blocksy UI runtime into the mod; bake styles to nine-slice sprites where possible. owo-ui XML is a possible optional backend after 1.0 behind the adapter.

## Consequences

No GUI dependency; more own code to maintain (gradients, blur, animation). Easier to read and teach.
