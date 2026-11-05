// The toolbar widget: quick actions under the menu bar (project editor only).
//   ← ▣ Berry Mod ⋯ │ ⊕ 💾 │ ↶ ↷ │ ⚒ Build ▶ Run ⬇ Export │ Design Code │            🔍 Search  Ctrl K
// Every button is a command from the registry, so it matches the menus and the shortcuts.
import { Code2, Search, Shapes } from "lucide-react"
import { Button, cn, Kbd, KbdGroup, Separator } from "@blocksy/ui"
import { BackButton } from "../../features/header/back-button"
import { ProjectTitle } from "../../features/header/project-title"
import { CommandButton } from "../../shared/commands/command-button"
import { runCommand } from "../../shared/commands/registry"
import { shortcutParts } from "../../shared/commands/shortcuts"
import { useCommandState } from "../../shared/commands/use-command-state"
import { useEditor } from "../../shared/stores/editor"
import { useGradle } from "../../shared/stores/gradle"

const divider = <Separator orientation="vertical" className="mx-1 h-5 bg-line-subtle" />

/** Design and Code as one segmented control. */
function ViewSwitch() {
  useCommandState()
  const view = useEditor((s) => s.view)
  const options = [
    { id: "project.design", view: "design", label: "Design", Icon: Shapes },
    { id: "project.code", view: "code", label: "Code", Icon: Code2 },
  ] as const
  return (
    <div role="group" aria-label="View" className="flex items-center rounded-lg bg-surface p-0.5">
      {options.map(({ id, view: v, label, Icon }) => (
        <Button
          key={id}
          variant="ghost"
          size="xs"
          aria-pressed={view === v}
          onClick={() => runCommand(id)}
          className={cn("h-6 gap-1.5 rounded-md px-2 text-fg-muted", view === v && "bg-bg text-fg shadow-sm")}
        >
          <Icon strokeWidth={1.75} /> {label}
        </Button>
      ))}
    </div>
  )
}

export function Toolbar() {
  const task = useGradle((s) => s.task)
  return (
    <div role="toolbar" aria-label="Quick actions" className="flex h-10 shrink-0 items-center gap-0.5 px-2">
      <BackButton />
      <ProjectTitle />
      {divider}
      <CommandButton id="file.new-element" />
      <CommandButton id="file.save" />
      {divider}
      <CommandButton id="edit.undo" />
      <CommandButton id="edit.redo" />
      {divider}
      <div className="flex items-center gap-1">
        <CommandButton id="build.build" label="Build" busy={task === "build"} />
        <CommandButton id="build.run" label="Run" busy={task === "run_client"} />
        <CommandButton id="build.export" label="Export" />
        {task !== null && <CommandButton id="build.stop" />}
      </div>
      {divider}
      <ViewSwitch />
      <div className="min-w-0 flex-1" />
      {/* Opens the command palette; looks like a search field, like Linear and VS Code. */}
      <Button variant="outline" size="sm" className="h-7 w-52 justify-start gap-2 px-2.5 font-normal text-fg-muted" onClick={() => runCommand("tools.palette")}>
        <Search strokeWidth={1.75} />
        <span className="flex-1 text-left">Search commands…</span>
        <KbdGroup>
          {shortcutParts("Mod+K").map((p) => (
            <Kbd key={p}>{p}</Kbd>
          ))}
        </KbdGroup>
      </Button>
    </div>
  )
}
