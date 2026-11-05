# 10. GUI Studio: the feature that should become a staple

Two ways in, one editor:

1. **Start from vanilla.** Pick a vanilla screen (chest, furnace, crafting table, hopper, dispenser, brewing stand, anvil, smithing table, and more) and iterate on it.
2. **Design from scratch.** A full design canvas with complete control over colour, shape, type and motion, for mods whose screens don't feel like Minecraft at all.

### 10.1 Bringing the real vanilla GUIs in

- Vanilla GUI art is read from the **user's own** Minecraft assets, never shipped with Blocksy.
- Modern Minecraft draws GUI parts as sprites under `textures/gui/sprites`, and a sprite's `.mcmeta` can set scaling to `stretch`, `tile` or `nine_slice` ([NeoForge docs: Screens](https://docs.neoforged.net/docs/1.21.4/gui/screens)). The importer reads that metadata so imported panels resize correctly.
- Slot positions and screen sizes for each vanilla screen are Blocksy-authored **layout data**, not copied from Mojang's code.
- Imported screens open as normal GUI Studio documents, so every custom tool works on them too.

### 10.2 What people building beautiful mod GUIs already use

| Library | What it shows is possible | Loader |
| --- | --- | --- |
| [owo-ui (owo-lib)](https://github.com/RedenMC/owo-lib) | Declarative UI with XML models, templates, blur surfaces and a built-in inspector | Fabric |
| [LDLib2](https://github.com/Low-Drag-MC/LDLib2) | Taffy-powered layout, LSS stylesheets, XML UIs, data binding, and an in-game [UI editor](https://low-drag-mc.github.io/LowDragMC-Doc/ldlib2/ui/editor) with a simulation mode | NeoForge |
| [Modern UI](https://github.com/BloCamLimb/ModernUI-MC) | A full desktop UI framework inside Minecraft: smooth text, true Gaussian blur, animation and transitions | NeoForge, Forge, Fabric |
| AE2 terminals | Dense, searchable item grids with sorting and tabs | NeoForge |

Lessons: designers want stylesheets, declarative layouts, a live inspector with simulation, and motion and blur for a premium feel.

### 10.3 The custom design experience

- **Canvas** on Minecraft's GUI pixel grid, with live previews at GUI scale 1 to 4 and several window sizes.
- **Layers panel**, grouping, alignment, distribution, snapping, rulers, undo history.
- **Components:** panel, image, slot, slot grid, player inventory, button, toggle, slider, text, text field, progress bar and arrow, energy and fluid gauges, item and entity preview, scroll list, item grid, tabs, tooltip.
- **Full style control:** mod-wide colour tokens, fills, gradients, borders, pixel-stepped corner radius, shadows and glow, opacity, custom fonts (TTF through Minecraft's font JSON), nine-slice editor.
- **Stylesheets:** named styles shared across all of a mod's screens, so a redesign is one edit.
- **States and motion:** hover, pressed, disabled, focused; transitions and keyframe animation; animated progress.
- **Data binding:** connect a gauge to a block entity value, a label to a translation, a button to a node graph event.
- **Layout anchors**, a contrast checker, a **simulate mode**, and starter templates ("Vanilla-style machine", "Dark tech terminal", "Magic tome", "Clean modern panel").

### 10.4 How it becomes real code

- A GUI is a **GUI document** of registered components.
- Styles are **baked into nine-slice sprites** where possible, so vanilla's own renderer draws them, fast and compatible.
- Effects vanilla can't draw (gradients at runtime, blur, animation) use a **small Blocksy UI runtime generated into the user's mod as readable source**, not an external dependency.
- Optional owo-ui or LDLib2 output backends are an after-1.0 question that the adapter design allows.
