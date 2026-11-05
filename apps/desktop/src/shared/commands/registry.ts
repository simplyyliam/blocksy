// The command registry: every action the editor can do, defined once.
// The menu bar, toolbar, Ctrl+K palette, shortcut sheet and keyboard shortcuts all read
// this one list, so a command is never described twice (plan v0.4, workstream 1).
// Built on core's generic registry, so a duplicate id fails loudly.
import type { LucideIcon } from "lucide-react"
import { createRegistry } from "@blocksy/core"

export interface AppCommand {
  /** "group.action", e.g. "file.save". */
  id: string
  title: string
  /** Where it lives in the palette and shortcut sheet; also the menu it belongs to. */
  group: string
  icon?: LucideIcon
  /** "Mod+S", "N", "?" (see shortcuts.ts). */
  keys?: string
  /** More shortcuts for the same command (redo is Ctrl+Shift+Z and Ctrl+Y). */
  altKeys?: string[]
  /** Leave this shortcut to the text field while one has focus (undo, redo). */
  skipWhileTyping?: boolean
  /** Extra words the palette searches. */
  keywords?: string[]
  /** Only offered while a project is open (the default). */
  needsProject?: boolean
  run(): void | Promise<void>
  /** Greyed out when this returns false. */
  enabled?(): boolean
  /** A check mark in menus (panel toggles). */
  checked?(): boolean
}

export const commandRegistry = createRegistry<AppCommand>("command")

export function defineCommand(command: AppCommand): AppCommand {
  return commandRegistry.register({ needsProject: true, ...command })
}

export function isEnabled(command: AppCommand): boolean {
  return command.enabled ? command.enabled() : true
}

/** Runs a command by id (does nothing if it is greyed out). */
export function runCommand(id: string) {
  const command = commandRegistry.require(id)
  if (isEnabled(command)) void command.run()
}
