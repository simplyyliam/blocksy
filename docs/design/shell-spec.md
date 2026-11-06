# Project editor shell spec

The IDE-style shell for the project editor. UI only. Sizes below are the contract: the shell is built
to these numbers and they live as tokens in both themes (`packages/ui/src/theme/`).

## Research

Measured from source, not guessed:

- VS Code: `titlebarpart.css`, `menubar.css`, `activityaction.css` (microsoft/vscode, main).
- Zed: `crates/ui` (`tab.rs`, `spacing.rs`), `workspace/status_bar.rs`, title bar height constants (32 on Windows).
- Blender: header = widget unit (20) plus padding.
- JetBrains New UI, Blockbench, MCreator: read from screenshots in `docs/design/minecraft/tool-*` (approximate).
- Wireframe `redesign-wireframe/Desktop - 1.png` is exported at 1.5x; values below are divided back to 1x.

## Size table

| Part | VS Code | Zed (Win) | Blender | JetBrains | Wireframe | **Blocksy** |
| --- | --- | --- | --- | --- | --- | --- |
| Title bar height | 35 | 32 | 26 | 40 | ~37 | **36** |
| Window control button | 46 x full height, icon 16 | n/a | n/a | 46 | ~43 | **46 x 36, icon 16, flush, no radius** |
| Close hover | rgba(232,17,35,.9) | n/a | n/a | n/a | red | **`--b-window-close`** |
| App icon zone | 35 wide, icon 16 | n/a | n/a | n/a | ~30 | **44 wide (= activity bar), icon 16; click = Home** |
| Menu bar item | 13px, padding 0 8, radius 5 | UI font | 11pt | 13 | 13 | **13px, padding 0 8, height 24, radius sm** |
| Title bar icon button | ~24, icon 16, gap 4 | 24 | 20 | 28-30 | ~24 | **28 x 28, icon 16, gap 2** |
| Activity bar width | 48 (icon 24, 2px indicator) | none | 40 | 40 (icon 20) | ~40 | **44: button 36, icon 20, 2px indicator** |
| Tab height | 35 | 32 | n/a | 40 | n/a | **32** |
| Tab content | 13px, padding 0 10, close 16 | padding 4, gap 4, end slot 14 | n/a | n/a | n/a | **13px, padding 0 10, gap 6, close 16 (icon 12), width 96-200** |
| Editor toolbar | breadcrumbs 22 | ~28 | 26 | 32 | n/a | **32** |
| Status bar height | 22 | ~28 | 26 | ~30 | ~28 | **26** |
| Status item | 12px, padding 0 5 | gap 8 | 11pt | 12 | 12 | **12px, padding 0 8, icon 14, height 22** |
| Side panel width | ~300, min 170 | 240 | ~300 | ~300 | ~272 | **Explorer 260 (200-440), Inspector 300 (240-520)** |
| Panel header | 35 | ~32 | 26 | 40 | n/a | **32** |
| List row | 22 | ~24 | 20 | 24 | n/a | **24** |
| Base font | 13 | 16 | 11pt | 13 | 13 | **13** |
| Panel gap | 0 (borders) | 0 | 2 | 0 | ~8 | **6, cards radius lg (0 in Minecraft theme)** |

Tokens: `--b-titlebar-h`, `--b-activitybar-w`, `--b-tab-h`, `--b-toolbar-h`, `--b-statusbar-h`,
`--b-row-h`, `--b-panel-header-h`, `--b-window-close`.

## Sketch

```text
+--+---------------+----------------------------------------+-----------+-------+-------------+
|# | Berry Mod v   | File Edit Project Resources Build&run   | B > . Export| L B R | -  []  X   | 36
+--+--------------+-+----------------------------------------+-----------+-------+-------------+
|O | EXPLORER  s +| [Overview][ruby_block*][ruby x] ... v     | INSPECTOR                         | tabs 32
|S | v Creative tabs| Blocks > ruby_block  [Paint|Model|Look] [Design|Code] | Properties | Code    | toolbar 32
|L | v Blocks      |                                         | > Block                           |
|H |   ruby_block  |            CANVAS (the tool)            | > Mining                          |
|? | v Items       |                                         | > Sound                           |
|  | v Recipes     |                                         |                                   |
|  | v Tags        |                                         |                                   |
|  | v Languages   +-----------------------------------------+                                   |
|B | v Resources   | Build log | Problems          (dock)    |                                   |
|P3|               |                                         |                                   |
|S |               |                                         |                                   |
+--+---------------+-----------------------------------------+-----------------------------------+
| Ready  x0 !3                       Update ready . Look loaded . Saved . Fabric 26.1.2          | 26
+------------------------------------------------------------------------------------------------+
```

Activity bar, top: Overview, Search, Library, History, Docs. Bottom: Build log, Problems (badge), Settings.

## Decisions and reasons

| Decision | Reason |
| --- | --- |
| Activity bar holds routes (views), opened as centre tabs | VS Code opens Welcome and Settings as editor tabs. The project never unmounts, so the 3D canvas and layout survive. |
| Overview, Search, Library, History, Docs on the activity bar | Overview and History exist. Search is the palette (one search box, not two). Library (vanilla blocks and items) is what MCreator users expect from a reference. Docs stays in the project instead of leaving it. |
| Bottom of the activity bar: Build log, Problems, Settings | The "secondary actions" IDEs put there (VS Code puts settings and accounts there, JetBrains puts tool windows there). Account is left out until sign-in (v0.8). |
| Explorer holds only lists | One job per panel. Overview and History leave it. |
| Title bar: icon (Home) + project name menu, menus, then run actions, panel toggles, window controls | Same order as VS Code (menus left, layout toggles right) and JetBrains (run actions beside the project). |
| Run actions: Build, Run, Stop (only while busy), Export (text label) | Build and Run have universal icons. Export has none, so it gets a label. No Debug: there is no debug feature (Liam: Build takes that slot). |
| Panel toggles in spatial order: left, bottom, right | VS Code's order. Pressed state shows what is open. |
| Window controls 46 x 36, flush to the corner | Native Windows 11 feel, same as VS Code. |
| Removed from the title bar: back, new, save, undo, redo, search | Redundant. All are in menus and shortcuts, autosave makes Save a no-op, search moves to the activity bar. |
| Mode controls move to a 32px editor toolbar under the tabs (shown on every tab: breadcrumb for views, modes + Design/Code for elements) | Many tabs can no longer push them away, and Design/Code stays reachable from any tab. Blockbench keeps its modes at the right of the toolbar. |
| Tab overflow: scroll, fade edges, list menu, close buttons, middle-click, pinned | Same behaviour as VS Code and Zed. |
| Dirty dot means "changed since the last build" | Autosave makes "unsaved" meaningless. What matters is whether the game has the change. |
| Status bar shows status only | See CLAUDE.md rule. JDK moves to Settings. |
| Panels are floating cards on a grey window | Matches the wireframe and `visual-editor(assets).jpg`. |
