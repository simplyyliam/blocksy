// Build, Run and Export (App.png, top right). While one task runs, its button shows a
// spinner and the others wait; Stop lives in the status bar.
import { Button, Spinner, Tooltip, TooltipContent, TooltipTrigger } from "@blocksy/ui"
import { buildMod, exportMod, runMod } from "../../shared/project-actions"
import { useGradle } from "../../shared/stores/gradle"
import { useNavigation } from "../../shared/stores/navigation"
import { useProject } from "../../shared/stores/project"

// Toolbar buttons: 28px, 6px corners, a hairline border (like Linear and Vercel).
const toolbar = "h-7 px-2.5"

export function BuildActions() {
  const hasProject = useProject((s) => s.current !== null)
  const onProjectPage = useNavigation((s) => s.page === "project")
  const task = useGradle((s) => s.task)
  // Only on the project page: on Home or Docs they would act on a project you cannot see.
  if (!hasProject || !onProjectPage) return null

  const busy = task !== null
  return (
    <div className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger render={<Button variant="outline" size="sm" className={toolbar} onClick={() => void buildMod()} disabled={busy} />}>
          {task === "build" && <Spinner />}
          Build
        </TooltipTrigger>
        <TooltipContent>Compile the mod</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger render={<Button variant="outline" size="sm" className={toolbar} onClick={() => void runMod()} disabled={busy} />}>
          {task === "run_client" && <Spinner />}
          Run
        </TooltipTrigger>
        <TooltipContent>Play it in Minecraft</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger render={<Button variant="outline" size="sm" className={toolbar} onClick={() => void exportMod()} disabled={busy} />}>
          Export
        </TooltipTrigger>
        <TooltipContent>Save the mod as a .jar file</TooltipContent>
      </Tooltip>
    </div>
  )
}
