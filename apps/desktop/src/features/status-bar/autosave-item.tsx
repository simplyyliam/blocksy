// Autosave: every change is written to the project folder 300 ms later. The item says
// Saving / Saved; the popover shows when the last write finished.
import { Check, CircleAlert } from "lucide-react"
import { Button, Popover, PopoverContent, PopoverTrigger, Spinner } from "@blocksy/ui"
import { useProject } from "../../shared/stores/project"
import { statusButton, statusPopover } from "./chip"

export function AutosaveItem() {
  const autosave = useProject((s) => s.autosave)
  const open = useProject((s) => s.current !== null)
  if (!open) return null
  const label = autosave.state === "saving" ? "Saving…" : autosave.state === "error" ? "Could not save" : "Saved"
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="ghost" size="xs" className={statusButton} />}>
        {autosave.state === "saving" ? <Spinner className="text-fg-muted" /> : autosave.state === "error" ? <CircleAlert className="text-danger" strokeWidth={1.75} /> : <Check strokeWidth={1.75} />}
        {label}
      </PopoverTrigger>
      <PopoverContent side="top" align="end" className={statusPopover}>
        <p className="font-medium text-fg">Autosave is on</p>
        <p className="text-fg-muted">
          Every change is written to your project folder as you work.
          {autosave.at && <> Last saved at {new Date(autosave.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}.</>}
        </p>
        {autosave.state === "error" && <p className="text-danger">The last write failed. Check that the project folder is still there and not read-only.</p>}
      </PopoverContent>
    </Popover>
  )
}
