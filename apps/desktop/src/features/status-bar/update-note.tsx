// The quiet "Blocksy X.Y.Z is ready" item (plan 2.6). It opens a popover with the Restart
// button. Restarting waits while a build runs or Minecraft is open, so work is never interrupted.
import { ArrowUpCircle } from "lucide-react"
import { motion } from "motion/react"
import { Button, Popover, PopoverContent, PopoverTrigger, toast } from "@blocksy/ui"
import { statusButton, statusPopover } from "./chip"
import { errorMessage } from "../../shared/api"
import { useGradle } from "../../shared/stores/gradle"
import { useUpdates } from "../../shared/stores/updates"

export function UpdateNote() {
  const { state, version, install } = useUpdates()
  const busy = useGradle((s) => s.task !== null)
  if (state !== "ready") return null

  const restart = async () => {
    try {
      await install() // the project is already saved: every change autosaves
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <Popover>
        <PopoverTrigger render={<Button variant="ghost" size="xs" className={statusButton} />}>
          <ArrowUpCircle className="text-brand" strokeWidth={1.75} />
          Update ready
        </PopoverTrigger>
        <PopoverContent side="top" align="end" className={statusPopover}>
          <p className="font-medium text-fg">Blocksy {version} is ready</p>
          <p className="text-fg-muted">{busy ? "Restart is possible once the build or game has finished." : "Restart Blocksy to use the new version. Your project is already saved."}</p>
          <Button size="sm" className="mt-1 self-start" disabled={busy} onClick={() => void restart()}>
            Restart to update
          </Button>
        </PopoverContent>
      </Popover>
    </motion.div>
  )
}
