// Open a project by dropping its folder on the window. Tauri reports the dropped paths (the welcome
// window turns native drag and drop on in tauri.conf.json); while something is held over the window a
// dashed card says what will happen.
import { FolderInput } from "lucide-react"
import { useEffect, useState } from "react"
import { getCurrentWebview } from "@tauri-apps/api/webview"
import { openDropped } from "./actions"

export function DropOverlay() {
  const [over, setOver] = useState(false)
  useEffect(() => {
    let stop: (() => void) | undefined
    let stopped = false
    try {
      void getCurrentWebview()
        .onDragDropEvent(({ payload }) => {
          if (payload.type === "enter" || payload.type === "over") setOver(true)
          else if (payload.type === "leave") setOver(false)
          else if (payload.type === "drop") {
            setOver(false)
            void openDropped(payload.paths)
          }
        })
        .then((off) => (stopped ? off() : (stop = off)))
    } catch {
      // Not inside Tauri (browser preview): nothing to listen to.
    }
    return () => {
      stopped = true
      stop?.()
    }
  }, [])
  if (!over) return null
  return (
    <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center bg-background/80 p-4 backdrop-blur-[2px]">
      <div className="flex size-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-brand/60 text-center">
        <FolderInput className="size-7 text-brand" strokeWidth={1.5} />
        <p className="text-md text-fg">Drop a project folder to open it</p>
        <p className="text-sm text-fg-muted">A folder that has a blocksy.json (or the blocksy.json itself)</p>
      </div>
    </div>
  )
}
