// Idle: nothing is running. Click to see the build log (a panel in this view).
import { Button } from "@blocksy/ui"
import { statusButton } from "./chip"
import { openDock } from "./open-dock"
import type { StatusView } from "./types"

function IdleView() {
  return (
    <Button variant="ghost" size="xs" className={statusButton} onClick={() => openDock("log")}>
      <span aria-hidden className="size-2 rounded-full bg-success" />
      Ready
    </Button>
  )
}

export const idleView: StatusView = { id: "idle", priority: 0, when: () => true, View: IdleView }
