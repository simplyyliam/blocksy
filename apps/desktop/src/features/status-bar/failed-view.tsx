// Failed: the last build or run ended with an error. Points to the log; dismissable.
import { CircleAlert, X } from "lucide-react"
import { Button } from "@blocksy/ui"
import { statusButton, statusItem } from "./chip"
import { useGradle } from "../../shared/stores/gradle"
import { useNavigation } from "../../shared/stores/navigation"
import type { StatusView } from "./types"

function FailedView() {
  const task = useGradle((s) => s.lastResult?.task)
  const clear = useGradle((s) => s.clearResult)
  const openLog = useNavigation((s) => s.setBottomPanel)
  return (
    <>
      <span className={statusItem}>
        <CircleAlert className="text-danger" strokeWidth={1.75} />
        {task === "run_client" ? "Minecraft stopped with an error" : "Build failed"}
      </span>
      <Button variant="ghost" size="xs" className={statusButton} onClick={() => openLog(true)}>Show log</Button>
      <Button variant="ghost" size="icon-xs" aria-label="Dismiss" className="text-fg-muted" onClick={clear}>
        <X strokeWidth={1.75} />
      </Button>
    </>
  )
}

export const failedView: StatusView = {
  id: "failed",
  priority: 10,
  when: (s) => s.task === null && s.lastResult !== null && !s.lastResult.success && !s.lastResult.stopped,
  View: FailedView,
}
