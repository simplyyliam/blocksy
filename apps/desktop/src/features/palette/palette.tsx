// The command palette (Ctrl+K) and the shortcut sheet (?). Both read the command registry,
// so they list exactly what the menus do. The palette also jumps to any element by name.
import {
  Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandShortcut, Dialog, DialogContent,
  DialogDescription, DialogHeader, DialogTitle, Kbd, KbdGroup,
} from "@blocksy/ui"
import { ElementIcon } from "../project-editor/element-icon"
import { commandRegistry, isEnabled, runCommand, type AppCommand } from "../../shared/commands/registry"
import { shortcutParts } from "../../shared/commands/shortcuts"
import { useEditor } from "../../shared/stores/editor"
import { useNavigation } from "../../shared/stores/navigation"
import { useProject } from "../../shared/stores/project"

/** Commands that make sense right now: project commands wait for an open project. */
function available(hasProject: boolean): AppCommand[] {
  return commandRegistry.list().filter((c) => hasProject || !c.needsProject)
}

function groupBy(commands: AppCommand[]): [string, AppCommand[]][] {
  const groups = new Map<string, AppCommand[]>()
  for (const c of commands) groups.set(c.group, [...(groups.get(c.group) ?? []), c])
  return [...groups]
}

export function Palette() {
  const open = useNavigation((s) => s.paletteOpen)
  const setOpen = useNavigation((s) => s.setPalette)
  const project = useProject((s) => s.current)
  const select = useEditor((s) => s.select)

  const run = (id: string) => {
    setOpen(false)
    // Wait for the dialog to close so a command that opens another dialog keeps focus.
    setTimeout(() => runCommand(id), 60)
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen} title="Command palette" description="Search commands and elements" className="sm:max-w-xl">
      <Command className="rounded-none">
        <CommandInput placeholder="Type a command or an element name…" />
        <CommandList className="max-h-96">
          <CommandEmpty>Nothing matches.</CommandEmpty>
          {project && project.doc.elements.length > 0 && (
            <CommandGroup heading="Elements">
              {project.doc.elements.map((element) => (
                <CommandItem
                  key={element.id}
                  value={`element ${element.name} ${element.type}`}
                  onSelect={() => {
                    setOpen(false)
                    select(element.id)
                  }}
                >
                  <ElementIcon element={element} project={project.doc} className="size-5" />
                  {element.name}
                  <CommandShortcut>{element.type.replace("_", " ")}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {groupBy(available(project !== null)).map(([group, commands]) => (
            <CommandGroup key={group} heading={group}>
              {commands.map((c) => {
                const Icon = c.icon
                return (
                  <CommandItem key={c.id} value={`${c.group} ${c.title} ${(c.keywords ?? []).join(" ")}`} disabled={!isEnabled(c)} onSelect={() => run(c.id)}>
                    {Icon && <Icon strokeWidth={1.75} />}
                    {c.title}
                    {c.keys && <CommandShortcut>{shortcutParts(c.keys).join("+")}</CommandShortcut>}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          ))}
        </CommandList>
      </Command>
    </CommandDialog>
  )
}

/** "?" opens this sheet: every shortcut, grouped like the menus. */
export function ShortcutSheet() {
  const open = useNavigation((s) => s.shortcutsOpen)
  const setOpen = useNavigation((s) => s.setShortcuts)
  const hasProject = useProject((s) => s.current !== null)
  const groups = groupBy(available(hasProject).filter((c) => c.keys))
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>Every command is also in the menus and the Ctrl K palette.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
          {groups.map(([group, commands]) => (
            <section key={group}>
              <h3 className="mb-1 text-xs font-medium tracking-wide text-fg-muted uppercase">{group}</h3>
              <ul>
                {commands.map((c) => (
                  <li key={c.id} className="flex h-7 items-center justify-between gap-3 text-sm">
                    <span className="truncate">{c.title.replace(/…$/, "")}</span>
                    <KbdGroup>
                      {shortcutParts(c.keys!).map((p) => (
                        <Kbd key={p}>{p}</Kbd>
                      ))}
                    </KbdGroup>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
