# 6. What a real mod contains: Applied Energistics 2

AE2 is a good reference for Aetheric Storage Engineering because both are storage-and-automation mods. It shows that a large mod is mostly **machines, GUIs and data**, not just blocks and items.

From [AE2's repository](https://github.com/AppliedEnergistics/Applied-Energistics-2) and [player guide](https://guide.appliedenergistics.org/1.21/ae2-mechanics/channels):

- It ships a public add-on API and an in-game guidebook, and builds with `gradlew runData build`, so data generation produces its JSON before every build.
- Code, textures and translations have separate licenses; translations come from Crowdin with `%s` placeholders.
- It uses game tests that run in a full game world ([AGENTS.md](https://github.com/AppliedEnergistics/Applied-Energistics-2/blob/main/AGENTS.md)).
- Gameplay is a progression chain: meteorites give quartz and presses, the Inscriber makes processors, processors build the network.

| AE2 feature | What it needs under the hood | Blocksy release |
| --- | --- | --- |
| Quartz ore, meteorites | Ore blocks, worldgen features, structures | 0.10 |
| Energy cell (fullness 1 to 4) | Block states driving model variants | 0.5 |
| Inscriber, Charger | Block entity, inventory, ticking, energy, custom recipe type | 0.8 |
| Machine screens | GUI Studio | 0.9 |
| Storage cells (1k to 256k) | Items carrying data, tooltips | 0.8 |
| ME Drive (10 cells) | Block entity inventory, filtered slots, model per slot | 0.8 |
| Terminals with search | GUI widgets: scroll grid, search, sorting, networking | 0.9, 0.12 |
| Cables and channels | Connecting blocks, graph across blocks, saved world data | 0.12 (with custom code) |
| Controller and Crafting CPU multiblocks | Multiblock shape validation | 0.12 |
| JEI and Jade support | Compatibility modules | 0.12 |
| Guidebook, add-on API | In-game docs, public API | After 1.0 |

Lesson: channels and autocrafting are logic, not content. Blocksy makes content easy and gives a clean place for custom Java where logic gets deep.
