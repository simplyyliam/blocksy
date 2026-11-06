# 0019: IDE-style editor shell

- Status: proposed
- Date: 2026-11-06

## Context

The v0.4 project editor shell reads like a web page: Overview is a list item, the title bar is crowded, window controls float, mode controls share a row with the tabs, and a status bar item (JDK) leaves the project. Users coming from VS Code, Zed, JetBrains, Blender, Blockbench and MCreator expect a familiar shell. Sizes and research are in `docs/design/shell-spec.md`.

## Decision

- Layout: title bar, activity bar, explorer, centre canvas, inspector, bottom dock, status bar.
- The activity bar holds routes. Views (Overview, Library, History, Docs) open as centre tabs with ids `@overview`, `@library`, `@history`, `@docs`, so the project never unmounts.
- The explorer holds only the project's lists.
- Mode controls live in a per-editor toolbar under the tabs.
- Tabs scroll, have a list menu, close buttons, pinned and "changed since last build" states, and are remembered per project.
- The status bar only shows status. An item may open a popover or a panel in the current view, never a new route.
- Shell sizes are theme tokens (both themes), taken from the spec table.
- No Debug button until a debug feature exists.

## Consequences

- Title bar quick actions (new, save, undo, redo) and the title search are gone; the same commands stay in menus, shortcuts and the palette.
- History leaves the bottom dock and Overview leaves the tree, so each has one home.
- The JDK picker lives only in Settings.
