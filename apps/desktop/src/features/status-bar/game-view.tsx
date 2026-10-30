// Game running: Minecraft is open from Run. Shows when our mod made it into the mod list,
// with a small pixel burst the moment it does.
import { CircleCheck, Square } from "lucide-react"
import { motion } from "motion/react"
import { Button, PixelBurst, Spinner } from "@blocksy/ui"
import { statusButton, statusItem } from "./chip"
import { stopTask } from "../../shared/project-actions"
import { useGradle } from "../../shared/stores/gradle"
import type { StatusView } from "./types"

function GameView() {
  const { gameLoaded, modLoaded } = useGradle()
  return (
    <>
      <span className={statusItem}>
        {gameLoaded ? <span className="size-2 rounded-full bg-success" /> : <Spinner className="text-brand" />}
        {gameLoaded ? "Minecraft is running" : "Starting Minecraft"}
      </span>
      {modLoaded && (
        <motion.span
          className="relative"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 28 }}
        >
          <span className={statusItem}>
            <CircleCheck className="text-success" strokeWidth={1.75} />
            Your mod is loaded
          </span>
          <PixelBurst />
        </motion.span>
      )}
      <Button variant="ghost" size="xs" className={statusButton} onClick={() => void stopTask()}>
        <Square className="fill-current" strokeWidth={0} />
        Stop
      </Button>
    </>
  )
}

export const gameView: StatusView = { id: "game", priority: 30, when: (s) => s.task === "run_client", View: GameView }
