// The quiet "Blocksy X.Y.Z is ready, restart to update" note (plan 2.6).
// Restarting waits while a build runs or Minecraft is open, so work is never interrupted.
import { ArrowUpCircle } from "lucide-react"
import { motion } from "motion/react"
import { Button, Tooltip } from "@blocksy/ui"
import { errorMessage } from "../../shared/api"
import { useGradle } from "../../shared/stores/gradle"
import { useToasts } from "../../shared/stores/toasts"
import { useUpdates } from "../../shared/stores/updates"

export function UpdateNote() {
  const { state, version, install } = useUpdates()
  const busy = useGradle((s) => s.task !== null)
  if (state !== "ready") return null

  const restart = async () => {
    try {
      await install() // the project is already saved: every change autosaves
    } catch (err) {
      useToasts.getState().show({ message: errorMessage(err), tone: "error" })
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <Tooltip label={busy ? "Waits until the build or game has finished" : "Restarts Blocksy with the new version"}>
        <Button onClick={() => void restart()} disabled={busy}>
          <ArrowUpCircle className="text-brand" strokeWidth={1.75} />
          Blocksy {version} is ready · Restart to update
        </Button>
      </Tooltip>
    </motion.div>
  )
}
