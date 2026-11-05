// The quick actions that sit in the titlebar row next to the menus (project editor only):
//   ← ▣ Berry Mod ⋯ │ File Edit … │ ＋ 💾 │ ↶ ↷ │ Build Run Export          🔍 Ctrl K
// Every button is a command from the registry, so it matches the menus and the shortcuts.
// Icons are pixel-art (the Minecraft feel); buttons are 28px and quiet (no outline).
import { Button, cn, Kbd, PixelBack, PixelBuild, PixelExport, PixelNew, PixelRedo, PixelRun, PixelSave, PixelSearch, PixelStop, PixelUndo, Separator } from "@blocksy/ui"
import { CommandButton } from "../../shared/commands/command-button"
import { runCommand } from "../../shared/commands/registry"
import { shortcutParts } from "../../shared/commands/shortcuts"
import { useGradle } from "../../shared/stores/gradle"
import { useNavigation } from "../../shared/stores/navigation"

const divider = <Separator orientation="vertical" className="mx-1 h-4 bg-line-subtle" />

/** Back to Home, as a pixel arrow. */
export function PixelBackButton() {
  const go = useNavigation((s) => s.go)
  return (
    <Button variant="ghost" size="icon-sm" aria-label="Back to Home" className="size-7 rounded-md text-fg-muted" onClick={() => go("home")}>
      <PixelBack className="size-4" />
    </Button>
  )
}

export function TitleActions() {
  const task = useGradle((s) => s.task)
  return (
    <div role="toolbar" aria-label="Quick actions" className="flex items-center">
      {divider}
      <CommandButton id="file.new-element" icon={PixelNew} />
      <CommandButton id="file.save" icon={PixelSave} />
      {divider}
      <CommandButton id="edit.undo" icon={PixelUndo} />
      <CommandButton id="edit.redo" icon={PixelRedo} />
      {divider}
      <CommandButton id="build.build" label="Build" icon={PixelBuild} busy={task === "build"} />
      <CommandButton id="build.run" label="Run" icon={PixelRun} busy={task === "run_client"} />
      <CommandButton id="build.export" label="Export" icon={PixelExport} />
      {task !== null && <CommandButton id="build.stop" icon={PixelStop} />}
    </div>
  )
}

/** The search field on the right of the titlebar: opens the palette. Shrinks to an icon when narrow. */
export function TitleSearch() {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn("h-7 gap-2 rounded-md bg-surface px-2 font-normal text-fg-muted hover:bg-surface-hover", "w-44 justify-start max-lg:w-7 max-lg:justify-center max-lg:px-0")}
      aria-label="Search commands"
      onClick={() => runCommand("tools.palette")}
    >
      <PixelSearch className="size-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate text-left max-lg:hidden">Search</span>
      <span className="flex gap-0.5 max-lg:hidden">
        {shortcutParts("Mod+K").map((p) => (
          <Kbd key={p}>{p}</Kbd>
        ))}
      </span>
    </Button>
  )
}
