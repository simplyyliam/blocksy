// Building: what Gradle is doing right now. Click to watch the build log.
// Stopping a build is a title bar action (Stop), not a status item.
import { Button, DotMatrix } from "@blocksy/ui"
import { statusButton } from "./chip"
import { openDock } from "./open-dock"
import { FIRST_BUILD_STEPS, useGradle } from "../../shared/stores/gradle"
import type { StatusView } from "./types"

function BuildingView() {
  const step = useGradle((s) => s.stepNow)
  const label = step >= 0 ? FIRST_BUILD_STEPS[step]!.label : "Starting Gradle"
  return (
    <Button variant="ghost" size="xs" className={statusButton} onClick={() => openDock("log")}>
      <DotMatrix state="loading" className="size-3.5 text-brand" />
      Building · {label}
    </Button>
  )
}

export const buildingView: StatusView = {
  id: "building",
  priority: 20,
  when: (s) => s.task === "build" || s.task === "clean" || s.task === "prepare",
  View: BuildingView,
}
