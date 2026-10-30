# Changelog

All notable changes to Blocksy are documented here. Versions follow docs/release/blocksy-release-plan.md.

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
