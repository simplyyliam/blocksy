// Game running: Minecraft is open from Run. Shows when our mod made it into the mod list,
// with a small pixel burst the moment it does.
import { CircleCheck, Square } from "lucide-react"
import { motion } from "motion/react"
import { Badge, Button, PixelBurst, Spinner } from "@blocksy/ui"
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
        <motion.span
          className="relative"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 28 }}
        >
          <Badge variant="secondary" className={statusChip}>
            <CircleCheck className="text-success" strokeWidth={1.75} />
            Your mod is loaded
          </Badge>
          <PixelBurst />
        </motion.span>
      )}
      <Button variant="secondary" size="sm" onClick={() => void stopTask()}>
        <Square className="fill-current" strokeWidth={0} />
        Stop
      </Button>
    </>
  )
}

export const gameView: StatusView = { id: "game", priority: 30, when: (s) => s.task === "run_client", View: GameView }
