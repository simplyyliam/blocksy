// Problems: how many things the project's check found right now (the same list as the
// Problems tab). Click opens that tab in the bottom dock.
import { CircleCheck, TriangleAlert } from "lucide-react"
import { Button, cn } from "@blocksy/ui"
import { useProblems } from "../bottom-panel/use-problems"
import { statusButton } from "./chip"
import { openDock } from "./open-dock"

export function ProblemsItem() {
  const count = useProblems().length
  return (
    <Button variant="ghost" size="xs" aria-label={`Problems: ${count}`} className={cn(statusButton, count > 0 && "text-warning hover:text-warning")} onClick={() => openDock("problems")}>
      {count > 0 ? <TriangleAlert strokeWidth={1.75} /> : <CircleCheck strokeWidth={1.75} />}
      {count}
    </Button>
  )
}
