# 11. Docs: a calm, visual place to learn

Docs are one of two top-level routes (Home, Docs). They should feel like the best developer docs: calm, clean, and visual first.

### 11.1 Structure (Diátaxis)

[Diátaxis](https://ubuntu.com/blog/diataxis-a-new-foundation-for-canonical-documentation) splits docs into four types that each serve a different need:

| Section | Diátaxis type | Example |
| --- | --- | --- |
| Learn | Tutorial (learning by doing) | "Make your first block" |
| Guides | How-to (solve a task) | "Add a drop to a vanilla loot table" |
| Reference | Reference (look things up) | Every node, element, GUI component and vanilla block |
| Concepts | Explanation (understand why) | "What is a block entity?", "Client vs server" |
| Community | Curated links | Videos, docs, tools and people (11.3) |

### 11.2 Page design

- **Visual first.** Every concept starts with a live demo, then the explanation.
- **Live demos reuse the real editors** in a sandbox: a node canvas you can poke, a 3D block that rotates, a GUI you can click, with the "this node = this code" toggle beside it, like how [react.dev embeds live sandboxes](https://codeSandbox.io/blog/using-sandpack-for-react-libraries-documentation). Every demo has an "Open as project" button. Demos follow the performance rules (render on demand, pause when scrolled out of view).
- **Calm layout:** about 70-character lines, left navigation, "On this page" on the right, generous whitespace, one idea per page.
- **Reference pages are generated** from node and element definitions, so they never drift.
- **Version badge** on every page, like [Fabric's docs](https://docs.fabricmc.net/develop/).
- Learn lessons track progress and can open the guided overlay inside a project; search covers everything.

### 11.3 Community: celebrating the modding world

Every entry credits its creator.

| Category | Starting entries |
| --- | --- |
| Official docs | [Fabric Documentation](https://docs.fabricmc.net/develop/), [Fabric Wiki tutorials](https://wiki.fabricmc.net/tutorial:setup), [NeoForge Documentation](https://docs.neoforged.net/docs/1.21.11/gettingstarted/) |
| Video guides | ModdingByKaupenjoe: Fabric and NeoForge playlists (listed on the [Fabric wiki](https://wiki.fabricmc.net/_export/raw/tutorial:start)) |
| Tools | [Blockbench](https://blockbench.net/wiki/blockbench/formats), [misode's data pack generators](https://minecraft.how/pl/blog/wpis/misode-data-pack-generator), [owo-lib docs](https://docs.wispforest.io/owo/features), [LDLib2 docs](https://low-drag-mc.github.io/LowDragMC-Doc/ldlib2/editor/) |
| Reference | [Minecraft Wiki](https://minecraft.wiki/w/Loot_tables), [AE2 guide](https://guide.appliedenergistics.org/1.21/ae2-mechanics/channels) |
| Communities | Fabric and NeoForge Discord servers, modding subreddits (links to verify before launch) |
| Creator spotlight | A rotating feature on a modder, mod or tool |

Entries live in `packages/docs/community.json` with title, URL, creator, type, loaders, Minecraft versions and a "last checked" date. A link checker runs in CI, and a "Suggest a resource" button opens a GitHub issue template.
