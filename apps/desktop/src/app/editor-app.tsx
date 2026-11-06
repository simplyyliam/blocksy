// The editor window's root (ADR 0020): providers, the router (app/router.tsx, one project
// layout) and the dialogs and toasts that float above it. It is created for one project:
// Rust hands over which one (take_editor_launch), and later switches arrive as "open-project".
import { MotionConfig } from "motion/react"
import { listen } from "@tauri-apps/api/event"
import { useEffect } from "react"
import { RouterProvider } from "react-router-dom"
import { Toaster, TooltipProvider } from "@blocksy/ui"
import { Palette, ShortcutSheet } from "../features/palette/palette"
import { SettingsDialog } from "../features/settings/settings-dialog"
import { WhatsNewDialog } from "../features/whats-new/whats-new-dialog"
import { errorMessage } from "../shared/api"
import { commands, type EditorLaunch } from "../shared/bindings"
import { registerBuiltinCommands } from "../shared/commands/builtin"
import { useShortcuts } from "../shared/commands/use-shortcuts"
import { prepareWorkspace } from "../shared/project-actions"
import { useProject } from "../shared/stores/project"
import { showWelcome } from "../shared/windows"
import { router } from "./router"

// The command registry (menus, toolbar, palette, shortcuts all read it) is filled once, at load.
registerBuiltinCommands()

/** Opens the project the window was made for. If it can't open, back to the welcome window with the reason. */
async function openLaunch({ projectDir, prepare }: EditorLaunch) {
  try {
    await useProject.getState().open(projectDir)
    // A new project: start the workspace setup right away (the first Gradle setup downloads Minecraft).
    // It runs in the background with a progress view (quiet when there is no Java yet).
    if (prepare) void prepareWorkspace()
  } catch (err) {
    await showWelcome({ notice: `Couldn't open that project: ${errorMessage(err)}` }).catch(() => {})
  }
}

export function EditorApp() {
  useShortcuts()
  useEffect(() => {
    // The editor can't have missed its launch: Rust keeps it until this call takes it.
    void commands.takeEditorLaunch().then((launch) => launch && void openLaunch(launch))
    // Switching project (File > Open Recent, or a project opened from the welcome window while this one is open).
    const stop = listen<EditorLaunch>("open-project", ({ payload }) => void openLaunch(payload))
    return () => void stop.then((off) => off())
  }, [])
  return (
    // reducedMotion="user": every motion animation follows the OS "reduce motion" setting.
    <MotionConfig reducedMotion="user">
      <TooltipProvider delay={500}>
        <RouterProvider router={router} />
        <SettingsDialog />
        <WhatsNewDialog />
        <Palette />
        <ShortcutSheet />
        <Toaster position="bottom-right" offset={{ right: 20, bottom: 36 }} />
      </TooltipProvider>
    </MotionConfig>
  )
}

