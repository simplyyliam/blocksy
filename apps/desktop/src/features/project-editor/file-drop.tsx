// Drag files from the desktop onto the project window to import them.
// (The window has Tauri's own drop handling off, so the browser hands us real File objects.)
// Only drags that carry files react; dragging text or elements inside the app is left alone.
import { Upload } from "lucide-react"
import { useEffect, useState } from "react"
import { importDroppedFiles } from "../../shared/import-resources"

const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes("Files")

export function FileDrop() {
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    // dragenter/dragleave fire for every child element, so count them to know when the drag really left.
    let depth = 0
    const enter = (e: DragEvent) => {
      if (!hasFiles(e)) return
      depth++
      setDragging(true)
    }
    const leave = (e: DragEvent) => {
      if (!hasFiles(e)) return
      depth = Math.max(0, depth - 1)
      if (depth === 0) setDragging(false)
    }
    const over = (e: DragEvent) => {
      if (!hasFiles(e)) return
      e.preventDefault() // required, or the browser refuses the drop
      if (e.dataTransfer) e.dataTransfer.dropEffect = "copy"
    }
    const drop = (e: DragEvent) => {
      if (!hasFiles(e)) return
      e.preventDefault()
      depth = 0
      setDragging(false)
      void importDroppedFiles(Array.from(e.dataTransfer?.files ?? []))
    }
    window.addEventListener("dragenter", enter)
    window.addEventListener("dragleave", leave)
    window.addEventListener("dragover", over)
    window.addEventListener("drop", drop)
    return () => {
      window.removeEventListener("dragenter", enter)
      window.removeEventListener("dragleave", leave)
      window.removeEventListener("dragover", over)
      window.removeEventListener("drop", drop)
    }
  }, [])

  if (!dragging) return null
  return (
    <div aria-hidden className="pointer-events-none fixed inset-3 z-50 grid place-items-center rounded-xl border-2 border-dashed border-ring/60 bg-bg/80 backdrop-blur-[2px]">
      <div className="flex flex-col items-center gap-1.5 text-center">
        <Upload className="size-5 text-fg-muted" strokeWidth={1.75} />
        <p className="text-sm font-medium text-fg">Drop to import</p>
        <p className="text-xs text-fg-muted">.png pictures · .ogg sounds · .json and .bbmodel models</p>
      </div>
    </div>
  )
}
