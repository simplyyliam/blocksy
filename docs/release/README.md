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
| 8 | `plan/08-model-studio.md` | Model Studio releases (0.5, 0.11) |
| 9 | `plan/09-node-graph.md` | Node canvas (0.4) |
| 10 | `plan/10-gui-studio.md` | GUI Studio (0.9) |
| 11 | `plan/11-docs.md` | Docs work (0.7) |
| 12 | `plan/12-roadmap.md` | Overview of all releases |
| 14 | `plan/14-v1-real-test.md` | v1.0.0 |
| 15 | `plan/15-after-1.0-and-risks.md` | Ideas after 1.0 |
| — | `plan/99-sources.md` | Links |

## Releases (`releases/`)

| Release | File | Status |
| --- | --- | --- |
| 0.1 Foundation | `releases/v0.1.md` | Released |
| 0.2 First block | `releases/v0.2.md` | Released |
| 0.3 First item | `releases/v0.3.md` | Released (0.3.0) |
| Editor refresh (proposed, between 0.3 and 0.4) | `releases/editor-refresh.md` | **Proposed**, Liam decides in PR review |
| 0.4 Blueprint canvas | `releases/v0.4.md` | Next (after Editor refresh if accepted) |
| 0.5 Model Studio: blocks and items | `releases/v0.5.md` | |
| 0.6 Block variety and redstone | `releases/v0.6.md` | |
| 0.7 Docs, learning and GitHub | `releases/v0.7.md` | |
| 0.8 Machines and energy | `releases/v0.8.md` | |
| 0.9 GUI Studio | `releases/v0.9.md` | |
| 0.10 Content and world | `releases/v0.10.md` | |
| 0.11 Model Studio: entities | `releases/v0.11.md` | |
| Effect Studio (proposed, after 0.10) | `releases/effect-studio.md` | Proposed |
| Combat and bosses (proposed, after 0.11) | `releases/combat-bosses.md` | Proposed |
| 0.12 Expert and compatibility | `releases/v0.12.md` | |
| 0.13 Release candidate | `releases/v0.13.md` | |

Ideas for a later release go into that release's file as notes, not code.
Local research notes (not committed) live in `docs/research/`; a release file's `/goal` names the ones to read.
A release's `/goal` also keeps the polish checklist and library credit entries (plan 2.4).
Old checkpoints are kept in `history/`.
