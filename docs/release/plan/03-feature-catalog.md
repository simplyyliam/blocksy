# 3. Feature catalog: everything a full mod can contain

This is the master checklist. "Can Blocksy build a full mod?" is answered line by line here. It was built from Fabric's developer guide topics, AE2's structure (section 6) and IntelliJ's tooling (section 7).

| Area | Features | Release |
| --- | --- | --- |
| Project and build | Official template, pinned versions, Run client, Build, Export jar, first-build progress | 0.1 |
| | Reload textures and models in a running game | 0.5 |
| | Run a dedicated server, code hotswap while the game runs | 0.12 |
| Blocks: basics | Hardness, resistance, tool, light, sound, map colour, drops itself, creative tab | 0.2 |
| Blocks: states and models | Facing, lit, powered, waterlogged, custom states, model per state, collision shapes | 0.5 |
| Blocks: families | Slabs, stairs, walls, fences, fence gates, doors, trapdoors, buttons, pressure plates, pillars (logs) | 0.6 |
| Blocks: rendering | Transparent and cutout (glass, leaves), tinting (grass-style colour), emissive textures | 0.6 |
| Blocks: plants | Crops with growth stages, flowers, saplings and trees | 0.6 (tree worldgen 0.10) |
| Blocks: behaviour | Falling blocks, ores that drop XP, redstone emit and receive, comparator output | 0.6 |
| Items: basics | Stack size, rarity, fire resistance, food, fuel, compostable, tooltips | 0.3 |
| Items: types | Tools and tool materials, armor, shields | 0.10 |
| | Bows and crossbows, throwables, buckets, music discs | 0.10 |
| | Spawn eggs | 0.11 |
| Items: data | Data components (items that carry data), dynamic tooltips | 0.8 |
| Textures | Pixel editor, palettes, animated textures | 0.3 |
| | Paint directly on 3D models | 0.5 |
| Recipes and tags | Crafting, smelting, blasting, smoking, stonecutting, tags | 0.3 |
| | Custom recipe types for machines | 0.8 |
| Behaviour | Event, logic and action nodes, custom code node | 0.4 |
| Machines | Block entities, inventories, ticking, saved data, data attachments, block entity renderers | 0.8 |
| | Energy storage and transfer, item transfer between blocks | 0.8 |
| | Fluid storage and transfer | 0.12 |
| GUIs | Vanilla screen import, fully custom screens, styles, animation, data binding | 0.9 |
| | Config screens | 0.10 |
| | HUD overlays | 0.12 |
| Models (Model Studio) | Block and item models, UV, display settings, `.bbmodel` import and export | 0.5 |
| | Entity models with bones and pivots, keyframe animation, armor models | 0.11 |
| World | Ore and feature generation, structures (NBT), biomes, dimensions | 0.10 |
| | Villager professions and trades | 0.10 |
| Entities | Mobs, attributes, spawn rules, AI goals, projectiles, renderers | 0.11 |
| Effects and magic | Effects, potions, enchantments, damage types | 0.10 |
| Sound and particles | Sound import, sound events, subtitles, custom particles | 0.10 |
| Progression | Advancements, loot tables (including adding to vanilla tables) | 0.10 |
| | Statistics | 0.12 |
| Text | Lang editor (English) | 0.2 |
| | Multiple languages and a translation view | 0.13 |
| Expert | Networking, key mappings, commands, game rules, resource conditions | 0.12 |
| | Multiblocks, connecting blocks (cables, pipes), fluids | 0.12 |
| | Mixins (guided), access wideners | 0.12 |
| Compatibility | Recipe viewers (EMI, REI, JEI), block info tooltips (Jade), Mod Menu config button | 0.12 |
| | Depending on another mod and its API | 0.12 |
| Testing | Game tests, dedicated server check | 0.12 |
| Collaboration | Local version history | 0.3 |
| | GitHub sync | 0.7 |
| Shipping | Metadata, icon, code and assets licenses, versioned export, release notes | 0.13 |
| | Publishing metadata for Modrinth and CurseForge | 0.13 |
