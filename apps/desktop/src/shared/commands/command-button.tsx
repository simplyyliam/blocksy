// A compact button for one command: icon (and an optional short label), a tooltip with its
// shortcut, greyed out when the command is not available. Press state follows `checked()`.
// 28px tall at most: tool buttons must not pull the eye away from the canvas.
import type { ComponentType } from "react"
import { Button, cn, Kbd, KbdGroup, Spinner, Tooltip, TooltipContent, TooltipTrigger } from "@blocksy/ui"
import { commandRegistry, isEnabled, runCommand } from "./registry"
import { shortcutParts } from "./shortcuts"
import { useCommandState } from "./use-command-state"

interface Props {
  id: string
  /** A short text label next to the icon (Build, Run). */
  label?: string
  /** Replaces the command's own icon (the titlebar uses pixel-art icons). */
  icon?: ComponentType<{ className?: string }>
  /** Shows a spinner instead of the icon (a running task). */
  busy?: boolean
  className?: string
}

export function CommandButton({ id, label, icon, busy, className }: Props) {
  "use no memo" // reads command state from stores at render; the compiler would cache it
  useCommandState()
  const command = commandRegistry.require(id)
  const Icon = icon ?? command.icon
  const checked = command.checked?.()
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size={label ? "sm" : "icon-sm"}
            aria-label={command.title}
            aria-pressed={checked}
            disabled={!isEnabled(command)}
            onClick={() => runCommand(id)}
            className={cn("h-7 rounded-md text-fg-muted hover:text-fg", label ? "gap-1.5 px-2 text-sm" : "w-7", checked && "bg-surface-hover text-fg", className)}
          />
        }
      >
        {busy ? <Spinner /> : Icon && <Icon className="size-4 shrink-0" />}
        {label}
      </TooltipTrigger>
      <TooltipContent className="flex items-center gap-2">
        {command.title.replace(/…$/, "")}
        {command.keys && (
          <KbdGroup>
            {shortcutParts(command.keys).map((part) => (
              <Kbd key={part}>{part}</Kbd>
            ))}
          </KbdGroup>
        )}
      </TooltipContent>
    </Tooltip>
  )
}
