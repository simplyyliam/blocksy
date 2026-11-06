# 0020: Two windows (welcome and editor)

- Status: accepted
- Date: 2026-11-06
- Replaces: the Home layout of ADR 0007 (`AppLayout`, the icon rail, the Home page, the New project dialog).

(The goal asked for "ADR 0012", but `0012-depend-on-geckolib.md` already exists, so this is the next free number.)

## Context

Blocksy opened on a Home page inside the editor window, with an icon rail and a New project dialog. Users see the start screen
every time they open the app. JetBrains IDEs, Visual Studio and Unity Hub all use a separate, fixed-size start window and open
the editor in its own window. That keeps the editor free of start-screen chrome and gives the start screen room for search,
pinning, clone, learn and settings.

## Decision

- Two Tauri windows in one bundle and one `index.html`:
  - `welcome`: fixed size (820 x 600, not resizable), custom title bar, folder drops enabled.
  - `editor`: resizable (1280 x 820, min 960 x 640), created on demand (`create: false` in the config).
- `main.tsx` picks `WelcomeApp` or `EditorApp` from the window label.
- The app starts in `welcome`. Opening or creating a project builds `editor`, then closes `welcome` (the new window first, so
  there is never a moment with zero windows). File > Close Project builds `welcome`, then closes `editor`.
- Closing the welcome window with no editor open quits the app (Tauri's default when the last window closes). Closing the
  editor also quits, like JetBrains with one project.
- One editor window means one project at a time, which matches Gradle running one task at a time (`GradleState`).
- File > Open Recent stays in the editor; opening another project from it re-opens the editor on that project.
- Rust stays thin: `open_editor`, `show_welcome`, `take_editor_launch` (window plumbing), `git_clone` (a process, like the
  existing `git` helper). Everything else (search, pin, validation, forms) is TypeScript.
- The project to open is handed over in Rust state (`Launch { projectDir, prepare }`) and taken once by the editor at boot, so
  there is no event race. If the editor already exists, it receives an `open-project` event instead.
- Settings and the recent list are files in the app data folder. Each window loads them at start; after a change the window emits
  `settings-changed` / `recent-changed` and the other window reloads.
- The welcome window has a start gate (an ordered list of first-launch views with a `when(state)` check). It is empty today. The
  sign-in release adds a sign-in view there, so it shows before the welcome view on first launch.

## Consequences

- The router only serves the editor (`/project/:projectId`); the Home, Docs and JDK routes and the icon rail are removed.
  Docs live in the editor's `@docs` tab and in the welcome window's Learn view. JDK setup lives in Settings > Java.
- The bench measures the welcome window first, then the editor.
- Two webviews cost some memory while both exist; they only overlap during the switch.
