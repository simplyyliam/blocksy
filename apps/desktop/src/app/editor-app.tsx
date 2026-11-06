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
import { useJava } from "../shared/stores/java"
import { useProject } from "../shared/stores/project"
import { showWelcome } from "../shared/windows"
import { router } from "./router"

// The command registry (menus, toolbar, palette, shortcuts all read it) is filled once, at load.
registerBuiltinCommands()

/** Waits (briefly) for the Java check that boot() started, so the workspace setup knows if there is a JDK. */
function javaChecked(): Promise<void> {
  if (useJava.getState().status !== "checking") return Promise.resolve()
  return new Promise((resolve) => {
    const done = () => {
      off()
      clearTimeout(timer)
      resolve()
    }
    const off = useJava.subscribe((s) => s.status !== "checking" && done())
    const timer = setTimeout(done, 5000)
  })
}

/** Opens the project the window was made for. If it can't open, back to the welcome window with the reason. */
async function openLaunch({ projectDir, prepare }: EditorLaunch) {
  try {
    await useProject.getState().open(projectDir)
    // A new project: start the workspace setup right away (the first Gradle setup downloads Minecraft).
    // It runs in the background with a progress view (quiet when there is no Java yet).
    if (prepare) void javaChecked().then(prepareWorkspace)
  } catch (err) {
    await showWelcome({ notice: `Couldn't open that project: ${errorMessage(err)}` }).catch(() => {})
  }
}

/** Rust keeps the launch until it is taken, and it can only be taken once: React's dev double-run of effects must not ask twice. */
let started = false

function startEditor() {
  if (started) return
  started = true
  // (Bench mode sets up its own in-memory project, so it never opens one from disk.)
  void Promise.all([commands.benchMode(), commands.takeEditorLaunch()]).then(([bench, launch]) => {
    if (bench) return
    if (launch) void openLaunch(launch)
    // A reloaded editor (dev reload, a WebView restart) has no project to show: back to the welcome window.
    else if (!useProject.getState().current) void showWelcome().catch(() => {})
  })
}

export function EditorApp() {
  useShortcuts()
  useEffect(() => {
    startEditor()
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

