// Minimise / maximise / close for the custom titlebar (the native one is turned off in
// tauri.conf.json so the top of the window follows the theme). Windows-style: wide,
// flat buttons flush with the top-right corner; close turns red on hover.
import { Copy, Minus, Square, X } from "lucide-react"
import { useEffect, useState } from "react"
import { getCurrentWindow } from "@tauri-apps/api/window"
import { Button, cn } from "@blocksy/ui"

const control = "h-11 w-11 rounded-none text-fg-muted hover:text-fg"

export function WindowControls() {
  const [maximized, setMaximized] = useState(false)

  // Keep the maximise icon right when the window is resized by other means (Win+Up, snapping).
  useEffect(() => {
    let unlisten: (() => void) | undefined
    try {
      const win = getCurrentWindow()
      void win.isMaximized().then(setMaximized)
      void win.onResized(() => void win.isMaximized().then(setMaximized)).then((stop) => (unlisten = stop))
    } catch {
      // Not running inside Tauri (browser preview): the buttons just do nothing.
    }
    return () => unlisten?.()
  }, [])

  return (
    <div className="flex h-11 shrink-0 items-stretch">
      <Button variant="ghost" aria-label="Minimise" className={control} onClick={() => void getCurrentWindow().minimize()}>
        <Minus strokeWidth={1.5} />
      </Button>
      <Button
        variant="ghost"
        aria-label={maximized ? "Restore" : "Maximise"}
        className={control}
        onClick={() => void getCurrentWindow().toggleMaximize()}
      >
        {maximized ? <Copy className="size-3.5! -scale-x-100" strokeWidth={1.5} /> : <Square className="size-3.5!" strokeWidth={1.5} />}
      </Button>
      <Button
        variant="ghost"
        aria-label="Close"
        className={cn(control, "hover:bg-danger hover:text-white")}
        onClick={() => void getCurrentWindow().close()}
      >
        <X strokeWidth={1.5} />
      </Button>
    </div>
  )
}
