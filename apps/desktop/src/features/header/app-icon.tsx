// The app icon at the far left of the titlebar, as wide as the activity bar below it.
// It is also the way back to Home (the old back arrow is gone), like JetBrains' project icon.
import { Tooltip, TooltipContent, TooltipTrigger } from "@blocksy/ui"
import { useNavigation } from "../../shared/stores/navigation"

export function AppIcon() {
  const go = useNavigation((s) => s.go)
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label="Home"
            onClick={() => go("home")}
            className="grid h-full w-(--b-activitybar-w) shrink-0 place-items-center outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          />
        }
      >
        <img src="/favicon.svg" alt="" className="size-4" draggable={false} />
      </TooltipTrigger>
      <TooltipContent side="bottom">Home</TooltipContent>
    </Tooltip>
  )
}
