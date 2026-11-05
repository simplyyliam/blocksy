# 7. What to take from IntelliJ's Minecraft Development plugin

IntelliJ with the [Minecraft Development plugin](https://mcdev.io/) is the standard setup. It supports Fabric, NeoForge, Forge and more, with in-depth support for access transformers, access wideners and NBT files. Fabric's [setup guide](https://wiki.fabricmc.net/tutorial:setup) highlights its project generator, mixin inspections, accessor generation and copying mixin target references.

| IntelliJ feature | Blocksy version | Release |
| --- | --- | --- |
| New project wizard | New project dialog backed by the official template | 0.1 |
| Gradle run configs | Run, Build, Export buttons; data generation runs automatically | 0.1 |
| Generated sources you can click into | Vanilla reference and "make one like this" | 0.7 |
| Translation folding, missing-key inspections ([details](https://deepwiki.com/minecraft-dev/MinecraftDev/6-translation-and-internationalization)) | Lang editor; Problems panel flags missing keys | 0.2, 0.13 |
| Mixin inspections and generators | Guided mixin node with target picker | 0.12 |
| Access wideners and transformers | Generated when a node needs private access | 0.12 |
| NBT support | NBT viewer for structures and saved data | 0.10 |

Cautions: Fabric warns the plugin's default template has used the latest unstable Loom ([setup page](https://wiki.fabricmc.net/es:tutorial:setup)), so Blocksy pins tested versions. Minecraft's source can't be published under the EULA, so it is generated on the user's machine.
