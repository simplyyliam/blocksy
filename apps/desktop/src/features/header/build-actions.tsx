// Build, Run and Export (App.png, top right). While one task runs, its button shows a
// spinner and the others wait; Stop lives in the status bar.
import { Button, Spinner, Tooltip } from "@blocksy/ui"
import { buildMod, exportMod, runMod } from "../../shared/project-actions"
import { useGradle } from "../../shared/stores/gradle"
import { useProject } from "../../shared/stores/project"

export function BuildActions() {
  const hasProject = useProject((s) => s.current !== null)
  const task = useGradle((s) => s.task)
  if (!hasProject) return null

  const busy = task !== null
  return (
    <div className="flex items-center gap-1">
      <Tooltip label="Compile the mod">
        <Button onClick={() => void buildMod()} disabled={busy}>
          {task === "build" && <Spinner />}
          Build
        </Button>
      </Tooltip>
      <Tooltip label="Play it in Minecraft">
        <Button onClick={() => void runMod()} disabled={busy}>
          {task === "run_client" && <Spinner />}
          Run
        </Button>
      </Tooltip>
      <Tooltip label="Save the mod as a .jar file">
        <Button onClick={() => void exportMod()} disabled={busy}>
          Export
        </Button>
      </Tooltip>
    </div>
  )
}
