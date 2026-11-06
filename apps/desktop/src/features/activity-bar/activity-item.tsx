// One icon on the activity bar: icon only, a tooltip with the shortcut, a 2px indicator on the
// left edge while its view is open (VS Code's look), and an optional count badge.
// Custom (not shadcn): shadcn's Sidebar is a labelled navigation list, not a narrow icon strip
// whose buttons run commands. The tooltip, kbd and cn come from shadcn.
import { cn, Kbd, KbdGroup, Tooltip, TooltipContent, TooltipTrigger } from "@blocksy/ui"
import { commandRegistry, isEnabled, runCommand } from "../../shared/commands/registry"
import { shortcutParts } from "../../shared/commands/shortcuts"
import { useCommandState } from "../../shared/commands/use-command-state"

interface Props {
  /** The command this icon runs; its icon, title, shortcut and pressed state come from the registry. */
  id: string
  /** A count on the corner (problems). Hidden at 0. */
  badge?: number
}

export function ActivityItem({ id, badge = 0 }: Props) {
  "use no memo" // reads command state from stores at render; the compiler would cache it
  useCommandState()
  const command = commandRegistry.require(id)
  const Icon = command.icon
  const checked = command.checked?.() ?? false
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label={command.title}
            aria-pressed={command.checked ? checked : undefined}
            disabled={!isEnabled(command)}
            onClick={() => runCommand(id)}
            className={cn(
              // 36px button inside the 44px bar (shell-spec.md), icon 20.
              "relative grid size-9 place-items-center rounded-md text-fg-muted outline-none transition-colors",
              "hover:bg-surface-hover hover:text-fg focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-40",
              checked && "text-fg",
            )}
          />
        }
      >
        {/* The 2px indicator sits on the bar's edge, 4px left of the button. */}
        <span aria-hidden className={cn("absolute top-2 -left-1 h-5 w-0.5 rounded-full bg-brand transition-opacity", checked ? "opacity-100" : "opacity-0")} />
        {Icon && <Icon className="size-5" strokeWidth={1.6} />}
        {badge > 0 && (
          <span className="absolute top-0.5 right-0.5 grid min-w-3.5 place-items-center rounded-full bg-warning px-1 text-[10px] leading-3.5 font-medium text-white tabular-nums">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </TooltipTrigger>
      <TooltipContent side="right" className="flex items-center gap-2">
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
