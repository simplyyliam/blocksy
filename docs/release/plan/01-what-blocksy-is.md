# 1. What Blocksy is

Blocksy is a desktop app (Tauri) for making Minecraft mods with nodes, visual editors and live docs, while teaching Java along the way. It scales from "I made one block" to a full tech mod.

The plan reaches **v1.0.0 in 14 releases**. Every release ends with something you can run in Minecraft. Section 3 lists every feature a full mod needs and which release delivers it.

**Stack** (confirm versions in an ADR during v0.1):

- Tauri 2, with Rust only for the thin native layer (files, processes, git)
- **tauri-specta** for generated, typed bindings between Rust and the frontend (section 2.5)
- **Tauri updater plugin** for signed auto-updates from GitHub Releases (section 2.6)
- React + TypeScript + Vite for the UI
- **React Three Fiber** (with drei) for every 3D view: block previews, Model Studio, entity previews
- Node canvas library behind an adapter (React Flow recommended, section 9)
- Gradle and the official loader toolchain for builds

### The three v1.0.0 tests

1. **A block:** custom textured block with states, drops and a recipe.
2. **An item:** a crafted item with behaviour from nodes.
3. **A full mod:** a playable slice of *Aetheric Storage Engineering* with ore, worldgen, machines, energy, beautiful custom GUIs, custom recipes, an animated entity, advancements and a release jar.
