# 0009: Items, recipes, tags, languages, pixel brushes and local history

- Status: accepted
- Date: 2026-11-04

## Context

v0.3 adds items, a pixel texture editor, recipes, tags, a lang editor and local version history.
Everything has to plug in without refactoring v0.1/v0.2 modules (plan 2.4), work on both pinned
Minecraft versions (26.1.2 and 26.3), and the brushes must be reusable by Model Studio in v0.6.

Checked offline against the cached jars (`javap`, see CHECKPOINT "Useful facts"):

| Thing | 26.1.2 | 26.3 |
| --- | --- | --- |
| Recipe JSON (shaped, shapeless, cooking, stonecutting) | same shape | same shape (crafting dropped `category`) |
| Tag JSON (`{"values": [...]}`) | same | same |
| Fabric `FabricRecipeProvider` | `RecipeProvider.Runner` | rewritten (BootstrapContext) |
| Fuel | Fabric `FuelValueEvents.BUILD` | `Item.Properties.cookingFuel(key)` + `context_int_provider` data file |
| Compost | `ComposterBlock.COMPOSTABLES` | `Item.Properties.compostable(key)` + data file |
| Food, consumable effects, rarity, fire resistance, lore, flat item model | same API | same API |

## Decision

1. **Each new thing is an element type, in its own package** (`elements/item`, `elements/recipe`,
   `elements/tag`, `elements/language`). They appear in the project tree, Code tab, Docs reference
   and generator with one registration line each, like blocks. No project format change:
   `formatVersion` stays 1 (no migration needed).
2. **Recipes and tags are plain JSON written by the generator**, not datagen: the JSON is the same
   on both versions while the recipe datagen API is not, and the JSON is readable for learners.
   Block tags that datagen already fills (`mineable/*`, `needs_*_tool`) can't be picked in the
   tags editor, so no file is written twice.
3. **Item models use datagen** (`generateFlatItem`, same on both versions) next to the block models,
   so `needsDatagen` grows to "blocks or items". Animated textures are a vertical strip PNG plus a
   `.png.mcmeta` written by the generator.
4. **Version differences live in the Fabric target only** (`atLeast(ctx, "26.3")`): fuel and compost
   pick the right API per version. `pnpm test:gradle` builds an item project on both versions.
5. **Ingredient references are strings**: `minecraft:wheat` (any id), `#minecraft:planks` (a tag),
   `berry_dough` (an element of this mod, no colon), `#my_tag` (a Tag element of this mod).
   `@blocksy/game-data` holds the vanilla id list (names only, no art) and the picker.
6. **Lang**: `ElementType.lang?(element, project)` (new optional field) lists the keys an element adds
   with their English text. Block and Creative tab gain this one optional field. Language elements
   hold translations per locale; the target writes `lang/<locale>.json`. A Language element for
   `en_us` overrides or adds English keys on top of the generated names.
7. **Pixel brushes**: `@blocksy/pixel` works on a `PaintSurface` (get/set a pixel by x, y). The texture
   editor gives it a flat image; Model Studio (v0.6) will give it a surface that maps UVs onto a
   model. Brushes (pencil, eraser, fill, picker) and the mirror modifier never know which one they
   paint. The PNG encode helper is a fresh copy there (the block package's copy stays untouched).
8. **Local history = git** in the project folder. Rust gets four thin commands (available, log, save,
   file at a version) that run the `git` CLI. Restoring a version is TypeScript: it reads
   `blocksy.json` at that commit, migrates it, and applies it as one undoable command.

## Consequences

- A project with only items still builds: item models need datagen, so the prepare step runs.
- If a future Minecraft version changes recipe JSON, only the Fabric recipe adapter changes.
- Without git installed, History says so and links to git's download page; everything else works.
- The Fabric target keeps a small copy of the reference rules (`elements/refs.ts`) and its own lang
  keys, because the generator must not import packages with React in them (`@blocksy/game-data`
  has the picker). Golden tests pin both. Cleanup for later: move the pure helpers into a UI-free
  module that both import (code review 2026-11-04).
- Block sounds play from the player's own Minecraft download (Loom's asset cache), never bundled
  (rule 10). Git runs with fsmonitor, hooks and GPG signing switched off for its own commands.

## No earlier module was refactored (plan 2.4)

- core: one new optional field (`ElementType.lang`).
- block / creative-tab elements: one optional `lang` line each; the creative tab's icon images get
  `object-cover object-top` so animated (tall) item textures show their first frame.
- Fabric target: v0.2 functions gained defaulted parameters or extra lines that only appear when
  the project has v0.3 elements; the `empty-mod` and `first-block` golden files are byte-identical.
- docs: `DocsHost.demos` (optional) replaces nothing; the block demo still renders as before.
