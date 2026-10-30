// Building: what Gradle is doing right now, with a Stop button.
import { Square } from "lucide-react"
import { Button, Spinner } from "@blocksy/ui"
import { statusButton, statusItem } from "./chip"
import { stopTask } from "../../shared/project-actions"
import { FIRST_BUILD_STEPS, useGradle } from "../../shared/stores/gradle"
import type { StatusView } from "./types"

function BuildingView() {
  const step = useGradle((s) => s.step)
  const label = step >= 0 ? FIRST_BUILD_STEPS[step]!.label : "Starting Gradle"
  return (
    <>
      <span className={statusItem}>
        <Spinner className="text-brand" />
        Building · {label}
      </span>
      <Button variant="ghost" size="xs" className={statusButton} onClick={() => void stopTask()}>
        <Square className="fill-current" strokeWidth={0} />
        Stop
      </Button>
    </>
  )
}

export const buildingView: StatusView = {
  id: "building",
  priority: 20,
  when: (s) => s.task === "build" || s.task === "clean",
  View: BuildingView,
}
