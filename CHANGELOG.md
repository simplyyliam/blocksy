# Changelog

All notable changes to Blocksy are documented here. Versions follow docs/release/README.md.

## [0.4.1] - 2026-11-06

A new welcome window for starting, opening and learning, and a safer way to open projects.

### Added

- **A welcome window.** Blocksy now opens a small window with your Projects, Learn, Community and Settings. Opening or creating a project brings up the editor, and File > Close Project, New project or Open bring the welcome window back.
- **A new Project view.** Pick a project type, then name your mod and see its ID and Java package fill in as you type. Choose the Minecraft version, Java, a starter template and Git, and read clear messages when a name or folder won't work.
- **Learn and Community.** Read the Docs lessons without leaving the welcome window, and find creator spotlights, helpful links and the full credits.
- **Open Recent in the editor.** The File menu can start a new project, open one, switch to a recent project or close the current one. The same actions are in the command palette.
- **"Trust this project?"** The first time you open a folder, Blocksy asks before going on. Projects Blocksy creates for you are trusted from the start.

### Changed

- Settings in the welcome window is one scrolling page with the same sections as the editor's Settings.
- The home page and its icon rail are gone; the welcome window replaces them.

### Fixed

- Closing a project or switching to another one saves your latest changes first.
- If switching to another project fails, your open project stays and you see a message.
- Long folder paths are shortened correctly, even when they mix slash styles.
- The welcome window follows your UI scale.

### Known issues

- Windows may warn "Windows protected your PC" when you install, because the installer isn't code-signed yet. Click **More info**, then **Run anyway**.
- Minecraft's look appears after the first setup or build. Until then you see Blocksy's simple preview with a "Build once to load Minecraft's look" note.
- Blocks are still full cubes with one texture on all six faces; custom shapes and per-face painting come with Model Studio.
- Panels can be resized and folded but not yet dragged out as free-floating windows.
- A picture you drop in is placed by its name (for example particle or gui) or by the item you have selected; there is no chooser yet.
- NeoForge, Forge and Quilt are shown in New project as "Later"; only Fabric works for now.
- Saving versions needs git installed; you need Java 25 (a JDK); the first build needs an internet connection and takes a few minutes.

### Privacy

- Blocksy checks GitHub for updates when it starts and every few hours. No account or personal data is sent.
- While setting up and building, Gradle downloads Minecraft, Fabric and code libraries from Mojang, Fabric and Maven repositories.
- Minecraft's pictures, sounds and font are read from the files already downloaded on your computer, only to draw previews. They are kept in memory, never copied into your project, bundled or uploaded.
- Files you import are stored in your project folder and never leave your computer.
- Saved versions stay in your project folder on your computer; nothing is uploaded.
- Docs lesson pages show video thumbnails from YouTube; a video loads from YouTube only when you press play.
- Links you open from the Docs, Learn, Community or elsewhere in Blocksy open in your browser.
- The list of folders you trust is kept on your computer only.
- There is no GitHub sign-in or sync in this version, and Blocksy collects no usage data.

## [0.4.0] - 2026-11-05

A new editor that looks and feels like a full creation tool, with previews drawn the way Minecraft draws them.

### Added

- **A full editor shell.** A menu bar, a row of quick actions, a project tree with your real textures as icons, tabs for several open items at once, panels you can drag to resize, and a bottom dock with the Build log, Problems and History.
- **Command palette and shortcuts.** Press Ctrl+K to search every action, and press ? to see all keyboard shortcuts. Blocksy remembers your panel layout for each project.
- **Minecraft's own look.** Creative tabs and recipes are now drawn on the real creative inventory, crafting and furnace screens, with Minecraft's pixel font. Items and blocks appear as they do in game, in both the Modern and Minecraft themes.
- **Paint studio.** A bigger texture editor with zoom and pan, a pixel grid, a colour picker, layers, a frames timeline for animations and a live preview at game size. Items also get a Look mode that shows them in a slot, a tooltip and the hotbar; blocks get Paint, Model and Look modes.
- **Importing files.** Bring in block and item textures, GUI and particle pictures, sounds and models from the Resources menu, or just drag them in from your desktop.
- **Setting up when you create a project.** A new project shows what is being downloaded and how much is left while Blocksy gets Minecraft ready, so the real Minecraft look is there when the editor opens. Later projects reuse it.

### Changed

- The editor is denser and calmer: one title row with the menus and search, tabbed settings on the right (Properties, Texture or Behaviour, Code), and sections you can fold away.
- Number settings can be dragged to change them, and show their units.
- Projects made with earlier versions open as they are and get the new workspace setup the first time you open them.

### Known issues

- Windows may warn "Windows protected your PC" when you install, because the installer isn't code-signed yet. Click **More info**, then **Run anyway**.
- Minecraft's look appears after the first setup or build. Until then you see Blocksy's simple preview with a "Build once to load Minecraft's look" note.
- Blocks are still full cubes with one texture on all six faces; custom shapes and per-face painting come with Model Studio.
- Panels can be resized and folded but not yet dragged out as free-floating windows.
- A picture you drop in is placed by its name (for example particle or gui) or by the item you have selected; there is no chooser yet.
- The creative tab preview shows the first 45 entries and doesn't scroll yet.
- Some Minecraft items that need special drawing show a simple placeholder.
- Saving versions needs git installed; you need Java 25 (a JDK); only the Fabric loader is supported; the first build needs an internet connection and takes a few minutes.

### Privacy

- Blocksy checks GitHub for updates when it starts and every few hours. No account or personal data is sent.
- While setting up and building, Gradle downloads Minecraft, Fabric and code libraries from Mojang, Fabric and Maven repositories.
- Minecraft's pictures, sounds and font are read from the files already downloaded on your computer, only to draw previews. They are kept in memory, never copied into your project, bundled or uploaded.
- Files you import are stored in your project folder and never leave your computer.
- Saved versions stay in your project folder on your computer; nothing is uploaded.
- Docs lesson pages show video thumbnails from YouTube; a video loads from YouTube only when you press play.
- Links you open from the Docs or elsewhere in Blocksy open in your browser.
- There is no GitHub sign-in or sync in this version, and Blocksy collects no usage data.

## [0.3.0] - 2026-11-04

Your first item: paint it, give it recipes, cook it in a furnace and eat it in Minecraft.

### Added

- **Items.** Add an item from the project tree and set its stack size, rarity and fire resistance. Make it food with hunger, saturation and status effects, a furnace fuel, or compostable, and give it tooltip lines. Every setting shows the Java it turns into.
- **Pixel texture editor.** Paint item textures right on the canvas with a pencil, eraser, paint bucket and colour picker, mirror both halves at once, and pick from a palette or the colours already in your texture. Add frames to animate a texture, with onion skin to line them up and a live preview at game size.
- **Recipes.** A visual crafting grid for shaped and shapeless recipes, plus furnace, blast furnace, smoker and stonecutter recipes. Click a slot to pick any item, one of your own, or a tag. Blocksy tells you what's missing before a recipe is ready.
- **Tags.** Group items or blocks into your own tags, or add them to existing ones like Minecraft's planks or the common tags other mods share.
- **Translations.** A Languages editor lists every name, tab title and tooltip line your mod has, next to its English text, so translating is filling in a table.
- **Version history.** Save a version of your project before a big change (Ctrl+S), and go back to any saved version from History. Going back can be undone.
- **Starter item.** New project can now start with Berry Dough and a Berry Bun, with the recipes to craft, cook and eat them, ready to Run.
- **Hear your block's sounds.** Pick from every block sound in Minecraft, search them all, and press play to hear a block broken, walked on or placed.
- **Docs.** New lessons and guides: Make your first item, painting animated textures, adding recipes, translating your mod, saving versions, and what tags are. Every new element's reference page has a live editor to try.

### Changed

- **A fresh "What's new".** Each release gets its own little pixel world with a block in the middle, and the full list of changes, so you don't need to leave Blocksy to read them.
- Creative tabs can hold items as well as blocks.
- Opening a block, item or recipe in the editor is quicker.

### Known issues

- Windows may warn "Windows protected your PC" when you install, because the installer isn't code-signed yet. Click **More info**, then **Run anyway**.
- Blocks are full cubes with one texture on all six faces; custom shapes and per-face textures come with Model Studio in 0.5.
- Saving versions needs git installed on your computer; History tells you where to get it if it's missing.
- Block sounds play after your first build, once Minecraft has been downloaded.
- Only the Fabric loader is supported; NeoForge comes later.
- You need Java 25 (a JDK) installed; Blocksy helps you find one but doesn't install it for you.
- The first build of each project needs an internet connection and takes a few minutes; mods with blocks or items also generate their models, which adds a little time after changes.
- Docs search and more lessons arrive in 0.7.

### Privacy

- Blocksy checks GitHub for updates when it starts and every few hours. No account or personal data is sent.
- While building, Gradle downloads Minecraft, Fabric and code libraries from Mojang, Fabric and Maven repositories.
- Block sounds play from the Minecraft files already downloaded on your computer; nothing is sent anywhere.
- Saved versions stay in your project folder on your computer; nothing is uploaded.
- Docs lesson pages show video thumbnails from YouTube; a video loads from YouTube only when you press play.
- Links you open from the Docs or elsewhere in Blocksy open in your browser.
- Textures and cover pictures you choose are stored in your project folder and never leave your computer.
- There is no GitHub sign-in or sync in this version, and Blocksy collects no usage data.

## [0.2.0] - 2026-10-30

Your first block: design it, give it a texture, and play it in Minecraft in its own creative tab.

### Added

- **Blocks.** Add a block from the project tree and set its name, hardness, blast resistance, tool and tool tier, whether it needs the right tool to drop, light level, sound and map colour. Every setting shows the Java it turns into, so you learn the code as you click.
- **Textures and a live 3D preview.** Import a 16x16 PNG and see your block turn in 3D straight away. Drag to look around. New blocks start with Blocksy's own pixel texture.
- **Creative tabs.** Give your mod its own page in the creative inventory, pick its icon, and see how it will look before you play.
- **Starter block.** New project now starts with a creative tab and one block, ready to Run.
- **The project editor.** Each project opens in its own focused editor: your blocks and tabs on the left, the block in the middle, its settings on the right, and a small toolbar for Design, Code, undo and redo. A back button takes you home.
- **Code tab.** Read every file Blocksy writes for your mod, with colours, always up to date with what you design.
- **Blocks that work in game.** Blocksy writes the registration, models, loot table, tool tags and English names for you, so your block shows in its tab, can be placed, and drops itself when mined with the right tool.
- **Minecraft theme.** Switch to it in Settings: stone and wood tones, chunky buttons and a pixel font, all original art.
- **Docs.** Learn, Guides, Reference, Concepts and Community, starting with **Make your first block**, featuring video lessons by Modding by Kaupenjoe. A Credits page thanks everyone whose work Blocksy builds on.
- Little touches: a dot-matrix light while building, a pixel loader while things get ready, and a burst of confetti the first time your mod loads in game.

### Changed

- Build and Run write your mod's files from the project first, and only regenerate block data when something changed.
- Home and Docs keep the icon sidebar; inside a project it steps aside so the editor has the whole window.

### Known issues

- Windows may warn "Windows protected your PC" when you install, because the installer isn't code-signed yet. Click **More info**, then **Run anyway**.
- Items, recipes and the Starter item arrive in 0.3.
- Blocks are full cubes with one texture on all six faces; custom shapes and per-face textures come with Model Studio in 0.5.
- English names come from your block and tab names; a language editor arrives in 0.3.
- Only the Fabric loader is supported; NeoForge comes later.
- You need Java 25 (a JDK) installed; Blocksy helps you find one but doesn't install it for you.
- The first build of each project needs an internet connection and takes a few minutes; mods with blocks also generate their block data, which adds a little time after changes.
- Docs search and more lessons arrive in 0.7.

### Privacy

- Blocksy checks GitHub for updates when it starts and every few hours. No account or personal data is sent.
- While building, Gradle downloads Minecraft, Fabric and code libraries from Mojang, Fabric and Maven repositories.
- Docs lesson pages show video thumbnails from YouTube; a video loads from YouTube only when you press play.
- Links you open from the Docs or elsewhere in Blocksy open in your browser.
- Textures and cover pictures you choose are stored in your project folder and never leave your computer.
- There is no GitHub sign-in or sync in this version, and Blocksy collects no usage data.

## [0.1.1] - 2026-10-30

A calmer, cleaner Blocksy, and a note on what's new every time it updates.

### Added

- **What's new after every update.** The first time you open Blocksy after an update, a short note shows what changed. Open it again any time from Settings, Updates.
- **Change a project's cover.** Every project gets its own pixel cover. Pick your own picture with Change cover in the project menu, or go back to the generated one.
- **Right-click menus.** Right-click a project to open it, show it in its folder or change its cover. Right-click the Build log to copy or clear it, or a project detail to copy it.

### Changed

- **A quieter look.** The sidebar is now a slim row of icons with just Home and Docs. There are no borders, and Home greets you with your projects as cards or a list.
- **Projects live on Home.** Open one project at a time from Home. The Build log and status bar only show while you're working in a project, and the status bar is plain text instead of buttons.
- **Blocksy draws its own window frame**, so the top of the window matches the app.
- **New project** is smaller and clearer: Blank mod, Starter block and Starter item, each with an icon. It fits better in smaller windows.
- **Settings** has an icon for each section and groups related settings together.
- Long project names and folder paths now wrap instead of running off the screen.

### Known issues

- Windows may warn "Windows protected your PC" when you install, because the installer isn't code-signed yet. Click **More info**, then **Run anyway**.
- Mods are empty for now: blocks arrive in 0.2 and items in 0.3. Starter block and Starter item open then.
- Only the Fabric loader is supported; NeoForge comes later.
- You need Java 25 (a JDK) installed; Blocksy helps you find one but doesn't install it for you.
- The first build of each project needs an internet connection and takes a few minutes.
- The Docs page is a short preview; full guides arrive in 0.7.
- The Minecraft theme arrives in 0.2; Modern is the only theme for now.

### Privacy

- Blocksy checks GitHub for updates when it starts and every few hours. No account or personal data is sent.
- While building, Gradle downloads Minecraft, Fabric and code libraries from Mojang, Fabric and Maven repositories.
- Links you open (like the Java download page or "See all changes") open in your browser.
- A cover picture you choose is copied into that project's folder and never leaves your computer.
- There is no GitHub sign-in or sync in this version, and Blocksy collects no usage data.

## [0.1.0] - 2026-10-30

The first Blocksy: create an empty Fabric mod, build it and play it in Minecraft, without touching Gradle.

### Added

- **Create a mod in one dialog.** Give it a name and a folder; Blocksy picks the mod ID and Java package, and shows every file it will create before it does.
- **Build, Run and Export.** Run starts Minecraft with your mod and tells you the moment it has loaded. Export saves a ready-to-share `.jar`.
- **A calm first build.** The first build downloads Minecraft and the mod loader, which takes a few minutes. A step-by-step timeline shows what is happening, with the latest line from Gradle so it never looks stuck.
- **Build log** under every page, with right-click to copy or clear it.
- **Java setup.** Blocksy finds the Java installs on your computer, says which one it will use, and links to a free download when you need one.
- **Home** shows your projects as cards or a list, each with its own pixel cover. Right-click (or the ··· menu) to open a project, show it in its folder, change its cover picture or remove it from the list.
- **Settings** for your Java install, the default project folder and the theme.
- **Automatic updates.** Blocksy checks for new versions and quietly offers to restart. It never restarts while a build or Minecraft is running.
- Supports Minecraft 26.1.2 and 26.3 with Fabric.

### Known issues

- Windows may warn "Windows protected your PC" when you install, because the installer isn't code-signed yet. Click **More info**, then **Run anyway**.
- Mods are empty for now: blocks arrive in 0.2 and items in 0.3.
- Only the Fabric loader is supported; NeoForge comes later.
- You need Java 25 (a JDK) installed; Blocksy helps you find one but doesn't install it for you.
- The first build of each project needs an internet connection and takes a few minutes.
- The Docs page is a short preview; full guides arrive in 0.7.
- The Minecraft theme arrives in 0.2; Modern is the only theme for now.

### Privacy

- Blocksy checks GitHub for updates when it starts and every few hours. No account or personal data is sent.
- While building, Gradle downloads Minecraft, Fabric and code libraries from Mojang, Fabric and Maven repositories.
- Links you open (like the Java download page) open in your browser.
- There is no GitHub sign-in or sync in this version, and Blocksy collects no usage data.
