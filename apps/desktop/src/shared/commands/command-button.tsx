// A toolbar button for one command: icon, tooltip with its shortcut, greyed out when the
// command is not available. Press state follows the command's `checked()`.
import { Button, cn, Kbd, KbdGroup, Spinner, Tooltip, TooltipContent, TooltipTrigger } from "@blocksy/ui"
import { commandRegistry, isEnabled, runCommand } from "./registry"
import { shortcutParts } from "./shortcuts"
import { useCommandState } from "./use-command-state"

interface Props {
  id: string
  /** A text label next to the icon (Build, Run). */
  label?: string
  /** Shows a spinner instead of the icon (a running task). */
  busy?: boolean
  className?: string
}

export function CommandButton({ id, label, busy, className }: Props) {
  useCommandState()
  const command = commandRegistry.require(id)
  const Icon = command.icon
  const checked = command.checked?.()
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant={label ? "outline" : "ghost"}
            size={label ? "sm" : "icon-sm"}
            aria-label={command.title}
            aria-pressed={checked}
            disabled={!isEnabled(command)}
            onClick={() => runCommand(id)}
            className={cn(label ? "h-7 gap-1.5 px-2.5" : "text-fg-muted", checked && "bg-surface-hover text-fg", className)}
          />
        }
      >
        {busy ? <Spinner /> : Icon && <Icon strokeWidth={1.75} />}
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
