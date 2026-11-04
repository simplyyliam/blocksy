# @blocksy/game-data

Facts about vanilla Minecraft that editors need, as plain data: item ids with readable names
and common item tags (names only, never Mojang's art or code). Plus the reference helpers
recipes and tags use, and the item picker.

References are strings (ADR 0009):

| Written | Means | Becomes |
| --- | --- | --- |
| `minecraft:wheat` | any item id | `minecraft:wheat` |
| `#minecraft:planks` | an item tag | `#minecraft:planks` |
| `berry_dough` | an item or block of this mod | `<modid>:berry_dough` |
| `#fruits` | a Tag element of this mod | `#<modid>:fruits` (or the tag it adds to) |
