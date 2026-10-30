// Game running: Minecraft is open from Run. Shows when our mod made it into the mod list.
import { CircleCheck, Square } from "lucide-react"
import { Button, Badge, Spinner } from "@blocksy/ui"
import { statusChip } from "./chip"
import { stopTask } from "../../shared/project-actions"
import { useGradle } from "../../shared/stores/gradle"
import type { StatusView } from "./types"

function GameView() {
  const { gameLoaded, modLoaded } = useGradle()
  return (
    <>
      <Badge variant="secondary" className={statusChip}>
        {gameLoaded ? <span className="size-2 rounded-full bg-success" /> : <Spinner className="text-brand" />}
        {gameLoaded ? "Minecraft is running" : "Starting Minecraft"}
      </Badge>
      {modLoaded && (
        <Badge variant="secondary" className={statusChip}>
          <CircleCheck className="text-success" strokeWidth={1.75} />
          Your mod is loaded
        </Badge>
      )}
      <Button variant="secondary" size="sm" onClick={() => void stopTask()}>
        <Square className="fill-current" strokeWidth={0} />
        Stop
      </Button>
    </>
  )
}

export const gameView: StatusView = { id: "game", priority: 30, when: (s) => s.task === "run_client", View: GameView }
