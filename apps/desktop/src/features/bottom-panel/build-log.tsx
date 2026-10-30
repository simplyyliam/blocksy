// The Build log: live Gradle and game output.
// Lines are drawn in chunks of 200; finished chunks never redraw, so even a
// 20,000-line log stays smooth. It sticks to the bottom unless you scroll up.
// Right-click: Copy selection / Copy log / Clear / Close.
import { Copy, Eraser, TextSelect, X } from "lucide-react"
import { memo, useLayoutEffect, useRef, useState } from "react"
import { cn, ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger, toast } from "@blocksy/ui"
import { useNavigation } from "../../shared/stores/navigation"
import { logLines, useGradle, type LogLine } from "../../shared/stores/gradle"
import { useProject } from "../../shared/stores/project"

const CHUNK = 200

function tone(line: LogLine, modId: string | undefined) {
  if (/BUILD SUCCESSFUL/.test(line.text)) return "text-success"
  if (/BUILD FAILED|FAILURE:|error:|Exception/.test(line.text)) return "text-danger"
  if (modId && new RegExp(`^\\s*-\\s+${modId}\\s`).test(line.text)) return "text-brand"
  if (line.text.startsWith("> Task")) return "text-fg-muted"
  return undefined
}

// `version` only changes for the last chunk, so memo() skips all the others.
const Chunk = memo(function Chunk({ index, modId }: { index: number; version: number; modId?: string }) {
  "use no memo"
  const lines = logLines.slice(index * CHUNK, (index + 1) * CHUNK)
  return (
    <div>
      {lines.map((line, i) => (
        <div key={i} className={cn("min-h-[1.5em] whitespace-pre-wrap break-all", tone(line, modId))}>
          {line.text}
        </div>
      ))}
    </div>
  )
})

export function BuildLog() {
  // Reads the shared logLines buffer, which changes outside React: opt out of the
  // React Compiler's caching so every logVersion change redraws.
  "use no memo"
  const version = useGradle((s) => s.logVersion)
  const task = useGradle((s) => s.task)
  const modId = useProject((s) => s.current?.doc.modId)
  const box = useRef<HTMLDivElement>(null)
  const stickToBottom = useRef(true)
  const chunks = Math.ceil(logLines.length / CHUNK)
  // Read when the menu opens, so "Copy selection" only shows when text is selected.
  const [selection, setSelection] = useState("")

  const copy = async (text: string, what: string) => {
    await navigator.clipboard.writeText(text)
    toast(`Copied ${what}`)
  }
  const clear = () => {
    logLines.length = 0
    useGradle.setState((s) => ({ logVersion: s.logVersion + 1 }))
  }

  useLayoutEffect(() => {
    const el = box.current
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight
  }, [version])

  return (
    <ContextMenu onOpenChange={(open) => open && setSelection(window.getSelection()?.toString() ?? "")}>
      {/* select-text: the trigger adds select-none by default, but log text must stay selectable. */}
      <ContextMenuTrigger
        className="h-full overflow-auto px-4 py-3 font-mono text-xs leading-[1.5] text-fg select-text"
        render={
          <div
            ref={box}
            data-selectable
            onScroll={(e) => {
              const el = e.currentTarget
              stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 24
            }}
          />
        }
      >
        {chunks === 0 ? (
          <p className="font-sans text-base text-fg-muted">
            {task ? "Waiting for Gradle…" : "Build or Run the mod to see its output here."}
          </p>
        ) : (
          Array.from({ length: chunks }, (_, i) => (
            <Chunk key={i} index={i} version={i === chunks - 1 ? version : 0} modId={modId} />
          ))
        )}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        {selection && (
          <ContextMenuItem onClick={() => void copy(selection, "selection")}>
            <TextSelect strokeWidth={1.75} /> Copy selection
          </ContextMenuItem>
        )}
        <ContextMenuItem disabled={chunks === 0} onClick={() => void copy(logLines.map((l) => l.text).join("\n"), "the build log")}>
          <Copy strokeWidth={1.75} /> Copy log
        </ContextMenuItem>
        <ContextMenuItem disabled={chunks === 0 || task !== null} onClick={clear}>
          <Eraser strokeWidth={1.75} /> Clear
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => useNavigation.getState().setBottomPanel(false)}>
          <X strokeWidth={1.75} /> Close
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
