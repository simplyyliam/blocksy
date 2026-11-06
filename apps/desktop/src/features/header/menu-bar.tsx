// The menu bar in the titlebar row: File, Edit, Project, Resources, Build & run, Tools,
// Window, Help. The structure is in shared/commands/menus.ts; every item is a command,
// so its title, icon, shortcut and greyed-out state come from the registry.
import { Fragment } from "react"
import {
  Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarMenu, MenubarSeparator, MenubarShortcut, MenubarTrigger,
} from "@blocksy/ui"
import { commandRegistry, isEnabled, runCommand, type AppCommand } from "../../shared/commands/registry"
import { menus } from "../../shared/commands/menus"
import { shortcutParts } from "../../shared/commands/shortcuts"
import { OpenRecent } from "./open-recent"

// Compact rows (28px) with small corners: dense but organised.
const item = "gap-2 rounded-lg px-2 py-1.5 font-normal"

const keysText = (command: AppCommand) => (command.keys ? shortcutParts(command.keys).join("+") : undefined)

function MenuItem({ id }: { id: string }) {
  "use no memo" // reads command state from stores at render; the compiler would cache it
  const command = commandRegistry.require(id)
  const Icon = command.icon
  const disabled = !isEnabled(command)
  const keys = keysText(command)
  // Panel toggles show a check mark instead of an icon.
  if (command.checked) {
    return (
      <MenubarCheckboxItem className={item} checked={command.checked()} disabled={disabled} onClick={() => runCommand(id)}>
        {command.title}
        {keys && <MenubarShortcut>{keys}</MenubarShortcut>}
      </MenubarCheckboxItem>
    )
  }
  return (
    <MenubarItem className={item} disabled={disabled} onClick={() => runCommand(id)}>
      {Icon && <Icon strokeWidth={1.75} />}
      {command.title}
      {keys && <MenubarShortcut>{keys}</MenubarShortcut>}
    </MenubarItem>
  )
}

export function MenuBar() {
  return (
    // Flat and borderless: it sits on the titlebar like VS Code's, not as a pill.
    <Menubar aria-label="Menu" className="h-6 gap-0 rounded-none border-0 bg-transparent p-0">
      {menus.map((menu) => (
        <MenubarMenu key={menu.title}>
          <MenubarTrigger className="h-6 shrink-0 whitespace-nowrap rounded-sm px-2 text-sm font-normal text-fg-muted hover:bg-surface-hover hover:text-fg aria-expanded:bg-surface-hover aria-expanded:text-fg">
            {menu.title}
          </MenubarTrigger>
          <MenubarContent className="min-w-60 rounded-xl p-1">
            {menu.items.map((id, i) =>
              id === "-" ? <MenubarSeparator key={`sep-${i}`} /> : id === "@recent" ? <OpenRecent key={id} /> : <Fragment key={id}><MenuItem id={id} /></Fragment>,
            )}
          </MenubarContent>
        </MenubarMenu>
      ))}
    </Menubar>
  )
}
