// Opens and closes the bottom panel with the Build log.
import { SquareTerminal } from "lucide-react"
import { Button, cn } from "@blocksy/ui"
import { useNavigation } from "../../shared/stores/navigation"

export function BuildLogToggle() {
  const open = useNavigation((s) => s.bottomPanelOpen)
  const setOpen = useNavigation((s) => s.setBottomPanel)
  return (
    <Button onClick={() => setOpen(!open)} aria-pressed={open} className={cn(open && "bg-surface-hover")}>
      <SquareTerminal strokeWidth={1.75} />
      Build log
    </Button>
  )
}
