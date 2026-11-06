// The app icon at the far left of the titlebar, as wide as the activity bar below it.
// It is also the way back to the welcome window (closes the project), like JetBrains' project icon.
import { Tooltip, TooltipContent, TooltipTrigger } from "@blocksy/ui"
import { closeProject } from "../../shared/project-menu-actions"

export function AppIcon() {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label="Close project and go to the welcome window"
            onClick={() => void closeProject()}
            className="grid h-full w-(--b-activitybar-w) shrink-0 place-items-center outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          />
        }
      >
        <img src="/favicon.svg" alt="" className="size-4" draggable={false} />
      </TooltipTrigger>
      <TooltipContent side="bottom">Welcome window</TooltipContent>
    </Tooltip>
  )
}
