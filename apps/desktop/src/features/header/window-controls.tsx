// Minimise / maximise / close for the custom titlebar (the native one is turned off in
// tauri.conf.json so the top of the window follows the theme). Like native Windows: three
// 46px-wide buttons that fill the full titlebar height and touch the top and right edges, no
// gaps, no corners. Close turns Windows red on hover and fills the top-right corner.
import { Copy, Minus, Square, X } from "lucide-react"
import { useEffect, useState } from "react"
import { getCurrentWindow } from "@tauri-apps/api/window"
import { cn } from "@blocksy/ui"

// A plain button (not shadcn Button): shadcn's has padding, radius and a focus ring that would
// stop it from filling the corner. 16px icons per the spec.
const control = "grid h-full w-11.5 place-items-center text-fg-muted outline-none transition-colors hover:bg-surface-hover hover:text-fg focus-visible:bg-surface-hover [&_svg]:size-4"

/** `maximize={false}` for the fixed-size welcome window: only minimise and close. */
export function WindowControls({ maximize = true }: { maximize?: boolean }) {
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
    <div className="flex h-full shrink-0 items-stretch">
      <button type="button" aria-label="Minimise" className={control} onClick={() => void getCurrentWindow().minimize()}>
        <Minus strokeWidth={1.25} />
      </button>
      {maximize && (
        <button type="button" aria-label={maximized ? "Restore" : "Maximise"} className={control} onClick={() => void getCurrentWindow().toggleMaximize()}>
          {maximized ? <Copy className="size-3.5! -scale-x-100" strokeWidth={1.25} /> : <Square className="size-3.5!" strokeWidth={1.25} />}
        </button>
      )}
      <button
        type="button"
        aria-label="Close"
        className={cn(control, "hover:bg-window-close hover:text-white focus-visible:bg-window-close focus-visible:text-white")}
        onClick={() => void getCurrentWindow().close()}
      >
        <X strokeWidth={1.25} />
      </button>
    </div>
  )
}
