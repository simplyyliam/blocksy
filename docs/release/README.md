# Blocksy release plan

The source of truth for what Blocksy is and the order it gets built in.
It is split into small files so a session reads only what the current release needs.
(Before 2026-11-05 it was one 81 KB file, `blocksy-release-plan.md`; see git history.)

Owner: Liam Matthews. Before any UI work, look at the images in `docs/design/`.
Every release must pass the performance budget (section 4) on the reference machine.

## What to read for a release

1. `releases/v0.X.md` for the current release (scope, "Done when", `/goal` prompt).
2. Only the plan sections that release's `/goal` prompt names (table below).
3. `CHECKPOINT.md` at the repo root to see where work stopped.

Don't read the other releases or unrelated sections. They're here for when they're needed.

## Plan sections (`plan/`)

| § | File | Read when |
| --- | --- | --- |
| 1 | `plan/01-what-blocksy-is.md` | First time / product questions |
| 2 | `plan/02-architecture-rules.md` | Release prompt names it (most do); 2.6 = versioning/updates |
| 3 | `plan/03-feature-catalog.md` | Adding a new element/feature family |
| 4 | `plan/04-performance-budget.md` | Every release (bench at the end) |
| 5 | `plan/05-themes.md` | Theme work |
| 6 | `plan/06-real-mod-ae2.md` | Planning tech-mod features |
| 7 | `plan/07-intellij-mcdev.md` | Expert tools ideas |
| 8 | `plan/08-model-studio.md` | Model Studio and Animator (0.8, 0.9); 8.5 Blockbench feel |
| 9 | `plan/09-node-graph.md` | Node canvas (0.5) |
| 10 | `plan/10-gui-studio.md` | GUI Studio (0.10, 1.4) |
| 11 | `plan/11-docs.md` | Docs work (0.5 demos, 0.9 credits, 0.12 full) |
| 12 | `plan/12-roadmap.md` | Overview of all releases |
| 14 | `plan/14-v1-real-test.md` | v1.0.0 |
| 15 | `plan/15-after-1.0-and-risks.md` | Ideas after 1.0 |
| — | `plan/99-sources.md` | Links |

## Releases (`releases/`)

Re-sequenced 2026-11-06 into playable slices: each release has a showcase Liam builds himself (plan 12, rules 15 and 16).

| Release | File | Showcase | Status |
| --- | --- | --- | --- |
| 0.1 Foundation | `releases/v0.1.md` | Empty mod runs | Released |
| 0.2 First block | `releases/v0.2.md` | Form-built block | Released |
| 0.3 First item | `releases/v0.3.md` | Berry Dough item | Released (0.3.0) |
| 0.4 Editor refresh | `releases/v0.4.md` | Real Minecraft look | Released (0.4.0) |
| 0.5 Particle wand | `releases/v0.5.md` | Wand with particle spiral and cooldown | Next |
| 0.6 Glowing block | `releases/v0.6.md` | Animated, glowing mana crystal | |
| 0.7 Charging magic circle | `releases/v0.7.md` | Staff with charging circle, beam, mana | |
| 0.8 Custom shapes | `releases/v0.8.md` | Own 3D altar and staff (Model Studio) | |
| 0.9 Animated mob | `releases/v0.9.md` | Animated golem (Animator) | |
| 0.10 Arcane infuser | `releases/v0.10.md` | Powered machine with screens | |
| 0.11 Mana network | `releases/v0.11.md` | Ore to multiblock, on a server | |
| 0.12 Ship it | `releases/v0.12.md` | Finished mod pushed to GitHub | |
| 1.0 The real test | `plan/14-v1-real-test.md` | Block, item, full mod | |

After 1.0 (advanced features moved, not deleted): `releases/v1.1.md` Effect Studio full, `v1.2.md` Combat and bosses, `v1.3.md` Gear and wearables,
`v1.4.md` GUI Studio full, `v1.5.md` World and nature, `v1.6.md` Expert and compatibility, `v1.7.md` Learn mode.
Old plan and release files from before the re-sequencing: `docs/research/plan-backup-2/` (local).

Ideas for a later release go into that release's file as notes, not code.
Local research notes (not committed) live in `docs/research/`; a release file's `/goal` names the ones to read.
A release's `/goal` also keeps the polish checklist and library credit entries (plan 2.4).
Old checkpoints are kept in `history/`.
