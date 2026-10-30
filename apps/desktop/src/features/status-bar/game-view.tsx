// Game running: Minecraft is open from Run. Shows when our mod made it into the mod list,
// with a small pixel burst the moment it does.
import { CircleCheck, Square } from "lucide-react"
import { motion } from "motion/react"
import { useEffect, useState } from "react"
import { Button, DotMatrix, PixelBurst } from "@blocksy/ui"
import { Celebration } from "./celebration"
import { firstSuccess } from "../../shared/first-success"
import { useProject } from "../../shared/stores/project"
import { statusButton, statusItem } from "./chip"
import { stopTask } from "../../shared/project-actions"
import { useGradle } from "../../shared/stores/gradle"
import type { StatusView } from "./types"

function GameView() {
  const { gameLoaded, modLoaded } = useGradle()
  const dir = useProject((s) => s.current?.dir)
  // Confetti only the first time this project's mod loads in game.
  const [celebrate, setCelebrate] = useState(false)
  useEffect(() => {
    if (modLoaded && dir && firstSuccess(dir)) setCelebrate(true)
  }, [modLoaded, dir])
  return (
    <>
      <span className={statusItem}>
        {gameLoaded ? <span className="size-2 rounded-full bg-success" /> : <DotMatrix state="loading" className="size-3.5 text-brand" />}
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
          {celebrate && <Celebration />}
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
