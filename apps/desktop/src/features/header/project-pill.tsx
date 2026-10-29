// The open project's name as a grey pill (App.png, top left). Hidden when no project is open.
import { useNavigation } from "../../shared/stores/navigation"
import { useProject } from "../../shared/stores/project"
import { Button } from "@blocksy/ui"

export function ProjectPill() {
  const name = useProject((s) => s.current?.doc.name)
  const go = useNavigation((s) => s.go)
  if (!name) return <div />
  return (
    <Button variant="pill" onClick={() => go("project")} className="max-w-[360px]">
      <span className="truncate">{name}</span>
    </Button>
  )
}
