// Minecraft look: are the real Minecraft textures loaded for previews? A popover explains
// what it means and what to do. Nothing here navigates.
import { Palette } from "lucide-react"
import { Button, Popover, PopoverContent, PopoverTrigger, Spinner } from "@blocksy/ui"
import { useWorkspace } from "../../shared/vanilla/workspace"
import { statusButton, statusPopover } from "./chip"

export function LookItem() {
  const status = useWorkspace((s) => s.status)
  const label = status === "ready" ? "Minecraft look loaded" : status === "loading" ? "Loading Minecraft look" : "Minecraft look needs a build"
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="ghost" size="xs" className={statusButton} />}>
        {status === "loading" ? <Spinner className="text-fg-muted" /> : <Palette className={status === "missing" ? "text-warning" : undefined} strokeWidth={1.75} />}
        {label}
      </PopoverTrigger>
      <PopoverContent side="top" align="end" className={statusPopover}>
        <p className="font-medium text-fg">{label}</p>
        <p className="text-fg-muted">
          {status === "ready"
            ? "Previews draw the real Minecraft textures, read from your own game files. Nothing from Minecraft is added to your mod."
            : status === "loading"
              ? "Looking for Minecraft's files for this project."
              : "Build once (Ctrl+B) and Blocksy downloads Minecraft for you. Previews switch to the real look afterwards."}
        </p>
      </PopoverContent>
    </Popover>
  )
}
