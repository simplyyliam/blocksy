// The run actions at the right of the titlebar (project editor only), in the usual IDE order:
//   Build · Run · (Stop, only while something runs) · Export
// Icon-only with tooltips, except Export: no icon for it is universally understood, so it keeps
// its label. There is no Debug button because Blocksy has no debug feature yet (ADR 0019).
// Every button is a command from the registry, so it matches the menus and the shortcuts.
import { Play } from "lucide-react"
import { PixelBuild, PixelStop } from "@blocksy/ui"
import { CommandButton } from "../../shared/commands/command-button"
import { useGradle } from "../../shared/stores/gradle"

/** Lucide's play triangle, filled green like every IDE's Run button. */
function RunIcon({ className }: { className?: string }) {
  return <Play className={className} strokeWidth={1.75} fill="var(--b-success)" stroke="var(--b-success)" />
}

export function RunActions() {
  const task = useGradle((s) => s.task)
  return (
    <div role="toolbar" aria-label="Run actions" className="flex items-center gap-0.5">
      <CommandButton id="build.build" icon={PixelBuild} busy={task === "build"} />
      <CommandButton id="build.run" icon={RunIcon} busy={task === "run_client"} />
      {task !== null && <CommandButton id="build.stop" icon={PixelStop} />}
      <CommandButton id="build.export" label="Export" />
    </div>
  )
}
