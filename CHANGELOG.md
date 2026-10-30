# Changelog

All notable changes to Blocksy are documented here. Versions follow docs/release/blocksy-release-plan.md.

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
