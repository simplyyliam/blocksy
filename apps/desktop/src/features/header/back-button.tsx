// Back to Home, at the top left of the project editor (which has no icon rail).
import { ArrowLeft } from "lucide-react"
import { Button, Tooltip, TooltipContent, TooltipTrigger } from "@blocksy/ui"
import { useNavigation } from "../../shared/stores/navigation"

export function BackButton() {
  const go = useNavigation((s) => s.go)
  return (
    <Tooltip>
      <TooltipTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Back to Home" className="text-fg-muted" onClick={() => go("home")} />}>
        <ArrowLeft strokeWidth={1.75} />
      </TooltipTrigger>
      <TooltipContent>Back to Home</TooltipContent>
    </Tooltip>
  )
}
