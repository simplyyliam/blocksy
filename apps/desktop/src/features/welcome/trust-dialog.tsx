// "Trust this project?": asked the first time a folder is opened. Building runs the project's
// Gradle files, so only open projects you made or got from someone you trust.
//
//   ┌ Trust this project? ──────────────────────┐
//   │ ~/Blocksy/berry_mod                        │
//   │ Building or running it runs code that      │
//   │ comes with the project...                  │
//   │              [Cancel] [Trust and open]     │
//   └────────────────────────────────────────────┘
import { ShieldQuestion } from "lucide-react"
import { Button, Dialog, DialogContent, DialogDescription, DialogTitle } from "@blocksy/ui"
import { prettyPath } from "../../shared/paths"
import { useSettings } from "../../shared/stores/settings"
import { useTrust } from "./trust"

export function TrustDialog() {
  const prompt = useTrust((s) => s.prompt)
  const home = useSettings((s) => s.home)
  return (
    <Dialog open={prompt !== null} onOpenChange={(open) => !open && prompt?.resolve(false)}>
      <DialogContent showCloseButton={false} className="w-[min(480px,calc(100vw-32px))] max-w-[calc(100vw-32px)] gap-0 rounded-dialog p-0 sm:max-w-[calc(100vw-32px)]">
        <div className="flex flex-col gap-4 px-5 pt-5 pb-4">
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-subtle text-warning">
              <ShieldQuestion className="size-5" strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <DialogTitle className="text-lg leading-normal text-fg">Trust this project?</DialogTitle>
              <p className="mt-0.5 text-sm wrap-anywhere text-fg-muted" data-selectable>
                {prompt ? prettyPath(prompt.dir, home) : ""}
              </p>
            </div>
          </div>
          <DialogDescription className="text-sm text-fg-muted">
            Building or running a project runs files that come with it (Gradle scripts). Only open projects you made yourself or got from someone you trust.
          </DialogDescription>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" className="border-line-subtle bg-subtle" onClick={() => prompt?.resolve(false)}>
              Cancel
            </Button>
            <Button size="sm" autoFocus className="px-4" onClick={() => prompt?.resolve(true)}>
              Trust and open
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
