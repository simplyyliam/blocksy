// Failed: the last build or run ended with an error. Click to open the build log, which also
// clears the state (you have seen it); the next Build or Run clears it too.
import { CircleAlert } from "lucide-react"
import { Button } from "@blocksy/ui"
import { statusButton } from "./chip"
import { openDock } from "./open-dock"
import { useGradle } from "../../shared/stores/gradle"
import type { StatusView } from "./types"

function FailedView() {
  const task = useGradle((s) => s.lastResult?.task)
  const clear = useGradle((s) => s.clearResult)
  return (
    <Button
      variant="ghost"
      size="xs"
      className={statusButton}
      onClick={() => {
        openDock("log")
        clear()
      }}
    >
      <CircleAlert className="text-danger" strokeWidth={1.75} />
      {task === "run_client" ? "Minecraft stopped with an error" : "Build failed"}
    </Button>
  )
}

export const failedView: StatusView = {
  id: "failed",
  priority: 10,
  when: (s) => s.task === null && s.lastResult !== null && !s.lastResult.success && !s.lastResult.stopped,
  View: FailedView,
}
